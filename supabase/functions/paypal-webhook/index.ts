import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

// PayPal webhooks are public by design; every event must be verified with PayPal.
const json = (status:number, body:unknown) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type':'application/json', 'Cache-Control':'no-store' }
});
const clientId=Deno.env.get('PAYPAL_CLIENT_ID')?.trim()||'';
const secret=Deno.env.get('PAYPAL_SECRET')?.trim()||'';
const webhookId=Deno.env.get('PAYPAL_WEBHOOK_ID')?.trim()||'';
const apiBase=Deno.env.get('PAYPAL_API_BASE')?.trim()||'https://api-m.sandbox.paypal.com';
const url=Deno.env.get('SUPABASE_URL')||'';
const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const prices:Record<string,{tier:'monthly'|'annual'|'lifetime',usd:string}>={
  '9.99':{tier:'monthly',usd:'9.99'},
  '59.99':{tier:'annual',usd:'59.99'},
  '200.00':{tier:'lifetime',usd:'200.00'}
};
async function token(){
  const r=await fetch(apiBase+'/v1/oauth2/token',{
    method:'POST',
    headers:{'Authorization':'Basic '+btoa(clientId+':'+secret),'Content-Type':'application/x-www-form-urlencoded'},
    body:'grant_type=client_credentials'
  });
  if(!r.ok)throw new Error('PayPal authentication unavailable');
  const data=await r.json();
  return String(data.access_token);
}
Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json(405,{error:'Method not allowed'});
  if(apiBase!=='https://api-m.sandbox.paypal.com')return json(503,{error:'Sandbox verification only; live PayPal is disabled'});
  if(!clientId||!secret||!webhookId||!url||!serviceKey)return json(503,{error:'Payment verification is not configured'});
  try{
    const raw=await req.text();
    if(raw.length>100000)return json(413,{error:'Event too large'});
    const event=JSON.parse(raw);
    const auth=await token();
    const header=(name:string)=>req.headers.get(name)||'';
    const verify=await fetch(apiBase+'/v1/notifications/verify-webhook-signature',{
      method:'POST',
      headers:{'Authorization':'Bearer '+auth,'Content-Type':'application/json'},
      body:JSON.stringify({
        auth_algo:header('paypal-auth-algo'),
        cert_url:header('paypal-cert-url'),
        transmission_id:header('paypal-transmission-id'),
        transmission_sig:header('paypal-transmission-sig'),
        transmission_time:header('paypal-transmission-time'),
        webhook_id:webhookId,
        webhook_event:event
      })
    });
    if(!verify.ok)return json(502,{error:'Payment verification unavailable'});
    const verification=await verify.json();
    if(verification.verification_status!=='SUCCESS')return json(401,{error:'Invalid PayPal webhook signature'});
    if(event.event_type!=='PAYMENT.CAPTURE.COMPLETED')return json(200,{received:true,ignored:true});
    const capture=event.resource;
    const orderId=capture?.supplementary_data?.related_ids?.order_id;
    const captureId=capture?.id;
    if(!orderId||!captureId||capture?.status!=='COMPLETED')return json(400,{error:'Invalid capture'});
    const orderResp=await fetch(apiBase+'/v2/checkout/orders/'+encodeURIComponent(orderId),{
      headers:{Authorization:'Bearer '+auth}
    });
    if(!orderResp.ok)return json(502,{error:'Could not confirm PayPal order'});
    const order=await orderResp.json();
    const unit=order?.purchase_units?.[0];
    const confirmedCapture=unit?.payments?.captures?.find((x:{id:string,status:string})=>x.id===captureId&&x.status==='COMPLETED');
    if(!confirmedCapture||!unit?.custom_id)return json(400,{error:'Order does not match completed capture'});
    const amount=confirmedCapture?.amount;
    if(amount?.currency_code!=='USD')return json(400,{error:'Unexpected currency'});
    const entry=prices[String(Number(amount?.value).toFixed(2))];
    if(!entry||Number(amount?.value)!==Number(entry.usd))return json(400,{error:'Unexpected payment amount'});
    const metadata=String(unit.custom_id);
    const parts=metadata.split(':');
    if(parts.length!==2||!['monthly','annual','lifetime'].includes(parts[1])||parts[1]!==entry.tier)return json(400,{error:'Order metadata mismatch'});
    const userId=parts[0];
    if(!/^[0-9a-f-]{36}$/i.test(userId))return json(400,{error:'Invalid user identifier'});
    const sb=createClient(url,serviceKey);
    const {data:receipt,error:receiptError}=await sb.from('paypal_payment_receipts')
      .upsert({order_id:orderId,capture_id:captureId,user_id:userId,tier:entry.tier,amount_usd:Number(entry.usd)},{onConflict:'order_id'})
      .select('order_id,capture_id,user_id,tier').single();
    if(receiptError||receipt?.capture_id!==captureId||receipt?.user_id!==userId||receipt?.tier!==entry.tier){
      return json(500,{error:'Could not record verified payment'});
    }
    // One-time payments grant time-limited access; not PayPal recurring subscriptions.
    const {data:storedReceipt}=await sb.from('paypal_payment_receipts').select('verified_at').eq('order_id',orderId).single();
    const verifiedAt=storedReceipt?.verified_at ? Date.parse(storedReceipt.verified_at) : Date.now();
    const expires=entry.tier==='lifetime'?null:new Date(verifiedAt+(entry.tier==='monthly'?30:365)*86400000).toISOString();
    const {error:updateError}=await sb.from('profiles')
      .update({subscription_tier:entry.tier,is_subscribed:true,premium_expires_at:expires})
      .eq('id',userId);
    if(updateError)return json(500,{error:'Could not activate access'});
    return json(200,{received:true});
  }catch(err){
    console.error('PayPal webhook processing failed:',err instanceof Error?err.message:'unknown');
    return json(500,{error:'Payment verification failed'});
  }
});
