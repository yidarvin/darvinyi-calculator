# Calculator 2026

> **A satirical SaaS calculator. No real money moves. No real data is stored.**

Calculator 2026 is a parody web app that applies every modern SaaS dark pattern to a four-function calculator. It starts as a clean, working calculator. The moment you do any math, it begins introducing escalating monetization layers — free-trial limits, paywalls, IOU loans, surge pricing, banner ads, video ads, AI gatekeeping — until what was a calculator has become an AI chatbot that takes 5 seconds to add 5+10, charges credits per token, and displays a running water-usage counter.

## What happens

| Stage | Trigger | What changes |
|-------|---------|-------------|
| Free trial | First `=` press | Countdown banner appears: "9 uses left" |
| Paywall | 10th `=` press | Pricing tiers ($49/mo – $2,400/mo). IOU option available. |
| IOU / Debt | Sign the IOU | 20%/week compounding debt ticker appears in corner |
| Surge pricing | After IOU or fake payment | Credits currency + surge multiplier (1×–4×) + cooldown timer |
| Premium triggers | 5 surge calcs | Prime numbers, lucky 7s, and other "features" cost more |
| Ads | 3 premium triggers | Banner ads on all sides + forced video interstitials |
| AI mode | 2 video ads dismissed | Calculator replaced with a chatbot that takes 5s to respond |

### Easter eggs

- Type `8 0 0 8 5 =` (stage free only) → display flips upside-down for 2s
- Type `42` into the calculator → "Don't panic."
- Ask "what is 1+1" three times in chat → "fine. it's 2."
- Click the `💖` emoji on `/receipts` 5 times → surprise message
- Click the y-axis label on `/debt` → compound interest wisdom
- Konami code (↑↑↓↓←→←→BA) anywhere → developer dashboard at `/dev`

### The deletion flow

`/settings/delete` — 47 steps to delete your account. Step 47 sends you back to step 1. Double-clicking "Done" on step 47 actually clears state and exits.

## Setup

```bash
npm install
# create .env.local and add:
# ANTHROPIC_API_KEY=your_key_here
npm run dev
```

The app works without an API key until stage `ai` (the chatbot). Everything before that is fully client-side.

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes (for AI mode) | Your Anthropic API key |

## Deploy to Vercel

1. Push to GitHub
2. Import repo in the [Vercel dashboard](https://vercel.com/new)
3. Set `ANTHROPIC_API_KEY` in **Project → Settings → Environment Variables**
4. Deploy — the `/api/chat` route runs under Node.js (not Edge)

## Disclaimer

**This is a parody.** No real payments are processed. No real PII is collected. Card numbers are validated client-side via the Luhn algorithm then discarded — only a hash of the last 4 digits is stored in `localStorage` for the "Receipts of Shame" page. The AI chatbot uses the Anthropic API with a satirical system prompt. All dark patterns depicted are for comedic purposes only.

## Tech stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4**
- **Zustand** for state (`localStorage`-persisted)
- **Framer Motion** for animations
- **Recharts** for the debt projection chart
- **Anthropic SDK** for the AI mode (`/api/chat`)
- **WebAudio API** for optional sound effects (no audio files — all synthesized)
