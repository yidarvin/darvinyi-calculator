export type CalcState = {
  display: string;
  pending: number | null;
  op: '+' | '−' | '×' | '÷' | null;
  justComputed: boolean;
  waitingForOperand: boolean;
};

export const initial: CalcState = {
  display: '0',
  pending: null,
  op: null,
  justComputed: false,
  waitingForOperand: false,
};

const OPS = ['+', '−', '×', '÷'] as const;
type Op = (typeof OPS)[number];

function formatResult(n: number): string {
  if (!isFinite(n) || isNaN(n)) return 'Error';
  const s = n.toString();
  if (s.length <= 12) return s;
  for (let p = 8; p >= 0; p--) {
    const f = parseFloat(n.toFixed(p)).toString();
    if (f.length <= 12) return f;
  }
  return n.toExponential(4).slice(0, 12);
}

function evaluate(a: number, op: Op, b: number): number | null {
  switch (op) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? null : a / b;
  }
}

export function press(
  state: CalcState,
  key: string,
): { state: CalcState; computed?: { a: number; b: number; r: number; op: string } } {
  const s = state;

  if (key === 'AC') return { state: initial };

  if (key === '±') {
    if (s.display === 'Error') return { state: s };
    return { state: { ...s, display: formatResult(-parseFloat(s.display)), justComputed: false } };
  }

  if (key === '%') {
    if (s.display === 'Error') return { state: s };
    return { state: { ...s, display: formatResult(parseFloat(s.display) / 100), justComputed: false } };
  }

  if (OPS.includes(key as Op)) {
    if (s.display === 'Error') return { state: s };
    const newOp = key as Op;
    const n = parseFloat(s.display);

    // Left-to-right chaining: evaluate existing op before accepting a new one
    if (s.op !== null && !s.waitingForOperand && !s.justComputed && s.pending !== null) {
      const r = evaluate(s.pending, s.op, n);
      if (r === null) {
        return { state: { display: 'Error', pending: null, op: null, justComputed: true, waitingForOperand: false } };
      }
      return {
        state: { display: formatResult(r), pending: r, op: newOp, justComputed: false, waitingForOperand: true },
      };
    }

    return {
      state: { display: s.display, pending: n, op: newOp, justComputed: false, waitingForOperand: true },
    };
  }

  if (key === '=') {
    if (s.op === null || s.pending === null || s.display === 'Error') return { state: s };
    const a = s.pending;
    const b = parseFloat(s.display);
    const r = evaluate(a, s.op, b);
    if (r === null) {
      return { state: { ...s, display: 'Error', pending: null, op: null, justComputed: true, waitingForOperand: false } };
    }
    return {
      state: { display: formatResult(r), pending: r, op: null, justComputed: true, waitingForOperand: false },
      computed: { a, b, r, op: s.op },
    };
  }

  if (key === '.') {
    if (s.justComputed || s.waitingForOperand) {
      return { state: { ...s, display: '0.', justComputed: false, waitingForOperand: false } };
    }
    if (s.display.includes('.')) return { state: s };
    const nd = s.display + '.';
    if (nd.length > 12) return { state: s };
    return { state: { ...s, display: nd } };
  }

  if (/^\d$/.test(key)) {
    if (s.display === 'Error') {
      return { state: { ...initial, display: key === '0' ? '0' : key } };
    }
    if (s.justComputed || s.waitingForOperand) {
      return { state: { ...s, display: key, justComputed: false, waitingForOperand: false } };
    }
    const nd = s.display === '0' ? key : s.display + key;
    if (nd.length > 12) return { state: s };
    return { state: { ...s, display: nd } };
  }

  return { state: s };
}
