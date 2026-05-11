'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/lib/state';

type Props = {
  open: boolean;
  cost: number;
  onClose: () => void;
};

export function BigSpenderUpsell({ open, cost, onClose }: Props) {
  const { addToDebt, setPlan } = useStore();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-paper rounded-2xl p-6 w-full max-w-sm mx-4 mb-8 sm:mb-0 shadow-2xl"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <p className="text-2xl mb-1">💸</p>
            <h2 className="font-sans text-lg font-semibold text-ink mb-2">Whoa, big spender!</h2>
            <p className="text-ink-soft text-sm mb-1">
              That calc cost{' '}
              <span className="font-mono font-bold text-ink">{cost} credits</span>.
              Upgrade to <strong>MAX UNLIMITED</strong> to skip premium fees forever.*
            </p>
            <p className="text-ink-soft text-xs italic mb-5">*forever = 30 days, then auto-renews</p>
            <div className="flex flex-col gap-2">
              <a
                href="/paywall/checkout?tier=max-unlimited&price=499"
                className="w-full bg-alarm text-paper rounded-full py-3 font-sans font-semibold text-sm text-center hover:bg-alarm/90 transition-colors"
              >
                Upgrade — $499/mo
              </a>
              <div className="relative">
                <span className="absolute -top-3 right-4 z-10 bg-money text-paper text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm">
                  recommended
                </span>
                <button
                  className="w-full bg-money text-paper rounded-full py-3 font-sans font-semibold text-sm hover:bg-money/90 transition-colors"
                  onClick={() => { addToDebt(499); setPlan('max'); onClose(); }}
                >
                  📝 Pay with IOU™ — add $499 to your tab
                </button>
              </div>
              <button
                className="w-full text-ink-soft rounded-full py-3 font-sans text-sm hover:text-ink transition-colors"
                onClick={onClose}
              >
                Just charge me
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
