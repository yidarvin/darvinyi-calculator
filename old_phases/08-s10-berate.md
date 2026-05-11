# Phase 08 — S10 (BeratePopup + card-attempt logging + receipts of shame)

> **Fresh Claude Code session.** Read `CONTEXT.md` and `STAGES.md` first (S10 section).
>
> Builds on phase 07. Replaces the BeratePopup *stub* from phase 02.

---

## Your task

Replace the stub BeratePopup with the real, escalating version. Implement universal card-submission interception, the `/receipts` page listing all "saved" attempts, and the doubled-down second-tier popup for users who click "Charge me anyway".

### 1. BeratePopup (`components/overlays/BeratePopup.tsx`)

```tsx
"use client";
import { motion } from 'framer-motion';
import { useState } from 'react';

export type BerateContext = {
  amount: number;
  reason: 'subscribe' | 'iou-payoff' | 'ad-free' | 'top-up';
  onAccept: () => void;   // proceed with the mocked transaction
  onCancel: () => void;
};

const COPY = {
  level1: {
    title: 'WAIT. STOP.',
    body: [
      "You were about to pay real money for a **calculator**.",
      "Every phone, every laptop, every microwave has one.",
      "Your spouse's calculator works. Math works.",
      "**We are not charging you. You're welcome.**",
    ],
    primary: "I know. I'm sorry.",
    secondary: "Charge me anyway",
  },
  level2: {
    title: 'ARE YOU SERIOUS.',
    body: [
      "We told you. The calculator on your phone works fine.",
      "Pressing this button again is a choice.",
      "_A choice we cannot legally stop you from making._",
    ],
    primary: "OK, you're right. Stop.",
    secondary: "I don't care. Charge me.",
  },
};

export function BeratePopup({ amount, reason, onAccept, onCancel }: BerateContext) {
  const [level, setLevel] = useState<1 | 2>(1);
  const copy = level === 1 ? COPY.level1 : COPY.level2;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4">
      <motion.div
        key={level}
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        className="bg-paper border-4 border-alarm rounded-xl p-6 max-w-md shadow-2xl"
      >
        <div className="text-5xl">⚠️</div>
        <h2 className="mt-3 text-3xl font-bold text-alarm">{copy.title}</h2>
        <div className="mt-3 space-y-2 text-ink">
          {copy.body.map((line, i) => (
            <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/_(.+?)_/g, '<i>$1</i>') }} />
          ))}
        </div>
        <p className="mt-3 text-sm text-ink-soft">You were about to be charged <b>${amount.toFixed(2)}</b>.</p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            className="w-full py-3 bg-money text-white rounded font-semibold"
            onClick={onCancel}
          >
            {copy.primary}
          </button>
          <button
            className="w-full py-2 text-sm text-ink-soft underline"
            onClick={() => level === 1 ? setLevel(2) : onAccept()}
          >
            {copy.secondary}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
```

### 2. Universal interception (`lib/cardSubmit.ts`)

A single function every card form calls. Handles Luhn, logs the attempt, and routes to BeratePopup via an event.

```ts
import { isLuhnValid, hashLast4 } from './luhn';
import { emit } from './events';
import { useStore } from './state';

export function submitCard(input: { number: string; amount: number; context: 'subscribe' | 'iou-payoff' | 'ad-free' | 'top-up' }, onCharge: () => void) {
  const digits = input.number.replace(/\D/g, '');
  if (!isLuhnValid(digits)) return { ok: false, error: 'Invalid card number.' };

  useStore.getState().recordCardAttempt({
    last4Hash: hashLast4(digits),
    amount: input.amount,
    context: input.context,
  });

  emit('berate.open', {
    amount: input.amount,
    reason: input.context,
    onAccept: onCharge,
  });

  return { ok: true };
}
```

Update **every** card form built in earlier phases (checkout, IOU payoff sheet, buy-credits, ad-free upsell, top-up) to call `submitCard()` instead of handling Luhn inline.

