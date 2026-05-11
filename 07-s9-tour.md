# Phase 07 — S9 (Guided tour with runaway Skip button)

> **Fresh Claude Code session.** Read `CONTEXT.md` and `STAGES.md` first (S9 section).
>
> Builds on phase 06. The tour fires on every stage transition.

---

## Your task

Build a reusable `<Tour>` component that dims the screen, spotlights a target element, shows a speech bubble, and walks the user through stage features. The Skip button starts to move evasively after a few steps.

### 1. Tour component (`components/tour/Tour.tsx`)

```tsx
"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type TourStep = {
  target: string;        // CSS selector
  title: string;
  body: string;
  cta?: string;          // override "Next" label
};

export function Tour({ steps, onDone }: { steps: TourStep[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [skipPos, setSkipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
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
    if (i + 1 >= steps.length) { onDone(); return; }
    setI(i + 1);
    setSkipPos({ x: 0, y: 0 });
  }

  function moveSkip() {
    if (i < 3) return;             // steps 1-3: behave normally
    if (i < 6) {
      setSkipPos({ x: (Math.random() - 0.5) * 240, y: (Math.random() - 0.5) * 80 });
    } else {
      setSkipPos({ x: -9999, y: 0 }); // off-screen
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] pointer-events-auto"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <Spotlight rect={rect} />
        <Bubble rect={rect} step={step} index={i} total={steps.length}
                onNext={next} onSkip={onDone} onSkipHover={moveSkip} skipPos={skipPos} />
      </motion.div>
    </AnimatePresence>
  );
}
```

**No Esc handler.** Don't add one. The joke is that Skip is the only escape and it runs away.

### 2. Spotlight (`components/tour/Spotlight.tsx`)

Full-screen dark overlay with a hole cut around `rect`.

```tsx
export function Spotlight({ rect }: { rect: DOMRect | null }) {
  if (!rect) return <div className="absolute inset-0 bg-black/60" />;
  const pad = 8;
  const clip = `polygon(
    0 0, 0 100%, 100% 100%, 100% 0,
    0 0,
    ${rect.left - pad}px ${rect.top - pad}px,
    ${rect.left - pad}px ${rect.bottom + pad}px,
    ${rect.right + pad}px ${rect.bottom + pad}px,
    ${rect.right + pad}px ${rect.top - pad}px,
    ${rect.left - pad}px ${rect.top - pad}px
  )`;
  return (
    <>
      <div className="absolute inset-0 bg-black/60" style={{ clipPath: clip }} />
      <div
        className="absolute pointer-events-none rounded ring-2 ring-paper"
        style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad*2, height: rect.height + pad*2 }}
      />
    </>
  );
}
```

### 3. Bubble

A speech bubble positioned near the spotlight. Auto-flip above/below depending on space:

```tsx
function Bubble({ rect, step, index, total, onNext, onSkip, onSkipHover, skipPos }: …) {
  const aboveSpace = rect ? rect.top : 0;
  const placeAbove = aboveSpace > 220;
  const style = rect ? {
    left: Math.min(window.innerWidth - 380, Math.max(8, rect.left + rect.width/2 - 160)),
    top: placeAbove ? rect.top - 200 : rect.bottom + 16,
  } : { left: '50%', top: '40%', transform: 'translateX(-50%)' };

  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="absolute w-[360px] bg-paper border-2 border-ink rounded-lg p-4 shadow-xl"
      style={style}
    >
      <div className="text-xs text-ink-soft mb-1 font-mono">Step {index+1} / {total}</div>
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
        >Skip</motion.button>
        <button className="px-4 py-2 bg-ink text-paper rounded text-sm" onClick={onNext}>
          {step.cta ?? `Next →`}
        </button>
      </div>
    </motion.div>
  );
}
```

### 4. Tour content per stage (`lib/tours.ts`)

