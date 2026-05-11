# Phase 09 — Extras (Review nag, Captcha, Signup gauntlet, Clippo, Cookies, Referral, Achievements)

> **Fresh Claude Code session.** Read `CONTEXT.md` and `STAGES.md` first (Extras section).
>
> Builds on phase 08. The OverlayHost from phase 08 needs upgrading to a real queue.

---

## Your task

Layer the secondary interrupts on top of the main funnel. These all use the event bus and the `<OverlayHost>` queue. Build them in the order listed; each is independent.

### 1. OverlayHost queue upgrade (`components/overlays/OverlayHost.tsx`)

Refactor from phase 08 to support a queue:

```ts
type OverlayKey = 'berate' | 'review' | 'captcha' | 'signup' | 'cookies' | 'referral' | 'video-ad' | 'cooldown' | 'buy-credits' | 'big-spender' | 'ad-free-upsell' | 'tokens-out';
type OverlayPayload = { key: OverlayKey; props: any };

const [queue, setQueue] = useState<OverlayPayload[]>([]);
const current = queue[0];

useEffect(() => {
  const handler = (payload: OverlayPayload) => setQueue(q => [...q, payload]);
  on('overlay.open', handler);
  return () => off('overlay.open', handler);
}, []);

function dismiss() { setQueue(q => q.slice(1)); }
```

Render whatever matches `current.key`. Berate always preempts (insert at front of queue, not push).

### 2. CookieBanner (`components/overlays/CookieBanner.tsx`)

Fires on first page load per session (use `sessionStorage` flag `'cookieBannerShown'`).

Layout: bottom-screen sticky bar.

```
We use cookies and 47 third-party trackers to improve your experience.
[Accept all]   [Reject all]
```

`[Accept all]` → close. Sets `flags.cookiesAccepted = true`.

`[Reject all]` → opens a nested "Manage preferences" panel with 5 expandable categories:
- Essential (locked on)
- Performance (unchecked, expandable → 12 sub-toggles, each defaulting checked)
- Personalization (unchecked → 8 sub-toggles)
- Marketing (unchecked → 23 sub-toggles)
- Other / Vendors / Affiliates (unchecked → 47 sub-toggles, one labeled "share my heart rate with insurance partners")

Bottom buttons: `[Save preferences]` `[Accept all instead →]`. Saving requires ≥3 clicks total. Most users will tap "Accept all instead".

### 3. ReviewNag (`components/overlays/ReviewNag.tsx`)

Subscribe to `calc.success`. Increment a session counter. On every 5th success (and at most once per day via `localStorage:lastReviewNag` timestamp), open the modal.

Content:
```
Enjoying Calculator 2026?
[★ ★ ★ ★ ★]
[Submit]   [Maybe later]
```

If user selects < 5 stars and submits → second modal:
> Are you sure? Less than 5 stars means your review will be sent to our **legal team** for review.
> [Send to legal] [Actually, 5 stars ★★★★★]

The "Actually, 5 stars" auto-submits with 5 stars and shows a confetti animation + "Thanks!". The "Send to legal" closes the modal but emits an event `legal.review.sent` (no-op for now; could power a future Easter egg in phase 10).

### 4. Captcha (`components/overlays/Captcha.tsx`)

Fires before every paid action (intercept in `submitCard` from phase 08 — if `flags.captchaPassed` is false, open captcha first; on pass, set the flag and continue).

3×3 grid of squares with text labels like:
- "TI-84"
- "TI-89"
- "Casio fx-991"
- "Abacus"
- "Slide rule"
- "Calculator with feelings"
- "Real human emotion"
- "A regret"
- "Math itself"

Prompt: "Select all squares containing real human emotion."

Validation: any selection is accepted on submit, but the modal then says "Hmm, try again" twice before accepting on the third submission. Use a counter.

### 5. SignupGauntlet (`components/overlays/SignupGauntlet.tsx`)

Fires the first time `uses >= 3`. Sets `flags.signupCompleted = true` on completion. Can be skipped (button: "Continue without signing up") but the button is small and grey.

11-step form (one field per step, all stored in component-local state only — never persisted, never sent anywhere):

1. Email
2. Confirm email
3. Password
4. Confirm password
5. First name
6. Last name
7. **Verify phone number via fax.** Input: phone. Below: "Don't have a fax? [Buy one — $99]" (button is a no-op that opens BeratePopup with `context: 'subscribe'`)
8. Date of birth
9. Mother's maiden name (for "security questions")
10. Upload a photo of yourself holding today's newspaper. (input type=file, accepted but discarded)
11. Solve a CAPTCHA (use Captcha component inline here)

