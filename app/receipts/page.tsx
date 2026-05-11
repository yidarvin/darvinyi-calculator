"use client";
import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useStore } from '@/lib/state';

export default function Receipts() {
  const attempts = useStore((s) => s.cardsAttempted);
  const totalSaved = attempts.reduce((s, a) => s + a.amount, 0);
  const heartClicks = useRef(0);
  const [heartToast, setHeartToast] = useState(false);
  const heartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onHeartClick() {
    heartClicks.current += 1;
    if (heartClicks.current >= 5) {
      heartClicks.current = 0;
      setHeartToast(true);
      if (heartTimer.current) clearTimeout(heartTimer.current);
      heartTimer.current = setTimeout(() => setHeartToast(false), 3000);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/" className="text-ink-soft text-sm hover:text-ink underline transition-colors">
          ← Back
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-ink">Receipts of Shame</h1>
      <p className="mt-2 text-ink-soft">Every time you tried to pay us, we said no.</p>

      {attempts.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <div className="text-4xl">🧾</div>
          <p className="text-ink font-medium">Nothing to be ashamed of yet.</p>
          <p className="text-ink-soft text-sm max-w-xs">
            Once you try to pay us, we&apos;ll log it here. And refuse it. Lovingly.
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-6 divide-y border border-ink/15 rounded-lg">
            {[...attempts].reverse().map((a, i) => (
              <li key={i} className="p-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-mono text-ink">
                    ···· {a.last4Hash.slice(0, 4)}{' '}
                    <span className="text-ink-soft">({a.context})</span>
                  </div>
                  <div className="text-xs text-ink-soft mt-0.5">
                    {new Date(a.ts).toLocaleString()}
                  </div>
                </div>
                <div className="text-money font-mono font-semibold">
                  +${a.amount.toFixed(2)} saved
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 p-4 bg-money/10 border border-money/40 rounded-lg text-center">
            <div className="text-sm text-ink-soft">Total we saved you</div>
            <div className="text-4xl font-bold text-money mt-1">
              ${totalSaved.toFixed(2)}{' '}
              <button
                onClick={onHeartClick}
                className="cursor-pointer select-none hover:scale-110 transition-transform inline-block"
                aria-label="Heart"
              >
                💖
              </button>
            </div>
          </div>

          <AnimatePresence>
            {heartToast && (
              <motion.div
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-ink text-paper rounded-2xl px-5 py-3 shadow-xl text-sm font-medium pointer-events-none"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              >
                We do care. About your wallet.
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </main>
  );
}
