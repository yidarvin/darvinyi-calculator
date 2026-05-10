export function tickSurge(prev: number): number {
  const next = prev + (Math.random() - 0.5) * 0.6;
  return Math.max(1.0, Math.min(4.0, next));
}
