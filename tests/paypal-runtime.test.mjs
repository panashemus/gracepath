import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';

const userId = '11111111-1111-4111-8111-111111111111';
const safeEnv = {
  PAYPAL_CLIENT_ID: 'dummy-sandbox-client',
  PAYPAL_SECRET: 'dummy-secret-for-mocked-tests',
  PAYPAL_API_BASE: 'https://api-m.sandbox.paypal.com',
  PAYPAL_WEBHOOK_ID: 'dummy-webhook-id',
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_ANON_KEY: 'dummy-public-key',
  SUPABASE_SERVICE_ROLE_KEY: 'dummy-server-key',
};

function loadHandler(name, options) {
  const path = new URL('../supabase/functions/' + name + '/index.ts', import.meta.url);
  const input = readFileSync(path, 'utf8');
  const withoutImport = input.replace(/^import\s+\{\s*createClient\s*\}\s+from\s+'npm:[^']+';\s*/m, '');
  assert.notEqual(withoutImport, input, 'Supabase import stub must be replaced');
  let handler = null;
  const context = {
    Deno: {
      env: { get: (key) => options.env?.[key] ?? safeEnv[key] ?? null },
      serve: (fn) => { handler = fn; },
    },
    createClient: options.createClient ?? (() => ({ auth: { getUser: async () => ({ data: { user: { id: userId } }, error: null }) } })),
    fetch: options.fetch ?? (() => { throw new Error('Unexpected external network request'); }),
    Request, Response, crypto, btoa, console,
  };
  runInNewContext(stripTypeScriptTypes(withoutImport), context, { timeout: 2000 });
  assert.equal(typeof handler, 'function');
  return handler;
}

function createOrderRequest(tier = 'monthly', token = 'dummy-jwt') {
  return new Request('https://project.supabase.co/functions/v1/paypal-create-order', {
    method: 'POST',
    headers: { Origin: 'https://gracepath.site', Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier }),
  });
}

function captureEvent(amount = '9.99') {
  return {
    event_type: 'PAYMENT.CAPTURE.COMPLETED',
    resource: {
      id: 'CAPTURE-SANDBOX-1',
      status: 'COMPLETED',
      amount: { currency_code: 'USD', value: amount },
      supplementary_data: { related_ids: { order_id: 'ORDER-SANDBOX-1' } },
    },
  };
}

function webhookRequest(event) {
  return new Request('https://project.supabase.co/functions/v1/paypal-webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
}

test('sandbox order creation uses server-side price and authenticated user', async () => {
  const calls = [];
  const handler = loadHandler('paypal-create-order', {
    fetch: async (url, init) => {
      calls.push({ url, init });
      if (url.endsWith('/v1/oauth2/token')) return Response.json({ access_token: 'mock-access' });
      if (url.endsWith('/v2/checkout/orders')) return Response.json({ id: 'ORDER-SANDBOX-1' });
      throw new Error('Unexpected URL ' + url);
    },
  });
  const result = await handler(createOrderRequest('monthly'));
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { orderID: 'ORDER-SANDBOX-1' });
  assert.equal(calls.length, 2);
  assert.ok(calls.every((c) => c.url.startsWith('https://api-m.sandbox.paypal.com/')));
  const order = JSON.parse(calls[1].init.body);
  assert.equal(order.purchase_units[0].amount.value, '9.99');
  assert.equal(order.purchase_units[0].custom_id, userId + ':monthly');
});

test('invalid tier and absent user session cannot create a PayPal order', async () => {
  let calls = 0;
  const handler = loadHandler('paypal-create-order', { fetch: async () => { calls++; throw new Error('Should not call PayPal'); } });
  assert.equal((await handler(createOrderRequest('not-a-plan'))).status, 400);
  assert.equal((await handler(createOrderRequest('monthly', ''))).status, 401);
  assert.equal(calls, 0);
});

