"use client";
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/lib/state';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AdFreeUpsell({ open, onClose }: Props) {
  const { addToDebt, setAdFree } = useStore();
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
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <p className="text-2xl mb-1">😤</p>
            <h2 className="font-sans text-lg font-semibold text-ink mb-2">
              Tired of ads?
            </h2>
            <p className="text-ink text-sm mb-1">
              Upgrade to <strong>AD-FREE</strong> for just $79/mo*
            </p>
            <p className="text-ink-soft text-xs italic mb-5">
              *billed annually as $948, non-refundable, you&apos;ll still see &ldquo;partner
              messages&rdquo;
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/paywall/checkout?tier=ad-free&price=79"
                className="w-full bg-ad text-paper rounded-full py-3 font-sans font-semibold text-sm text-center hover:opacity-90 transition-opacity"
                onClick={onClose}
              >
                Go Ad-Free — $79/mo
              </Link>
              <div className="relative">
                <span className="absolute -top-3 right-4 z-10 bg-money text-paper text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm">
                  recommended
                </span>
                <button
                  className="w-full bg-money text-paper rounded-full py-3 font-sans font-semibold text-sm hover:bg-money/90 transition-colors"
                  onClick={() => { addToDebt(79); setAdFree(); onClose(); }}
                >
                  📝 Pay with IOU™ — add $79 to your tab
                </button>
              </div>
              <button
                className="w-full text-ink-soft rounded-full py-3 font-sans text-sm hover:text-ink transition-colors"
                onClick={onClose}
              >
                Keep watching ads
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AdFreeUpsell;
