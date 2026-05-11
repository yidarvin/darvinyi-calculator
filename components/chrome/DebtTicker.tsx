"use client";
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/state';
import { debtAt, formatDebt } from '@/lib/iou';
import { DebtPayoffSheet } from './DebtPayoffSheet';

export function DebtTicker() {
  const debt = useStore(s => s.debt);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<number>(() => Date.now());
  const [open, setOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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

  if (!mounted || !debt) return null;

  const amount = debtAt(now, debt.principal, debt.startedAt);

  return (
    <>
      <button
        id="debt-ticker"
        onClick={() => setOpen(true)}
        className="fixed top-3 right-3 z-40 bg-money text-white px-3 py-1.5 rounded font-mono text-xs shadow-[2px_2px_0_var(--color-ink)] border border-ink hover:brightness-110 transition-all"
      >
        You owe {formatDebt(amount)}
      </button>
      {open && <DebtPayoffSheet onClose={() => setOpen(false)} />}
    </>
  );
}

export default DebtTicker;
