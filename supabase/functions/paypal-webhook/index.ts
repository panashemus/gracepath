import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID') ?? '';
const PAYPAL_SECRET = Deno.env.get('PAYPAL_SECRET') ?? '';
const PAYPAL_API_BASE = Deno.env.get('PAYPAL_API_BASE') ?? 'https://api-m.sandbox.paypal.com';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const TIER_MAP: Record<string, string> = {
  '9.99': 'monthly',
  '59.99': 'annual',
  '200.00': 'lifetime',
  '200': 'lifetime',
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
    const body = await req.json();
    const eventType = body?.event_type;
    const resource = body?.resource;

    if (eventType !== 'CHECKOUT.ORDER.APPROVED' && eventType !== 'PAYMENT.CAPTURE.COMPLETED') {
      return new Response(
        JSON.stringify({ received: true, message: 'Ignored event type' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let orderId: string | undefined;
    let userId: string | undefined;
    let amount: string | undefined;

    if (eventType === 'CHECKOUT.ORDER.APPROVED') {
      orderId = resource?.id;
      userId = resource?.purchase_units?.[0]?.custom_id;
      amount = resource?.purchase_units?.[0]?.amount?.value;
    } else {
      orderId = resource?.supplementary_data?.related_ids?.order_id;
      userId = resource?.custom_id ?? undefined;
      amount = resource?.amount?.value;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'No user ID in webhook payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tier = amount ? (TIER_MAP[amount] ?? 'monthly') : 'monthly';

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_subscribed: true,
        subscription_tier: tier,
      })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ received: true, userId, tier, orderId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
