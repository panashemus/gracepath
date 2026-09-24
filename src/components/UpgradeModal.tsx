import { useState } from 'react';
import { X, Check, Sparkles, Clock, CreditCard, ShieldCheck, Calendar, Infinity as InfinityIcon } from 'lucide-react';
import { PRICING_TIERS, setIsPremium, type PricingTier } from '../lib/paywall';

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

export default function UpgradeModal({ open, onClose, showToast, onPremiumActivated }: UpgradeModalProps) {
  const [selectedTier, setSelectedTier] = useState<string>('annual');

  if (!open) return null;

  const tier = PRICING_TIERS.find((t) => t.id === selectedTier) ?? PRICING_TIERS[0];

  const openPayPal = () => {
    window.open(tier.paypalUrl, '_blank', 'noopener,noreferrer');
  };

  const handlePaymentComplete = () => {
    setIsPremium(true);
    onPremiumActivated();
    onClose();
    showToast('Premium unlocked — enjoy unlimited prayers and full audio');
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-ink-950/40 backdrop-blur-sm animate-fade-in">
      <div className="relative mx-4 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl animate-scale-in">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-champagne-50">
            <Sparkles className="h-7 w-7 text-champagne-500" />
          </div>
          <h2 className="text-2xl font-semibold text-ink-900">Unlock Unlimited Prayers</h2>
          <p className="mt-2 text-sm text-ink-500">
            Your free prayer has been delivered. Choose a plan to continue receiving
            personalized prayers anytime.
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
                onClick={() => setSelectedTier(t.id)}
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

        {/* Checkout button */}
        <button onClick={openPayPal} className="btn-gold mt-5 w-full text-sm">
          <CreditCard className="h-4 w-4" />
          Continue to PayPal — ${tier.price}{tier.period}
        </button>

        {/* Trust badges */}
        <div className="mt-4 space-y-2">
          {[
            'Instant Access to Daily Scripture & Audio',
            'Cancel Anytime with 1 Click',
            'Secure 256-Bit Encrypted PayPal Checkout',
          ].map((badge) => (
            <div key={badge} className="flex items-center gap-2 text-xs text-ink-500">
              <Check className="h-3.5 w-3.5 shrink-0 text-sage-500" />
              {badge}
            </div>
          ))}
        </div>

        {/* I have completed payment */}
        <div className="mt-5 border-t border-ink-100 pt-5">
          <button
            onClick={handlePaymentComplete}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-sage-300 bg-sage-50 px-6 py-3 text-sm font-medium text-sage-700 transition-all hover:border-sage-500 hover:bg-sage-100"
          >
            <Check className="h-4 w-4" />
            I have completed payment
          </button>
          <p className="mt-2 text-center text-xs text-ink-400">
            Already paid? Click above to unlock your premium access instantly.
          </p>
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-ink-400">
          <ShieldCheck className="h-3.5 w-3.5 text-sage-400" />
          7-day money-back guarantee · Cancel anytime
        </p>
      </div>
    </div>
  );
}
