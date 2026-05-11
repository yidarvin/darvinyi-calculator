# Phase 10 — Polish, 47-step account deletion, Easter eggs

> **Fresh Claude Code session.** Read `CONTEXT.md` and `STAGES.md` first.
>
> Final phase. Builds on phase 09. Focus: feel, finish, the deletion gauntlet, and a handful of Easter eggs.

---

## Your task

Polish the existing experience to a real-feeling level, build the 47-step account deletion flow, and seed a few Easter eggs.

### 1. Sound (optional but recommended)

Add subtle UI sounds with `<audio>` elements preloaded. Use **free, CC0** sounds only (suggest pulling from freesound.org or generating with the WebAudio API).

Triggers:
- Key press: a soft mechanical click (low-pitched, ~30ms)
- Calc success: a register-ding (cha-ching feel) — only after stage `surge`
- Stage advance: a "level up" chime
- BeratePopup open: an alarm sting (1.5s)
- Tour spotlight reposition: tiny whoosh
- Skip button running away: cartoon "boing"

Gate behind `flags.soundEnabled` (default false). Add a small audio toggle in the header.

Implementation: build a `useSound(name)` hook that lazy-loads + plays. Never auto-play on first interaction without consent.

### 2. Motion polish

Audit every modal, banner, and overlay for entry/exit animation:
- Modals: `spring` opacity + scale (0.96 → 1)
- Toasts: slide-up from bottom
- Stage transitions: full-screen fade through paper color
- Cost toast: spring with a tiny bounce + auto-dismiss
- Tour spotlight reposition: smooth tween between target rects (not snap)

Use `<AnimatePresence>` and `mode="wait"` where appropriate to avoid overlapping animations.

### 3. Empty states

Every page should look intentional when empty:
- `/receipts` with no attempts → friendly empty state ("Nothing to be ashamed of yet")
- `/debt` with no debt → "You're debt-free! Why not sign an IOU to fix that? [Sign now]"

### 4. 47-step account deletion (`app/settings/delete/page.tsx`)

This is the marquee Easter egg. Real PII never moves; it's all theater.

Steps (each is its own screen with a "Back" / "Continue" button — Back works, Continue advances):

