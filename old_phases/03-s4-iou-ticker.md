# Phase 03 — S4 (IOU debt ticker, compounding in real time)

> **Fresh Claude Code session.** Read `CONTEXT.md` and `STAGES.md` first (S4 section).
>
> Builds on phase 02. After signing the IOU, the user has `debt = { principal, startedAt }` in state but no UI for it yet.

---

## Your task

Build the always-on debt ticker (visible on every page when `debt != null`), the payoff drawer, and the `/debt` projection page.

### 1. IOU math helpers (`lib/iou.ts`)

```ts
const WEEK_MS = 7 * 86400 * 1000;
const k = Math.log(1.20); // 20% per week, continuous compounding

export function debtAt(now: number, principal: number, startedAt: number): number {
  return principal * Math.exp(k * (now - startedAt) / WEEK_MS);
}

export function projectDebt(principal: number, startedAt: number, days: number[]): { day: number; amount: number }[] {
  return days.map(d => ({ day: d, amount: principal * Math.exp(k * d / 7) }));
}

export function formatDebt(amount: number): string {
  if (amount < 1)        return `$${amount.toFixed(7)}`;
  if (amount < 1000)     return `$${amount.toFixed(4)}`;
  if (amount < 1e6)      return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  if (amount < 1e9)      return `$${(amount/1e6).toFixed(2)}M`;
  if (amount < 1e12)     return `$${(amount/1e9).toFixed(2)}B`;
  return `$${(amount/1e12).toFixed(2)}T`;
}
```

Unit tests (Vitest or simple assert): `debtAt(start + WEEK_MS, 0.01, start) ≈ 0.012`. `debtAt(start + 365*86400e3, 0.01, start) > 13_000_000`.

### 2. DebtTicker component (`components/chrome/DebtTicker.tsx`)

Persistent fixed-position widget in the top-right corner of the viewport.

```tsx
"use client";
import { useStore } from '@/lib/state';
import { debtAt, formatDebt } from '@/lib/iou';
import { useEffect, useState } from 'react';

export function DebtTicker() {
  const debt = useStore(s => s.debt);
  const [now, setNow] = useState<number>(() => Date.now());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!debt) return;
    let raf: number;
    let lastWrite = 0;
    const loop = () => {
      const t = performance.now();
      if (t - lastWrite > 100) { // throttle to ~10Hz
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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 right-3 z-40 bg-money text-white px-3 py-1.5 rounded font-mono text-xs shadow-[2px_2px_0_var(--ink)] border border-ink"
      >
        You owe {formatDebt(amount)}
      </button>
      {open && <DebtPayoffSheet onClose={() => setOpen(false)} />}
    </>
  );
}
```

Mount in `app/layout.tsx` (it was already a stub from phase 00 — replace it).

### 3. DebtPayoffSheet (`components/chrome/DebtPayoffSheet.tsx`)

Modal that opens when the ticker is tapped.

Content:
- Large display of current debt (4 decimals, ticking)
- Caption: "compounding at 20%/wk · next tick in 0.{N}s"
- Card form (number, exp, cvc)
- `[Pay off $X]` button
- Submit → Luhn check
  - Invalid → inline error
  - Valid → record card attempt with `context: 'iou-payoff'` → open BeratePopup
- On "Charge me anyway" in the popup: **debt is NOT cleared.** Just close the popup. (The receipt logs it as an attempt; the joke is that even paying it off doesn't work.)
- [Cancel] button just closes the sheet

### 4. `/debt` page (`app/debt/page.tsx`)

A "marketing"-style page showing the user how their debt will project.

Use **recharts** to draw a line chart of debt over 365 days (or up to the current day if longer). Y-axis log scale because the curve gets vertical fast.

Above the chart:
- Title: "Your Calc-Karma™"
- Caption: handwritten-feel text describing the user's situation

Below the chart:
- Stats grid (4 columns):
  - "Day 1: $0.01"
  - "Day 7: $0.012"
  - "Day 30: $4.30" (in money color)
  - "Year 1: $13,915,704" (in alarm color)
- A `[Share to Twitter]` button (no-op, just opens a `mailto:` style intent URL)

### 5. Linking from the ticker

The popover from the ticker should also have a small link: `View projection →` that routes to `/debt`.

### 6. Stage transition

After 1 successful calc in `iou` state, advance: `stage = 'surge'`. (The seed `credits = 100` happens in phase 04.) For now, just transition the stage and let the calculator keep working. The ticker stays visible because `debt` persists.

### 7. Edge cases

- The ticker should render server-side as `null` (no debt yet hydrated) and hydrate on the client without flicker. Use a "mounted" guard if needed.
- If the user manages to clear localStorage but somehow keeps `debt`, gracefully handle the case where `startedAt` is in the future (clamp to `now`).
- Don't update the DOM at 60Hz — your throttle should keep it readable.

---

## Acceptance criteria

- [ ] Ticker appears in top-right when `debt != null`, on every page
- [ ] Number visibly ticks up (4 decimals)
- [ ] After ~10 seconds, you can see the last digit changing every 1–2 seconds (rate depends on principal)
- [ ] Tapping the ticker opens the payoff sheet
- [ ] Submitting a valid card → BeratePopup; debt is not cleared after "Charge me anyway"
- [ ] `/debt` page shows a hockey-stick chart projecting debt to 1 year
- [ ] Refreshing preserves debt amount (math derives from `startedAt`)
- [ ] No layout shift / no console errors

## Aesthetic notes

The ticker should feel slightly *off* — like it shouldn't be allowed to exist in a normal app. Money-green background, ink-black border, a tiny shadow. Keep it small enough that it doesn't block content, but big enough that you can't ignore it.

## Commit

`phase 03: s4 — iou debt ticker (compounding, real time)`

## Next phase

`04-s5-s6-surge-triggers.md` — surge pricing + premium-feature triggers.
