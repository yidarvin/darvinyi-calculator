// Tiny pub-sub event bus for overlay triggers.
//
// Event names:
//   calc.success     — a calculation completed (payload: { a, b, op, result })
//   stage.advance    — stage transition (payload: Stage)
//   card.submit      — Luhn-valid card submitted (payload: CardAttempt-like)
//   idle.30s         — user has been idle 30s (no payload)
//   interaction      — any key press (no payload)
//   overlay.show     — overlay requested (payload: { id, props })
//   overlay.dismiss  — overlay dismissed (payload: { id })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (payload?: any) => void;
const listeners = new Map<string, Set<Handler>>();

export function on(event: string, h: Handler): void {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(h);
}

export function off(event: string, h: Handler): void {
  listeners.get(event)?.delete(h);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function emit(event: string, payload?: any): void {
  listeners.get(event)?.forEach((h) => h(payload));
}
