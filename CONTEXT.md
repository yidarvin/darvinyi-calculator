# Calculator 2026 — Context (read this first)

> **Read this file at the start of every Claude Code session before doing any work.**

## What we're building

**Calculator 2026** is a satirical web app that pokes fun at modern SaaS dark patterns by applying every single one of them to a four-function calculator.

It starts as a clean, working calculator. The moment the user does any math, it begins introducing escalating monetization layers — free-trial limits, paywalls, IOU loans, surge pricing, banner ads, video ads, AI gatekeeping — until what was a calculator has become an AI chatbot that takes 5 seconds to add 5+10, charges credits per token, and displays a running water-usage counter.

The whole thing is **a joke**. No real money moves. No real PII is collected. No real services are integrated. If a user enters a real credit card, we mock them and throw the data away.

## Tone

**Escalating satire.** Stage 1 looks like a real, polished, plausible calculator app. Stage 10 is unhinged. The transition is gradual — each stage adds *one more* believable-but-evil SaaS mechanic on top of the previous one. The humor lands because the early stages are too realistic to laugh at.

- Microcopy is the workhorse. "9 uses left" → "Only 2 calculations remaining ⚠" → "WAIT. STOP."
- Real-feeling typography in actual UI. Joke-feeling typography is reserved for our wireframe annotations, not the built app.
- Visual quality stays **high** the whole way through. Bad code or sloppy CSS undercuts the joke.

## Tech stack

- **Next.js 14+ (App Router)** with TypeScript
- **Tailwind CSS** for styling
- **React 18**, client-side state only (no auth backend, no DB)
- **Zustand** for global state (stages, debt, credits, flags)
- **Framer Motion** for overlays + tour spotlight
- **localStorage** for persistence (state survives refresh)
- **Anthropic SDK** for the AI mode (phase 6) — server route at `/api/chat`
- **Deploy to Vercel** (free tier)

## Folder layout (target)

```
app/
  layout.tsx           # root layout, mounts <GlobalChrome />, <OverlayHost />, <DebtTicker />
  page.tsx             # calculator (or chat, depending on stage)
  api/chat/route.ts    # POST { messages } → streamed Claude response
  receipts/page.tsx    # receipts of shame
  debt/page.tsx        # debt projection chart
  settings/delete/page.tsx  # 47-step deletion
components/
  calculator/          # CalcPad, Display, KeyButton, evaluator
  chat/                # ChatThread, ChatInput, ThinkingStream
  paywall/             # PricingTiers, StripeForm, IOUForm, SignaturePad
  overlays/            # BeratePopup, ReviewNag, Captcha, SignupGauntlet, Clippo, CookieBanner, Referral
  tour/                # Tour, TourStep, Spotlight
  chrome/              # AdBanner, DebtTicker, Meters, SurgeBanner
lib/
  state.ts             # zustand store + types
  stages.ts            # stage definitions + transition rules
  triggers.ts          # premium-feature trigger registry
  luhn.ts              # credit-card validation
  iou.ts               # compounding interest math
  ads.ts               # ad inventory + rotation
  events.ts            # tiny pub-sub bus for overlay triggers
  storage.ts           # localStorage helpers w/ SSR safety
```

## Global state shape

```ts
// lib/state.ts

export type Stage =
  | 'free'         // S1, S2 — pristine calc + free trial
  | 'paywall'      // S3 — pick a plan
  | 'iou'          // S4 — debt ticker active
  | 'surge'        // S5 — credits + surge multiplier
  | 'premium'     // S6 — premium-feature triggers active
  | 'ads'          // S7 — banners + video interstitials
  | 'ai';          // S8 — chat-only mode

export type CardAttempt = {
  ts: number;
  last4Hash: string;   // sha256(last4).slice(0,8) — never raw digits
  amount: number;
  context: 'subscribe' | 'iou-payoff' | 'ad-free' | 'top-up';
};

export type State = {
  stage: Stage;
  uses: number;                  // total "=" presses
  interactions: number;          // any keypress, for ad cadence
  credits: number;               // post-paywall currency
  tokens: number;                // AI mode
  waterLiters: number;           // AI mode
  surgeMultiplier: number;       // wanders 1.0–4.0
  debt: { principal: number; startedAt: number } | null;
  plan: 'pro' | 'max' | 'enterprise' | null;
  flags: {
    adFree: boolean;
    captchaPassed: boolean;
    onboardingDone: Partial<Record<Stage, boolean>>;
    signupCompleted: boolean;
  };
  cardsAttempted: CardAttempt[];
};
```

## Stage transition rules

| From       | To       | Trigger |
|------------|----------|---------|
| `free`     | `paywall`| `uses >= 10` and user attempts another calc |
| `paywall`  | `iou`    | User signs IOU |
| `paywall`  | `surge`  | User submits a card (after BeratePopup → "Charge me anyway") |
| `iou`      | `surge`  | After 1 calc in iou state |
| `surge`    | `premium`| After 5 calcs in surge |
| `premium` | `ads`    | After 3 premium-trigger events |
| `ads`      | `ai`     | After 2 forced video ads dismissed |
| **any**    | (overlay) | Valid Luhn card submit → BeratePopup |

On every transition: fire the `Tour` for the new stage (unless `flags.onboardingDone[stage]` is true).

## Inviolable rules

1. **No real payments.** Every payment path is a mock. Card forms validate via Luhn, then route to BeratePopup.
2. **No raw card numbers stored.** Hash last-4 only. Never log full digits.
3. **No real PII.** "Signup gauntlet" inputs go nowhere.
4. **localStorage persistence everywhere.** Refresh should never reset progress.
5. **The user can always make progress.** Even cooldowns and ads can be bypassed (painfully).
6. **No fake screenshots of real products.** No Apple, no Stripe wordmark, no Google ads — original "Stripe-style" forms are fine; copying logos is not.
7. **Stage is monotonic.** Once a user reaches `ai`, they never go back to `free`. (Settings can offer a reset, but it's hidden in step 47 of deletion.)

## Aesthetic tokens

```
--paper:      #fbf9f4
--ink:        #1a1612
--ink-soft:   #6b6357
--alarm:      #b04a2a   /* paywall, escalation */
--money:      #3a7044   /* IOU, debt */
--ad:         oklch(0.62 0.16 60)
--ai:         oklch(0.55 0.16 270)

Type: Inter Tight (UI), Geist Mono or JetBrains Mono (digits/numerals)
```

Apply the alarm/money/ad/ai accents *only when* the satire turns the screw. Early stages should look almost beige.

## See also

- **`STAGES.md`** — full description of each S1–S10 stage and its UI.
- **`wireframes.pdf`** (if attached) — visual reference, low-fi sketches.
