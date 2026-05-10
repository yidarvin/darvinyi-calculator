"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Stage =
  | "free"
  | "paywall"
  | "iou"
  | "surge"
  | "premium"
  | "ads"
  | "ai";

export type CardAttempt = {
  ts: number;
  last4Hash: string; // sha256(last4).slice(0,8) — never raw digits
  amount: number;
  context: "subscribe" | "iou-payoff" | "ad-free" | "top-up";
};

export type State = {
  stage: Stage;
  uses: number;
  interactions: number;
  credits: number;
  tokens: number;
  waterLiters: number;
  surgeMultiplier: number;
  debt: { principal: number; startedAt: number } | null;
  plan: "pro" | "max" | "enterprise" | null;
  flags: {
    adFree: boolean;
    captchaPassed: boolean;
    onboardingDone: Partial<Record<Stage, boolean>>;
    signupCompleted: boolean;
  };
  cardsAttempted: CardAttempt[];
};

type Actions = {
  bumpUses: () => void;
  bumpInteractions: () => void;
  advance: (s: Stage) => void;
  addCredits: (n: number) => void;
  spendCredits: (n: number) => void;
  setDebt: (principal: number) => void;
  setPlan: (p: "pro" | "max" | "enterprise") => void;
  recordCardAttempt: (a: Omit<CardAttempt, "ts">) => void;
  markOnboardingDone: (s: Stage) => void;
  reset: () => void;
};

const initialState: State = {
  stage: "free",
  uses: 0,
  interactions: 0,
  credits: 0,
  tokens: 0,
  waterLiters: 0,
  surgeMultiplier: 1.0,
  debt: null,
  plan: null,
  flags: {
    adFree: false,
    captchaPassed: false,
    onboardingDone: {},
    signupCompleted: false,
  },
  cardsAttempted: [],
};

export const useStore = create<State & Actions>()(
  persist(
    (set) => ({
      ...initialState,

      bumpUses: () => set((s) => ({ uses: s.uses + 1 })),

      bumpInteractions: () =>
        set((s) => ({ interactions: s.interactions + 1 })),

      advance: (stage) => set({ stage }),

      addCredits: (n) => set((s) => ({ credits: s.credits + n })),

      spendCredits: (n) =>
        set((s) => ({ credits: Math.max(0, s.credits - n) })),

      setDebt: (principal) =>
        set({ debt: { principal, startedAt: Date.now() } }),

      setPlan: (plan) => set({ plan }),

      recordCardAttempt: (a) =>
        set((s) => ({
          cardsAttempted: [...s.cardsAttempted, { ...a, ts: Date.now() }],
        })),

      markOnboardingDone: (stage) =>
        set((s) => ({
          flags: {
            ...s.flags,
            onboardingDone: { ...s.flags.onboardingDone, [stage]: true },
          },
        })),

      reset: () => set(initialState),
    }),
    {
      name: "calc2026",
      storage: createJSONStorage(() => {
        // SSR-safe: return a no-op storage during server render
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
    }
  )
);