test('live API configuration is rejected before any payment API request', async () => {
  let calls = 0;
  const handler = loadHandler('paypal-create-order', {
    env: { PAYPAL_API_BASE: 'https://api-m.paypal.com' },
    fetch: async () => { calls++; throw new Error('Must not make a live request'); },
  });
  const result = await handler(createOrderRequest());
  assert.equal(result.status, 503);
  assert.equal(calls, 0);
});

function makeWebhookHarness(verificationStatus = 'SUCCESS') {
  const receipts = new Map();
  const profile = { subscription_tier: 'free', is_subscribed: false, premium_expires_at: null };
  let inserts = 0;
  let updates = 0;
  const createClient = () => ({
    from: (table) => {
      if (table === 'paypal_payment_receipts') return {
        insert: async (record) => {
          inserts++;
          if (receipts.has(record.order_id)) return { error: { code: '23505' } };
          receipts.set(record.order_id, { ...record, verified_at: new Date().toISOString() });
          return { error: null };
        },
        select: () => ({
          eq: (_key, id) => ({ maybeSingle: async () => ({ data: receipts.get(id) ?? null, error: null }) }),
        }),
      };
      if (table === 'profiles') return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { ...profile }, error: null }) }) }),
        update: (patch) => ({ eq: async () => { updates++; Object.assign(profile, patch); return { error: null }; } }),
      };
      throw new Error('Unknown table ' + table);
    },
  });
  const fetch = async (url) => {
    if (url.endsWith('/v1/oauth2/token')) return Response.json({ access_token: 'mock-access' });
    if (url.endsWith('/v1/notifications/verify-webhook-signature')) return Response.json({ verification_status: verificationStatus });
    if (url.endsWith('/v2/checkout/orders/ORDER-SANDBOX-1')) return Response.json({
      status: 'COMPLETED',
      purchase_units: [{
        custom_id: userId + ':monthly',
        payments: { captures: [{ id: 'CAPTURE-SANDBOX-1', status: 'COMPLETED', amount: { currency_code: 'USD', value: '9.99' } }] },
      }],
    });
    throw new Error('Unexpected URL ' + url);
  };
  const handler = loadHandler('paypal-webhook', { fetch, createClient });
  return { handler, profile, receipts, get inserts() { return inserts; }, get updates() { return updates; } };
}

test('unverified webhook cannot grant Premium access', async () => {
  const h = makeWebhookHarness('FAILURE');
  const res = await h.handler(webhookRequest(captureEvent()));
  assert.equal(res.status, 401);
  assert.equal(h.inserts, 0);
  assert.equal(h.updates, 0);
  assert.equal(h.profile.subscription_tier, 'free');
});

test('valid sandbox capture creates a receipt once; replay cannot extend entitlement', async () => {
  const h = makeWebhookHarness();
  const first = await h.handler(webhookRequest(captureEvent()));
  assert.equal(first.status, 200);
  assert.equal(h.inserts, 1);
  assert.equal(h.updates, 1);
  assert.equal(h.profile.subscription_tier, 'monthly');
  assert.equal(h.profile.is_subscribed, true);
  const expiry = h.profile.premium_expires_at;
  assert.ok(Date.parse(expiry) > Date.now());
  const second = await h.handler(webhookRequest(captureEvent()));
  assert.equal(second.status, 200);
  assert.equal(h.receipts.size, 1);
  assert.equal(h.updates, 1);
  assert.equal(h.profile.premium_expires_at, expiry);
});

test('mismatched captured amount never grants access', async () => {
  const h = makeWebhookHarness();
  const result = await h.handler(webhookRequest(captureEvent('8.99')));
  assert.equal(result.status, 400);
  assert.equal(h.inserts, 0);
  assert.equal(h.updates, 0);
});

test('old payment delivery cannot downgrade Lifetime access', async () => {
  const h = makeWebhookHarness();
  h.profile.subscription_tier = 'lifetime';
  h.profile.is_subscribed = true;
  h.profile.premium_expires_at = null;
  const result = await h.handler(webhookRequest(captureEvent()));
  assert.equal(result.status, 200);
  assert.equal(h.profile.subscription_tier, 'lifetime');
  assert.equal(h.updates, 0);
});
