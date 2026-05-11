"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { on, off } from '@/lib/events';
import { useStore } from '@/lib/state';
import { BeratePopup, BerateContext } from './BeratePopup';
import { ReviewNag } from './ReviewNag';
import { Captcha } from './Captcha';
import { SignupGauntlet } from './SignupGauntlet';
import { Referral } from './Referral';

export type OverlayKey =
  | 'berate'
  | 'review'
  | 'captcha'
  | 'signup'
  | 'referral'
  | 'video-ad'
  | 'cooldown'
  | 'buy-credits'
  | 'big-spender'
  | 'ad-free-upsell'
  | 'tokens-out';

export type OverlayPayload = { key: OverlayKey; props: Record<string, unknown> };

export function OverlayHost() {
  const [queue, setQueue] = useState<OverlayPayload[]>([]);
  const current = queue[0];
  const router = useRouter();
  const setCardGaveUp = useStore((s) => s.setCardGaveUp);

  function dismiss() {
    setQueue((q) => q.slice(1));
  }

  useEffect(() => {
    const pushHandler = (payload: OverlayPayload) =>
      setQueue((q) => [...q, payload]);
    on('overlay.open', pushHandler);

    // Berate preempts — insert at front
    const berateHandler = (payload: Omit<BerateContext, 'onCancel' | 'onGiveUp'>) =>
      setQueue((q) => [{ key: 'berate', props: payload as Record<string, unknown> }, ...q]);
    on('berate.open', berateHandler);

    return () => {
      off('overlay.open', pushHandler);
      off('berate.open', berateHandler);
    };
  }, []);

  if (!current) return null;

  if (current.key === 'berate') {
    const p = current.props as unknown as Omit<BerateContext, 'onCancel' | 'onGiveUp'>;
    return (
      <BeratePopup
        amount={p.amount}
        reason={p.reason}
        onCancel={dismiss}
        onGiveUp={() => {
          setCardGaveUp();
          dismiss();
          router.push('/paywall/iou');
        }}
      />
    );
  }

  if (current.key === 'review') {
    return <ReviewNag onClose={dismiss} />;
  }

  if (current.key === 'captcha') {
    const p = current.props as { onPass: () => void };
    return (
      <Captcha
        onPass={() => { p.onPass(); dismiss(); }}
      />
    );
  }

  if (current.key === 'signup') {
    return <SignupGauntlet onClose={dismiss} />;
  }

  if (current.key === 'referral') {
    return <Referral onClose={dismiss} />;
  }

  return null;
}

export default OverlayHost;
