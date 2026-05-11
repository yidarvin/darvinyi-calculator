"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/state';
import { Spotlight } from './Spotlight';

export type TourStep = {
  target: string;
  title: string;
  body: string;
  cta?: string;
};

function CertModal({ onDone }: { onDone: () => void }) {
  const [certId] = useState(() => Math.random().toString(36).slice(2, 10));
  const url = `calculator2026.com/certificates/u/${certId}`;
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(`https://${url}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50"
      onClick={onDone}
    >
      <div
        className="bg-paper border-2 border-ink rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-3xl mb-2 text-center">🎓</div>
        <h2 className="text-lg font-bold text-center mb-1">Certificate issued!</h2>
        <p className="text-sm text-ink-soft text-center mb-4">
          Share your achievement with the world.
        </p>
        <div className="bg-ink/5 border border-ink/15 rounded-lg px-3 py-2 flex items-center gap-2 mb-4">
          <span className="flex-1 text-xs font-mono text-ink-soft truncate">{url}</span>
          <button
            onClick={copy}
            className="text-xs bg-ink text-paper px-2 py-1 rounded shrink-0"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <button onClick={onDone} className="w-full text-sm text-ink-soft underline text-center">
          Just let me calculate
        </button>
      </div>
    </div>
  );
}

function Bubble({
  rect,
  step,
  index,
  total,
  onNext,
  onSkip,
  onSkipHover,
  skipPos,
}: {
  rect: DOMRect | null;
  step: TourStep;
  index: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
  onSkipHover: () => void;
  skipPos: { x: number; y: number };
}) {
  const aboveSpace = rect ? rect.top : 0;
  const placeAbove = aboveSpace > 220;
  const style: React.CSSProperties = rect
    ? {
        left: Math.min(window.innerWidth - 380, Math.max(8, rect.left + rect.width / 2 - 160)),
        top: placeAbove ? rect.top - 200 : rect.bottom + 16,
      }
    : { left: '50%', top: '40%', transform: 'translateX(-50%)' };

  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute w-[360px] bg-paper border-2 border-ink rounded-lg p-4 shadow-xl"
      style={style}
    >
      <div className="text-xs text-ink-soft mb-1 font-mono">
        Step {index + 1} / {total}
      </div>
      <h3 className="text-lg font-bold">{step.title}</h3>
      <p className="mt-1 text-sm text-ink-soft">{step.body}</p>
      <div className="mt-4 flex items-center justify-between">
        <motion.button
          className="text-xs underline text-ink-soft"
          animate={{ x: skipPos.x, y: skipPos.y }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          onMouseEnter={onSkipHover}
          onFocus={onSkipHover}
          onClick={onSkip}
        >
          Skip
        </motion.button>
        <button className="px-4 py-2 bg-ink text-paper rounded text-sm" onClick={onNext}>
          {step.cta ?? 'Next →'}
        </button>
      </div>
    </motion.div>
  );
}

export function Tour({ steps, onDone }: { steps: TourStep[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [skipPos, setSkipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showCert, setShowCert] = useState(false);
  const markCertShared = useStore((s) => s.markCertShared);
  const step = steps[i];

  useEffect(() => {
    function update() {
      const el = document.querySelector(step.target);
      if (el) setRect(el.getBoundingClientRect());
    }
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, [step.target]);

  function next() {
    if (i + 1 >= steps.length) {
      if (step.cta?.includes('LinkedIn')) {
        markCertShared();
        setShowCert(true);
        return;
      }
      onDone();
      return;
    }
    setI(i + 1);
    setSkipPos({ x: 0, y: 0 });
  }

  function moveSkip() {
    if (i < 3) return;
    if (i < 6) {
      setSkipPos({ x: (Math.random() - 0.5) * 240, y: (Math.random() - 0.5) * 80 });
    } else {
      setSkipPos({ x: -9999, y: 0 });
    }
  }

  if (showCert) {
    return <CertModal onDone={onDone} />;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] pointer-events-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Spotlight rect={rect} />
        <Bubble
          rect={rect}
          step={step}
          index={i}
          total={steps.length}
          onNext={next}
          onSkip={onDone}
          onSkipHover={moveSkip}
          skipPos={skipPos}
        />
      </motion.div>
    </AnimatePresence>
  );
}
