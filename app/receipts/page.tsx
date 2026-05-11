"use client";
import Link from 'next/link';
import { useStore } from '@/lib/state';

export default function Receipts() {
  const attempts = useStore((s) => s.cardsAttempted);
  const totalSaved = attempts.reduce((s, a) => s + a.amount, 0);

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
        <div className="mt-10 text-center text-ink-soft italic">
          No attempts yet. Try entering a card somewhere — we&apos;ll log it (and refuse it).
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
              ${totalSaved.toFixed(2)} 💖
            </div>
          </div>
        </>
      )}
    </main>
  );
}
