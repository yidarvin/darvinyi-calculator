'use client';
import { clsx } from 'clsx';

interface Props {
  uses: number;
  onUpgrade: () => void;
}

export function FreeTrialBanner({ uses, onUpgrade }: Props) {
  if (uses === 0) return null;
  const remaining = Math.max(0, 10 - uses);
  const variant = uses <= 6 ? 'soft' : 'warn';

  return (
    <div
      className={clsx(
        'mt-3 rounded-lg px-3 py-2 text-center text-sm font-mono',
        variant === 'soft' && 'bg-paper text-ink-soft border border-ink-soft/20',
        variant === 'warn' && 'bg-alarm/10 text-alarm border border-alarm/40',
      )}
    >
      {variant === 'soft' && <>{remaining} free uses left</>}
      {variant === 'warn' && (
        <>
          ⚠ Only <b>{remaining}</b> calculation{remaining !== 1 ? 's' : ''} remaining.{' '}
          <button className="underline font-medium" onClick={onUpgrade}>
            Upgrade
          </button>
        </>
      )}
    </div>
  );
}
