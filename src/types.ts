export interface ScriptureVerse {
  reference: string;
  text: string;
  translation: string;
}

export interface PrayerResult {
  id: string;
  name: string;
  categories: string[];
  request: string;
  tone: string;
  translation: string;
  prayer: string;
  scriptures: ScriptureVerse[];
  reflection: string;
  createdAt: string;
  voice?: string;
  duration?: string;
}

export interface JournalEntry extends PrayerResult {
  answered: boolean;
}

export type Tone = 'uplifting' | 'intercession' | 'calming';

export interface ToneOption {
  id: Tone;
  label: string;
  description: string;
}

export interface CategoryOption {
  id: string;
  label: string;
  icon: string;
}

export type AppView = 'landing' | 'journal' | 'prayer';

export type IntakeStep = 1 | 2 | 3 | 4;

export type VoiceId = 'onyx' | 'shimmer';

export type ReflectionDuration = '1min' | '3min';

export interface OnboardingChoices {
  focusArea: string;
  voice: VoiceId;
  duration: ReflectionDuration;
}