1. "We're sorry to see you go. Are you sure?" [I'm sure] [Stay]
2. "Really sure?" [Yes] [Stay]
3. "Like, actually sure?" [Yes] [I'll think about it]
4. "Verify your identity." Email input.
5. "Verify your identity (again)." Same email input.
6. "Verify with your phone." Phone input.
7. "Verify with your secondary phone."
8. "Provide a reason." Radio buttons: "Too expensive", "Found a better calculator (lol)", "Other"
9. "If 'Other', please specify in 500 words." Textarea. Validation: requires >= 500 chars (count visible). 
10. "Take this survey." 10 likert questions about your experience.
11. "Watch this video about what you'll miss." 30s placeholder video (use `<VideoAdModal>` from phase 05 with a custom config).
12. "Confirm your DOB."
13. "Mother's maiden name."
14. "Childhood pet's name."
15. "First street you grew up on."
16. "Solve this CAPTCHA." (use Captcha from phase 09)
17. "Sign this NDA." Signature pad (re-use phase 02 component).
18. "Wait 24 hours." A countdown timer for 24 hours. **Bypassable** with a "Skip wait — $99/mo subscription" button that opens BeratePopup.
19. "Confirm via fax." Same fake fax field from signup.
20. "Confirm via carrier pigeon." Upload a photo of a pigeon. (file input, accepted but discarded.)
21. "Talk to a retention specialist." Fake chat interface — types out a message slowly: "Hi! I'm Karen from Retention. What can I offer you to stay?" — offers free month, free credits, etc. All accept buttons → BeratePopup. "I still want to delete" → continue.
22. "Final confirmation." [Delete account] button. Click it…
23. "Tell us what we could have done better." Textarea, 500 words.
24–46. Repeat patterns: more CAPTCHAs, more surveys, "verify via X" steps, more retention offers.
47. **"Account deletion submitted. Estimated completion: 7-14 business decades."** [Done]
    - Clicking [Done] reads as success but actually loops the user **back to step 1** of deletion. The URL stays at `/settings/delete?step=1`. A small banner appears: "Note: your account is still active. Please try again."

Implementation: drive via a single `?step=N` URL param. State of partial filling is held in URL hash or short-lived component state — none of it persists.

Optional escape hatch: at step 47, double-click the "Done" button quickly → **really** clear localStorage and route to `/`. The escape is the joke's resolution.

### 5. Easter eggs

- Press the calculator buttons `8 0 0 8 5 =` → display flips upside down and shows "BOOBS" for 2s. (Stage `free` only.)
- Type `42` into the calculator → small toast: "Don't panic."
- On the chat page, ask "what is 1+1" three times in a row → AI responds with a single line: "fine. it's 2." (No reasoning steps.) Implement client-side by detecting the pattern in the last 3 user messages and short-circuiting the API call. **Don't actually hit the API.**
- On `/receipts`, click the "💖" emoji 5 times → toast: "We do care. About your wallet."
- On `/debt`, the chart's y-axis label is clickable → toast: "Compound interest is the eighth wonder of the world. We're billing for it."
- Konami code anywhere (↑↑↓↓←→←→BA) → unlocks the "developer dashboard" at `/dev` that just shows the zustand state as JSON.

### 6. Settings page (`app/settings/page.tsx`)

A real-feeling settings page (this gives the "Delete account" link a home):

- Profile (display name from signup, if completed)
- Plan (from `state.plan`, with "Change plan" button)
- Sound toggle
- Reduce motion toggle (respects `prefers-reduced-motion` by default)
- Export data (CSV download of `cardsAttempted` and stage transitions — generated client-side)
- **Delete account →** routes to `/settings/delete`

### 7. Final QA pass

Run through the entire flow on a fresh browser (clear localStorage):
1. Land → calculator works
2. Hit 10 calcs → paywall
3. Sign IOU → debt ticker appears, calculator still works
4. Calc 1 more time → surge mode, banner appears, tour fires
5. Calc 5 times → premium, triggers cost more, tour fires again
6. Trigger 3 events → ads mode, banners + interstitial after 3 calcs
7. Dismiss 2 video ads → AI mode, chat replaces calculator
8. Type "5+10" → 5s delay, streaming reasoning, "15" answer

Each transition: tour fires once and is rememberable across refresh. Refresh at any stage preserves all state.

### 8. README for the actual app

Write `README.md` (in the project root, not in `claude-code/`) describing:
- What it is
- That it's a parody
- Setup instructions (env vars)
- Deployment to Vercel
- Disclaimer: no real money, no real PII

### 9. Vercel deploy config

Add `vercel.json` if needed for environment variable enforcement. Confirm `ANTHROPIC_API_KEY` is set in the Vercel dashboard. Ensure `/api/chat` works under Vercel's Node runtime (`runtime = 'nodejs'` not `edge`, since we use the Anthropic SDK).

---

## Acceptance criteria

- [ ] Every modal has a polished entry animation
- [ ] Sound toggle works; sounds play subtly when enabled
- [ ] Empty states feel intentional
- [ ] Deletion flow has all 47 steps; step 47 loops back to step 1
- [ ] Double-clicking [Done] on step 47 actually clears state and exits
- [ ] All 6 Easter eggs work as described
- [ ] Settings page renders cleanly with all toggles functional
- [ ] Production build passes (`npm run build` then `npm start`)
- [ ] Deployed to Vercel; API route streams successfully under prod

## Commit

`phase 10: polish, deletion gauntlet, easter eggs — calculator 2026 v1.0`

## After this phase

You're done. Tag a release:
```bash
git tag v1.0.0
git push --tags
```

Share the URL. Watch friends slowly realize what's happening.
