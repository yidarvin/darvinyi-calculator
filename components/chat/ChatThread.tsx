"use client";
import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/lib/state";

const THINKING_LINES = [
  "Loading model weights…",
  "Allocating GPU memory…",
  "Spinning up TPU pod…",
  "Negotiating compute reservation…",
];

function ThinkingIndicator() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % THINKING_LINES.length), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-xs font-mono text-ink-soft italic animate-pulse">
      {THINKING_LINES[idx]}
    </div>
  );
}

function AssistantBubble({ content, streaming }: { content: string; streaming?: boolean }) {
  const lines = content.split("\n");
  const reasoningLines: string[] = [];
  const answerLines: string[] = [];
  let seenAnswer = false;

  for (const line of lines) {
    if (line.startsWith("► ")) {
      reasoningLines.push(line);
    } else if (line.trim() === "" && !seenAnswer) {
      // blank separator between reasoning and answer
    } else {
      seenAnswer = true;
      answerLines.push(line);
    }
  }

  const showThinking = streaming && content.length === 0;

  return (
    <div className="flex flex-col gap-1 max-w-[85%]">
      <div className="text-[10px] uppercase tracking-widest text-ink-soft mb-1 font-sans">
        AI
      </div>
      <div className="bg-paper border border-ink/10 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        {showThinking && <ThinkingIndicator />}

        {reasoningLines.length > 0 && (
          <div className="mb-3 space-y-0.5">
            {reasoningLines.map((line, i) => (
              <p
                key={i}
                className="font-mono text-[11px] leading-relaxed text-ink-soft"
              >
                {line}
              </p>
            ))}
          </div>
        )}

        {answerLines.length > 0 && (
          <div>
            {answerLines.map((line, i) => {
              const isLast = i === answerLines.length - 1;
              const looksNumeric = /^-?[\d.,\s]+$/.test(line.trim()) && line.trim().length > 0;
              if (isLast && looksNumeric && !streaming) {
                return (
                  <p key={i} className="font-mono text-3xl font-bold text-ink mt-1">
                    {line}
                  </p>
                );
              }
              return (
                <p key={i} className="font-sans text-sm text-ink">
                  {line}
                </p>
              );
            })}
          </div>
        )}

        {streaming && content.length > 0 && (
          <span className="inline-block w-1.5 h-3.5 bg-ai/60 animate-pulse align-middle ml-0.5" />
        )}
      </div>
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex flex-col items-end max-w-[85%] self-end">
      <div className="text-[10px] uppercase tracking-widest text-ink-soft mb-1 font-sans text-right">
        You
      </div>
      <div className="bg-ai text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
        <p className="font-sans text-sm">{content}</p>
      </div>
    </div>
  );
}

type ChatThreadProps = {
  messages: ChatMessage[];
};

export default function ChatThread({ messages }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-ink-soft text-sm font-sans">
        Ask me anything. I am GPT-Premium-XL.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
      {messages.map((msg, i) =>
        msg.role === "user" ? (
          <UserBubble key={i} content={msg.content} />
        ) : (
          <AssistantBubble key={i} content={msg.content} streaming={msg.streaming} />
        )
      )}
      <div ref={bottomRef} />
    </div>
  );
}
