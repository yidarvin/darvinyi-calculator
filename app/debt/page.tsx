"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useStore } from '@/lib/state';
import { debtAt, projectDebt, formatDebt } from '@/lib/iou';

const ALL_DAYS = Array.from({ length: 366 }, (_, i) => i);

function formatY(v: number): string {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v.toFixed(2)}`;
}

export default function DebtPage() {
  const debt = useStore(s => s.debt);
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!debt) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
        <p className="text-ink-soft text-sm">No debt on file. Yet.</p>
        <Link href="/" className="mt-4 text-xs underline text-ink-soft hover:text-ink">← Back to calculator</Link>
      </main>
    );
  }

  const currentAmount = debtAt(now, debt.principal, debt.startedAt);
  const elapsedDays = (now - debt.startedAt) / 86400000;
  const chartDays = elapsedDays > 365 ? Math.ceil(elapsedDays + 30) : 365;
  const chartPoints = Array.from({ length: chartDays + 1 }, (_, i) => i);
  const data = projectDebt(debt.principal, debt.startedAt, chartPoints).map(({ day, amount }) => ({
    day,
    amount,
  }));

  const stats = [
    { label: 'Day 1',   value: formatDebt(projectDebt(debt.principal, debt.startedAt, [1])[0].amount),   color: 'text-ink' },
    { label: 'Day 7',   value: formatDebt(projectDebt(debt.principal, debt.startedAt, [7])[0].amount),   color: 'text-ink' },
    { label: 'Day 30',  value: formatDebt(projectDebt(debt.principal, debt.startedAt, [30])[0].amount),  color: 'text-money' },
    { label: 'Year 1',  value: formatDebt(projectDebt(debt.principal, debt.startedAt, [365])[0].amount), color: 'text-alarm' },
  ];

  const twitterText = encodeURIComponent(
    `I owe a calculator ${formatDebt(currentAmount)} at 20%/week compounding interest. Send help.`,
  );

  return (
    <main className="min-h-dvh bg-paper px-4 py-12 max-w-2xl mx-auto">
      <Link href="/" className="text-ink-soft text-xs hover:text-ink underline transition-colors">
        ← Back to calculator
      </Link>

      <h1 className="mt-6 font-sans text-3xl font-bold text-ink">Your Calc-Karma™</h1>

      <p
        className="mt-3 text-ink-soft text-sm leading-relaxed max-w-md"
        style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}
      >
        You borrowed $0.01 from a calculator. Now you owe{' '}
        <span className="text-money font-semibold not-italic font-mono">{formatDebt(currentAmount)}</span>.
        {' '}The math does not lie. The math has never lied. The math is the only honest thing left.
      </p>

      {/* Current amount display */}
      <div className="mt-6 mb-8 p-4 border-2 border-money rounded-xl inline-block">
        <p className="text-[10px] uppercase tracking-widest text-ink-soft mb-1">Currently owed</p>
        <p className="font-mono text-2xl font-bold text-money tabular-nums">{formatDebt(currentAmount)}</p>
      </div>

      {/* Chart */}
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,22,18,0.08)" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: '#6b6357' }}
              tickFormatter={(d: number) => `Day ${d}`}
              interval={Math.floor(chartPoints.length / 6)}
            />
            <YAxis
              scale="log"
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: '#6b6357' }}
              tickFormatter={formatY}
              width={64}
            />
            <Tooltip
              formatter={(v) => [formatDebt(Number(v)), 'Debt']}
              labelFormatter={(d) => `Day ${d}`}
              contentStyle={{ fontSize: 12, background: '#fbf9f4', border: '1px solid rgba(26,22,18,0.15)' }}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#3a7044"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#3a7044' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats grid */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="border border-ink/10 rounded-xl p-4 text-center">
            <p className="text-[10px] uppercase tracking-widest text-ink-soft mb-1">{label}</p>
            <p className={`font-mono font-bold text-base tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Share */}
      <div className="mt-8">
        <a
          href={`https://twitter.com/intent/tweet?text=${twitterText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block border border-ink/20 rounded-full px-5 py-2 text-sm text-ink-soft hover:text-ink hover:border-ink/40 transition-colors"
        >
          Share to Twitter →
        </a>
      </div>
    </main>
  );
}
