"use client";
import { useStore } from "@/lib/state";
import Link from "next/link";

export default function DevPage() {
  const state = useStore();

  // Strip action functions — only show plain state
  const {
    bumpUses, bumpInteractions, advance, addCredits, spendCredits,
    setSurge, incrementSurgeCalcs, addPremiumTriggers, incrementVideoAdsDismissed,
    setAdFree, setDebt, setPlan, recordCardAttempt, markOnboardingDone,
    markCertShared, addToDebt, bumpTokens, setChatMessages, setCaptchaPassed,
    setSignupCompleted, setCookiesAccepted, addAchievement, setSoundEnabled,
    setReduceMotion, reset,
    ...plainState
  } = state;

  return (
    <main className="min-h-dvh bg-ink text-paper p-6 font-mono">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-paper/40 mb-1">
              Calculator 2026
            </p>
            <h1 className="text-xl font-bold text-paper">Developer Dashboard</h1>
            <p className="text-xs text-paper/50 mt-1">
              Unlocked via Konami code. You found a secret.
            </p>
          </div>
          <Link
            href="/"
            className="text-xs text-paper/50 border border-paper/20 rounded-full px-3 py-1.5 hover:text-paper/80 transition-colors"
          >
            ← Back
          </Link>
        </div>

        <div className="bg-paper/5 border border-paper/10 rounded-xl p-4 overflow-auto">
          <pre className="text-xs text-[oklch(0.8_0.15_150)] leading-relaxed whitespace-pre-wrap break-all">
            {JSON.stringify(plainState, null, 2)}
          </pre>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={reset}
            className="px-3 py-1.5 bg-alarm/80 text-white rounded-full text-xs font-semibold hover:bg-alarm transition-colors"
          >
            Reset all state
          </button>
          <button
            onClick={() => advance("ai")}
            className="px-3 py-1.5 bg-ai/80 text-white rounded-full text-xs font-semibold hover:bg-ai transition-colors"
          >
            Skip to AI mode
          </button>
          <button
            onClick={() => { addCredits(9999); advance("surge"); }}
            className="px-3 py-1.5 bg-money/80 text-white rounded-full text-xs font-semibold hover:bg-money transition-colors"
          >
            Give 9999 credits
          </button>
        </div>

        <p className="mt-6 text-[10px] text-paper/20 text-center">
          This page is only accessible via the Konami code. Don't share it.
        </p>
      </div>
    </main>
  );
}
