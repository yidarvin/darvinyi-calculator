'use client';
import { useStore } from '@/lib/state';

const SURGE_STAGES = new Set(['surge', 'premium', 'ads']);

export default function SurgeBanner() {
  const stage = useStore((s) => s.stage);
  const mult = useStore((s) => s.surgeMultiplier);

  if (!SURGE_STAGES.has(stage)) return null;

  // intensity 0→1 as multiplier goes 1.0→4.0
  const intensity = (mult - 1.0) / 3.0;
  const l = (0.52 + intensity * 0.08).toFixed(2);
  const c = (0.14 + intensity * 0.14).toFixed(2);

  return (
    <div
      id="surge-banner"
      className="w-full py-2 px-4 text-center text-white text-sm font-medium tracking-wide transition-[background-color] duration-700"
      style={{ backgroundColor: `oklch(${l} ${c} 30)` }}
    >
      🔥 SURGE:{' '}
      <span className="font-mono font-bold">{mult.toFixed(1)}×</span>
      {' '}— high demand right now
    </div>
  );
}
