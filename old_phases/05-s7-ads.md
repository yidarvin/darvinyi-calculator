# Phase 05 — S7 (Banner ads + video interstitials + ad-free upsell)

> **Fresh Claude Code session.** Read `CONTEXT.md` and `STAGES.md` first (S7 section).
>
> Builds on phase 04. User is now in `stage = 'ads'`.

---

## Your task

Add the visual chaos of an ad-supported app: rotating banner slots around the calculator, a forced video ad every 3rd calc, and an ad-free upsell that fires every 7th interaction.

### 1. Ad inventory (`lib/ads.ts`)

Static array of fake ad placements. Make them feel parodically real:

```ts
export type AdUnit = {
  id: string;
  size: '728x90' | '320x50' | '300x250' | '100x100' | '160x600';
  bg: string;             // tailwind class or CSS color
  headline: string;
  sub?: string;
  cta?: string;
};

export const ads: AdUnit[] = [
  { id:'crypto1',  size:'728x90', bg:'bg-orange-200', headline:'$DOGE TO THE MOON',         sub:'47% in 24h. Allegedly.',  cta:'Buy now' },
  { id:'mattress', size:'320x50', bg:'bg-blue-100',   headline:'Sleep Number — $4,200',     sub:'You will not sleep on it.' },
  { id:'vpn',      size:'100x100',bg:'bg-green-100',  headline:'Protect Your Math',          sub:'NumberVPN' },
  { id:'fat',      size:'100x100',bg:'bg-red-100',    headline:'One Weird Trick',            sub:'Doctors hate it' },
  { id:'auto',     size:'300x250',bg:'bg-yellow-100', headline:'Refinance Your Car',         sub:'Even if you don\'t have one' },
  { id:'aigirl',   size:'160x600',bg:'bg-pink-100',   headline:'Chat with an AI Girlfriend', sub:'She likes math too' },
  // …4 more
];
```

### 2. AdBanner component (`components/chrome/AdBanner.tsx`)

```tsx
"use client";
import { ads, AdUnit } from '@/lib/ads';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/state';

export function AdBanner({ size }: { size: AdUnit['size'] }) {
  const adFree = useStore(s => s.flags.adFree);
  const stage = useStore(s => s.stage);
  const pool = ads.filter(a => a.size === size);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setIdx(n => (n + 1) % pool.length), 8000);
    return () => clearInterval(i);
  }, [pool.length]);

  if (adFree) return null;
  if (!['ads','ai'].includes(stage)) return null;

  const ad = pool[idx];
  return (
    <div className={`${ad.bg} border border-ink rounded p-2 text-xs flex items-center justify-center`} aria-label={`Ad ${ad.id}`}>
      <div>
        <div className="font-bold">{ad.headline}</div>
        {ad.sub && <div className="text-ink-soft">{ad.sub}</div>}
      </div>
      <span className="absolute top-0.5 right-1 text-[9px] text-ink-soft">Ad</span>
    </div>
  );
}
```

Slot dimensions enforced via Tailwind (`w-[728px] h-[90px]`, etc.) — these should overflow on mobile to make the joke land. Use CSS to crop/scroll.

### 3. Layout placement

Wrap the calculator page with banner slots:

```
┌─────────────────────────────────────┐
│ [728x90 banner]                     │
├──┬──────────────┬───────────────────┤
│16│              │                   │
│0x│   Calculator │  [300x250]        │
│600│  (320 wide)  │                   │
│  │              │  [160x600]        │
│  │              │                   │
├──┴──────────────┴───────────────────┤
│ [320x50] [100x100] [100x100]        │
└─────────────────────────────────────┘
```

Use CSS grid. Mobile: stack everything; banners shrink-wrap; calculator stays usable.

### 4. VideoAdModal (`components/overlays/VideoAdModal.tsx`)

Forced interstitial fires after every 3rd successful calc.

Triggered by event bus (`emit('calc.success', …)` → host checks counter). For this phase, hook it directly in CalcPad: maintain a `videoAdCounter` in the store; on `calc.success`, increment and open modal if `% 3 === 0`.

Modal content:
- Full-screen dark overlay
- 16:9 placeholder block in the middle, colored, animated: a slow pan/zoom gradient with a label like `🚗 BUY ME · SUV CO. · 0:14 remaining`
- Skip counter top-right: `Skip in 14s` (decrements every **1.2 seconds**, not 1.0 — slow joke)
- After counter hits 0: skip button activates with cursor → `[Skip ad ⤳]`
- Watch-full button always present: `Watch fully → +1 credit`

Implementation note: use `useEffect` with an interval at 1200ms to drive the counter. Don't game it with `Math.random()` — keep it deterministic.

After skip (or watch full):
- Watch full → grant 1 credit
- Skip → no credit
- Then show: `Watch 2 more for +3 credits` `[Watch] [Maybe later]`
- "Watch" recurses: shows another video. Skip counter is now 18s × 1.2s.
- Each recursion: skip duration +3s, reward +1 credit
- "Maybe later" closes the modal

Each modal close increments `videoAdsDismissed`. When `videoAdsDismissed >= 2`, advance `stage = 'ai'`.

### 5. AdFreeUpsell (`components/overlays/AdFreeUpsell.tsx`)

Fires every 7th interaction (use `interactions` from store).

> **Tired of ads?**
> Upgrade to **AD-FREE** for just $79/mo*
>
> _*billed annually as $948, non-refundable, you'll still see "partner messages"_
>
> [Go Ad-Free] [Keep watching ads]

[Go Ad-Free] → checkout flow (`/paywall/checkout?tier=ad-free&price=79`). On "Charge me anyway" in the popup: `flags.adFree = true`.

[Keep watching ads] → close modal.

### 6. Ad-free behavior

When `flags.adFree === true`:
- All `<AdBanner>` instances render `null`
- VideoAdModal **still fires** — but prepended with an apology bubble for 2s before the video starts:
  > _We apologize for these partner messages._

### 7. Don't break the calculator

Banners must not push the calculator off-screen on mobile. The calculator interaction is still primary. Ads are visual noise, not blockers.

### 8. Tour fire

When stage advances to `ads`, the tour (phase 07) will fire. For this phase, just trigger an event `emit('stage.advance', 'ads')` — the handler ships in phase 07.

---

## Acceptance criteria

- [ ] Banner ads visibly rotate every 8s
- [ ] Banners hide when `adFree === true`
- [ ] Every 3rd successful calc opens VideoAdModal
- [ ] Skip counter takes ~18 seconds of wall time to decrement 15 ticks
- [ ] Watching fully grants 1 credit; the "watch 2 more" loop works and grants more
- [ ] AdFreeUpsell fires every 7th interaction
- [ ] After 2 video ads dismissed, stage advances to 'ai'
- [ ] After Go Ad-Free completes, banners disappear; interstitials still play with apology

## Commit

`phase 05: s7 — ads (banners, interstitials, ad-free upsell)`

## Next phase

`06-s8-ai-mode.md` — chat-only AI mode + water meter.
