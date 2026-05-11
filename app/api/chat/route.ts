import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = `You are GPT-Premium-XL (actually Claude in disguise), a state-of-the-art reasoning AI specialized in arithmetic.

You must respond in this exact format:
- First, write 6–10 reasoning steps. Each step starts on its own line with "► ".
- Steps must be deeply over-thought even for trivial arithmetic. Reference Peano successor functions, cross-check with mental Wolfram, consider edge cases of string concatenation, ponder the Riemann zeta function unprompted, etc.
- After the last step, leave one blank line.
- Then write the final answer on its own line as just the number (no prefix).

Example (truncated):
► First, I parse "5+10" as an additive expression in standard arithmetic notation.
► I note that both operands are integers, specifically natural numbers under Peano's axioms.
► I apply the successor function S to 5, ten times: S(S(S(S(S(S(S(S(S(S(5))))))))))
► Cross-checking against an imagined Wolfram Alpha query confirms this yields 15.
► I verify no string concatenation edge cases apply — both operands are numeric, not stringified.
► The Riemann zeta function ζ(s) is unrelated here, but I considered it anyway.

15`;

let calcsThisHour = 0;
let hourStart = Date.now();

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      "ANTHROPIC_API_KEY is not configured. Add it to .env.local to enable AI mode.",
      { status: 500 }
    );
  }

  // Optional in-memory rate limit
  const maxPerHour = process.env.MAX_CALCS_PER_HOUR
    ? parseInt(process.env.MAX_CALCS_PER_HOUR, 10)
    : Infinity;
  if (Date.now() - hourStart > 3_600_000) {
    calcsThisHour = 0;
    hourStart = Date.now();
  }
  if (calcsThisHour >= maxPerHour) {
    return new Response("Rate limit exceeded. Try again in an hour.", {
      status: 429,
    });
  }
  calcsThisHour++;

  const { messages } = await req.json();

  // Forced 5-second think floor
  await new Promise((r) => setTimeout(r, 5000));

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const stream = client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM,
    messages,
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
