import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Landing from './components/Landing';
import IntakeFlow from './components/IntakeFlow';
import PrayerOutput from './components/PrayerOutput';
import JournalView from './components/JournalView';
import CommunityView from './components/CommunityView';
import BibleReader from './components/BibleReader';
import UpgradeModal from './components/UpgradeModal';
import AuthModal from './components/AuthModal';
import { Toast, useToast } from './components/Toast';
import { AuthProvider, useAuth } from './lib/auth';
import { incrementPrayerCount, getIsPremium } from './lib/paywall';
import type { AppView, PrayerResult, VoiceId } from './types';

function AppContent() {
  const { user } = useAuth();
  const [view, setView] = useState<AppView>('landing');
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [prayer, setPrayer] = useState<PrayerResult | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [authPrompt, setAuthPrompt] = useState<{ title?: string; subtitle?: string } | undefined>(undefined);
  const [isPremium, setIsPremiumState] = useState(getIsPremium());
  const [voice, setVoice] = useState<VoiceId>('onyx');
  const { toast, showToast } = useToast();

  const startPrayer = () => {
    setPrayer(null);
    setIntakeOpen(true);
  };

  const handlePrayerComplete = (result: PrayerResult) => {
    incrementPrayerCount();
    setPrayer(result);
    if (result.voice === 'onyx' || result.voice === 'shimmer') setVoice(result.voice);
    setIntakeOpen(false);
    setView('prayer');
  };

  const handleNavigate = (target: AppView) => {
    setView(target);
  };

  const handlePaywall = () => {
    setIntakeOpen(false);
    setUpgradeOpen(true);
  };

  const handlePremiumActivated = () => {
    setIsPremiumState(true);
  };

  const showAuth = (mode: 'signin' | 'signup', prompt?: { title?: string; subtitle?: string }) => {
    setAuthMode(mode);
    setAuthPrompt(prompt);
    setAuthOpen(true);
  };

  const requireAuth = (action: () => void, promptTitle?: string, promptSubtitle?: string) => {
    if (user) {
      action();
    } else {
      showAuth('signup', { title: promptTitle, subtitle: promptSubtitle });
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  return (
    <div className="min-h-screen">
      <Navbar
        view={view}
        onNavigate={handleNavigate}
        onStartPrayer={startPrayer}
        isPremium={isPremium}
        onShowAuth={(mode) => showAuth(mode)}
      />

      {view === 'landing' && (
        <Landing
          onStartPrayer={startPrayer}
          onNavigate={(v) => handleNavigate(v)}
          onShowUpgrade={() => setUpgradeOpen(true)}
        />
      )}

      {view === 'prayer' && prayer && (
        <PrayerOutput
          prayer={prayer}
          onBack={() => handleNavigate('landing')}
          onGoToJournal={() => {
            requireAuth(
              () => handleNavigate('journal'),
              'Sign up to view your prayer journal',
              'Create a free account to save prayers, track answered prayers, and revisit your spiritual journey anytime.'
            );
          }}
          showToast={showToast}
          isPremium={isPremium}
          voice={voice}
          onVoiceChange={setVoice}
          onRequireAuth={(action, title, subtitle) => requireAuth(action, title, subtitle)}
        />
      )}

      {view === 'prayer' && !prayer && (
        <div className="flex min-h-screen items-center justify-center pt-16">
          <p className="text-ink-400">Loading...</p>
        </div>
      )}

      {view === 'journal' && (
        <JournalView
          onStartPrayer={startPrayer}
          onViewPrayer={(p) => {
            setPrayer(p);
            setView('prayer');
          }}
        />
      )}

      {view === 'community' && (
        <CommunityView
          onShowUpgrade={() => setUpgradeOpen(true)}
          onShowAuth={() => showAuth('signup')}
        />
      )}

      {view === 'bible' && (
        <BibleReader
          onShowUpgrade={() => setUpgradeOpen(true)}
        />
      )}

      {intakeOpen && (
        <IntakeFlow
          onClose={() => setIntakeOpen(false)}
          onComplete={handlePrayerComplete}
          onPaywall={handlePaywall}
        />
      )}

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        showToast={showToast}
        onPremiumActivated={handlePremiumActivated}
      />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
        title={authPrompt?.title}
        subtitle={authPrompt?.subtitle}
      />

      <Toast toast={toast} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
