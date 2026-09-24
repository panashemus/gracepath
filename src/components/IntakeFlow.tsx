import { useState } from 'react';
import {
  X, ArrowRight, ArrowLeft, Check, Sparkles, Loader2,
  Heart, Brain, Users, Dumbbell, Volume2, Clock,
} from 'lucide-react';
import { CATEGORIES, TONES, TRANSLATIONS, LOADING_QUOTES } from '../data';
import { CategoryIcon } from './CategoryIcon';
import { generatePrayer, type PrayerRequest } from '../lib/prayerGenerator';
import { canGenerateFreePrayer } from '../lib/paywall';
import type { PrayerResult, IntakeStep, Tone, VoiceId, ReflectionDuration } from '../types';

interface IntakeFlowProps {
  onClose: () => void;
  onComplete: (prayer: PrayerResult) => void;
  onPaywall: () => void;
}

const FOCUS_AREAS = [
  { id: 'peace', label: 'Anxiety & Peace', icon: Brain },
  { id: 'financial', label: 'Financial Purpose', icon: Heart },
  { id: 'family', label: 'Relationships', icon: Users },
  { id: 'healing', label: 'Health & Strength', icon: Dumbbell },
];

const VOICE_OPTIONS: { id: VoiceId; label: string; desc: string }[] = [
  { id: 'onyx', label: 'Warm Male — Onyx', desc: 'Deep, grounded, and reassuring' },
  { id: 'shimmer', label: 'Gentle Female — Shimmer', desc: 'Soft, nurturing, and calming' },
];

const DURATION_OPTIONS: { id: ReflectionDuration; label: string; desc: string }[] = [
  { id: '1min', label: '1-Minute Daily Focus', desc: 'Quick, centered start to your day' },
  { id: '3min', label: '3-Minute Deep Prayer', desc: 'Extended reflection for deeper moments' },
];

