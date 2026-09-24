import { useRef, useState } from 'react';
import {
  Sparkles, ArrowRight, Heart, BookOpen, Headphones, PenLine,
  Quote, Check, Star, Users, Clock, ShieldCheck, Download,
  Play, Pause, Loader2, Calendar, Infinity as InfinityIcon,
} from 'lucide-react';
import { PRICING_TIERS } from '../lib/paywall';
import { LogoMark } from './Logo';

interface LandingProps {
  onStartPrayer: () => void;
  onNavigate: (view: 'journal') => void;
  onShowUpgrade: () => void;
}

const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    role: 'Mother of three, Texas',
    text: 'I was walking through a season of deep anxiety and GracePath gave me prayers that felt like they were written just for me. The scripture selections were exactly what I needed each morning.',
    rating: 5,
  },
  {
    name: 'David K.',
    role: 'Entrepreneur, California',
    text: 'The financial breakthrough prayers were remarkably specific and encouraging. I saved them to my journal and revisited them daily. It became my morning ritual before checking email.',
    rating: 5,
  },
  {
    name: 'Grace L.',
    role: 'College Student, Georgia',
    text: 'Finding purpose felt impossible until I used GracePath. The reflection prompts helped me process what God was saying. The audio player with the worship pad is so peaceful.',
    rating: 5,
  },
];

const SAMPLE_PRAYER = `Heavenly Father, I come before You today lifting up the one reading this, asking that Your peace would settle over their mind like the morning dew. You see every anxious thought, every quiet worry they haven't spoken aloud — and You are near.

I ask that You would remind them of Your faithfulness, that You would quiet the storm within, and that Your presence would be more real than any circumstance. Let them rest in the truth that they are held, seen, and deeply loved.`;

const TIER_ICONS: Record<string, typeof Clock> = {
  monthly: Clock,
  annual: Calendar,
  lifetime: InfinityIcon,
};

