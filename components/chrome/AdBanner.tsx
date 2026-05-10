"use client";
import { useEffect, useState } from 'react';
import { ads, type AdUnit } from '@/lib/ads';
import { useStore } from '@/lib/state';

const SIZE_CLASSES: Record<AdUnit['size'], string> = {
  '728x90':  'w-[728px] h-[90px]',
  '320x50':  'w-[320px] h-[50px]',
  '300x250': 'w-[300px] h-[250px]',
  '100x100': 'w-[100px] h-[100px]',
  '160x600': 'w-[160px] h-[600px]',
};

export function AdBanner({ size }: { size: AdUnit['size'] }) {
  const adFree = useStore((s) => s.flags.adFree);
  const stage = useStore((s) => s.stage);
  const pool = ads.filter((a) => a.size === size);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (pool.length <= 1) return;
    const i = setInterval(() => setIdx((n) => (n + 1) % pool.length), 8000);
    return () => clearInterval(i);
  }, [pool.length]);

  if (adFree) return null;
  if (!['ads', 'ai'].includes(stage)) return null;
  if (pool.length === 0) return null;

  const ad = pool[idx % pool.length];

  return (
    <div
      className={`relative shrink-0 ${SIZE_CLASSES[size]} ${ad.bg} border border-ad/40 rounded flex flex-col items-center justify-center gap-0.5 overflow-hidden`}
      aria-label={`Advertisement: ${ad.headline}`}
    >
      <span className="absolute top-0.5 right-1 text-[9px] text-ink-soft/60 font-mono">Ad</span>
      <p className="font-bold text-ink text-xs text-center leading-tight px-2">{ad.headline}</p>
      {ad.sub && (
        <p className="text-ink-soft text-[10px] text-center leading-tight px-2">{ad.sub}</p>
      )}
      {ad.cta && (
        <button className="mt-1 text-[9px] uppercase tracking-widest bg-ad/20 text-ink px-2 py-0.5 rounded border border-ad/30 font-medium">
          {ad.cta}
        </button>
      )}
    </div>
  );
}

export default AdBanner;
