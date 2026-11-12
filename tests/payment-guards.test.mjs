import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('PayPal order creation refuses live configuration during sandbox testing', () => {
  const code = source('supabase/functions/paypal-create-order/index.ts');
  assert.match(code, /apiBase!=='https:\/\/api-m\.sandbox\.paypal\.com'/);
  assert.match(code, /supabase\.auth\.getUser/);
  assert.doesNotMatch(code, /PAYPAL_SECRET\s*=\s*['"][^'"]+['"]/);
});

test('PayPal webhook verifies signed captures, never upserts receipts', () => {
  const code = source('supabase/functions/paypal-webhook/index.ts');
  assert.match(code, /apiBase!=='https:\/\/api-m\.sandbox\.paypal\.com'/);
  assert.match(code, /verify-webhook-signature/);
  assert.match(code, /verification_status!=='SUCCESS'/);
  assert.match(code, /PAYMENT\.CAPTURE\.COMPLETED/);
  assert.match(code, /\.insert\(\{order_id:orderId/);
  assert.doesNotMatch(code, /\.upsert\(/);
});

test('Premium lookup is user-scoped and based on verified server receipt', () => {
  const code = source('supabase/functions/paypal-check-order/index.ts');
  assert.match(code, /auth\.getUser\(token\)/);
  assert.match(code, /paypal_payment_receipts/);
  assert.match(code, /\.eq\('user_id',data\.user\.id\)/);
});

test('Frontend never exposes PayPal secrets or direct live payment links', () => {
  const client = source('src/lib/paypalClient.ts');
  const paywall = source('src/lib/paywall.ts');
  assert.match(client, /VITE_PAYMENT_MODE!=='sandbox'/);
  assert.doesNotMatch(client + paywall, /paypal\.com\/ncp\/payment\//);
  assert.doesNotMatch(client + paywall, /VITE_PAYPAL_SECRET/);
});
