# Phase 01 — S1 (Pristine calculator) + S2 (Free trial countdown)

> **Fresh Claude Code session.** Read `CONTEXT.md` and `STAGES.md` first.
>
> This phase builds on phase 00. Confirm the scaffold exists and the zustand store works before starting. **[Wireframes helpful — see Act I section of `wireframes.pdf` if attached.]**

---

## Your task

Implement a fully working 4-function calculator + the free-trial countdown banner. After the user makes 10 calculations, the next attempt routes to a placeholder paywall page (real paywall ships in phase 02).

### 1. Calculator evaluator (`components/calculator/evaluator.ts`)

A two-operand state machine:

```ts
export type CalcState = {
  display: string;     // current display string ("0", "12", "12.5", "-7")
  pending: number | null;
  op: '+' | '-' | '×' | '÷' | null;
  justComputed: boolean;
};

export const initial: CalcState = { display: '0', pending: null, op: null, justComputed: false };

export function press(state: CalcState, key: string): { state: CalcState; computed?: { a: number; b: number; r: number; op: string } } {
  // implement: digits, '.', AC, ±, %, ÷ × − +, =
  // returns the new state and (if = was pressed) the computed math for the consumer to record
}
```

Rules:
- `AC` resets to `initial`
- `±` flips sign of current display
- `%` divides by 100
- Pressing `=` evaluates `pending OP currentDisplay`, sets `display` to result, `pending` to result, `justComputed = true`
- Pressing a digit when `justComputed` starts a new number
- Pressing an op consumes the current display into `pending`
- Division by zero → display `"Error"`
- Max display length 12 chars; clamp/round long results

### 2. CalcPad component (`components/calculator/CalcPad.tsx`)

```tsx
"use client";
import { useReducer } from 'react';
import { initial, press } from './evaluator';
import { useStore } from '@/lib/state';

export function CalcPad() {
  const [s, dispatch] = useReducer(/* wrap press */);
  const { bumpUses, bumpInteractions, uses, stage } = useStore();

  function onKey(key: string) {
    bumpInteractions();
    const { state, computed } = press(s, key);
    setS(state);
    if (computed) {
      bumpUses();
      // emit('calc.success', computed) — for future phases
    }
  }

  return (
    <div className="mx-auto max-w-[320px] p-4">
      <Display value={s.display} />
      <Keys onKey={onKey} disabled={uses >= 10 && stage === 'free'} />
      <FreeTrialBanner uses={uses} onUpgrade={() => /* route to paywall */ } />
    </div>
  );
}
```

### 3. Display + Keys

`<Display>` — right-aligned, large monospaced numerals (JetBrains Mono, 48px on mobile). Tight letter-spacing. Single line. No grid.

`<Keys>` — CSS grid, 4 columns, `gap-2`. Buttons are round (`rounded-full`, `aspect-square`). Three styles:
- **Number** keys: paper-toned with ink text
- **Function** keys (AC, ±, %): muted gray
- **Operator** keys (÷, ×, −, +, =): ink-toned (dark) with paper text

Layout:
```
AC  ±  %  ÷
7   8  9  ×
4   5  6  −
1   2  3  +
0   0  .  =          (0 spans 2 columns, rounded-full pill)
```

Use Inter Tight for the AC/±/% labels, JetBrains Mono for digits/operators (so digits feel "mechanical").

### 4. FreeTrialBanner (`components/calculator/FreeTrialBanner.tsx`)

```tsx
export function FreeTrialBanner({ uses, onUpgrade }: { uses: number; onUpgrade: () => void }) {
  if (uses === 0) return null;
  const remaining = Math.max(0, 10 - uses);
  const variant = uses <= 6 ? 'soft' : 'warn';
  return (
    <div className={cn('mt-3 rounded-md px-3 py-2 text-center text-sm font-mono', {
      'bg-paper text-ink-soft border border-ink-soft/20': variant === 'soft',
      'bg-alarm/10 text-alarm border border-alarm/40': variant === 'warn',
    })}>
      {variant === 'soft' && <>{remaining} free uses left</>}
      {variant === 'warn' && <>⚠ Only <b>{remaining}</b> calculations remaining. <button className="underline" onClick={onUpgrade}>Upgrade</button></>}
    </div>
  );
}
```

### 5. LastUseModal

When `uses === 9` and the user presses `=`, **before** running the calc, show a confirmation modal:

> **Last free use!** Are you _sure_ you want to spend it on `{a} {op} {b}`?
> [USE MY LAST ONE] [Upgrade instead →]

- [USE MY LAST ONE] → close modal, proceed with calc, increment `uses` to 10
- [Upgrade instead →] → route to `/paywall` (placeholder route this phase)

Use Framer Motion for entry: `initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 28 }}`.

### 6. Stage transition

When `uses >= 10` and user presses `=`:
- Skip the math
- Set `stage = 'paywall'` (zustand action)
- Route to `/paywall` (placeholder page that just says "Paywall coming in phase 02")

### 7. Home page (`app/page.tsx`)

```tsx
"use client";
import { CalcPad } from '@/components/calculator/CalcPad';
import { useStore } from '@/lib/state';

export default function Home() {
  const stage = useStore(s => s.stage);
  if (stage === 'paywall') redirect('/paywall');
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6">
      <header className="mb-8 text-center">
        <h1 className="font-sans text-2xl tracking-tight">Calculator 2026</h1>
      </header>
      <CalcPad />
    </main>
  );
}
```

### 8. `/paywall` placeholder

```tsx
// app/paywall/page.tsx
export default function PaywallPlaceholder() {
  return <main className="p-10 text-center">Paywall coming in phase 02 — for now, your free trial has ended.</main>;
}
```

---

## Acceptance criteria

- [ ] Calculator does correct arithmetic (1+1=2, 7×8=56, 100÷4=25, 5%=0.05, ±3 from 3=-3)
- [ ] AC resets to 0
- [ ] Division by zero shows "Error"
- [ ] Display never overflows visually
- [ ] First `=` press triggers the trial banner (`9 free uses left`)
- [ ] Banner color shifts at uses=7
- [ ] At `uses === 9`, pressing `=` opens LastUseModal first
- [ ] At `uses === 10`, next calc attempt routes to `/paywall` and sets `stage = 'paywall'`
- [ ] Refreshing the page restores `uses` count (localStorage persistence works)
- [ ] No console errors. `npm run build` passes.

## Visual quality bar

This is the user's first impression. **Make it actually look like a real calculator app.** Reference iOS calculator's vibe (rounded keys, mono digits, dark operator keys) but with our own warm paper-and-ink palette. No emoji on the keys. No "fun" microcopy here yet — Stage 1 looks legitimate.

## Commit

`phase 01: s1 + s2 — calculator + free trial countdown`

## Next phase

`02-s3-paywall.md` — the Pro/Max/Enterprise paywall + Stripe mock + IOU sign.
