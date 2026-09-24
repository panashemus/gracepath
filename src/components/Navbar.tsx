import { BookOpen, Crown, Sparkles } from 'lucide-react';
import { LogoMark } from './Logo';
import type { AppView } from '../types';

interface NavbarProps {
  view: AppView;
  onNavigate: (view: AppView) => void;
  onStartPrayer: () => void;
  isPremium: boolean;
}

export default function Navbar({ view, onNavigate, onStartPrayer, isPremium }: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-ink-100/60 bg-white/80 backdrop-blur-lg">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <LogoMark className="h-9 w-9" />
          <span className="font-serif text-lg font-semibold text-ink-900">GracePath</span>
          {isPremium && (
            <span className="inline-flex items-center gap-1 rounded-full bg-champagne-100 px-2 py-0.5 text-[10px] font-bold text-champagne-700">
              <Crown className="h-3 w-3" />
              PREMIUM
            </span>
          )}
        </button>

        <div className="hidden items-center gap-8 sm:flex">
          <button
            onClick={() => onNavigate('landing')}
            className={`text-sm font-medium transition-colors ${
              view === 'landing' ? 'text-ink-900' : 'text-ink-500 hover:text-ink-800'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('journal')}
            className={`text-sm font-medium transition-colors ${
              view === 'journal' ? 'text-ink-900' : 'text-ink-500 hover:text-ink-800'
            }`}
          >
            Prayer Journal
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('journal')}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-800 sm:hidden"
            aria-label="Journal"
          >
            <BookOpen className="h-5 w-5" />
          </button>
          <button onClick={onStartPrayer} className="btn-gold !px-5 !py-2.5 text-xs sm:text-sm">
            <Sparkles className="h-4 w-4" />
            New Prayer
          </button>
        </div>
      </nav>
    </header>
  );
}
