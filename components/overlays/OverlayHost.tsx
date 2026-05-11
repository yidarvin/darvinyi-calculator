"use client";
import { useEffect, useState } from 'react';
import { on, off } from '@/lib/events';
import { BeratePopup, BerateContext } from './BeratePopup';

export function OverlayHost() {
  const [berate, setBerate] = useState<Omit<BerateContext, 'onCancel'> | null>(null);

  useEffect(() => {
    const handler = (payload: Omit<BerateContext, 'onCancel'>) => setBerate(payload);
    on('berate.open', handler);
    return () => off('berate.open', handler);
  }, []);

  if (!berate) return null;

  return (
    <BeratePopup
      amount={berate.amount}
      reason={berate.reason}
      onAccept={() => { berate.onAccept(); setBerate(null); }}
      onCancel={() => setBerate(null)}
    />
  );
}

export default OverlayHost;
