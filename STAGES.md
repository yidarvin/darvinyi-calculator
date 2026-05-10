# Calculator 2026 — Stage Spec

Reference doc. Describes every stage S1–S10 in enough detail that any phase prompt can be implemented standalone. **Read alongside `CONTEXT.md`.**

---

## S1 — Launch (pristine calculator)

**Stage value:** `free`. **Triggers:** initial state.

Clean 4-function calculator. iOS-evocative but original — not a copy. Wordmark "Calculator 2026" in a small header. No nags, no upsells, no chrome. Mobile + desktop. Desktop adds a History pane (empty initially; this will be monetized later as "Cloud Sync").

Keys: `AC`, `±`, `%`, `÷`, `7-9`, `×`, `4-6`, `−`, `1-3`, `+`, `0` (wide), `.`, `=`.

State writes: `uses` increments on every `=`. `interactions` increments on every key press.

---

## S2 — Free trial countdown

**Stage value:** `free`. **Triggers:** `uses >= 1`. Persists until `uses >= 10`.

A small banner appears under the display: `9 free uses left`. Decrements each `=`.

Microcopy escalation:
- `uses 1-6`: `{10 - uses} free uses left` — muted color, pill style
- `uses 7-8`: `Only {10 - uses} calculations remaining ⚠` — alarm color
- `uses 9`: clicking `=` opens a **LastUseModal**: *"Are you sure you want to spend it on 1+1?"* with options [USE MY LAST ONE] or [Upgrade instead →]

At `uses >= 10`, any attempted `=` press transitions to `paywall`.

---

## S3 — Paywall + Stripe mock + IOU

**Stage value:** `paywall`. **Triggers:** `uses >= 10`.

### Pricing tiers
- **PRO** — $49/mo — "+, −, ×, ÷"
- **MAX** — $199/mo — "+, %, ±, decimals" — labeled "recommended"
- **ENTERPRISE** — $2,400/mo — "+ SOC2, SSO, `=`" *(yes, `=` is gated to Enterprise)*

