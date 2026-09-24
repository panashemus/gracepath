import { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import {
  ArrowLeft, Copy, Check, Download, BookOpen, Bookmark,
  Sparkles, PenLine, Share2, Heart,
} from 'lucide-react';
import type { PrayerResult, VoiceId } from '../types';
import { CATEGORIES, TONES } from '../data';
import { CategoryIcon } from './CategoryIcon';
import AudioPlayer from './AudioPlayer';
import { saveToJournal, isInJournal } from '../lib/storage';

interface PrayerOutputProps {
  prayer: PrayerResult;
  onBack: () => void;
  onGoToJournal: () => void;
  showToast: (message: string) => void;
  isPremium: boolean;
  voice: VoiceId;
  onVoiceChange: (voice: VoiceId) => void;
}

export default function PrayerOutput({ prayer, onBack, onGoToJournal, showToast, isPremium, voice, onVoiceChange }: PrayerOutputProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(isInJournal(prayer.id));
  const [downloading, setDownloading] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const categoryLabels = prayer.categories
    .map((id) => CATEGORIES.find((c) => c.id === id)?.label)
    .filter(Boolean) as string[];
  const toneLabel = TONES.find((t) => t.id === prayer.tone)?.label;

  const handleCopy = async () => {
    const text = formatPrayerText(prayer);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast('Prayer copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Unable to copy — please try again');
    }
  };

  const handleSave = () => {
    if (!saved) {
      saveToJournal(prayer);
      setSaved(true);
      showToast('Prayer saved to your journal');
    }
  };

  const handleDownloadImage = useCallback(async () => {
    if (!exportRef.current || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        backgroundColor: '#1a1d26',
        useCORS: true,
        logging: false,
      });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gracepath-prayer-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Image card downloaded');
      });
    } catch {
      showToast('Unable to generate image — please try again');
    } finally {
      setDownloading(false);
    }
  }, [downloading, showToast]);

  const handleShare = async () => {
    const text = formatPrayerText(prayer);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My GracePath Prayer', text });
      } catch {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        showToast('Prayer copied to clipboard');
      } catch {
        showToast('Unable to share — please try again');
      }
    }
  };

  return (
    <div className="min-h-screen bg-grain px-4 pb-20 pt-24 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </button>

        {/* Header card */}
        <div className="card mb-6 p-6 animate-fade-up">
          <div className="flex flex-wrap items-center gap-2">
            {categoryLabels.map((label) => {
              const cat = CATEGORIES.find((c) => c.label === label);
              return (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 px-3 py-1 text-xs font-medium text-sage-700"
                >
                  {cat && <CategoryIcon name={cat.icon} className="h-3 w-3" />}
                  {label}
                </span>
              );
            })}
            {toneLabel && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-champagne-50 px-3 py-1 text-xs font-medium text-champagne-700">
                <Sparkles className="h-3 w-3" />
                {toneLabel}
              </span>
            )}
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-ink-900">
            A Prayer for {prayer.name || 'You'}
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            {new Date(prayer.createdAt).toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            })}
          </p>
        </div>

        {/* Prayer text */}
        <div className="card mb-6 p-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="mb-4 flex items-center gap-2 border-b border-ink-100 pb-3">
            <Heart className="h-4 w-4 text-champagne-500" />
            <span className="text-sm font-medium text-ink-600">Your Personalized Prayer</span>
          </div>
          <p className="whitespace-pre-line font-serif text-lg leading-[1.8] text-ink-700">
            {prayer.prayer}
          </p>
        </div>

        {/* Scripture anchors */}
        <div className="card mb-6 p-8 animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <div className="mb-5 flex items-center gap-2 border-b border-ink-100 pb-3">
            <BookOpen className="h-4 w-4 text-sage-500" />
            <span className="text-sm font-medium text-ink-600">Scripture Anchors</span>
          </div>
          <div className="space-y-6">
            {prayer.scriptures.map((verse, i) => (
              <div key={i} className="border-l-2 border-champagne-300 pl-5">
                <p className="font-serif text-base italic leading-relaxed text-ink-700">
                  &ldquo;{verse.text}&rdquo;
                </p>
                <p className="mt-2 text-sm font-semibold text-champagne-700">
                  {verse.reference} ({verse.translation})
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Reflection prompt */}
        <div className="card mb-6 p-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="mb-3 flex items-center gap-2">
            <PenLine className="h-4 w-4 text-sage-500" />
            <span className="text-sm font-medium text-ink-600">Reflection Prompt</span>
          </div>
          <p className="text-base leading-relaxed text-ink-700">{prayer.reflection}</p>
        </div>

        {/* Audio player */}
        <div className="mb-6 animate-fade-up" style={{ animationDelay: '0.25s' }}>
          <AudioPlayer prayerText={prayer.prayer} name={prayer.name} isPremium={isPremium} voice={voice} onVoiceChange={onVoiceChange} />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <button onClick={handleCopy} className="btn-ghost flex-1 text-sm">
            {copied ? <Check className="h-4 w-4 text-sage-500" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy Prayer'}
          </button>
          <button
            onClick={handleDownloadImage}
            disabled={downloading}
            className="btn-ghost flex-1 text-sm disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Generating...' : 'Download Card'}
          </button>
          <button onClick={handleShare} className="btn-ghost flex-1 text-sm">
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <button
            onClick={handleSave}
            disabled={saved}
            className={`flex-1 text-sm transition-all ${
              saved
                ? 'inline-flex items-center justify-center gap-2 rounded-full border border-sage-200 bg-sage-50 px-6 py-3 font-medium text-sage-700'
                : 'btn-gold'
            }`}
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Saved to Journal
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4" />
                Save to Journal
              </>
            )}
          </button>
        </div>

        {saved && (
          <div className="mt-4 text-center animate-fade-in">
            <button
              onClick={onGoToJournal}
              className="text-sm font-medium text-champagne-600 transition-colors hover:text-champagne-700"
            >
              View your prayer journal →
            </button>
          </div>
        )}
      </div>

      {/* Hidden export card for html2canvas */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div
          ref={exportRef}
          style={{
            width: '540px',
            padding: '48px 40px',
            background: 'linear-gradient(180deg, #1a1d26 0%, #101218 100%)',
            borderRadius: '24px',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: '#d9b65f', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '16px', color: '#1a1d26', fontWeight: 700 }}>G</span>
            </div>
            <span style={{ color: '#e6cd87', fontSize: '18px', fontWeight: 600, fontFamily: 'Georgia, serif' }}>
              GracePath
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {categoryLabels.map((label) => (
              <span key={label} style={{
                fontSize: '12px', color: '#aab2c3', background: 'rgba(255,255,255,0.08)',
                padding: '4px 12px', borderRadius: '9999px',
              }}>
                {label}
              </span>
            ))}
          </div>

          <p style={{
            color: '#f5f6f8', fontSize: '18px', lineHeight: '1.7',
            fontFamily: 'Georgia, serif', whiteSpace: 'pre-line', marginBottom: '28px',
          }}>
            {prayer.prayer}
          </p>

          {prayer.scriptures.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginBottom: '16px' }}>
              {prayer.scriptures.map((v, i) => (
                <div key={i} style={{ marginBottom: '12px', borderLeft: '3px solid #d9b65f', paddingLeft: '16px' }}>
                  <p style={{ color: '#cfd4de', fontSize: '14px', fontStyle: 'italic', fontFamily: 'Georgia, serif', marginBottom: '4px' }}>
                    {v.text}
                  </p>
                  <p style={{ color: '#e6cd87', fontSize: '13px', fontWeight: 600 }}>
                    {v.reference} ({v.translation})
                  </p>
                </div>
              ))}
            </div>
          )}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginTop: '20px' }}>
            <p style={{ color: '#e6cd87', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
              Generated by GracePath
            </p>
            <p style={{ color: '#5d6378', fontSize: '12px' }}>
              {new Date(prayer.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatPrayerText(prayer: PrayerResult): string {
  const lines = [
    `A Prayer for ${prayer.name || 'You'}`,
    `${new Date(prayer.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
    '',
    prayer.prayer,
    '',
    'Scripture Anchors:',
    ...prayer.scriptures.map((s) => `${s.reference} (${s.translation}): "${s.text}"`),
    '',
    `Reflection: ${prayer.reflection}`,
    '',
    '— Crafted with GracePath',
  ];
  return lines.join('\n');
}
