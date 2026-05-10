# Phase 04 — S5 (Surge pricing) + S6 (Premium feature triggers)

> **Fresh Claude Code session.** Read `CONTEXT.md` and `STAGES.md` first (S5 + S6 sections).
>
> Builds on phase 03. The user is now in `stage = 'surge'` after either paying or going through the IOU path.

---

## Your task

Add a credit currency, a surge multiplier that wanders, premium-feature trigger detection that stacks multiplicatively, cost toasts, cooldown after rapid calcs, buy-credits modal, and an upsell modal for big spenders.

### 1. Seed credits on stage entry

In the zustand store, when `advance('surge')` is called the first time, set `credits = 100`.

### 2. Surge multiplier (`lib/surge.ts`)

```ts
export function tickSurge(prev: number): number {
  const next = prev + (Math.random() - 0.5) * 0.6;
  return Math.max(1.0, Math.min(4.0, next));
}
```

In `app/layout.tsx` (client component), set up a 15s interval that calls `setSurge(tickSurge(prev))` whenever `stage` is `surge`, `premium`, `ads`, or `ai`.

### 3. SurgeBanner (`components/chrome/SurgeBanner.tsx`)

Sticky banner at the top of the calculator page:

```
🔥 SURGE: 2.4× — high demand right now
```

Alarm-toned background. Mono font for the multiplier. Updates smoothly (CSS transition on color intensity tied to multiplier value: 1.0 = pale, 4.0 = saturated).

### 4. Premium triggers registry (`lib/triggers.ts`)

```ts
function isPrime(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
  return true;
}

export type Trigger = {
  id: string;
  label: string;
  detect: (a: number, b: number, r: number, op: string) => boolean;
  mult: number;
};

export const triggers: Trigger[] = [
  { id:'prime',   label:'prime number',  detect:(a,b,r)=>isPrime(a)||isPrime(b)||isPrime(r), mult:4   },
  { id:'evenmul', label:'both evens',    detect:(a,b,r,op)=>op==='×'&&a%2===0&&b%2===0,      mult:2   },
  { id:'big',     label:'result > 1000', detect:(a,b,r)=>Math.abs(r)>1000,                   mult:3   },
  { id:'neg',     label:'sadness fee',   detect:(a,b,r)=>r<0,                                 mult:5   },
  { id:'seven',   label:'lucky 7',       detect:(a,b,r)=>String(r).includes('7'),             mult:1.5 },
  { id:'repeat',  label:'pattern fee',   detect:(a,b,r)=>/(\d)\1/.test(String(Math.abs(r))),  mult:2   },
];

export function evaluateTriggers(a: number, b: number, r: number, op: string) {
  const hit = triggers.filter(t => t.detect(a, b, r, op));
  const mult = hit.reduce((m, t) => m * t.mult, 1);
  return { hit, mult };
}
```

### 5. Calc cost calculation

In the CalcPad, after a successful calc:

```ts
const baseCost = 10;
const { hit, mult: premiumMult } = evaluateTriggers(a, b, r, op);
const cost = Math.ceil(baseCost * surgeMultiplier * premiumMult);

if (credits < cost) {
  // open <BuyCredits> modal
  return;
}
spendCredits(cost);
// emit a toast describing the breakdown
showCostToast({ baseCost, surge: surgeMultiplier, hits: hit, total: cost });
```

### 6. Cost toast

Bottom-center toast, auto-dismisses after 2.5s. Animated slide-in.

Format:
```
7×8 = 56
10 base × 2.4 surge × 1.5 (lucky 7)  = 36 credits
```

If `hit.length > 0` and `stage === 'premium'`, render the trigger labels in alarm color with their multipliers in parens.

### 7. Cooldown

Track timestamps of recent `=` presses (last 10 only):

```ts
recentCalcs: number[]; // ms timestamps, capped at 10
```

If `recentCalcs.filter(t => now - t < 10_000).length >= 3`, open `<CooldownModal>`:

> **Slow down!**
> You can press = again in **0:47**
> [Skip cooldown — 10 credits] [I'll wait]

Counts down visibly. After expiry, modal auto-closes.

- "Skip cooldown" → spend 10 credits, close, clear `recentCalcs`
- "I'll wait" → close (the input remains gated until timer hits 0)

Don't actually disable the buttons — just intercept `=`. Other keys still work for entering numbers.

### 8. BuyCredits modal (`components/overlays/BuyCredits.tsx`)

Three options:
- 100 credits — $9.99
- 1,000 credits — $89.99 ("10% off" sticker)
- ∞ credits — Enterprise (routes to a "Contact Sales" form that's just an iframe-y fake)

Card form below. Submit → Luhn check → BeratePopup (use the stub from phase 02 if phase 08 hasn't run yet). On "Charge me anyway" — grant the chosen credit pack.

### 9. Upsell modal (`components/overlays/BigSpenderUpsell.tsx`)

Triggered when a single calc costs > 50 credits (not when total spend is high — single calc).

> **Whoa, big spender!**
> That calc cost **{cost} credits**. Upgrade to **MAX UNLIMITED** to skip premium fees forever.\*
>
> [Upgrade — $499/mo] [Just charge me]
>
> \*forever = 30 days, then auto-renew

[Upgrade] → checkout flow (re-uses `/paywall/checkout?tier=max-unlimited&price=499`)
[Just charge me] → already charged; just close

### 10. Stage transitions

- After 5 successful calcs since entering `surge`: `stage = 'premium'`. Tour fires.
- After 3 premium-trigger events (sum of `hit.length` across calcs): `stage = 'ads'`.

Track these counters in the store: `surgeCalcs`, `premiumTriggerCount`. Reset both on stage entry.

### 11. UI mounting

`<SurgeBanner>` is only visible when `stage` is `'surge'`, `'premium'`, `'ads'`. `<CreditBalance>` (a small chip showing `🪙 {credits}`) goes in the header.

---

## Acceptance criteria

- [ ] Surge multiplier visibly random-walks 1.0–4.0, updates every 15s
- [ ] Each calc deducts credits = baseCost × surge × premium
- [ ] When premium triggers hit, toast shows them with multipliers
- [ ] At credits < cost, BuyCredits modal opens; submitting a card → BeratePopup
- [ ] After 3 calcs in 10s, CooldownModal blocks `=` for 47s
- [ ] Single calc > 50 credits → BigSpenderUpsell modal
- [ ] After 5 calcs: stage advances to premium; after 3 triggers: advances to ads
- [ ] Refresh preserves all of: credits, surge multiplier (or re-seeds it), counters, stage

## Commit

`phase 04: s5+s6 — surge pricing + premium triggers + cooldown`

## Next phase

`05-s7-ads.md` — banner ads, video interstitials, ad-free upsell.
