export interface PayPalSDK {
 Buttons: (config: {
  createOrder: () => Promise<string>;
  onApprove: (data: unknown, actions: { order: { capture: () => Promise<unknown> } }) => Promise<void>;
  onError: (error: Error) => void;
  onCancel: () => void;
 }) => { render: (selector: string) => Promise<void> };
}
declare global { interface Window { paypal?: PayPalSDK } }
let pending: Promise<PayPalSDK> | null = null;
export function loadPaypalSdk(): Promise<PayPalSDK> {
 // Check the payment mode BEFORE accepting any previously loaded SDK global.
 if(import.meta.env.VITE_PAYMENT_MODE!=='sandbox') return Promise.reject(new Error('Payments are disabled until sandbox configuration is complete.'));
 const clientId=import.meta.env.VITE_PAYPAL_CLIENT_ID;
 if(!clientId) return Promise.reject(new Error('Checkout is temporarily unavailable. PayPal configuration is incomplete.'));
 if(window.paypal)return Promise.resolve(window.paypal);
 if(pending)return pending;
 pending=new Promise<PayPalSDK>((resolve,reject)=>{
  const existing=document.querySelector<HTMLScriptElement>('script[data-gracepath-paypal]');
  const script=existing||document.createElement('script');
  let settled=false;
  const timeout=window.setTimeout(()=>{
   if(!settled){settled=true;pending=null;reject(new Error('PayPal is taking too long to load. Please try again.'))}
  },15000);
  const fail=()=>{if(settled)return;settled=true;clearTimeout(timeout);pending=null;reject(new Error('PayPal could not load. Check your connection or browser protection settings.'))};
  const success=()=>{if(settled)return;if(!window.paypal){fail();return;}settled=true;clearTimeout(timeout);resolve(window.paypal)};
  script.addEventListener('load',success,{once:true});
  script.addEventListener('error',fail,{once:true});
  if(!existing){
    script.dataset.gracepathPaypal='true';
    const params=new URLSearchParams({'client-id':clientId,'currency':'USD','intent':'capture'});
    script.src='https://www.paypal.com/sdk/js?'+params.toString();
    script.async=true;
    document.head.appendChild(script);
  }
 });
 return pending;
}