export default function Landing({ onStartPrayer, onNavigate, onShowUpgrade }: LandingProps) {
  const pricingRef = useRef<HTMLElement>(null);
  const [samplePlaying, setSamplePlaying] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const sampleAudioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const playSample = async () => {
    if (samplePlaying) {
      if (sampleAudioRef.current) {
        sampleAudioRef.current.pause();
        sampleAudioRef.current = null;
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setSamplePlaying(false);
      return;
    }

    setSampleLoading(true);

    // Primary: try local pre-recorded sample MP3
    const audio = new Audio('/audio/prayer-sample-female.mp3');
    audio.volume = 1.0;
    audio.onended = () => setSamplePlaying(false);
    audio.onerror = async () => {
      // Secondary: fall back to Web Speech API
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(SAMPLE_PRAYER);
        utterance.rate = 0.85;
        utterance.pitch = 0.95;
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find((v) =>
          v.name.includes('Google UK English Female') ||
          v.name.includes('Samantha') ||
          v.name.includes('Microsoft Natural Female')
        ) ?? voices.find((v) => v.name.includes('Female'));
        if (preferred) utterance.voice = preferred;
        utterance.onend = () => setSamplePlaying(false);
        utterance.onerror = () => setSamplePlaying(false);
        window.speechSynthesis.speak(utterance);
        setSamplePlaying(true);
        setSampleLoading(false);
      } else {
        setSampleLoading(false);
      }
    };

    sampleAudioRef.current = audio;
    try {
      await audio.play();
      setSamplePlaying(true);
    } catch {
      // MP3 failed — trigger fallback via onerror
    }
    setSampleLoading(false);
  };

  return (
    <div className="bg-grain">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-32 pb-20 sm:px-6 sm:pt-40 sm:pb-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-20 h-72 w-72 rounded-full bg-champagne-200/30 blur-3xl" />
          <div className="absolute right-1/4 top-40 h-96 w-96 rounded-full bg-sage-200/20 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-champagne-300 bg-champagne-50 px-4 py-1.5 text-xs font-medium text-champagne-700 animate-fade-in">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Prayer Companion
          </div>

          <h1 className="text-balance text-4xl font-semibold leading-[1.1] text-ink-900 sm:text-5xl md:text-6xl animate-fade-up">
            Personalized Daily Prayer
            <span className="block text-champagne-600">& Scripture for Your Life's Season</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-ink-500 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Share what's on your heart and receive deeply personal prayers, scripture
            anchors, and audio reflections crafted for your unique journey.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <button onClick={onStartPrayer} className="btn-gold group text-base">
              <Sparkles className="h-5 w-5" />
              Receive Your Personalized Prayer
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button onClick={scrollToPricing} className="btn-ghost text-base">
              View Pricing
            </button>
          </div>

          {/* Hero sample player */}
          <div className="mx-auto mt-10 max-w-md animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white/80 px-5 py-4 shadow-soft backdrop-blur">
              <button
                onClick={playSample}
                disabled={sampleLoading}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-900 text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                aria-label={samplePlaying ? 'Pause sample' : 'Play sample'}
              >
                {sampleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : samplePlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="ml-0.5 h-5 w-5" />
                )}
              </button>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-ink-900">Listen to a Sample Daily Reflection</p>
                <p className="text-xs text-ink-400">Hear the voice quality before you subscribe</p>
              </div>
              <Headphones className="h-5 w-5 text-champagne-500" />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-ink-400 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-champagne-500" />
              Over 10,000+ daily prayers delivered
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-champagne-500 fill-champagne-500" />
              4.9/5 from 2,300+ members
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-champagne-500" />
              Biblically grounded & theologically sound
            </span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-semibold text-ink-900 sm:text-4xl">How It Works</h2>
            <p className="mt-3 text-ink-500">Three simple steps to a prayer crafted just for you</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: 1,
                icon: Heart,
                title: 'Share what\u2019s on your heart',
                desc: 'Tell us about your season — career, family, peace, healing, or anything you\u2019re walking through.',
              },
              {
                step: 2,
                icon: BookOpen,
                title: 'Receive custom scripture & prayer',
                desc: 'Get a tailored intercessory prayer, contextual Bible verses, and an audio reflection in seconds.',
              },
              {
                step: 3,
                icon: PenLine,
                title: 'Save to your journal',
                desc: 'Keep your prayers in a personal journal, mark answered prayers, and receive daily encouragement.',
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="card relative p-8 text-center animate-fade-up"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-ink-900 px-3 py-1 text-xs font-semibold text-white">
                  Step {item.step}
                </div>
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-champagne-50">
                  <item.icon className="h-7 w-7 text-champagne-600" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-ink-900">{item.title}</h3>
                <p className="text-sm text-ink-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Prayer Preview */}
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50/50 px-6 py-3">
              <Quote className="h-4 w-4 text-champagne-500" />
              <span className="text-sm font-medium text-ink-600">Sample Prayer Preview</span>
            </div>
            <div className="p-8">
              <p className="whitespace-pre-line font-serif text-lg leading-relaxed text-ink-700">
                {SAMPLE_PRAYER}
              </p>
              <div className="mt-6 flex items-center gap-2 border-t border-ink-100 pt-5">
                <Headphones className="h-4 w-4 text-sage-500" />
                <span className="text-sm text-ink-400">Audio reflection available with each prayer</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-semibold text-ink-900 sm:text-4xl">Everything You Need for Your Spiritual Journey</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Sparkles, title: 'Personalized Prayers', desc: 'Every prayer is crafted to address your specific situation by name.' },
              { icon: BookOpen, title: 'Scripture Anchors', desc: '2-3 contextual Bible verses with explanations on how they apply to you.' },
              { icon: Headphones, title: 'Audio Reflections', desc: 'Listen to your prayer with calming ambient backgrounds (Rain or Worship Pad).' },
              { icon: PenLine, title: 'Reflection Prompts', desc: 'Daily micro-journaling prompts to deepen your walk with God.' },
              { icon: Download, title: 'Share & Export', desc: 'Copy, download as an image card, or share your prayers on social media.' },
              { icon: BookOpen, title: 'Prayer Journal', desc: 'Save prayers, track history, and mark answered prayers over time.' },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="card p-6 transition-all duration-300 hover:shadow-card hover:-translate-y-1 animate-fade-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-sage-50">
                  <feature.icon className="h-5 w-5 text-sage-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-ink-900">{feature.title}</h3>
                <p className="text-sm text-ink-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-semibold text-ink-900 sm:text-4xl">Loved by Thousands</h2>
            <p className="mt-3 text-ink-500">Real stories from people whose prayer life has been transformed</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className="card p-6 animate-fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, idx) => (
                    <Star key={idx} className="h-4 w-4 fill-champagne-400 text-champagne-400" />
                  ))}
                </div>
                <p className="mb-5 text-sm leading-relaxed text-ink-600">"{t.text}"</p>
                <div className="flex items-center gap-3 border-t border-ink-100 pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 font-serif text-sm font-semibold text-champagne-300">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{t.name}</p>
                    <p className="text-xs text-ink-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section ref={pricingRef} className="px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-semibold text-ink-900 sm:text-4xl">Simple, Transparent Pricing</h2>
            <p className="mt-3 text-ink-500">Choose the plan that fits your journey</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PRICING_TIERS.map((tier, i) => {
              const Icon = TIER_ICONS[tier.id];
              return (
                <div
                  key={tier.id}
                  className={`relative card p-8 animate-fade-up ${
                    tier.highlight ? 'border-champagne-300 shadow-glow' : ''
                  }`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {tier.badge && (
                    <div className={`absolute right-5 top-5 rounded-full px-3 py-1 text-xs font-semibold ${
                      tier.highlight ? 'bg-champagne-400 text-ink-900' : 'bg-ink-900 text-champagne-300'
                    }`}>
                      {tier.badge}
                    </div>
                  )}
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-3 py-1 text-xs font-medium text-ink-600">
                    <Icon className="h-3.5 w-3.5" />
                    {tier.id === 'monthly' ? 'Monthly' : tier.id === 'annual' ? 'Annual' : 'Lifetime'}
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold text-ink-900">{tier.label}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-serif text-4xl font-semibold text-ink-900">${tier.price}</span>
                    <span className="text-ink-400">{tier.period}</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-ink-600">
                        <Check className={`mt-0.5 h-4 w-4 shrink-0 ${tier.highlight ? 'text-champagne-500' : 'text-sage-500'}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => window.open(tier.paypalUrl, '_blank', 'noopener,noreferrer')}
                    className={`mt-8 w-full ${tier.highlight ? 'btn-gold' : 'btn-primary'}`}
                  >
                    {tier.id === 'lifetime' ? 'Get Lifetime Access' : tier.id === 'annual' ? 'Subscribe for $59.99/year' : 'Subscribe — $9.99/mo'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-8">
            {[
              'Instant Access to Daily Scripture & Audio',
              'Cancel Anytime with 1 Click',
              'Secure 256-Bit Encrypted PayPal Checkout',
            ].map((badge) => (
              <div key={badge} className="flex items-center gap-2 text-sm text-ink-500">
                <Check className="h-4 w-4 shrink-0 text-sage-500" />
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="card relative overflow-hidden bg-ink-900 p-10 sm:p-14">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-0 h-40 w-72 -translate-x-1/2 rounded-full bg-champagne-400/10 blur-3xl" />
            </div>
            <div className="relative">
              <Sparkles className="mx-auto mb-4 h-8 w-8 text-champagne-300" />
              <h2 className="text-balance text-3xl font-semibold text-white sm:text-4xl">
                Let God's Word Meet You Where You Are
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-ink-300">
                Your personalized prayer is just a few clicks away. No account needed to begin.
              </p>
              <button onClick={onStartPrayer} className="btn-gold mt-8 text-base">
                <Sparkles className="h-5 w-5" />
                Receive Your Personalized Prayer
              </button>
              <button
                onClick={() => onNavigate('journal')}
                className="mt-4 block w-full text-center text-sm text-ink-400 transition-colors hover:text-ink-200"
              >
                Or view your prayer journal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-100 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <LogoMark className="h-7 w-7" />
            <span className="font-serif text-sm font-semibold text-ink-900">GracePath</span>
          </div>
          <p className="text-xs text-ink-400">
            Crafted with faith. Powered by grace. © 2026 GracePath.
          </p>
        </div>
      </footer>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-ink-100 bg-white/95 px-4 py-3 shadow-card backdrop-blur-lg sm:hidden">
        <button onClick={onStartPrayer} className="btn-gold w-full text-sm">
          <Sparkles className="h-4 w-4" />
          Receive Your Prayer
        </button>
      </div>
    </div>
  );
}
