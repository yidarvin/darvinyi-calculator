"use client";
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/state';
import { tours } from '@/lib/tours';
import { Tour } from './Tour';

export function TourHost() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const stage = useStore((s) => s.stage);
  const done = useStore((s) => s.flags.onboardingDone[stage]);
  const markDone = useStore((s) => s.markOnboardingDone);
  const steps = tours[stage];

  if (!mounted || done || !steps) return null;
  return <Tour steps={steps} onDone={() => markDone(stage)} />;
}
