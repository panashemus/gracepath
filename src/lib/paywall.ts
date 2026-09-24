const COUNT_KEY = 'gracepath_prayers_generated';
const PREMIUM_KEY = 'gracepath_is_premium';

export const PAYPAL_URL = 'https://www.paypal.com/ncp/payment/ALL7HKAS6T85G';

export interface PricingTier {
  id: 'monthly' | 'annual' | 'lifetime';
  label: string;
  price: number;
  period: string;
  badge?: string;
  paypalUrl: string;
  features: string[];
  highlight?: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'monthly',
    label: 'Daily Walk VIP',
    price: 9.99,
    period: '/month',
    paypalUrl: PAYPAL_URL,
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
    label: 'Annual Grace',
    price: 59.99,
    period: '/year',
    badge: 'SAVE 50% — BEST VALUE',
    highlight: true,
    paypalUrl: PAYPAL_URL,
    features: [
      'Everything in Daily Walk VIP',
      'Save 50% vs. monthly billing',
      'Voice reflections (Warm Male & Gentle Female)',
      'Prayer journal & answered prayer tracking',
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
    paypalUrl: PAYPAL_URL,
    features: [
      'Everything in Annual Grace',
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
  try {
    return localStorage.getItem(PREMIUM_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setIsPremium(value: boolean): void {
  localStorage.setItem(PREMIUM_KEY, String(value));
}

export function canGenerateFreePrayer(): boolean {
  return getIsPremium() || getPrayerCount() < 1;
}
