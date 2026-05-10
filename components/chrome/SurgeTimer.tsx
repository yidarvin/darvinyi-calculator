'use client';
import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/state';
import { tickSurge } from '@/lib/surge';

const SURGE_STAGES = new Set(['surge', 'premium', 'ads', 'ai']);

export function SurgeTimer() {
  const stage = useStore((s) => s.stage);
  const setSurge = useStore((s) => s.setSurge);
  const multiplierRef = useRef(useStore.getState().surgeMultiplier);

  useEffect(() => {
    return useStore.subscribe((s) => {
      multiplierRef.current = s.surgeMultiplier;
    });
  }, []);

  useEffect(() => {
    if (!SURGE_STAGES.has(stage)) return;
    const id = setInterval(() => {
      setSurge(tickSurge(multiplierRef.current));
    }, 15_000);
    return () => clearInterval(id);
  }, [stage, setSurge]);

  return null;
}
