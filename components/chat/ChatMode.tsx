"use client";
import { useEffect, useRef, useState } from "react";
import { useStore, ChatMessage } from "@/lib/state";
import ChatThread from "./ChatThread";
import ChatInput from "./ChatInput";
import Meters from "@/components/chrome/Meters";
import { RestartButton } from "@/components/chrome/RestartButton";
import TokensOutModal from "@/components/overlays/TokensOutModal";
import { emit } from "@/lib/events";

const MODELS = [
  { id: "gpt-4o-mini", label: "GPT-4o-mini", price: 0, free: true },
  { id: "claude-quantum-max", label: "Claude-Quantum-Max", price: 0.42 },
  { id: "gpt-premium-xl", label: "GPT-Premium-XL", price: 1.2 },
  { id: "o5-deep-think", label: "o5-deep-think 🏆", price: 14.0 },
];

const FIRST_TOKEN_THRESHOLD = 50_000;
const TOKEN_REPEAT_INTERVAL = 10_000;

export default function ChatMode() {
  const storedMessages = useStore((s) => s.chatMessages);
  const setChatMessages = useStore((s) => s.setChatMessages);
  const tokens = useStore((s) => s.tokens);
  const waterLiters = useStore((s) => s.waterLiters);

  const [messages, setMessages] = useState<ChatMessage[]>(storedMessages);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showTokensOut, setShowTokensOut] = useState(false);
  const tokenModalCount = useRef(0);

  // Sync to store whenever messages settle (not streaming)
  useEffect(() => {
    if (!pending) {
      setChatMessages(messages);
    }
  }, [pending, messages, setChatMessages]);

  // Token top-up modal threshold
  useEffect(() => {
    const nextThreshold =
      tokenModalCount.current === 0
        ? FIRST_TOKEN_THRESHOLD
        : FIRST_TOKEN_THRESHOLD + tokenModalCount.current * TOKEN_REPEAT_INTERVAL;
    if (tokens > nextThreshold) {
      tokenModalCount.current++;
      setShowTokensOut(true);
    }
  }, [tokens]);

  function isOneAndOne(s: string) {
    return /^\s*what\s+is\s+1\s*\+\s*1\s*\??\s*$/i.test(s);
  }

  async function send() {
    if (!input.trim() || pending) return;
    const userMsg: ChatMessage = { role: "user", content: input };
    const next = [...messages, userMsg];

    // Easter egg: "what is 1+1" three times in a row → skip API
    const userMsgs = next.filter((m) => m.role === "user");
    if (
      userMsgs.length >= 3 &&
      userMsgs.slice(-3).every((m) => isOneAndOne(m.content))
    ) {
      setMessages([
        ...next,
        { role: "assistant", content: "fine. it's 2." },
      ]);
      setInput("");
      return;
    }

    setMessages([...next, { role: "assistant", content: "", streaming: true }]);
    setInput("");
    setPending(true);

    let res: Response;
    try {
      res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
    } catch {
      setMessages((m) =>
        m.slice(0, -1).concat({
          role: "assistant",
          content: "⚠ Connection error. Check your API key.",
        })
      );
      setPending(false);
      return;
    }

    if (!res.ok || !res.body) {
      const errText = await res.text().catch(() => "Unknown error");
      setMessages((m) =>
        m.slice(0, -1).concat({
          role: "assistant",
          content: `⚠ AI ran out of tokens. Top up to continue.\n\n_${errText}_`,
        })
      );
      setPending(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      setMessages((m) => {
        const copy = [...m];
        const last = { ...copy[copy.length - 1] };
        last.content += chunk;
        copy[copy.length - 1] = last;
        return copy;
      });
      useStore.getState().bumpTokens(chunk.length);
    }

    setMessages((m) => {
      const copy = [...m];
      copy[copy.length - 1] = { ...copy[copy.length - 1], streaming: false };
      return copy;
    });
    setPending(false);
  }

  const currentModelLabel = MODELS.find((m) => m.id === selectedModel)?.label ?? "GPT-4o-mini";

  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-ink/10 bg-paper/80 backdrop-blur-sm shrink-0 relative z-30">
        <Meters tokens={tokens} waterLiters={waterLiters} />
        <RestartButton />

        {/* Model picker */}
        <div className="relative">
          <button
            id="model-picker"
            onClick={() => setShowModelPicker((v) => !v)}
            className="flex items-center gap-1 text-xs font-mono text-ink-soft border border-ink/15 rounded-lg px-2 py-1 hover:border-ai/40 transition-colors"
          >
            {currentModelLabel} <span className="text-[10px]">▾</span>
          </button>

          {showModelPicker && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-paper border border-ink/15 rounded-xl shadow-xl z-30 overflow-hidden">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setShowModelPicker(false);
                    setSelectedModel(m.id);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-sans hover:bg-ai/5 transition-colors flex justify-between items-center ${
                    selectedModel === m.id ? "bg-ai/10 text-ai" : "text-ink"
                  }`}
                >
                  <span>{m.label}</span>
                  {!m.free && (
                    <span className="text-ink-soft font-mono">${m.price}/calc</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message thread */}
      <ChatThread messages={messages} />

      {/* Input */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={send}
        disabled={pending}
      />

      {/* Tokens out modal */}
      {showTokensOut && (
        <TokensOutModal
          tokens={tokens}
          onTopUp={() => emit('berate.open', { amount: 9.99, reason: 'top-up', onAccept: () => setShowTokensOut(false) })}
          onDismiss={() => setShowTokensOut(false)}
        />
      )}

      {/* Click-outside to close model picker */}
      {showModelPicker && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setShowModelPicker(false)}
        />
      )}
    </div>
  );
}
