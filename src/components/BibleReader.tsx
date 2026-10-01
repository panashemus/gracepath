import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Lock, Crown, Loader2, Copy, Check, ChevronLeft, ChevronRight,
  Type, Bookmark,
} from 'lucide-react';
import { hasProAccess } from '../lib/paywall';

interface BibleReaderProps {
  onShowUpgrade: () => void;
}

interface BibleVerse {
  verse: number;
  text: string;
}

interface BibleChapter {
  reference: string;
  verses: BibleVerse[];
  translation_id: string;
  translation_name: string;
  next_book?: string;
  next_chapter?: number;
  previous_book?: string;
  previous_chapter?: number;
}

type Translation = 'KJV' | 'WEB' | 'ASV';

const TRANSLATIONS: { id: Translation; label: string; name: string }[] = [
  { id: 'KJV', label: 'KJV', name: 'King James Version' },
  { id: 'WEB', label: 'WEB', name: 'World English Bible' },
  { id: 'ASV', label: 'ASV', name: 'American Standard Version' },
];

const BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy',
  '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
  '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation',
];

const CHAPTER_COUNTS: Record<string, number> = {
  'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34,
  'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
  '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36, 'Ezra': 10,
  'Nehemiah': 13, 'Esther': 10, 'Job': 42, 'Psalms': 150, 'Proverbs': 31,
  'Ecclesiastes': 12, 'Song of Solomon': 8, 'Isaiah': 66, 'Jeremiah': 52, 'Lamentations': 5,
  'Ezekiel': 48, 'Daniel': 12, 'Hosea': 14, 'Joel': 3, 'Amos': 9,
  'Obadiah': 1, 'Jonah': 4, 'Micah': 7, 'Nahum': 3, 'Habakkuk': 3,
  'Zephaniah': 3, 'Haggai': 2, 'Zechariah': 14, 'Malachi': 4,
  'Matthew': 28, 'Mark': 16, 'Luke': 24, 'John': 21, 'Acts': 28,
  'Romans': 16, '1 Corinthians': 16, '2 Corinthians': 13, 'Galatians': 6, 'Ephesians': 6,
  'Philippians': 4, 'Colossians': 4, '1 Thessalonians': 5, '2 Thessalonians': 3, '1 Timothy': 6,
  '2 Timothy': 4, 'Titus': 3, 'Philemon': 1, 'Hebrews': 13, 'James': 5,
  '1 Peter': 5, '2 Peter': 3, '1 John': 5, '2 John': 1, '3 John': 1,
  'Jude': 1, 'Revelation': 22,
};