### 3. BeratePopup host

In `<OverlayHost>` (phase 09 builds this fully; for now build the minimum):

```tsx
"use client";
import { useEffect, useState } from 'react';
import { on, off } from '@/lib/events';
import { BeratePopup, BerateContext } from './BeratePopup';

export function OverlayHost() {
  const [berate, setBerate] = useState<Omit<BerateContext, 'onCancel'> | null>(null);

  useEffect(() => {
    const handler = (payload: any) => setBerate(payload);
    on('berate.open', handler);
    return () => off('berate.open', handler);
  }, []);

  return (
    <>
      {berate && (
        <BeratePopup
          amount={berate.amount}
          reason={berate.reason}
          onAccept={() => { berate.onAccept(); setBerate(null); }}
          onCancel={() => setBerate(null)}
        />
      )}
    </>
  );
}
```

Mount in `app/layout.tsx`.

### 4. Receipts of shame (`/receipts`)

```tsx
// app/receipts/page.tsx
"use client";
import { useStore } from '@/lib/state';

export default function Receipts() {
  const attempts = useStore(s => s.cardsAttempted);
  const totalSaved = attempts.reduce((s, a) => s + a.amount, 0);

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold">Receipts of Shame</h1>
      <p className="mt-2 text-ink-soft">Every time you tried to pay us, we said no.</p>

      {attempts.length === 0 ? (
        <div className="mt-10 text-center text-ink-soft italic">No attempts yet. Try entering a card somewhere — we'll log it (and refuse it).</div>
      ) : (
        <>
          <ul className="mt-6 divide-y border rounded">
            {[...attempts].reverse().map((a, i) => (
              <li key={i} className="p-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-mono">···· {a.last4Hash.slice(0,4)} <span className="text-ink-soft">({a.context})</span></div>
                  <div className="text-xs text-ink-soft">{new Date(a.ts).toLocaleString()}</div>
                </div>
                <div className="text-money font-mono">+${a.amount.toFixed(2)} saved</div>
              </li>
            ))}
          </ul>
          <div className="mt-6 p-4 bg-money/10 border border-money/40 rounded text-center">
            <div className="text-sm text-ink-soft">Total we saved you</div>
            <div className="text-4xl font-bold text-money">${totalSaved.toFixed(2)} 💖</div>
          </div>
        </>
      )}
    </main>
  );
}
```

Add a quiet link to `/receipts` in the app footer or header (small text, e.g. "Receipts").

### 5. Behavior contract per context

When the user clicks "Charge me anyway" (level 2), the `onCharge` callback **does happen** — but the mocked outcome depends on context:

| Context | Outcome on "Charge me anyway" |
|---|---|
| `subscribe`   | Set `plan` to the chosen tier; advance stage to `surge` |
| `iou-payoff`  | Receipt logs it. **`debt` is NOT reduced.** This is the cruelest joke. |
| `ad-free`     | `flags.adFree = true` |
| `top-up`      | Grant chosen credit pack |

### 6. Security / privacy

- Never write the full card number anywhere — only `hashLast4`
- Never log card data to console
- Never persist anything other than what's in `CardAttempt`
- Confirm via grep: `grep -r "card.*number" app/ components/ lib/` — only references should be input fields and `submitCard`

---

## Acceptance criteria

- [ ] Every card form across the app routes to BeratePopup on valid submit
- [ ] Level-2 popup appears on second "Charge me anyway"
- [ ] Card attempts log to `cardsAttempted` in store
- [ ] `/receipts` lists attempts with hashed last4 and shows total "saved"
- [ ] "Charge me anyway" on iou-payoff does NOT reduce debt
- [ ] No full card numbers anywhere in localStorage, logs, or DOM
- [ ] BeratePopup z-index sits above everything except itself

## Commit

`phase 08: s10 — beratepopup + receipts of shame`

## Next phase

`09-extras.md` — review nag, captcha, signup gauntlet, Clippo, cookies, referral, achievements.
