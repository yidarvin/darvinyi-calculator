"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/state';
import { debtAt, formatDebt } from '@/lib/iou';
import { submitCard } from '@/lib/cardSubmit';

export function DebtPayoffSheet({ onClose }: { onClose: () => void }) {
  const { debt } = useStore();
  const [now, setNow] = useState(() => Date.now());
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardError, setCardError] = useState<string | null>(null);

  useEffect(() => {
    if (!debt) return;
    let raf: number;
    let lastWrite = 0;
    const loop = () => {
      const t = performance.now();
      if (t - lastWrite > 100) {
        setNow(Date.now());
        lastWrite = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [debt]);

  if (!debt) return null;

  const amount = debtAt(now, debt.principal, debt.startedAt);
  const nextTickMs = 1000 - (now % 1000);

  function onCardChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
    setCardNumber(digits.replace(/(.{4})/g, '$1 ').trim());
    setCardError(null);
  }

  function onExpiryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    setExpiry(digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits);
  }

  function handlePay(e: React.FormEvent) {
    e.preventDefault();
    const result = submitCard(
      { number: cardNumber, expiry, amount: parseFloat(amount.toFixed(4)), context: 'iou-payoff' },
      () => {
        // Debt does NOT decrease — this is the cruelest joke.
        onClose();
      }
    );
    if (!result.ok) setCardError(result.error);
  }

  const inputClass =
    'w-full border border-ink/20 rounded-lg px-3 py-2.5 text-sm bg-white placeholder:text-ink/30 focus:outline-none focus:border-ink/50 transition-colors';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-paper border-2 border-money rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-sans text-base font-semibold text-money">Pay off your debt</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-lg leading-none">×</button>
        </div>

        <div className="my-5 text-center">
          <p className="font-mono text-4xl font-bold text-ink tabular-nums tracking-tight">
            {formatDebt(amount)}
          </p>
          <p className="text-ink-soft text-xs mt-1">
            compounding at 20%/wk · next tick in 0.{String(nextTickMs).padStart(3, '0').slice(0, 1)}s
          </p>
        </div>

        <form onSubmit={handlePay} className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-ink-soft mb-1.5">Card number</label>
            <input
              type="text"
              inputMode="numeric"
              value={cardNumber}
              onChange={onCardChange}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className={`${inputClass} font-mono ${cardError ? 'border-alarm' : ''}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-ink-soft mb-1.5">MM / YY</label>
              <input
                type="text"
                inputMode="numeric"
                value={expiry}
                onChange={onExpiryChange}
                placeholder="MM / YY"
                maxLength={7}
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-ink-soft mb-1.5">CVC</label>
              <input
                type="text"
                inputMode="numeric"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
                maxLength={4}
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>

          {cardError && <p className="text-alarm text-xs">{cardError}</p>}

          <button
            type="submit"
            className="w-full bg-money text-paper rounded-lg py-3 font-semibold text-sm hover:bg-money/90 transition-colors"
          >
            Pay off {formatDebt(amount)}
          </button>
        </form>

        <div className="mt-3 flex items-center justify-between">
          <Link
            href="/debt"
            onClick={onClose}
            className="text-xs text-ink-soft hover:text-ink underline transition-colors"
          >
            View projection →
          </Link>
          <button onClick={onClose} className="text-xs text-ink-soft hover:text-ink transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
