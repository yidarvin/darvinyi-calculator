"use client";
import { KeyboardEvent } from "react";

type ChatInputProps = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
};

export default function ChatInput({ value, onChange, onSubmit, disabled }: ChatInputProps) {
  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="border-t border-ink/10 bg-paper px-4 py-3 flex gap-2 items-end">
      <textarea
        id="chat-input"
        className="flex-1 resize-none rounded-xl border border-ink/15 bg-white/60 px-3 py-2 text-sm font-sans text-ink placeholder:text-ink-soft focus:outline-none focus:ring-1 focus:ring-ai/40 min-h-[40px] max-h-[120px]"
        rows={1}
        placeholder="Ask anything… (e.g. what is 847 × 23)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        disabled={disabled}
      />
      <button
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        className="shrink-0 w-10 h-10 rounded-xl bg-ai text-white flex items-center justify-center disabled:opacity-40 hover:brightness-110 transition-all active:scale-95 font-bold"
        aria-label="Send"
      >
        →
      </button>
    </div>
  );
}
