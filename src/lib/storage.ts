import type { JournalEntry, PrayerResult } from '../types';

const STORAGE_KEY = 'gracepath_journal';

export function loadJournal(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveToJournal(prayer: PrayerResult): JournalEntry {
  const entry: JournalEntry = { ...prayer, answered: false };
  const journal = loadJournal();
  journal.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journal));
  return entry;
}

export function deleteFromJournal(id: string): JournalEntry[] {
  const journal = loadJournal().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journal));
  return journal;
}

export function toggleAnswered(id: string): JournalEntry[] {
  const journal = loadJournal().map((e) =>
    e.id === id ? { ...e, answered: !e.answered } : e
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journal));
  return journal;
}

export function isInJournal(id: string): boolean {
  return loadJournal().some((e) => e.id === id);
}
