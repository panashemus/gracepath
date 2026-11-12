const COUNT_KEY = 'gracepath_prayers_generated';
// A browser must never be the authority for paid access. The AuthProvider refreshes this
// in-memory tier exclusively from Supabase's server-protected profile fields.
let confirmedTier: SubscriptionTier = 'free';

export const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID ?? '';

export const TIER_AMOUNTS: Record<string, string> = {
  monthly: '9.99',
  annual: '59.99',
  lifetime: '200.00',
};


export type SubscriptionTier = 'free' | 'monthly' | 'annual' | 'lifetime';

export interface PricingTier {
  id: 'monthly' | 'annual' | 'lifetime';
  label: string;
  price: number;
  period: string;
  badge?: string;
  features: string[];
  highlight?: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'monthly',
    label: '30-Day Grace',
    price: 9.99,
    period: 'for 30 days',
    features: [
      'Unlimited personalized prayers',
      'All Bible translations (NIV, KJV, ESV, NLT)',
      'Audio reflections with ambient backgrounds',
      'Prayer journal & answered prayer tracking',
      'Daily morning encouragement',
      'Export & share prayers as image cards',
    ],
  },
  {
    id: 'annual',
    label: 'Year of Grace',
    price: 59.99,
    period: 'for 365 days',
    badge: 'SAVE 50% — BEST VALUE',
    highlight: true,
    features: [
      'Everything in 30-Day Grace',
      'Save 50% compared with twelve 30-day passes',
      'Voice reflections (Warm Male & Gentle Female)',
      'Prayer journal and answered prayer tracking',
      'Priority prayer generation',
      'All future features included',
    ],
  },
  {
    id: 'lifetime',
    label: 'Lifetime Grace',
    price: 200,
    period: 'one-time',
    badge: 'PAY ONCE, OWN FOREVER',
    features: [
      'Everything in Year of Grace',
      'One-time payment — no subscription',
      'Lifetime access to all future features',
      'Premium ambient soundscapes',
      'Early access to new features',
      'Priority support',
    ],
  },
];

export function getPrayerCount(): number {
  try {
    return parseInt(localStorage.getItem(COUNT_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

export function incrementPrayerCount(): number {
  const count = getPrayerCount() + 1;
  localStorage.setItem(COUNT_KEY, String(count));
  return count;
}

export function getIsPremium(): boolean {
  return confirmedTier !== 'free';
}

export function setIsPremium(_value: boolean): void {
  // Legacy API compatibility: paid status cannot be changed by UI controls.
}

export function getSubscriptionTier(): SubscriptionTier {
  return confirmedTier;
}

export function setSubscriptionTier(tier: SubscriptionTier): void {
  // Only call after the authenticated profile has been fetched from Supabase.
  confirmedTier = tier;
}

export function canGenerateFreePrayer(): boolean {
  return getIsPremium() || getPrayerCount() < 1;
}

export function hasProAccess(): boolean {
  return getSubscriptionTier() !== 'free';
}
