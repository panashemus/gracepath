import { useState, useEffect, useRef } from 'react';
import {
  Crown, Sparkles, LogOut, ChevronDown, Menu, X,
  Home, BookOpen, Users, Heart, User as UserIcon,
} from 'lucide-react';
import { LogoMark } from './Logo';
import { useAuth } from '../lib/auth';
import NotificationBell from './NotificationBell';
import type { AppView } from '../types';

interface NavbarProps {
  view: AppView;
  onNavigate: (view: AppView) => void;
  onStartPrayer: () => void;
  isPremium: boolean;
  onShowAuth: (mode: 'signin' | 'signup') => void;
}

const NAV_ITEMS: { view: AppView; label: string; icon: typeof Home }[] = [
  { view: 'landing', label: 'Home', icon: Home },
  { view: 'journal', label: 'Journal', icon: BookOpen },
  { view: 'community', label: 'Community', icon: Users },
  { view: 'bible', label: 'Bible', icon: Heart },
];

export default function Navbar({ view, onNavigate, onStartPrayer, isPremium, onShowAuth }: NavbarProps) {
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const handleNavigate = (target: AppView) => {
    onNavigate(target);
    setDrawerOpen(false);
  };

  const handleStartPrayer = () => {
    onStartPrayer();
    setDrawerOpen(false);
  };

  const displayName = profile?.username
    ? `@${profile.username}`
    : user?.email
    ? user.email.split('@')[0]
    : '';

  const initials = profile?.username
    ? profile.username.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : '?';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-ink-100/60 bg-white/80 backdrop-blur-lg">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Left: Logo */}
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <LogoMark className="h-9 w-9" />
            <span className="font-serif text-lg font-semibold text-ink-900">GracePath</span>
            {isPremium && (
              <span className="hidden items-center gap-1 rounded-full bg-champagne-100 px-2 py-0.5 text-[10px] font-bold text-champagne-700 sm:inline-flex">
                <Crown className="h-3 w-3" />
                PREMIUM
              </span>
            )}
          </button>

          {/* Center: Desktop nav */}
          <div className="hidden items-center gap-6 md:flex">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`text-sm font-medium transition-colors ${
                  view === item.view ? 'text-ink-900' : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right: Desktop actions */}
          <div className="hidden items-center gap-3 md:flex">
            <NotificationBell onShowAuth={() => onShowAuth('signin')} />
            <button onClick={onStartPrayer} className="btn-gold !px-5 !py-2.5 text-sm">
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
                      <p className="truncate text-sm font-semibold text-ink-900">{displayName || user.email}</p>
                      {profile?.username && (
                        <p className="truncate text-xs text-ink-400">{user.email}</p>
                      )}
                    </div>
                    <div className="p-2">
                      <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-500">
                        <UserIcon className="h-4 w-4" />
                        My Account
                      </div>
                      <button
                        onClick={() => { signOut(); setMenuOpen(false); }}
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
              <div className="flex items-center gap-2">
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

          {/* Right: Mobile — hamburger + avatar only */}
          <div className="flex items-center gap-2 md:hidden">
            <NotificationBell onShowAuth={() => onShowAuth('signin')} />
            {user ? (
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-champagne-300"
                aria-label="Open menu"
              >
                {initials}
              </button>
            ) : (
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 transition-colors hover:bg-ink-50"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-2xl animate-slide-in-right">
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <LogoMark className="h-8 w-8" />
                <span className="font-serif text-base font-semibold text-ink-900">GracePath</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User info */}
            {user && (
              <div className="border-b border-ink-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-sm font-semibold text-champagne-300">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">{displayName || user.email}</p>
                    {profile?.username && (
                      <p className="truncate text-xs text-ink-400">{user.email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Nav links */}
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <div className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = view === item.view;
                  return (
                    <button
                      key={item.view}
                      onClick={() => handleNavigate(item.view)}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-ink-50 text-ink-900'
                          : 'text-ink-600 hover:bg-ink-50/50'
                      }`}
                    >
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-champagne-500' : 'text-ink-400'}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="my-4 border-t border-ink-100" />

              <button
                onClick={handleStartPrayer}
                className="btn-gold w-full text-sm"
              >
                <Sparkles className="h-4 w-4" />
                New Prayer
              </button>

              {user ? (
                <button
                  onClick={() => { signOut(); setDrawerOpen(false); }}
                  className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-ink-500 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              ) : (
                <div className="mt-3 space-y-2">
                  <button
                    onClick={() => { onShowAuth('signup'); setDrawerOpen(false); }}
                    className="btn-primary w-full text-sm"
                  >
                    Create Account
                  </button>
                  <button
                    onClick={() => { onShowAuth('signin'); setDrawerOpen(false); }}
                    className="btn-ghost w-full text-sm"
                  >
                    Log In
                  </button>
                </div>
              )}
            </div>

            {/* Premium badge */}
            {isPremium && (
              <div className="border-t border-ink-100 px-5 py-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-champagne-100 px-3 py-1 text-xs font-bold text-champagne-700">
                  <Crown className="h-3 w-3" />
                  PREMIUM MEMBER
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
