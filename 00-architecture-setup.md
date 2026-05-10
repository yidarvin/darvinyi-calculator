# Phase 00 — Architecture & scaffold

> **Fresh Claude Code session.** Read `CONTEXT.md` and `STAGES.md` first.
>
> This phase **does no feature work**. It only scaffolds the project structure, installs dependencies, and stubs out the file layout described in `CONTEXT.md`.

---

## Your task

Set up a Next.js 14+ App Router project named `calculator-2026` in the current directory.

### 1. Initialize the project

```bash
npx create-next-app@latest . \
  --typescript --tailwind --app --eslint \
  --src-dir=false --import-alias="@/*" --use-npm
```

If the directory is not empty, install into a temp dir and move files. Confirm the final structure looks like a clean Next.js App Router project.

### 2. Install runtime dependencies

```bash
npm install zustand framer-motion @anthropic-ai/sdk recharts clsx
npm install --save-dev @types/node
```

### 3. Configure Tailwind

Add the design tokens from `CONTEXT.md` to `tailwind.config.ts`:

```ts
// tailwind.config.ts
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper:     "#fbf9f4",
        ink:       "#1a1612",
        "ink-soft":"#6b6357",
        alarm:     "#b04a2a",
        money:     "#3a7044",
        ad:        "oklch(0.62 0.16 60)",
        ai:        "oklch(0.55 0.16 270)",
      },
      fontFamily: {
        sans: ['"Inter Tight"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
```

Set `body` background to `bg-paper text-ink` in `app/layout.tsx`. Load Inter Tight and JetBrains Mono via `next/font/google`.

### 4. Create the folder skeleton

Create these files as **empty stubs** (single export default function returning `null`, or empty `.ts` files with a TODO comment):

```
app/
  page.tsx                          # renders <Home /> stub
  receipts/page.tsx                 # stub
  debt/page.tsx                     # stub
  settings/delete/page.tsx          # stub
  api/chat/route.ts                 # stub — returns 501
components/
  calculator/CalcPad.tsx            # stub
  calculator/Display.tsx            # stub
  calculator/evaluator.ts           # stub
  chat/ChatThread.tsx               # stub
  chat/ChatInput.tsx                # stub
  paywall/PricingTiers.tsx          # stub
  paywall/StripeForm.tsx            # stub
  paywall/IOUForm.tsx               # stub
  paywall/SignaturePad.tsx          # stub
  overlays/BeratePopup.tsx          # stub
  overlays/ReviewNag.tsx            # stub
  overlays/Captcha.tsx              # stub
  overlays/SignupGauntlet.tsx       # stub
  overlays/Clippo.tsx               # stub
  overlays/CookieBanner.tsx         # stub
  overlays/Referral.tsx             # stub
  overlays/OverlayHost.tsx          # stub
  tour/Tour.tsx                     # stub
  tour/Spotlight.tsx                # stub
  chrome/AdBanner.tsx               # stub
  chrome/DebtTicker.tsx             # stub
  chrome/Meters.tsx                 # stub
  chrome/SurgeBanner.tsx            # stub
lib/
  state.ts                          # zustand store — see below
  stages.ts                         # stub
  triggers.ts                       # stub
  luhn.ts                           # stub
  iou.ts                            # stub
  ads.ts                            # stub
  events.ts                         # stub
  storage.ts                        # stub
```

### 5. Implement the zustand store (`lib/state.ts`)

Implement the **full** store with the shape from `CONTEXT.md`, including a `hydrate()` action that reads from localStorage on client mount, and a subscription that persists on every change. SSR-safe (no localStorage access during render).

```ts
"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// … type Stage, CardAttempt, State from CONTEXT.md

type Actions = {
  bumpUses: () => void;
  bumpInteractions: () => void;
  advance: (s: Stage) => void;
  addCredits: (n: number) => void;
  spendCredits: (n: number) => void;
  setDebt: (principal: number) => void;
  setPlan: (p: 'pro' | 'max' | 'enterprise') => void;
  recordCardAttempt: (a: Omit<CardAttempt, 'ts'>) => void;
  markOnboardingDone: (s: Stage) => void;
  reset: () => void;
};

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      stage: 'free',
      uses: 0,
      interactions: 0,
      credits: 0,
      tokens: 0,
      waterLiters: 0,
      surgeMultiplier: 1.0,
      debt: null,
      plan: null,
      flags: {
        adFree: false,
        captchaPassed: false,
        onboardingDone: {},
        signupCompleted: false,
      },
      cardsAttempted: [],
      // …actions
    }),
    { name: 'calc2026', storage: createJSONStorage(() => localStorage) }
  )
);
```

### 6. Implement `lib/events.ts` (pub-sub bus)

```ts
type Handler = (payload?: any) => void;
const listeners = new Map<string, Set<Handler>>();
export function on(event: string, h: Handler) { /* … */ }
export function off(event: string, h: Handler) { /* … */ }
export function emit(event: string, payload?: any) { /* … */ }
```

Document the event names we'll use (`calc.success`, `stage.advance`, `card.submit`, `idle.30s`, `interaction`, etc.).

### 7. Wire `app/layout.tsx`

```tsx
<html lang="en">
  <body className={`${inter.variable} ${mono.variable} bg-paper text-ink font-sans`}>
    {children}
    <OverlayHost />
    <DebtTicker />
  </body>
</html>
```

`<OverlayHost />` and `<DebtTicker />` are stubs that return null in this phase.

### 8. Verify

Run `npm run dev`. The page should load showing only "Calculator 2026" placeholder text. Tailwind classes work. No console errors. No TypeScript errors (`npm run build` passes).

### 9. Commit

Stage and commit everything with the message: `phase 00: project scaffold + state store`.

---

## Acceptance criteria

- [ ] `npm run dev` boots without errors
- [ ] `npm run build` passes
- [ ] All stub files exist as listed
- [ ] `lib/state.ts` exports a working zustand store with persistence
- [ ] Tailwind tokens (`bg-paper`, `text-alarm`, etc.) work in components
- [ ] Layout mounts `<OverlayHost />` and `<DebtTicker />` stubs

## Do NOT do in this phase

- Don't implement any calculator UI
- Don't implement any business logic in `stages.ts`, `triggers.ts`, etc.
- Don't add Anthropic API integration yet
- Don't write any unit tests yet

## Next phase

`01-s1-s2-calculator.md` — build the actual calculator + free trial.
