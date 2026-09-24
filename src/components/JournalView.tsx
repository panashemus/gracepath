import { useState, useEffect } from 'react';
import {
  BookOpen, Sparkles, Trash2, Check, ChevronRight,
  Calendar, Heart, Search, X,
} from 'lucide-react';
import type { JournalEntry, PrayerResult } from '../types';
import { CATEGORIES } from '../data';
import { CategoryIcon } from './CategoryIcon';
import {
  loadJournal, deleteFromJournal, toggleAnswered,
} from '../lib/storage';

interface JournalViewProps {
  onStartPrayer: () => void;
  onViewPrayer: (prayer: PrayerResult) => void;
}

export default function JournalView({ onStartPrayer, onViewPrayer }: JournalViewProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [search, setSearch] = useState('');
  const [filterAnswered, setFilterAnswered] = useState<'all' | 'answered' | 'pending'>('all');

  useEffect(() => {
    setEntries(loadJournal());
  }, []);

  const handleDelete = (id: string) => {
    setEntries(deleteFromJournal(id));
  };

  const handleToggle = (id: string) => {
    setEntries(toggleAnswered(id));
  };

  const filtered = entries.filter((e) => {
    if (filterAnswered === 'answered' && !e.answered) return false;
    if (filterAnswered === 'pending' && e.answered) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        e.prayer.toLowerCase().includes(q) ||
        e.categories.some((c) =>
          CATEGORIES.find((cat) => cat.id === c)?.label.toLowerCase().includes(q)
        )
      );
    }
    return true;
  });

  const answeredCount = entries.filter((e) => e.answered).length;

  return (
    <div className="min-h-screen bg-grain px-4 pb-20 pt-24 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-2 text-sm text-ink-400">
            <BookOpen className="h-4 w-4" />
            <span>Your prayer history</span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900 sm:text-4xl">Prayer Journal</h1>
          <p className="mt-2 text-ink-500">
            {entries.length > 0
              ? `${entries.length} ${entries.length === 1 ? 'prayer' : 'prayers'} saved · ${answeredCount} answered`
              : 'Your saved prayers will appear here.'}
          </p>
        </div>

        {entries.length === 0 ? (
          <EmptyState onStartPrayer={onStartPrayer} />
        ) : (
          <>
            {/* Controls */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-up" style={{ animationDelay: '0.05s' }}>
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search prayers..."
                  className="input-field !pl-10 !py-2.5 text-sm"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                {(['all', 'pending', 'answered'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterAnswered(f)}
                    className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
                      filterAnswered === f
                        ? 'bg-ink-900 text-white'
                        : 'border border-ink-200 bg-white text-ink-500 hover:border-ink-300'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'answered' ? 'Answered' : 'Pending'}
                  </button>
                ))}
              </div>
            </div>

            {/* Entries */}
            <div className="space-y-4">
              {filtered.length === 0 ? (
                <p className="py-12 text-center text-sm text-ink-400">No prayers match your search.</p>
              ) : (
                filtered.map((entry, i) => (
                  <JournalCard
                    key={entry.id}
                    entry={entry}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                    onView={() => onViewPrayer(entry)}
                    index={i}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function JournalCard({
  entry, onDelete, onToggle, onView, index,
}: {
  entry: JournalEntry;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onView: () => void;
  index: number;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const date = new Date(entry.createdAt);
  const categoryLabels = entry.categories
    .map((id) => CATEGORIES.find((c) => c.id === id)?.label)
    .filter(Boolean);

  return (
    <div
      className={`card p-5 transition-all duration-300 hover:shadow-card animate-fade-up ${
        entry.answered ? 'border-sage-200 bg-sage-50/30' : ''
      }`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-start justify-between gap-4">
        <button onClick={onView} className="flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            {categoryLabels.slice(0, 3).map((label) => {
              const cat = CATEGORIES.find((c) => c.label === label);
              return (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 rounded-full bg-ink-50 px-2.5 py-0.5 text-xs font-medium text-ink-500"
                >
                  {cat && <CategoryIcon name={cat.icon} className="h-3 w-3" />}
                  {label}
                </span>
              );
            })}
          </div>
          <h3 className="mt-2.5 font-serif text-lg font-semibold text-ink-900">
            A Prayer for {entry.name || 'You'}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-ink-500">
            {entry.prayer.split('\n')[0]}
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-400">
            <Calendar className="h-3.5 w-3.5" />
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </button>

        <div className="flex flex-col items-end gap-2">
          {/* Answered toggle */}
          <button
            onClick={() => onToggle(entry.id)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              entry.answered
                ? 'bg-sage-500 text-white'
                : 'border border-ink-200 bg-white text-ink-500 hover:border-sage-300 hover:text-sage-600'
            }`}
          >
            <Check className="h-3.5 w-3.5" />
            {entry.answered ? 'Answered' : 'Mark Answered'}
          </button>

          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onDelete(entry.id)}
                className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-full border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-500"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-red-50 hover:text-red-500"
                aria-label="Delete prayer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onView}
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
                aria-label="View prayer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onStartPrayer }: { onStartPrayer: () => void }) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-20 text-center animate-fade-up">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-champagne-50">
        <Heart className="h-8 w-8 text-champagne-500" />
      </div>
      <h2 className="text-xl font-semibold text-ink-900">Your journal is waiting</h2>
      <p className="mt-2 max-w-sm text-sm text-ink-500">
        Generate your first personalized prayer and save it here. Come back anytime to
        reflect, mark answered prayers, and see God's faithfulness over time.
      </p>
      <button onClick={onStartPrayer} className="btn-gold mt-6 text-sm">
        <Sparkles className="h-4 w-4" />
        Receive Your First Prayer
      </button>
    </div>
  );
}
