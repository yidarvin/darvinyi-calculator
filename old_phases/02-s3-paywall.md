# Phase 02 — S3 (Paywall + Stripe mock + IOU sign)

> **Fresh Claude Code session.** Read `CONTEXT.md` and `STAGES.md` first (S3 section especially). **[Wireframes helpful.]**
>
> Builds on phases 00–01. The calculator should already redirect to `/paywall` when `uses >= 10`.

---

## Your task

Replace the `/paywall` placeholder with a real paywall flow: pricing tiers → checkout (Stripe mock OR IOU). Card submission validates via Luhn and routes to a `<BeratePopup>` stub (real one ships in phase 08). IOU signing transitions the user to `stage = 'iou'`.

### 1. Luhn validator (`lib/luhn.ts`)

```ts
export function isLuhnValid(input: string): boolean {
  const digits = input.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = +digits[i];
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function isPlausibleExpiry(mmYY: string): boolean {
  const m = mmYY.match(/^(\d{1,2})\s*\/\s*(\d{2,4})$/);
  if (!m) return false;
  const month = +m[1]; let year = +m[2];
  if (year < 100) year += 2000;
  if (month < 1 || month > 12) return false;
  const now = new Date();
  return new Date(year, month, 0) >= now;
}

export function hashLast4(num: string): string {
  // simple stable hash — never use for security
  const last4 = num.replace(/\D/g, '').slice(-4);
  let h = 0;
  for (const c of last4) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h.toString(16).padStart(8, '0');
}
```

### 2. Pricing page (`app/paywall/page.tsx`)

Three-tier card grid. Mobile: stacked. Desktop: 3-column.

```tsx
const TIERS = [
  { id:'pro',        name:'PRO',        price:49,    period:'mo', features:['+', '−', '×', '÷'], cta:'Choose Pro' },
  { id:'max',        name:'MAX',        price:199,   period:'mo', features:['Everything in Pro', '%, ±, decimals'], cta:'Choose Max', recommended:true },
  { id:'enterprise', name:'ENTERPRISE', price:2400,  period:'mo', features:['Everything in Max', 'SOC2 + SSO', 'The "=" key'], cta:'Contact Sales' },
];
```

Each card:
- Tier name in mono, small
- Big price (`$199`) + `/mo` suffix
- Feature list (bullet points)
- Bordered, white background; recommended one has alarm-colored border and a "recommended" sticker pinned top-right
- CTA button → routes to `/paywall/checkout?tier=max`

Title above the grid: "Choose your plan". Subtitle: "Continue calculating with Calculator 2026™".

### 3. Checkout page (`app/paywall/checkout/page.tsx`)

Two-column layout (mobile: stacked):

**Left column — Stripe-style form:**
- Title: "Pay $199.00" (or whichever tier)
- Email field
- Card number (formatted with spaces every 4 digits)
- Two-up: MM/YY + CVC
- Country select (default US)
- ZIP
- `[Pay $199.00]` — alarm-toned button, full-width, **modest size**

**Below the divider — IOU CTA (visually LOUDER):**
- Caption text: "_or, skip the card —_"
- Big money-toned button: `📝 Pay later with IOU™` — full-width, larger padding, **bold**
- Tiny sticker: "recommended" pinned to the button
- Subtitle below: "0% down. Pay it off whenever."

Routes:
- Pay button submit → validate Luhn → if invalid: inline error. If valid: call `recordCardAttempt({ last4Hash, amount: 199, context: 'subscribe' })` and route to `<BeratePopup>` (this phase: stub modal that says "Berate popup placeholder — phase 08"; with two buttons: "OK" and "Charge me anyway")
  - "Charge me anyway" → set `plan = 'max'`, `stage = 'surge'` (we skip 'iou' for paid users — they go straight to surge), route to `/`
- IOU button → route to `/paywall/iou`

### 4. IOU signing page (`app/paywall/iou/page.tsx`)

Full-screen modal-style. Money-toned border.

Content:
- Title (handwritten cursive, big): "One moment…"
- Body: "By signing, you agree to a **20% per week, compounding** loan from Calculator 2026 Financial Inc."
- Fine print (collapsible): a long fake legal disclaimer about jurisdiction, arbitration in Delaware, etc. ~300 words of LLM-generated fake legal copy. Make it absurd but plausible.
- Signature pad — see below
- `[I solemnly swear (Sign IOU)]` — money button, large
- `[Actually I'll pay $199]` — text link, small

### 5. SignaturePad component (`components/paywall/SignaturePad.tsx`)

```tsx
"use client";
import { useEffect, useRef, useState } from 'react';

export function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  // pointer events: down → begin path; move → lineTo + stroke; up → end
  // onChange(canvas.toDataURL('image/png')) when stroke ends
  // Clear button calls clearRect and onChange(null)

  return (
    <div className="rounded-md border border-dashed border-ink/40 p-2 bg-white">
      <canvas ref={ref} width={400} height={120} className="w-full touch-none cursor-crosshair" />
      <div className="flex justify-between text-xs mt-1">
        <span className="text-ink-soft">Sign here</span>
        <button className="text-ink-soft underline" onClick={clear}>clear</button>
      </div>
    </div>
  );
}
```

Both mouse and touch input supported. Pointer events handle both.

On submit (Sign IOU):
- Require `hasInk === true`
- Save dataURL to localStorage as `iouSignature`
- Set state: `debt = { principal: 0.01, startedAt: Date.now() }`, `stage = 'iou'`, persist
- Route to `/` (back to the calculator)

### 6. BeratePopup stub (`components/overlays/BeratePopup.tsx`)

```tsx
"use client";
export function BeratePopupStub({ amount, onCharge, onClose }: { amount: number; onCharge: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="bg-paper border-2 border-alarm rounded-lg p-6 max-w-md">
        <h2 className="text-2xl font-bold text-alarm">WAIT. STOP.</h2>
        <p className="mt-3">You were about to pay <b>${amount}</b> for a calculator.</p>
        <p className="mt-2 text-sm italic">[Real popup ships in phase 08.]</p>
        <div className="mt-5 flex gap-3 justify-end">
          <button className="px-4 py-2 border" onClick={onClose}>OK</button>
          <button className="px-4 py-2 bg-ink text-paper" onClick={onCharge}>Charge me anyway</button>
        </div>
      </div>
    </div>
  );
}
```

### 7. Wiring

In the checkout page, manage the popup as local state (`useState<BerateState | null>`). Don't try to integrate with the global OverlayHost yet — that's phase 09.

### 8. Persistence sanity

After signing the IOU, refresh the page. The user should:
- Be on the calculator (`/`)
- Have `stage === 'iou'`
- Have a `debt` object in localStorage with `principal: 0.01` and a `startedAt` timestamp from when they signed

For now the calculator should just work normally — the debt ticker comes in phase 03.

---

## Acceptance criteria

- [ ] `/paywall` shows three pricing tiers; Max is visually emphasized
- [ ] Checkout page has both a Stripe-style form and a louder IOU button
- [ ] Submitting an invalid card shows an inline error, no popup
- [ ] Submitting a valid Luhn card (e.g. `4242 4242 4242 4242`) opens the Berate stub
- [ ] "Charge me anyway" sets `plan` and `stage = 'surge'`, returns to `/`
- [ ] IOU signing requires actual ink in the canvas
- [ ] After IOU sign: `stage === 'iou'`, `debt` is set, refresh preserves both
- [ ] No real network calls leave the app

## Commit

`phase 02: s3 — paywall + stripe mock + iou sign`

## Next phase

`03-s4-iou-ticker.md` — the always-on compounding debt counter.
