'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalcPad } from '@/components/calculator/CalcPad';
import ChatMode from '@/components/chat/ChatMode';
import SurgeBanner from '@/components/chrome/SurgeBanner';
import CreditBalance from '@/components/chrome/CreditBalance';
import { AdBanner } from '@/components/chrome/AdBanner';
import { AdFreeUpsell } from '@/components/overlays/AdFreeUpsell';
import { RestartButton } from '@/components/chrome/RestartButton';
import { ReferralButton } from '@/components/overlays/Referral';
import Link from 'next/link';
import { useStore } from '@/lib/state';

export default function Home() {
  const router = useRouter();
  const stage = useStore((s) => s.stage);
  const interactions = useStore((s) => s.interactions);
  const [showAdFreeUpsell, setShowAdFreeUpsell] = useState(false);
  const prevInteractionsRef = useRef(0);

  useEffect(() => {
    if (stage === 'paywall') router.replace('/paywall');
  }, [stage, router]);

  // Fire AdFreeUpsell every 7th interaction in ads stage
  useEffect(() => {
    if (stage !== 'ads') {
      prevInteractionsRef.current = interactions;
      return;
    }
    if (
      interactions > 0 &&
      Math.floor(interactions / 7) > Math.floor(prevInteractionsRef.current / 7)
    ) {
      setShowAdFreeUpsell(true);
    }
    prevInteractionsRef.current = interactions;
  }, [interactions, stage]);

  if (stage === 'paywall') return null;

  const showAds = stage === 'ads' || stage === 'ai';

  return (
    <div className="h-dvh flex flex-col">
      <SurgeBanner />

      {/* Top leaderboard banner */}
      {showAds && (
        <div id="ad-top" className="w-full overflow-x-auto border-b border-ad/20 flex justify-center bg-ad/5 py-1">
          <AdBanner size="728x90" />
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        {/* Left skyscraper rail — desktop only */}
        {showAds && (
          <div className="hidden lg:flex items-start justify-end pt-8 pl-2 pr-2 border-r border-ad/10">
            <AdBanner size="160x600" />
          </div>
        )}

        {/* Center: calculator or AI chat */}
        {stage === 'ai' ? (
          <main className="flex-1 flex flex-col min-h-0">
            <ChatMode />
          </main>
        ) : (
          <main className="flex-1 flex flex-col items-center justify-center p-6">
            <header className="mb-8 text-center flex items-center gap-4 flex-wrap justify-center">
              <h1 className="font-sans text-2xl font-medium tracking-tight text-ink">
                Calculator 2026
              </h1>
              <CreditBalance />
              <ReferralButton />
              <RestartButton />
            </header>
            <CalcPad />
          </main>
        )}

        {/* Right rail — desktop only */}
        {showAds && (
          <div id="ad-side" className="hidden lg:flex flex-col gap-4 items-start pt-8 pl-2 pr-2 border-l border-ad/10">
            <AdBanner size="300x250" />
          </div>
        )}
      </div>

      {/* Bottom banner strip */}
      {showAds && (
        <div className="w-full overflow-x-auto border-t border-ad/20 bg-ad/5 py-1">
          <div className="flex gap-2 px-2 justify-center items-center">
            <AdBanner size="320x50" />
            <AdBanner size="100x100" />
            <AdBanner size="100x100" />
          </div>
        </div>
      )}

      <AdFreeUpsell
        open={showAdFreeUpsell}
        onClose={() => setShowAdFreeUpsell(false)}
      />

      <footer className="text-center py-2 flex items-center justify-center gap-4">
        <Link href="/receipts" className="text-[11px] text-ink-soft/50 hover:text-ink-soft transition-colors">
          Receipts
        </Link>
        <Link href="/settings" className="text-[11px] text-ink-soft/50 hover:text-ink-soft transition-colors">
          Settings
        </Link>
      </footer>
    </div>
  );
}