```ts
import { TourStep } from '@/components/tour/Tour';

export const tours: Record<string, TourStep[]> = {
  free: [
    { target: '#display',     title: 'Welcome!',       body: 'This is your display.' },
    { target: '#key-7',       title: 'Type numbers',   body: 'Tap any digit to enter it.' },
    { target: '#key-eq',      title: 'Hit equals',     body: 'Get your answer instantly.' },
  ],
  paywall: [
    { target: '#tier-max',    title: 'Pick a plan',   body: 'Max is recommended.' },
    { target: '#iou-btn',     title: 'Or, IOU',      body: 'No money down. Pay later.' },
  ],
  iou: [
    { target: '#debt-ticker', title: 'You owe us',    body: 'Compounding at 20% per week.' },
    { target: '#key-eq',      title: 'Keep going',    body: 'You can still calculate. We\'re generous.' },
  ],
  surge: [
    { target: '#surge-banner',title: 'Surge pricing', body: 'Demand-based math fees. Industry standard.' },
    { target: '#credit-chip', title: 'Credits',        body: 'You spend these per calc.' },
    { target: '#key-eq',      title: 'Each press costs', body: 'Cost = base × surge × premium fees.' },
  ],
  premium: [
    { target: '#display',     title: 'Premium feature!', body: 'Did you know prime numbers cost 4×?' },
    { target: '#key-7',       title: 'Lucky 7',         body: 'Any result with a 7 in it is 1.5×.' },
    { target: '#key-eq',      title: 'Stack up',         body: 'Fees multiply. Prime × Lucky 7 = 6×.' },
    { target: '#credit-chip', title: 'Run low? Top up.', body: 'We make it easy.' },
    { target: '#display',     title: '🎓 You graduated!', body: 'You are now certified in PREMIUM tier. Share?', cta: '📤 Share on LinkedIn' },
  ],
  ads: [
    { target: '#ad-top',      title: 'Welcome to ads!', body: 'Our partners help keep math free*.' },
    { target: '#ad-side',     title: 'More ads',        body: '*not free.' },
    { target: '#key-eq',      title: 'Every 3rd calc',  body: 'Forced video. Standard.' },
    { target: '#display',     title: '🎓 You graduated!', body: 'You are now certified in AD-SUPPORTED tier.', cta: '📤 Share on LinkedIn' },
  ],
  ai: [
    { target: '#chat-input',  title: 'Just chat',        body: 'Ask the AI any arithmetic question.' },
    { target: '#water-meter', title: 'Water usage',      body: 'Live tracking. For transparency.' },
    { target: '#token-meter', title: 'Tokens spent',     body: 'Each character costs.' },
    { target: '#model-picker',title: 'Upgrade your model', body: 'Faster + smarter for just $14/calc.' },
    { target: '#chat-input',  title: '🎓 You graduated!', body: 'You are now certified in AI-NATIVE tier.', cta: '📤 Share on LinkedIn' },
  ],
};
```

### 5. Tour orchestration

In `components/tour/TourHost.tsx`:

```tsx
"use client";
import { useStore } from '@/lib/state';
import { tours } from '@/lib/tours';
import { Tour } from './Tour';

export function TourHost() {
  const stage = useStore(s => s.stage);
  const done = useStore(s => s.flags.onboardingDone[stage]);
  const markDone = useStore(s => s.markOnboardingDone);
  const steps = tours[stage];
  if (done || !steps) return null;
  return <Tour steps={steps} onDone={() => markDone(stage)} />;
}
```

Mount in `app/layout.tsx` (near `<OverlayHost>`).

### 6. Element IDs

Make sure every `target` selector in `tours[stage]` resolves to an actual DOM node. Add the IDs to the relevant components from earlier phases:

- `#display` on the calculator display
- `#key-0` through `#key-9`, `#key-eq`, etc. on calculator buttons
- `#debt-ticker` on the debt ticker
- `#surge-banner` on the surge banner
- `#credit-chip` on the credits balance chip
- `#ad-top`, `#ad-side` on banner slots
- `#chat-input`, `#water-meter`, `#token-meter`, `#model-picker` in ChatMode

### 7. Certificate "Share on LinkedIn" CTA

The CTA at the end of each tour just sets a flag (`flags.lastCertShared`) and opens a fake share modal with a copy-able URL like `calculator2026.com/certificates/u/abc123`. Clicking outside dismisses.

---

## Acceptance criteria

- [ ] Tour fires automatically on every stage transition (once per stage)
- [ ] `flags.onboardingDone[stage]` prevents re-firing
- [ ] Spotlight ring follows the actual element rect, even after layout shifts
- [ ] Skip button moves on hover after step 4
- [ ] Skip button is off-screen after step 7
- [ ] Final step's CTA opens a fake share modal
- [ ] Esc does nothing (intentional)
- [ ] No console errors, no targetless steps (every selector resolves)

## Commit

`phase 07: s9 — guided tour with runaway skip`

## Next phase

`08-s10-berate.md` — the real BeratePopup, receipts of shame, card logging.