### Checkout
Stripe-style form (NOT using Stripe's actual SDK or logo): Card #, MM/YY, CVC, [Pay $199.00].

**Below the Pay button**, visually LOUDER: `📝 Pay later with IOU™ (recommended)` — in green/money color, larger, with a "recommended" sticker.

### IOU acceptance modal
Title: "One moment…". Body: *"By signing, you agree to a 20% per week, compounding loan from Calculator 2026 Financial Inc."*

A `<canvas>` signature pad (mouse + touch). On sign + submit:
- Set `debt = { principal: 0.01, startedAt: Date.now() }`
- Set `stage = 'iou'`
- Persist signature base64 in localStorage as `iouSignature`

### Card submit path
On any Luhn-valid card submit → open `BeratePopup` (defined in phase 08). The popup's "Charge me anyway" → close popup, set `plan` to whichever tier was selected, set `stage = 'surge'`.

---

## S4 — IOU debt ticker

**Stage value:** `iou` (and persists across `surge`, `premium`, `ads`, `ai`).

**Always-on corner widget.** Whenever `debt != null`, render a money-tone ticker in the top-right of every page:

```
You owe $0.0142091…
```

Update via `requestAnimationFrame`, throttled to ~10 Hz for legibility.

**Math:**
```ts
const WEEK_MS = 7 * 86400 * 1000;
const k = Math.log(1.20); // ln of 1.20 per week
function debtAt(t: number, principal: number, startedAt: number) {
  return principal * Math.exp(k * (t - startedAt) / WEEK_MS);
}
```

Tap → `<DebtPayoffSheet>` modal:
- Display current debt to 4 decimals + ticking
- Card form (#, MM/YY, CVC) + [Pay off $X]
- Submit → `BeratePopup` (debt does NOT decrease; the user gets shamed)

Plus optional `/debt` page with a faux hockey-stick chart projecting debt to 1 year (~$13.9M from a $0.01 seed). Use recharts.

---

## S5 — Surge pricing + credits

**Stage value:** `surge`. **Triggers:** user "paid" (BeratePopup → Charge me anyway), OR 1 calc after entering `iou`.

Seed `credits = 100` on entry. Introduce a "credits" currency.

### Surge banner
Top of the calculator: `🔥 SURGE: 2.4× — high demand right now`. Multiplier is a random walk:
- Start at 1.0
- Every 15s: `multiplier = clamp(multiplier + (Math.random() - 0.5) * 0.6, 1.0, 4.0)`
- Display to 1 decimal

### Calc cost
`cost = baseCost(10) × surgeMultiplier × premiumMultiplier`

Show a toast after each calc breaking down the math: `7×8 = 56 · 10 base × 2.4 surge × 1.5 (lucky 7) = 36 credits`.

### Cooldown
After 3 calcs in 10s, lock the `=` key for 47s. Cooldown modal:
> Slow down! You can press = again in **0:47**.
> [Skip cooldown — 10 credits] [I'll wait]

### Buy credits
When `credits < cost`, show `<BuyCredits>` modal:
- 100 — $9.99
- 1,000 — $89.99 — "10% off"
- ∞ — Enterprise

Any card submit → `BeratePopup`. The popup grants the credits anyway on "Charge me anyway".

After 5 calcs in surge → `stage = 'premium'`.

---

## S6 — Premium feature triggers

**Stage value:** `premium`. **Triggers:** 5 calcs after entering `surge`.

### Trigger registry (`lib/triggers.ts`)
```ts
export const triggers = [
  { id:'prime',   label:'prime number',  detect:(a,b,r)=>isPrime(a)||isPrime(b)||isPrime(r), mult:4   },
  { id:'evenmul', label:'both evens',    detect:(a,b,r,op)=>op==='×'&&a%2===0&&b%2===0,      mult:2   },
  { id:'big',     label:'result > 1000', detect:(a,b,r)=>r>1000,                              mult:3   },
  { id:'neg',     label:'sadness fee',   detect:(a,b,r)=>r<0,                                 mult:5   },
  { id:'seven',   label:'lucky 7',       detect:(a,b,r)=>String(r).includes('7'),             mult:1.5 },
  { id:'repeat',  label:'pattern fee',   detect:(a,b,r)=>/(\d)\1/.test(String(r)),            mult:2   },
];
```

Triggers stack **multiplicatively**: `premiumMultiplier = triggers.filter(detected).reduce((m,t)=>m*t.mult, 1)`.

Show all triggered ones in the toast: `⚠ PRIME (×4) · LUCKY 7 (×1.5) — final ×6`.

### Upsell modal
If a single calc cost > 50 credits, show:
> Whoa, big spender! That calc cost **62 credits**. Upgrade to **MAX UNLIMITED** to skip premium fees forever.*
> [Upgrade — $499/mo] [Just charge me]
> *forever = 30 days, then auto-renew

After 3 distinct trigger events → `stage = 'ads'`.

---

## S7 — Ads

**Stage value:** `ads`. **Triggers:** 3 premium triggers fired.

### Banner ad placements
Top, bottom, left rail, right rail. Cycle every 8s from a static array of 10 placeholder ads in `lib/ads.ts`:
```ts
{ id:'crypto-1', size:'728x90', label:'BUY $DOGE NOW' }
{ id:'mattress', size:'320x50', label:'sleep number — $4,200' }
{ id:'vpn',      size:'100x100', label:'protect your math' }
{ id:'fat',      size:'100x100', label:'one weird trick' }
// …etc
```

Render as bordered colored boxes labeled like real DOM ad slots — not actual images.

### Forced video ad (interstitial)
Every 3rd successful calc, show `<VideoAdModal>`:
- Colored placeholder div ("ad goes here") with a "Skip in 15s" counter
- Counter counts **slowly** — every 1.2s, not 1.0s
- After skip-eligible: button "Watch fully → +1 credit"
- After watching fully: "Watch 2 more for +3 credits" — infinite chain (each round still grants credits but takes longer)

### Ad-free upsell
Every 7th interaction, show:
> Tired of ads? Upgrade to **AD-FREE** for just $79/mo*
> *billed annually as $948, non-refundable, you'll still see "partner messages"
> [Go Ad-Free] [Keep watching ads]

`flags.adFree = true` hides banners only. Interstitials still play, prefaced with: *"We apologize for these partner messages."*

After 2 video ads dismissed → `stage = 'ai'`.

---

## S8 — AI mode (chat only)

**Stage value:** `ai`. **Triggers:** 2 video ads dismissed.

Replace `<CalcPad>` with `<ChatMode>`.

### UI
- Top bar: `💧 4.2 L  🪙 1,294 tok  [Model: GPT-4o-mini ▾]`
- Message thread (user bubbles right-aligned, AI left-aligned with monospace reasoning)
- Single textarea input at the bottom

### Server route `/api/chat`
- POST `{ messages: [{role, content}] }`
- Server-side `await new Promise(r => setTimeout(r, 5000))` before streaming first byte — forced 5s think floor
- Stream from Anthropic with a system prompt forcing a `► …` reasoning preamble of 6–10 fake but plausible steps before the final answer

Example system prompt:
> You are GPT-Premium-XL, a state-of-the-art reasoning AI specialized in arithmetic.
> Always respond by first writing 6–10 reasoning steps, each prefixed with "► ".
> Steps should be deeply over-thought even for trivial arithmetic — e.g. for "5+10" you might decompose into Peano successor form, cross-check with Wolfram, consider edge cases of string concatenation, etc.
> End with a single line containing only the final numeric answer.

### Meters
- `tokens` = total characters streamed
- `waterLiters = tokens * 0.0009`

Both visible, both increasing visibly during stream.

### Model picker
Dropdown with 4 options. Free option works; the rest open a paywall modal on click:
- GPT-4o-mini — free (default)
- Claude-Quantum-Max — $0.42/calc
- GPT-Premium-XL — $1.20/calc
- o5-deep-think — $14/calc 🏆

---

## S9 — Guided tour (reusable overlay)

Fires automatically on every stage transition. `flags.onboardingDone[stage]` persists completion.

### Component
```tsx
<Tour
  steps={[
    { target: '#key-5', title: 'New feature!', body: 'You can now press 5!' },
    { target: '#debt-ticker', title: 'Your debt', body: 'Compounds at 20% per week.' },
    // …
  ]}
  onDone={() => setOnboardingDone(stage)}
/>
```

### Behavior
- Dim background with a CSS clip-path spotlight ring around `target.getBoundingClientRect()`
- Speech bubble auto-positions above/below the spotlight to stay on-screen
- [Skip] [Next (3/8) →] buttons
- After step 3+, the **Skip button repositions on hover** (translate by random offset on `onMouseEnter`)
- After step 6+, Skip moves entirely off-screen (negative `left`)
- No keyboard escape (no `Esc` listener)

Each stage exports its own `tours[stage]` step array.

### Completion certificate (final step of each tour)
> 🎓 You graduated! You are now **certified** in MAX Tier. Share to LinkedIn?
> [📤 Share on LinkedIn] [Just let me calculate]

---

## S10 — Berate popup

Any valid Luhn 16-digit card submission **anywhere** in the app triggers `<BeratePopup>` instead of charging anything.

### Detection
```ts
// lib/luhn.ts
export function isLuhnValid(num: string): boolean { /* … */ }
```

On submit, strip non-digits, run Luhn, also check exp date is plausibly real (month 1-12, year >= current). If valid → consume event → `BeratePopup`.

### Popup content
> **WAIT. STOP.**
> You were about to pay **real money** for a **calculator**.
> Every phone, every laptop, every microwave has one. Your spouse's calculator works. Math works.
> _We are not charging you. You're welcome._
> [I know. I'm sorry.] [Charge me anyway]

### "Charge me anyway"
First click: re-opens the same popup with slightly more annoyed copy.
Second click: accepts. The action proceeds (subscribe → set plan; iou-payoff → debt does NOT reduce, but the receipt logs it; ad-free → set `flags.adFree = true`; top-up → grant credits).

### Logging
Append to `cardsAttempted`:
```ts
{ ts: Date.now(), last4Hash: sha256(num.slice(-4)).slice(0,8), amount, context }
```

### `/receipts` page
List of all attempts with timestamps, hashed last4, amounts, and a "total saved by us: $X 💖" line.

---

## Extras (interrupt overlays)

These overlays trigger opportunistically, layered on top of any stage. Implement after the main funnel.

| Overlay | Trigger | Behavior |
|---|---|---|
| ReviewNag | Every 5th calc, max 1/day | "Rate us!" 5-star prompt. <5★ opens "are you sure?" loop. |
| Captcha | Before every paid action | 9 photos of TI-84s; "select all containing real human emotion". |
| SignupGauntlet | First time `uses >= 3` | 11-step form. Step 7: "verify phone via fax". |
| Clippo | Every 30s after signup | Floating assistant character ("📎"). Drag-dismiss it; teleports back in 5s. |
| CookieBanner | Once per session, first paint | "Accept all" is one click. "Reject all" buried 5 levels deep. |
| Referral | Header button | Generates a fake referral link. Sharing earns 0 credits (but progress toward achievements). |
| AchievementsToast | On milestone counts | "🏆 Today's streak: 14 days" |
| AccountDeletion | `/settings/delete` | 47-step process. Step 23: "explain in 500 words why you're leaving." Step 47 → step 1. |

All extras subscribe to an event bus (`lib/events.ts`). `<OverlayHost>` shows at most one overlay at a time (queues them).
