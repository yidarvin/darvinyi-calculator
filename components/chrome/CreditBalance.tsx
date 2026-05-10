'use client';
import { useStore } from '@/lib/state';

const CREDIT_STAGES = new Set(['surge', 'premium', 'ads', 'ai']);

export default function CreditBalance() {
  const stage = useStore((s) => s.stage);
  const credits = useStore((s) => s.credits);

  if (!CREDIT_STAGES.has(stage)) return null;

  return (
    <div className="font-mono text-sm text-ink-soft border border-ink/10 rounded-full px-3 py-1 bg-paper tabular-nums">
      🪙 {credits.toLocaleString()}
    </div>
  );
}
