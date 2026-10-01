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

export type AppView = 'landing' | 'journal' | 'prayer' | 'community' | 'bible';

export type IntakeStep = 1 | 2 | 3 | 4;

export type VoiceId = 'onyx' | 'shimmer';

export type ReflectionDuration = '1min' | '3min';

export interface OnboardingChoices {
  focusArea: string;
  voice: VoiceId;
  duration: ReflectionDuration;
}

export interface UserProfile {
  id: string;
  username: string | null;
  subscription_tier: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  body: string;
  tags: string[];
  prayer_count: number;
  created_at: string;
  author_username: string | null;
  has_prayed: boolean;
}

export interface AppNotification {
  id: string;
  recipient_id: string;
  sender_id: string | null;
  actor_username: string | null;
  post_id: string | null;
  post_title: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
}
