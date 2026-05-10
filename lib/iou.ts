const WEEK_MS = 7 * 86400 * 1000;
const k = Math.log(1.2); // 20% per week, continuous compounding

export function debtAt(now: number, principal: number, startedAt: number): number {
  const elapsed = Math.max(0, now - startedAt);
  return principal * Math.exp(k * elapsed / WEEK_MS);
}

export function projectDebt(
  principal: number,
  startedAt: number,
  days: number[],
): { day: number; amount: number }[] {
  return days.map(d => ({
    day: d,
    amount: principal * Math.exp(k * d / 7),
  }));
}

export function formatDebt(amount: number): string {
  if (amount < 1)    return `$${amount.toFixed(7)}`;
  if (amount < 1000) return `$${amount.toFixed(4)}`;
  if (amount < 1e6)  return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  if (amount < 1e9)  return `$${(amount / 1e6).toFixed(2)}M`;
  if (amount < 1e12) return `$${(amount / 1e9).toFixed(2)}B`;
  return `$${(amount / 1e12).toFixed(2)}T`;
}