Progress bar at the top: `Step 7 of 11`. Each step has a "Back" and "Next" button. Validation is loose — almost anything is accepted.

Final step submission shows: "Welcome to Calculator 2026!" and a "Thanks for joining" toast.

### 6. Clippo (`components/overlays/Clippo.tsx`)

After `flags.signupCompleted = true`, Clippo appears. Floating paperclip character in the bottom-right.

```tsx
"use client";
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const HINTS = [
  "It looks like you're trying to add two numbers. Want help?",
  "Did you mean to subtract instead?",
  "I notice you've been calculating a lot. Have you considered an LLM?",
  "Hot tip: pressing = costs credits! Want a tip?",
  "Have you tried our Enterprise plan?",
  "I'm trained on 47 trillion math problems. Just saying.",
];

export function Clippo() {
  const [pos, setPos] = useState({ x: window.innerWidth - 120, y: window.innerHeight - 200 });
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setHint(HINTS[Math.floor(Math.random() * HINTS.length)]);
      setTimeout(() => setHint(null), 6000);
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  function onDragEnd(_e: any, info: any) {
    // Snap back home after 5s
    setTimeout(() => setPos({ x: window.innerWidth - 120, y: window.innerHeight - 200 }), 5000);
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={onDragEnd}
      animate={pos}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      className="fixed z-50 w-24 h-24 grid place-items-center cursor-grab active:cursor-grabbing select-none"
    >
      <div className="text-6xl">📎</div>
      {hint && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="absolute right-full mr-2 bottom-2 w-56 bg-paper border-2 border-ink rounded-lg p-2 text-xs shadow"
        >
          {hint}
        </motion.div>
      )}
    </motion.div>
  );
}
```

Tweak the eyes: googly eyes via two CSS-positioned divs that move slightly with the cursor (`mousemove` listener, parallax-style). 

### 7. Referral (`components/overlays/Referral.tsx`)

A button in the header: `🎁 Refer a friend, earn credits!`

Opens a modal:
```
Your referral link:
https://calculator2026.com/?ref=abc123xyz
[Copy]

Share to earn 0 credits per signup.*
* terms apply; "earning" subject to validation
```

The link uses a stable randomly-generated id from `localStorage:refId` (gen once on first open). [Copy] copies to clipboard with a "Copied!" toast.

No real referrals tracked. The button is achievement-bait only.

### 8. AchievementsToast (`components/overlays/AchievementsToast.tsx`)

Subscribes to `calc.success`. On certain milestones, shows a top-of-screen toast for 4s:

- 5 calcs: "🏆 First five! You did math!"
- 10 calcs: "🏆 Decimator"
- 25 calcs: "🏆 Math Apprentice"
- 50 calcs: "🏆 Mathlete"
- 100 calcs: "🏆 Math Olympian"
- Day 7 IOU debt: "🏆 In Debt for a Week!"

Track shown achievements in `flags.achievements: string[]` to avoid repeats.

### 9. Wiring summary

In `app/page.tsx` and `app/layout.tsx`, make sure these are mounted:
- `<OverlayHost />` (handles modal-style overlays in queue)
- `<Clippo />` (only renders when `flags.signupCompleted`)
- `<CookieBanner />` (separate from OverlayHost — uses sessionStorage gate)
- `<AchievementsToast />` (separate; subscribes to `calc.success`)

---

## Acceptance criteria

- [ ] Cookie banner appears once per session, "Reject all" leads to a 5-tab nightmare
- [ ] ReviewNag fires every 5th calc, max once per day
- [ ] Captcha intercepts every card submission (until `captchaPassed`)
- [ ] SignupGauntlet fires at `uses === 3`, has 11 steps, none of which persist
- [ ] Clippo appears after signup, teleports back home if dragged
- [ ] Referral modal generates a stable link and copies to clipboard
- [ ] AchievementsToast fires once per milestone; no repeats
- [ ] All overlays correctly queue (no stacking; berate always preempts)

## Commit

`phase 09: extras — review/captcha/signup/clippo/cookies/referral/achievements`

## Next phase

`10-polish-deletion.md` — sound, motion polish, 47-step deletion, Easter eggs.
