import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
const allowedOrigin='https://gracepath.site';
const cors={ 'Access-Control-Allow-Origin':allowedOrigin,'Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type, apikey' };
const respond=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
const amounts:Record<string,string>={monthly:'9.99',annual:'59.99',lifetime:'200.00'};
const clientId=Deno.env.get('PAYPAL_CLIENT_ID')?.trim()||'';
const secret=Deno.env.get('PAYPAL_SECRET')?.trim()||'';
const apiBase=Deno.env.get('PAYPAL_API_BASE')?.trim()||'https://api-m.sandbox.paypal.com';
const dbUrl=Deno.env.get('SUPABASE_URL')||'';
const anon=Deno.env.get('SUPABASE_ANON_KEY')||'';
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST')return respond(405,{error:'Method not allowed'});
 if(apiBase!=='https://api-m.sandbox.paypal.com')return respond(503,{error:'Sandbox checkout only; live PayPal is disabled'});
 if(req.headers.get('origin')!==allowedOrigin)return respond(403,{error:'Origin not allowed'});
 if(!clientId||!secret||!dbUrl||!anon)return respond(503,{error:'Secure checkout is being configured'});
 try{
  const auth=req.headers.get('authorization')||'';
  if(!auth.startsWith('Bearer '))return respond(401,{error:'Sign in before checkout'});
  const supabase=createClient(dbUrl,anon,{global:{headers:{Authorization:auth}}});
  const {data:userResponse,error:userError}=await supabase.auth.getUser(auth.substring(7));
  const user=userResponse?.user;
  if(userError||!user)return respond(401,{error:'Invalid session'});
  const {tier}=await req.json();
  if(typeof tier!=='string'||!(tier in amounts))return respond(400,{error:'Invalid plan'});
  const oauth=await fetch(apiBase+'/v1/oauth2/token',{
   method:'POST',
   headers:{Authorization:'Basic '+btoa(clientId+':'+secret),'Content-Type':'application/x-www-form-urlencoded'},
   body:'grant_type=client_credentials'
  });
  if(!oauth.ok)return respond(503,{error:'PayPal unavailable'});
  const access=(await oauth.json()).access_token;
  const order=await fetch(apiBase+'/v2/checkout/orders',{
   method:'POST',
   headers:{Authorization:'Bearer '+access,'Content-Type':'application/json','PayPal-Request-Id':crypto.randomUUID()},
   body:JSON.stringify({intent:'CAPTURE',purchase_units:[{
    amount:{currency_code:'USD',value:amounts[tier]},
    custom_id:user.id+':'+tier,
    description:'GracePath '+tier+' premium access'
   }]})
  });
  if(!order.ok)return respond(502,{error:'Could not create PayPal order'});
  const data=await order.json();
  return respond(200,{orderID:data.id});
 }catch(err){
  console.error('Checkout error:',err instanceof Error?err.message:'unknown');
  return respond(500,{error:'Unable to initiate secure checkout'});
 }
});