import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play, Pause, Volume2, CloudRain, Music, Sparkles, VolumeX, Lock,
} from 'lucide-react';
import type { VoiceId } from '../types';

type AmbientMode = 'none' | 'rain' | 'worship';

const AMBIENT_URLS: Record<Exclude<AmbientMode, 'none'>, string> = {
  rain: 'https://cdn.pixabay.com/audio/2022/03/15/audio_5b1cf6a1c7.mp3',
  worship: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
};

const SAMPLE_AUDIO: Record<VoiceId, string> = {
  onyx: '/audio/prayer-sample-male.mp3',
  shimmer: '/audio/prayer-sample-female.mp3',
};

const MALE_VOICE_PREFERENCES = [
  'Google UK English Male',
  'Microsoft Natural Male',
  'Daniel',
  'Microsoft David',
  'Google US English',
];

const FEMALE_VOICE_PREFERENCES = [
  'Google UK English Female',
  'Microsoft Natural Female',
  'Samantha',
  'Microsoft Zira',
  'Google US English',
];

function pickVoice(voiceId: VoiceId): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return undefined;
  const prefs = voiceId === 'onyx' ? MALE_VOICE_PREFERENCES : FEMALE_VOICE_PREFERENCES;
  for (const name of prefs) {
    const match = voices.find((v) => v.name.includes(name));
    if (match) return match;
  }
  const gender = voiceId === 'onyx' ? 'Male' : 'Female';
  return voices.find((v) => v.name.includes(gender)) ?? voices[0];
}

interface AudioPlayerProps {
  prayerText: string;
  name: string;
  isPremium: boolean;
  voice?: VoiceId;
  onVoiceChange?: (voice: VoiceId) => void;
}

