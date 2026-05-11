# Phase 06 — S8 (AI mode — chat-only calculator with water + token meters)

> **Fresh Claude Code session.** Read `CONTEXT.md` and `STAGES.md` first (S8 section).
>
> Builds on phase 05. **You will need `ANTHROPIC_API_KEY` set in `.env.local` for this phase to actually run.**

---

## Your task

Replace the calculator UI with a chat-based AI mode when `stage === 'ai'`. The AI is forced to over-think every simple arithmetic question, takes a guaranteed 5s minimum to start responding, displays a streaming reasoning trace, and updates token + water meters in real time.

### 1. Setup

```bash
npm install @anthropic-ai/sdk
```

Create `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-…
```

Add `.env.local` to `.gitignore` (should already be there from `create-next-app`).

### 2. API route (`app/api/chat/route.ts`)

```ts
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const SYSTEM = `You are GPT-Premium-XL (actually Claude in disguise), a state-of-the-art reasoning AI specialized in arithmetic.

You must respond in this exact format:
- First, write 6–10 reasoning steps. Each step starts on its own line with "► ".
- Steps must be deeply over-thought even for trivial arithmetic. Reference Peano successor functions, cross-check with mental Wolfram, consider edge cases of string concatenation, ponder the Riemann zeta function unprompted, etc.
- After the last step, leave one blank line.
- Then write the final answer on its own line as just the number (no prefix).

Examples (truncated):
► First, I parse "5+10" as an additive expression in standard arithmetic notation.
► I note that both operands are integers, specifically natural numbers under Peano's axioms.
► I apply the successor function S to 5, ten times: S(S(S(S(S(S(S(S(S(S(5))))))))))
… (more steps)

15`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  // forced 5-second think floor
  await new Promise(r => setTimeout(r, 5000));

  const stream = await client.messages.stream({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: SYSTEM,
    messages,
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    }
  });

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' }
  });
}
```

### 3. ChatMode component (`components/chat/ChatMode.tsx`)

Replaces `<CalcPad>` when `stage === 'ai'`.

Layout (mobile-first, full-height):

```
┌──────────────────────────────────────┐
│ 💧 4.2 L  🪙 1,294 tok  [Model ▾]   │  ← meters + model picker
├──────────────────────────────────────┤
│ user: what is 5+10                   │
│                                       │
│ ai (thinking…)                        │
│ ► First, I parse "5+10" as...        │
│ ► I note that both operands are...    │
│ ► …                                  │
│                                       │
│ 15                                    │
├──────────────────────────────────────┤
│ [textarea: ask anything…]   [→]      │
└──────────────────────────────────────┘
```

### 4. State

```ts
type Message = { role: 'user' | 'assistant'; content: string; streaming?: boolean };

const [messages, setMessages] = useState<Message[]>([]);
const [input, setInput] = useState('');
const [pending, setPending] = useState(false); // true during the 5s wait + stream
```

### 5. Submit handler

```ts
async function send() {
  if (!input.trim() || pending) return;
  const userMsg = { role: 'user' as const, content: input };
  const next = [...messages, userMsg];
  setMessages([...next, { role: 'assistant', content: '', streaming: true }]);
  setInput('');
  setPending(true);

  const res = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ messages: next.map(m => ({ role: m.role, content: m.content })) }),
  });
  if (!res.ok || !res.body) {
    setMessages(m => m.slice(0, -1).concat({ role: 'assistant', content: '⚠ AI ran out of tokens. Top up to continue.' }));
    setPending(false);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    setMessages(m => {
      const copy = [...m];
      const last = { ...copy[copy.length - 1] };
      last.content += chunk;
      copy[copy.length - 1] = last;
      return copy;
    });
    useStore.getState().bumpTokens(chunk.length);
  }
  setMessages(m => {
    const copy = [...m];
    copy[copy.length - 1] = { ...copy[copy.length - 1], streaming: false };
    return copy;
  });
  setPending(false);
}
```

### 6. Meter updates

Add to the store:
```ts
bumpTokens: (n: number) => set(s => ({
  tokens: s.tokens + n,
  waterLiters: +(s.tokens + n * 0.0009).toFixed(2),
})),
```

Both meters are visible in the top bar of ChatMode. They animate (small flip/scale on change) to draw the eye.

### 7. Thinking indicator

While `pending === true` **and** the last message is empty (i.e. we're in the 5s wait):
- Show a typing indicator with a fake stream of "thinking" placeholders:
  - `Loading model weights…`
  - `Allocating GPU memory…`
  - `Spinning up TPU pod…`
  - `Negotiating compute reservation…`
- Cycle every ~1s through these messages

Once content starts streaming, hide the indicator.

### 8. Reasoning style

When rendering an assistant message: parse lines. Lines starting with `► ` render in monospace, smaller font, ink-soft color. Lines that don't render in normal sans-serif (the answer). The final numeric answer line should be visually emphasized — big, ink-toned.

### 9. Model picker

```ts
const MODELS = [
  { id:'gpt-4o-mini',         label:'GPT-4o-mini',          price:0,    free:true },
  { id:'claude-quantum-max',  label:'Claude-Quantum-Max',   price:0.42  },
  { id:'gpt-premium-xl',      label:'GPT-Premium-XL',       price:1.20  },
  { id:'o5-deep-think',       label:'o5-deep-think 🏆',     price:14.00 },
];
```

Clicking a non-free model opens a modal: `[Model] requires the [tier] subscription. Upgrade for ${price}/calc.` [Upgrade] [Stick with free]. Upgrade routes to checkout. The free model is the one that's actually used.

### 10. No more calculator

When `stage === 'ai'`, `app/page.tsx` renders `<ChatMode>` instead of `<CalcPad>`. The change is irreversible (joke premise).

### 11. Top-up modal

When `tokens > 50_000` (arbitrary threshold), show a `<TokensOutModal>`:
> You've used **50,000 tokens** this session.
> Top up to continue calculating:
> - 100k tokens — $9.99
> - 1M tokens — $79.99 (recommended)
> - ∞ — $499/mo
>
> [Top up] [I'll be quick]

[Top up] → checkout → BeratePopup loop.
[I'll be quick] → close (still works, but modal re-fires at every +10k).

---

## Acceptance criteria

- [ ] `/api/chat` waits 5s before first byte
- [ ] Streams tokens visibly into the latest message
- [ ] Reasoning lines starting with `► ` render distinctly from the answer
- [ ] Token + water meters update in real time
- [ ] Non-free models open an upsell modal
- [ ] At `tokens > 50k`, top-up modal appears
- [ ] Refresh preserves the chat history (persisted via zustand → localStorage)
- [ ] If `ANTHROPIC_API_KEY` is missing, server returns a clear 500 with a developer-friendly message (not the joke; this is a real error)

## Cost note for the user

Each calc burns real Anthropic API tokens (~$0.001/calc with haiku-4-5). At demo time, set a rate-limit or warn the user. Optional: add `MAX_CALCS_PER_HOUR` env var with a simple in-memory counter.

## Commit

`phase 06: s8 — ai mode (chat, streaming reasoning, meters)`

## Next phase

`07-s9-tour.md` — guided tour with the runaway Skip button.
