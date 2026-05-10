'use client';
import { clsx } from 'clsx';

export function Display({ value }: { value: string }) {
  const len = value.length;

  return (
    <div className="bg-ink rounded-2xl px-5 pt-5 pb-6 mb-4 flex items-end justify-end min-h-[96px]">
      <span
        className={clsx(
          'font-mono leading-none select-none tracking-tight',
          value === 'Error' ? 'text-[#d07070]' : 'text-paper',
          len <= 7 && 'text-[3rem]',
          len > 7 && len <= 9 && 'text-[2.4rem]',
          len > 9 && len <= 11 && 'text-[1.9rem]',
          len > 11 && 'text-[1.5rem]',
        )}
      >
        {value}
      </span>
    </div>
  );
}
