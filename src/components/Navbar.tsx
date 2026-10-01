import { useState, useEffect, useRef } from 'react';
import { BookOpen, Crown, Sparkles, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { LogoMark } from './Logo';
import { useAuth } from '../lib/auth';
import type { AppView } from '../types';

interface NavbarProps {
  view: AppView;
  onNavigate: (view: AppView) => void;
  onStartPrayer: () => void;
  isPremium: boolean;
  onShowAuth: (mode: 'signin' | 'signup') => void;
}

export default function Navbar({ view, onNavigate, onStartPrayer, isPremium, onShowAuth }: NavbarProps) {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const initials = user?.email
    ? user.email.charAt(0).toUpperCase()
    : '?';

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

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-full border border-ink-100 bg-white py-1.5 pl-1.5 pr-2.5 transition-all hover:border-ink-200 hover:shadow-soft"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-champagne-300">
                  {initials}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-ink-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card animate-scale-in">
                  <div className="border-b border-ink-100 px-4 py-3">
                    <p className="text-xs font-medium text-ink-400">Signed in as</p>
                    <p className="truncate text-sm font-semibold text-ink-900">{user.email}</p>
                  </div>
                  <div className="p-2">
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-500">
                      <UserIcon className="h-4 w-4" />
                      My Account
                    </div>
                    <button
                      onClick={() => {
                        signOut();
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <button
                onClick={() => onShowAuth('signin')}
                className="rounded-full px-4 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"
              >
                Log In
              </button>
              <button
                onClick={() => onShowAuth('signup')}
                className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition-all hover:border-ink-300 hover:shadow-soft"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
