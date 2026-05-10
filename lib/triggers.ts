function isPrime(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
  return true;
}

export type Trigger = {
  id: string;
  label: string;
  detect: (a: number, b: number, r: number, op: string) => boolean;
  mult: number;
};

export const triggers: Trigger[] = [
  { id: 'prime',   label: 'prime number',  detect: (a, b, r) => isPrime(a) || isPrime(b) || isPrime(r), mult: 4   },
  { id: 'evenmul', label: 'both evens',    detect: (a, b, _r, op) => op === '×' && a % 2 === 0 && b % 2 === 0, mult: 2 },
  { id: 'big',     label: 'result > 1000', detect: (_a, _b, r) => Math.abs(r) > 1000,                   mult: 3   },
  { id: 'neg',     label: 'sadness fee',   detect: (_a, _b, r) => r < 0,                                mult: 5   },
  { id: 'seven',   label: 'lucky 7',       detect: (_a, _b, r) => String(r).includes('7'),              mult: 1.5 },
  { id: 'repeat',  label: 'pattern fee',   detect: (_a, _b, r) => /(\d)\1/.test(String(Math.abs(r))),   mult: 2   },
];

export function evaluateTriggers(a: number, b: number, r: number, op: string) {
  const hit = triggers.filter(t => t.detect(a, b, r, op));
  const mult = hit.reduce((m, t) => m * t.mult, 1);
  return { hit, mult };
}
