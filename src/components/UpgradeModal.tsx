import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Check, Sparkles, Clock, CreditCard, ShieldCheck, Calendar, Infinity as InfinityIcon, Loader2, AlertCircle } from 'lucide-react';
import { PRICING_TIERS, PAYPAL_CLIENT_ID, setSubscriptionTier, type PricingTier } from '../lib/paywall';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  showToast: (message: string) => void;
  onPremiumActivated: () => void;
}

const TIER_ICONS: Record<string, typeof Clock> = {
  monthly: Clock,
  annual: Calendar,
  lifetime: InfinityIcon,
};

type CheckoutState = 'idle' | 'creating' | 'verifying' | 'success' | 'error';

export default function UpgradeModal({ open, onClose, showToast, onPremiumActivated }: UpgradeModalProps) {
  const { user, refreshProfile } = useAuth();
  const [selectedTier, setSelectedTier] = useState<string>('annual');
  const [checkoutState, setCheckoutState] = useState<CheckoutState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const paypalLoadedRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tier = PRICING_TIERS.find((t) => t.id === selectedTier) ?? PRICING_TIERS[0];

  useEffect(() => {
    if (open) {
      setCheckoutState('idle');
      setErrorMsg(null);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [open]);

  // Load PayPal SDK
  useEffect(() => {
    if (!open || !PAYPAL_CLIENT_ID || paypalLoadedRef.current) return;
    paypalLoadedRef.current = true;

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`;
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Don't remove — PayPal SDK can't be safely reloaded
    };
  }, [open]);

  const pollSubscription = useCallback(async (userId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);

    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > 60) {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        setCheckoutState('error');
        setErrorMsg('Verification timed out. If you completed payment, please contact support.');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('is_subscribed, subscription_tier')
        .eq('id', userId)
        .maybeSingle();

      if (data?.is_subscribed) {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        const tier = (data.subscription_tier || 'monthly') as 'monthly' | 'annual' | 'lifetime';
        setSubscriptionTier(tier);
        await refreshProfile();
        setCheckoutState('success');
        showToast('Premium unlocked — enjoy unlimited prayers and full audio');
        setTimeout(() => {
          onPremiumActivated();
          onClose();
        }, 2000);
      }
    }, 2000);
  }, [refreshProfile, showToast, onPremiumActivated, onClose]);

  const handleCheckout = async () => {
    if (!user) {
      setErrorMsg('Please sign in or create an account first.');
      return;
    }

    setCheckoutState('creating');
    setErrorMsg(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/paypal-create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ tier: tier.id, userId: user.id }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Failed to create order' }));
        throw new Error(errData.error || 'Failed to create PayPal order');
      }

      const { orderID } = await response.json();

      // @ts-expect-error - PayPal SDK global
      const paypal = window.paypal;
      if (!paypal) {
        throw new Error('PayPal SDK not loaded. Please refresh and try again.');
      }

      // Clean up any previous button render
      const container = document.getElementById('paypal-button-container');
      if (container) container.innerHTML = '';

      await new Promise<void>((resolve, reject) => {
        paypal.Buttons({
          createOrder: () => Promise.resolve(orderID),
          onApprove: async (_data: unknown, actions: { order: { capture: () => Promise<unknown> } }) => {
            await actions.order.capture();
            resolve();
          },
          onError: (err: Error) => {
            reject(err);
          },
          onCancel: () => {
            reject(new Error('Payment cancelled'));
          },
        }).render('#paypal-button-container');
      });

      // Transition to verifying state
      setCheckoutState('verifying');
      pollSubscription(user.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed';
      if (message === 'Payment cancelled') {
        setCheckoutState('idle');
      } else {
        setCheckoutState('error');
        setErrorMsg(message);
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-ink-950/40 backdrop-blur-sm animate-fade-in">
      <div className="relative mx-4 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl animate-scale-in">
        {checkoutState !== 'verifying' && checkoutState !== 'success' && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Verifying state */}
        {checkoutState === 'verifying' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-champagne-50">
                <Loader2 className="h-10 w-10 animate-spin text-champagne-500" />
              </div>
              <div className="absolute inset-0 -z-10 animate-pulse-soft rounded-full bg-champagne-200/40 blur-2xl" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-ink-900">Verifying secure payment...</h3>
            <p className="mt-3 max-w-sm text-sm text-ink-500">
              We're confirming your PayPal payment with our secure backend.
              This usually takes a few seconds.
            </p>
          </div>
        )}

        {/* Success state */}
        {checkoutState === 'success' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-sage-50">
              <Check className="h-10 w-10 text-sage-500" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-ink-900">Premium Unlocked!</h3>
            <p className="mt-3 max-w-sm text-sm text-ink-500">
              Your payment is confirmed. Redirecting you to your unlocked experience...
            </p>
          </div>
        )}

        {/* Idle / error / creating states */}
        {(checkoutState === 'idle' || checkoutState === 'error' || checkoutState === 'creating') && (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-champagne-50">
                <Sparkles className="h-7 w-7 text-champagne-500" />
              </div>
              <h2 className="text-2xl font-semibold text-ink-900">Unlock Unlimited Prayers</h2>
              <p className="mt-2 text-sm text-ink-500">
                Choose a plan to continue receiving personalized prayers anytime.
              </p>
            </div>

            {/* Tier selector */}
            <div className="space-y-3">
              {PRICING_TIERS.map((t) => {
                const Icon = TIER_ICONS[t.id];
                const selected = selectedTier === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTier(t.id); setCheckoutState('idle'); setErrorMsg(null); }}
                    disabled={checkoutState === 'creating'}
                    className={`w-full rounded-2xl border p-5 text-left transition-all ${
                      selected
                        ? t.highlight
                          ? 'border-champagne-400 bg-champagne-50/50 shadow-glow'
                          : 'border-ink-900 bg-ink-50 shadow-soft'
                        : 'border-ink-100 hover:border-ink-300 hover:shadow-soft'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Icon className={`h-4 w-4 ${t.id === 'lifetime' ? 'text-champagne-500' : 'text-sage-500'}`} />
                          <span className="text-sm font-semibold text-ink-900">{t.label}</span>
                          {t.badge && (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              t.highlight ? 'bg-champagne-400 text-ink-900' : 'bg-ink-900 text-champagne-300'
                            }`}>
                              {t.badge}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-ink-400">
                          {t.id === 'monthly' && 'Unlimited prayers, every day'}
                          {t.id === 'annual' && 'Best value — save 50% vs monthly'}
                          {t.id === 'lifetime' && 'Pay once, pray forever'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-serif text-2xl font-semibold text-ink-900">
                          ${t.price}
                        </span>
                        <span className="text-xs text-ink-400">{t.period}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {errorMsg && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {!user && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Please sign in or create an account before subscribing.</span>
              </div>
            )}

            {/* PayPal checkout */}
            <div className="mt-5">
              <button
                onClick={handleCheckout}
                disabled={checkoutState === 'creating' || !user}
                className="btn-gold w-full text-sm disabled:opacity-50"
              >
                {checkoutState === 'creating' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {checkoutState === 'creating'
                  ? 'Opening PayPal...'
                  : `Continue to PayPal — $${tier.price}${tier.period}`}
              </button>
              <div id="paypal-button-container" className="mt-3" />
            </div>

            {/* Trust badges */}
            <div className="mt-4 space-y-2">
              {[
                'Instant Access to Daily Scripture & Audio',
                'Secure 256-Bit Encrypted PayPal Checkout',
                '7-day money-back guarantee',
              ].map((badge) => (
                <div key={badge} className="flex items-center gap-2 text-xs text-ink-500">
                  <Check className="h-3.5 w-3.5 shrink-0 text-sage-500" />
                  {badge}
                </div>
              ))}
            </div>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-ink-400">
              <ShieldCheck className="h-3.5 w-3.5 text-sage-400" />
              Payments are verified securely via PayPal webhook
            </p>
          </>
        )}
      </div>
    </div>
  );
}
