"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type Props = { onClose: () => void };

function getRefId(): string {
  if (typeof localStorage === 'undefined') return 'abc123xyz';
  let id = localStorage.getItem('refId');
  if (!id) {
    id = Math.random().toString(36).slice(2, 11);
    localStorage.setItem('refId', id);
  }
  return id;
}

export function Referral({ onClose }: Props) {
  const [refId, setRefId] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setRefId(getRefId());
  }, []);

  const link = `https://calculator2026.com/?ref=${refId}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // fallback: ignore
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        className="bg-paper rounded-2xl p-6 max-w-sm w-full shadow-2xl"
      >
        <h2 className="text-lg font-semibold text-ink mb-1">🎁 Refer a friend</h2>
        <p className="text-sm text-ink-soft mb-4">
          Share your link and earn{' '}
          <strong className="text-ink">0 credits</strong> per signup.*
        </p>

        <label className="block text-xs text-ink-soft font-medium mb-1 uppercase tracking-wide">
          Your referral link
        </label>
        <div className="flex gap-2 mb-1">
          <input
            readOnly
            value={link}
            className="flex-1 border border-ink/20 rounded-xl px-3 py-2 text-xs font-mono bg-[#f0ece4] text-ink-soft overflow-hidden"
          />
          <button
            onClick={copy}
            className="px-4 py-2 bg-ink text-paper rounded-xl text-sm font-semibold shrink-0 hover:bg-ink/80 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <p className="text-[10px] text-ink-soft/60 mb-5">
          * terms apply; "earning" subject to validation, audit, approval, and 47 additional conditions
        </p>

        <button
          onClick={onClose}
          className="w-full py-2.5 text-sm text-ink-soft border border-ink/20 rounded-full hover:border-ink/40 transition-colors"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}

// Trigger button — drop into a header
export function ReferralButton() {
  return (
    <button
      onClick={() => {
        // Dynamic import to avoid circular — emit via event bus
        import('@/lib/events').then(({ emit }) =>
          emit('overlay.open', { key: 'referral', props: {} })
        );
      }}
      className="text-xs text-ink-soft/70 border border-ink/15 rounded-full px-3 py-1 hover:border-ink/30 hover:text-ink-soft transition-colors"
    >
      🎁 Refer a friend, earn credits!
    </button>
  );
}

export default Referral;