export default function AudioPlayer({ prayerText, name, isPremium, voice = 'onyx', onVoiceChange }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ambient, setAmbient] = useState<AmbientMode>('none');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [usingSample, setUsingSample] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const estimatedDuration = Math.max(20, Math.ceil(prayerText.length / 15));

  const stopAll = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (ambientRef.current) {
      ambientRef.current.pause();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (ambientRef.current) {
        ambientRef.current.pause();
        ambientRef.current = null;
      }
    };
  }, []);

  const startAmbient = () => {
    if (ambient !== 'none' && isPremium) {
      if (!ambientRef.current || ambientRef.current.src !== AMBIENT_URLS[ambient]) {
        if (ambientRef.current) ambientRef.current.pause();
        ambientRef.current = new Audio(AMBIENT_URLS[ambient]);
        ambientRef.current.loop = true;
        ambientRef.current.volume = 0.3;
      }
      ambientRef.current.play().catch(() => {});
    }
  };

  const playSampleMp3 = (selectedVoice: VoiceId): Promise<boolean> => {
    return new Promise((resolve) => {
      const url = SAMPLE_AUDIO[selectedVoice];
      const audio = new Audio(url);
      audio.volume = 1.0;
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        setDuration(audio.duration || estimatedDuration);
      };

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
        if (audio.duration > 0) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        if (ambientRef.current) ambientRef.current.pause();
      };

      audio.onerror = () => resolve(false);

      audio.play()
        .then(() => {
          setUsingSample(true);
          resolve(true);
        })
        .catch(() => resolve(false));
    });
  };

  const playSpeechSynthesis = (text: string, selectedVoice: VoiceId) => {
    if (!('speechSynthesis' in window)) return false;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 0.95;
    utterance.volume = ambient !== 'none' && isPremium ? 0.7 : 1.0;

    const preferred = pickVoice(selectedVoice);
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => stopAll();
    utterance.onerror = () => stopAll();
    utteranceRef.current = utterance;

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setUsingSample(false);
    setProgress(0);
    setDuration(estimatedDuration);

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsPlaying(false);
          if (ambientRef.current) ambientRef.current.pause();
          return 0;
        }
        return prev + 100 / (estimatedDuration * 10);
      });
    }, 100);

    return true;
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      stopAll();
      return;
    }

    startAmbient();

    // Primary: try local pre-recorded sample MP3
    const sampleWorked = await playSampleMp3(voice);
    if (sampleWorked) {
      setIsPlaying(true);
      return;
    }

    // Secondary: fall back to Web Speech API
    audioRef.current = null;
    const speechWorked = playSpeechSynthesis(prayerText, voice);
    if (!speechWorked) {
      stopAll();
    }
  };

  const cycleAmbient = () => {
    const modes: AmbientMode[] = ['none', 'rain', 'worship'];
    const currentIdx = modes.indexOf(ambient);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    if (ambientRef.current) {
      ambientRef.current.pause();
      ambientRef.current = null;
    }
    setAmbient(nextMode);
    if (isPlaying && nextMode !== 'none' && isPremium) {
      ambientRef.current = new Audio(AMBIENT_URLS[nextMode]);
      ambientRef.current.loop = true;
      ambientRef.current.volume = 0.3;
      ambientRef.current.play().catch(() => {});
    }
  };

  const ambientLabel = ambient === 'none' ? 'No ambient' : ambient === 'rain' ? 'Rain' : 'Worship Pad';
  const AmbientIcon = ambient === 'rain' ? CloudRain : ambient === 'worship' ? Music : isPlaying ? Volume2 : VolumeX;

  const displayDuration = duration || estimatedDuration;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50/50 px-5 py-3">
        <Sparkles className="h-4 w-4 text-champagne-500" />
        <span className="text-sm font-medium text-ink-600">Audio Reflection</span>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePlayPause}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink-900 text-white transition-all duration-300 hover:scale-105 hover:shadow-glow active:scale-95"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="ml-0.5 h-6 w-6" />
            )}
          </button>

          <div className="flex flex-1 items-center gap-0.5 overflow-hidden">
            {Array.from({ length: 48 }).map((_, i) => {
              const active = (progress / 100) * 48 > i;
              const baseHeight = 20 + Math.sin(i * 0.5) * 15 + ((i * 7) % 10);
              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-colors duration-200 ${
                    active ? 'bg-champagne-400' : 'bg-ink-200'
                  }`}
                  style={{
                    height: `${baseHeight}px`,
                    animation: isPlaying ? `pulseSoft ${0.5 + (i % 5) * 0.15}s ease-in-out infinite` : undefined,
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-champagne-400 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-ink-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(displayDuration)}</span>
          </div>
        </div>

        {/* Voice selection */}
        <div className="mt-5 flex items-center justify-between rounded-xl border border-ink-100 bg-ink-50/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-sage-500" />
            <span className="text-sm text-ink-600">Voice</span>
          </div>
          <div className="flex gap-2">
            {(['onyx', 'shimmer'] as VoiceId[]).map((v) => (
              <button
                key={v}
                onClick={() => onVoiceChange?.(v)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  voice === v
                    ? 'bg-ink-900 text-white'
                    : 'bg-white text-ink-500 shadow-soft hover:text-ink-700'
                }`}
              >
                {v === 'onyx' ? 'Warm Male' : 'Gentle Female'}
              </button>
            ))}
          </div>
        </div>

        {/* Ambient background */}
        <div className="mt-3 flex items-center justify-between rounded-xl border border-ink-100 bg-ink-50/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <AmbientIcon className="h-4 w-4 text-sage-500" />
            <span className="text-sm text-ink-600">Ambient background</span>
            {!isPremium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-champagne-50 px-2 py-0.5 text-[10px] font-bold text-champagne-700">
                <Lock className="h-2.5 w-2.5" />
                PREMIUM
              </span>
            )}
          </div>
          <button
            onClick={isPremium ? cycleAmbient : undefined}
            className={`rounded-full px-3 py-1.5 text-xs font-medium shadow-soft transition-all ${
              isPremium
                ? 'bg-white text-ink-700 hover:shadow-card'
                : 'cursor-not-allowed bg-ink-100 text-ink-400'
            }`}
          >
            {isPremium ? ambientLabel : 'Locked'}
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-ink-400">
          {usingSample
            ? 'Playing pre-recorded reflection'
            : name
            ? `Read aloud for ${name}`
            : 'Read aloud'}
        </p>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
