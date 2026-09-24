import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Landing from './components/Landing';
import IntakeFlow from './components/IntakeFlow';
import PrayerOutput from './components/PrayerOutput';
import JournalView from './components/JournalView';
import UpgradeModal from './components/UpgradeModal';
import { Toast, useToast } from './components/Toast';
import { incrementPrayerCount, getIsPremium } from './lib/paywall';
import type { AppView, PrayerResult, VoiceId } from './types';

function App() {
  const [view, setView] = useState<AppView>('landing');
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [prayer, setPrayer] = useState<PrayerResult | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
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
          onGoToJournal={() => handleNavigate('journal')}
          showToast={showToast}
          isPremium={isPremium}
          voice={voice}
          onVoiceChange={setVoice}
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

      <Toast toast={toast} />
    </div>
  );
}

export default App;
