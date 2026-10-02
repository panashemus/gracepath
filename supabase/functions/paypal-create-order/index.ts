import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID') ?? '';
const PAYPAL_SECRET = Deno.env.get('PAYPAL_SECRET') ?? '';
const PAYPAL_API_BASE = Deno.env.get('PAYPAL_API_BASE') ?? 'https://api-m.sandbox.paypal.com';

const TIER_AMOUNTS: Record<string, { value: string; tier: string }> = {
  monthly: { value: '9.99', tier: 'monthly' },
  annual: { value: '59.99', tier: 'annual' },
  lifetime: { value: '200.00', tier: 'lifetime' },
};

async function getAccessToken(): Promise<string> {
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`);
  const resp = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`PayPal auth failed: ${resp.status} ${text}`);
  }

  const data = await resp.json();
  return data.access_token;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { tier, userId } = await req.json();

    if (!tier || !TIER_AMOUNTS[tier]) {
      return new Response(
        JSON.stringify({ error: 'Invalid tier' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing user ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = await getAccessToken();
    const tierInfo = TIER_AMOUNTS[tier];

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: tierInfo.value,
          },
          custom_id: userId,
        },
      ],
    };

    const resp = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`PayPal order creation failed: ${resp.status} ${text}`);
    }

    const order = await resp.json();

    return new Response(
      JSON.stringify({ orderID: order.id, tier: tierInfo.tier }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