export default function BibleReader({ onShowUpgrade }: BibleReaderProps) {
  const canAccess = hasProAccess();
  const [translation, setTranslation] = useState<Translation>('KJV');
  const [book, setBook] = useState('John');
  const [chapter, setChapter] = useState(1);
  const [data, setData] = useState<BibleChapter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [copiedVerse, setCopiedVerse] = useState<number | null>(null);
  const [bookmarked, setBookmarked] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('gracepath_bookmarks');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });

  const maxChapters = CHAPTER_COUNTS[book] ?? 1;

  const fetchChapter = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ref = `${book} ${chapter}`;
      const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=${translation}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load chapter');
      const json: BibleChapter = await response.json();
      setData(json);
    } catch {
      setError('Unable to load this chapter. Please try again.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [book, chapter, translation]);

  useEffect(() => {
    if (canAccess) fetchChapter();
  }, [canAccess, fetchChapter]);

  const goToChapter = (newBook: string, newChapter: number) => {
    setBook(newBook);
    setChapter(newChapter);
  };

  const goPrev = () => {
    if (chapter > 1) {
      setChapter(chapter - 1);
    } else {
      const bookIdx = BOOKS.indexOf(book);
      if (bookIdx > 0) {
        const prevBook = BOOKS[bookIdx - 1];
        setBook(prevBook);
        setChapter(CHAPTER_COUNTS[prevBook] ?? 1);
      }
    }
  };

  const goNext = () => {
    if (chapter < maxChapters) {
      setChapter(chapter + 1);
    } else {
      const bookIdx = BOOKS.indexOf(book);
      if (bookIdx < BOOKS.length - 1) {
        const nextBook = BOOKS[bookIdx + 1];
        setBook(nextBook);
        setChapter(1);
      }
    }
  };

  const copyVerse = async (verse: BibleVerse) => {
    const text = `"${verse.text}" — ${book} ${chapter}:${verse.verse} (${translation})`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedVerse(verse.verse);
      setTimeout(() => setCopiedVerse(null), 2000);
    } catch {
      // ignore
    }
  };

  const toggleBookmark = (verseKey: string) => {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(verseKey)) next.delete(verseKey);
      else next.add(verseKey);
      localStorage.setItem('gracepath_bookmarks', JSON.stringify([...next]));
      return next;
    });
  };

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-grain px-4 pb-20 pt-24 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="card overflow-hidden animate-fade-up">
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-ink-900 to-ink-800">
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="h-20 w-20 text-champagne-400/30" />
              </div>
              <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <Lock className="h-8 w-8 text-champagne-400" />
                <h2 className="mt-3 font-serif text-2xl font-semibold text-white">Bible Reader</h2>
                <p className="mt-1 text-sm text-champagne-200/80">Multi-translation scripture access</p>
              </div>
            </div>
            <div className="p-8 text-center">
              <p className="text-ink-500">
                Read the Bible in multiple translations — KJV, WEB, and ASV — with
                a clean, distraction-free reading experience. Copy verses, bookmark
                favorites, and adjust font size for comfortable reading.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  'Multiple translations (KJV, WEB, ASV)',
                  'All 66 books, every chapter',
                  'Adjustable font size',
                  'Copy and bookmark verses',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 rounded-xl border border-ink-100 bg-ink-50/50 px-4 py-3 text-sm text-ink-600">
                    <BookOpen className="h-4 w-4 shrink-0 text-champagne-500" />
                    {feature}
                  </div>
                ))}
              </div>
              <button onClick={onShowUpgrade} className="btn-gold mt-8 text-sm">
                <Crown className="h-4 w-4" />
                Unlock with Pro — $9.99/mo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grain px-4 pb-20 pt-24 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 animate-fade-up">
          <div className="flex items-center gap-2 text-sm text-ink-400">
            <BookOpen className="h-4 w-4" />
            <span>Holy Scripture</span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900 sm:text-4xl">Bible Reader</h1>
        </div>

        {/* Controls */}
        <div className="card mb-6 p-4 animate-fade-up">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={translation}
              onChange={(e) => setTranslation(e.target.value as Translation)}
              className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 transition-colors focus:border-ink-400 focus:outline-none"
            >
              {TRANSLATIONS.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>

            <select
              value={book}
              onChange={(e) => { setBook(e.target.value); setChapter(1); }}
              className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 transition-colors focus:border-ink-400 focus:outline-none"
            >
              {BOOKS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <select
              value={chapter}
              onChange={(e) => setChapter(Number(e.target.value))}
              className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 transition-colors focus:border-ink-400 focus:outline-none"
            >
              {Array.from({ length: maxChapters }, (_, i) => i + 1).map((c) => (
                <option key={c} value={c}>Chapter {c}</option>
              ))}
            </select>

            <div className="ml-auto flex items-center gap-2">
              <Type className="h-4 w-4 text-ink-400" />
              <button
                onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-ink-200 text-sm text-ink-600 transition-colors hover:bg-ink-50"
                aria-label="Decrease font size"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize((s) => Math.min(28, s + 2))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-ink-200 text-sm text-ink-600 transition-colors hover:bg-ink-50"
                aria-label="Increase font size"
              >
                A+
              </button>
            </div>
          </div>
        </div>

        {/* Chapter content */}
        {loading ? (
          <div className="card p-8">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 w-full rounded bg-ink-50" style={{ marginBottom: '12px' }} />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={fetchChapter} className="btn-ghost mt-4 text-sm">
              Try Again
            </button>
          </div>
        ) : data ? (
          <>
            <div className="card p-8 animate-fade-up">
              <div className="mb-6 border-b border-ink-100 pb-4">
                <h2 className="font-serif text-2xl font-semibold text-ink-900">{data.reference}</h2>
                <p className="mt-1 text-xs text-ink-400">{data.translation_name}</p>
              </div>

              <div className="space-y-3" style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}>
                {data.verses.map((verse) => {
                  const verseKey = `${book}-${chapter}-${verse.verse}`;
                  const isBookmarked = bookmarked.has(verseKey);
                  return (
                    <div
                      key={verse.verse}
                      className="group flex gap-2 rounded-lg p-1.5 transition-colors hover:bg-ink-50/50"
                    >
                      <span className="shrink-0 font-sans text-xs font-bold text-champagne-500" style={{ marginTop: `${fontSize * 0.35}px` }}>
                        {verse.verse}
                      </span>
                      <p className="flex-1 font-serif text-ink-700">{verse.text}</p>
                      <div className="flex shrink-0 items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100" style={{ marginTop: `${fontSize * 0.25}px` }}>
                        <button
                          onClick={() => copyVerse(verse)}
                          className="flex h-7 w-7 items-center justify-center rounded text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
                          aria-label="Copy verse"
                        >
                          {copiedVerse === verse.verse ? (
                            <Check className="h-3.5 w-3.5 text-sage-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleBookmark(verseKey)}
                          className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                            isBookmarked
                              ? 'text-champagne-500'
                              : 'text-ink-400 hover:bg-ink-100 hover:text-ink-700'
                          }`}
                          aria-label="Bookmark verse"
                        >
                          <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-champagne-400' : ''}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between animate-fade-up">
              <button
                onClick={goPrev}
                disabled={book === 'Genesis' && chapter === 1}
                className="btn-ghost text-sm disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                onClick={goNext}
                disabled={book === 'Revelation' && chapter === 22}
                className="btn-ghost text-sm disabled:opacity-30"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
