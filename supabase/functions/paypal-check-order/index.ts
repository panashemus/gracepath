import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
const headers={'Access-Control-Allow-Origin':'https://gracepath.site','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization, apikey','Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers});
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply(405,{error:'Method not allowed'});
 if(req.headers.get('origin')!=='https://gracepath.site')return reply(403,{error:'Forbidden'});
 try{
  const auth=req.headers.get('authorization')||'';
  const token=auth.startsWith('Bearer ')?auth.substring(7):'';
  if(!token)return reply(401,{error:'Sign in required'});
  const url=Deno.env.get('SUPABASE_URL')||'';
  const anon=Deno.env.get('SUPABASE_ANON_KEY')||'';
  const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!anon||!service)return reply(503,{error:'Checkout service unavailable'});
  const identity=createClient(url,anon);
  const {data,error}=await identity.auth.getUser(token);
  if(error||!data.user)return reply(401,{error:'Invalid session'});
  const {orderId}=await req.json();
  if(typeof orderId!=='string'||!/^[-A-Z0-9]{8,64}$/.test(orderId))return reply(400,{error:'Invalid order identifier'});
  const admin=createClient(url,service);
  const {data:receipt,error:dbError}=await admin.from('paypal_payment_receipts').select('order_id,tier,verified_at').eq('order_id',orderId).eq('user_id',data.user.id).maybeSingle();
  if(dbError)return reply(503,{error:'Could not verify payment'});
  return reply(200,{verified:!!receipt,tier:receipt?.tier??null});
 }catch(err){
  console.error('Payment status error:',err instanceof Error?err.message:'unknown');
  return reply(500,{error:'Could not verify payment'});
 }
});