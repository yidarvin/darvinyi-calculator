'use client';
import { AnimatePresence, motion } from 'framer-motion';
import type { Trigger } from '@/lib/triggers';

export type CostToastData = {
  expression: string;
  result: string;
  baseCost: number;
  surge: number;
  hits: Trigger[];
  total: number;
  showPremium: boolean;
};

type Props = {
  toast: CostToastData | null;
  toastKey: number;
};

export function CostToast({ toast, toastKey }: Props) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toastKey}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-ink text-paper rounded-2xl px-5 py-3 shadow-xl pointer-events-none"
          style={{ minWidth: '220px', maxWidth: '90vw', width: 'max-content' }}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        >
          <div className="font-mono text-base font-bold text-center">
            {toast.expression} = {toast.result}
          </div>
          <div className="text-xs text-paper/70 mt-1 text-center leading-relaxed">
            <span>{toast.baseCost} base</span>
            <span className="mx-1 opacity-50">×</span>
            <span className="font-mono">{toast.surge.toFixed(1)} surge</span>
            {toast.showPremium && toast.hits.map((h) => (
              <span key={h.id}>
                <span className="mx-1 opacity-50">×</span>
                <span className="text-[oklch(0.75_0.18_30)] font-mono">
                  {h.mult} ({h.label})
                </span>
              </span>
            ))}
            <span className="mx-1 opacity-50">=</span>
            <span className="font-semibold text-paper">{toast.total} credits</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
