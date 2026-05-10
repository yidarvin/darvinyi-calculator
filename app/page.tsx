'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CalcPad } from '@/components/calculator/CalcPad';
import { useStore } from '@/lib/state';

export default function Home() {
  const router = useRouter();
  const stage = useStore((s) => s.stage);

  useEffect(() => {
    if (stage === 'paywall') router.replace('/paywall');
  }, [stage, router]);

  if (stage === 'paywall') return null;

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6">
      <header className="mb-8 text-center">
        <h1 className="font-sans text-2xl font-medium tracking-tight text-ink">
          Calculator 2026
        </h1>
      </header>
      <CalcPad />
    </main>
  );
}