export default function IntakeFlow({ onClose, onComplete, onPaywall }: IntakeFlowProps) {
  const [step, setStep] = useState<IntakeStep>(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [request, setRequest] = useState('');
  const [translation, setTranslation] = useState<string>('NIV');
  const [name, setName] = useState('');
  const [tone, setTone] = useState<Tone>('uplifting');
  const [loading, setLoading] = useState(false);
  const [loadingQuoteIdx, setLoadingQuoteIdx] = useState(0);
  const [error, setError] = useState('');
  const [focusArea, setFocusArea] = useState('');
  const [voice, setVoice] = useState<VoiceId>('onyx');
  const [duration, setDuration] = useState<ReflectionDuration>('1min');

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const canProceed = () => {
    if (step === 1) return selectedCategories.length > 0;
    if (step === 3) return name.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < 4) {
      setStep((step + 1) as IntakeStep);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as IntakeStep);
  };

  const handleGenerate = async () => {
    if (!canGenerateFreePrayer()) {
      onPaywall();
      return;
    }
    setLoading(true);
    setError('');
    const quoteInterval = setInterval(() => {
      setLoadingQuoteIdx((prev) => (prev + 1) % LOADING_QUOTES.length);
    }, 2500);

    const req: PrayerRequest = {
      name: name.trim(),
      categories: selectedCategories,
      request: request.trim(),
      tone,
      translation,
    };

    try {
      const result = await generatePrayer(req);
      clearInterval(quoteInterval);
      onComplete({ ...result, voice, duration });
    } catch {
      clearInterval(quoteInterval);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const stepLabels = ['Season', 'Request', 'Tone', 'Prayer'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 backdrop-blur-sm animate-fade-in">
      <div className="relative flex h-full w-full flex-col bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900">
              <Sparkles className="h-4 w-4 text-champagne-300" />
            </span>
            <span className="font-serif text-lg font-semibold text-ink-900">Receive Your Prayer</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar */}
        {!loading && (
          <div className="flex items-center gap-2 px-6 py-3">
            {stepLabels.map((label, idx) => {
              const stepNum = idx + 1;
              const isActive = step === stepNum;
              const isComplete = step > stepNum;
              return (
                <div key={label} className="flex flex-1 items-center gap-2">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                      isComplete
                        ? 'bg-sage-500 text-white'
                        : isActive
                        ? 'bg-ink-900 text-white ring-4 ring-ink-100'
                        : 'bg-ink-100 text-ink-400'
                    }`}
                  >
                    {isComplete ? <Check className="h-4 w-4" /> : stepNum}
                  </div>
                  <span
                    className={`hidden text-xs font-medium sm:block ${
                      isActive ? 'text-ink-900' : 'text-ink-400'
                    }`}
                  >
                    {label}
                  </span>
                  {idx < stepLabels.length - 1 && (
                    <div className={`h-px flex-1 transition-colors duration-300 ${isComplete ? 'bg-sage-300' : 'bg-ink-100'}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading ? (
            <LoadingScreen quote={LOADING_QUOTES[loadingQuoteIdx]} />
          ) : (
            <>
              {step === 1 && (
                <div className="animate-fade-up">
                  <h2 className="text-2xl font-semibold text-ink-900">What season are you in?</h2>
                  <p className="mt-2 text-sm text-ink-500">
                    Select all that apply. This helps us tailor scripture and prayer to your situation.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {CATEGORIES.map((cat) => {
                      const selected = selectedCategories.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => toggleCategory(cat.id)}
                          className={`chip ${
                            selected
                              ? 'border-ink-900 bg-ink-900 text-white shadow-soft'
                              : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:bg-ink-50'
                          }`}
                        >
                          <CategoryIcon name={cat.icon} className="h-4 w-4" />
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="animate-fade-up">
                  <h2 className="text-2xl font-semibold text-ink-900">Share what's on your heart</h2>
                  <p className="mt-2 text-sm text-ink-500">
                    The more you share, the more personal your prayer will be.
                  </p>
                  <textarea
                    value={request}
                    onChange={(e) => setRequest(e.target.value)}
                    rows={5}
                    placeholder="I'm going through a difficult season at work and feeling overwhelmed..."
                    className="input-field mt-6 resize-none"
                  />
                  <div className="mt-6">
                    <label className="mb-2 block text-sm font-medium text-ink-700">
                      Preferred Bible translation
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {TRANSLATIONS.map((t) => (
                        <button
                          key={t}
                          onClick={() => setTranslation(t)}
                          className={`chip !px-4 !py-1.5 text-xs ${
                            translation === t
                              ? 'border-champagne-400 bg-champagne-50 text-champagne-700'
                              : 'border-ink-200 bg-white text-ink-500 hover:border-ink-300'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="animate-fade-up">
                  <h2 className="text-2xl font-semibold text-ink-900">Your name & prayer tone</h2>
                  <p className="mt-2 text-sm text-ink-500">
                    We'll address you by name and match the spirit of your prayer.
                  </p>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your first name"
                    className="input-field mt-6"
                    maxLength={30}
                  />
                  <div className="mt-6 space-y-3">
                    {TONES.map((t) => {
                      const selected = tone === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setTone(t.id)}
                          className={`w-full rounded-xl border p-4 text-left transition-all duration-200 ${
                            selected
                              ? 'border-ink-900 bg-ink-50 shadow-soft'
                              : 'border-ink-200 bg-white hover:border-ink-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-ink-900">{t.label}</span>
                            {selected && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-900">
                                <Check className="h-3 w-3 text-white" />
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-ink-500">{t.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="animate-fade-up">
                  <h2 className="text-2xl font-semibold text-ink-900">Personalize your experience</h2>
                  <p className="mt-2 text-sm text-ink-500">
                    Choose your focus, voice, and reflection style.
                  </p>

                  {/* Focus Area */}
                  <div className="mt-6">
                    <label className="mb-3 block text-sm font-medium text-ink-700">Focus Area</label>
                    <div className="grid grid-cols-2 gap-3">
                      {FOCUS_AREAS.map((area) => {
                        const selected = focusArea === area.id;
                        return (
                          <button
                            key={area.id}
                            onClick={() => {
                              setFocusArea(area.id);
                              if (!selectedCategories.includes(area.id)) {
                                setSelectedCategories((prev) => [...prev, area.id]);
                              }
                            }}
                            className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all ${
                              selected
                                ? 'border-ink-900 bg-ink-50 shadow-soft'
                                : 'border-ink-200 bg-white hover:border-ink-300'
                            }`}
                          >
                            <area.icon className="h-4 w-4 text-champagne-600" />
                            <span className="text-xs font-medium text-ink-800">{area.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Voice Tone */}
                  <div className="mt-5">
                    <label className="mb-3 flex items-center gap-1.5 text-sm font-medium text-ink-700">
                      <Volume2 className="h-4 w-4 text-sage-500" />
                      Voice Tone
                    </label>
                    <div className="space-y-2">
                      {VOICE_OPTIONS.map((v) => {
                        const selected = voice === v.id;
                        return (
                          <button
                            key={v.id}
                            onClick={() => setVoice(v.id)}
                            className={`w-full rounded-xl border p-3 text-left transition-all ${
                              selected
                                ? 'border-ink-900 bg-ink-50 shadow-soft'
                                : 'border-ink-200 bg-white hover:border-ink-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-ink-900">{v.label}</span>
                              {selected && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-900">
                                  <Check className="h-3 w-3 text-white" />
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-ink-500">{v.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reflection Duration */}
                  <div className="mt-5">
                    <label className="mb-3 flex items-center gap-1.5 text-sm font-medium text-ink-700">
                      <Clock className="h-4 w-4 text-sage-500" />
                      Reflection Duration
                    </label>
                    <div className="space-y-2">
                      {DURATION_OPTIONS.map((d) => {
                        const selected = duration === d.id;
                        return (
                          <button
                            key={d.id}
                            onClick={() => setDuration(d.id)}
                            className={`w-full rounded-xl border p-3 text-left transition-all ${
                              selected
                                ? 'border-ink-900 bg-ink-50 shadow-soft'
                                : 'border-ink-200 bg-white hover:border-ink-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-ink-900">{d.label}</span>
                              {selected && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-900">
                                  <Check className="h-3 w-3 text-white" />
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-ink-500">{d.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mt-6 space-y-2 rounded-xl border border-ink-100 bg-ink-50/50 p-4">
                    <SummaryRow label="Name" value={name.trim() || 'Friend'} />
                    <SummaryRow label="Seasons" value={selectedCategories
                      .map((id) => CATEGORIES.find((c) => c.id === id)?.label)
                      .join(', ')} />
                    <SummaryRow label="Translation" value={translation} />
                    <SummaryRow label="Tone" value={TONES.find((t) => t.id === tone)?.label ?? ''} />
                  </div>
                </div>
              )}

              {error && (
                <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="flex items-center justify-between border-t border-ink-100 px-6 py-4">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="btn-ghost !py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="btn-primary !py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                className="btn-gold !py-2.5 text-sm"
              >
                <Sparkles className="h-4 w-4" />
                Generate My Prayer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-100 pb-2 last:border-0 last:pb-0">
      <span className="text-sm text-ink-400">{label}</span>
      <span className="text-right text-sm font-medium text-ink-800">{value}</span>
    </div>
  );
}

function LoadingScreen({ quote }: { quote: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="relative mb-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-champagne-50">
          <Loader2 className="h-10 w-10 animate-spin text-champagne-500" />
        </div>
        <div className="absolute inset-0 -z-10 animate-pulse-soft rounded-full bg-champagne-200/40 blur-2xl" />
      </div>
      <h3 className="font-serif text-xl font-semibold text-ink-900">Crafting your prayer...</h3>
      <p className="mt-6 max-w-sm text-sm leading-relaxed text-ink-500 transition-all duration-500">
        "{quote}"
      </p>
    </div>
  );
}
