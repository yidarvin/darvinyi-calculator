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

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
};

export type State = {
  stage: Stage;
  uses: number;
  interactions: number;
  credits: number;
  tokens: number;
  waterLiters: number;
  surgeMultiplier: number;
  surgeCalcs: number;
  premiumTriggerCount: number;
  videoAdsDismissed: number;
  debt: { principal: number; startedAt: number } | null;
  plan: "pro" | "max" | "enterprise" | null;
  flags: {
    adFree: boolean;
    captchaPassed: boolean;
    cookiesAccepted: boolean;
    onboardingDone: Partial<Record<Stage, boolean>>;
    signupCompleted: boolean;
    lastCertShared: boolean;
    achievements: string[];
  };
  cardsAttempted: CardAttempt[];
  chatMessages: ChatMessage[];
};

type Actions = {
  bumpUses: () => void;
  bumpInteractions: () => void;
  advance: (s: Stage) => void;
  addCredits: (n: number) => void;
  spendCredits: (n: number) => void;
  setSurge: (n: number) => void;
  incrementSurgeCalcs: () => void;
  addPremiumTriggers: (n: number) => void;
  incrementVideoAdsDismissed: () => void;
  setAdFree: () => void;
  setDebt: (principal: number) => void;
  setPlan: (p: "pro" | "max" | "enterprise") => void;
  recordCardAttempt: (a: Omit<CardAttempt, "ts">) => void;
  markOnboardingDone: (s: Stage) => void;
  markCertShared: () => void;
  addToDebt: (amount: number) => void;
  bumpTokens: (n: number) => void;
  setChatMessages: (msgs: ChatMessage[]) => void;
  setCaptchaPassed: () => void;
  setSignupCompleted: () => void;
  setCookiesAccepted: () => void;
  addAchievement: (id: string) => void;
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
  surgeCalcs: 0,
  premiumTriggerCount: 0,
  videoAdsDismissed: 0,
  debt: null,
  plan: null,
  flags: {
    adFree: false,
    captchaPassed: false,
    cookiesAccepted: false,
    onboardingDone: {},
    signupCompleted: false,
    lastCertShared: false,
    achievements: [],
  },
  cardsAttempted: [],
  chatMessages: [],
};

export const useStore = create<State & Actions>()(
  persist(
    (set) => ({
      ...initialState,

      bumpUses: () => set((s) => ({ uses: s.uses + 1 })),

      bumpInteractions: () =>
        set((s) => ({ interactions: s.interactions + 1 })),

      advance: (stage) =>
        set((s) => {
          const patch: Partial<State> = { stage };
          if (stage === "surge") {
            patch.credits = 100;
            patch.surgeCalcs = 0;
          }
          if (stage === "premium") {
            patch.premiumTriggerCount = 0;
          }
          return patch;
        }),

      addCredits: (n) => set((s) => ({ credits: s.credits + n })),

      spendCredits: (n) =>
        set((s) => ({ credits: Math.max(0, s.credits - n) })),

      setSurge: (n) => set({ surgeMultiplier: n }),

      incrementSurgeCalcs: () =>
        set((s) => ({ surgeCalcs: s.surgeCalcs + 1 })),

      addPremiumTriggers: (n) =>
        set((s) => ({ premiumTriggerCount: s.premiumTriggerCount + n })),

      incrementVideoAdsDismissed: () =>
        set((s) => ({ videoAdsDismissed: s.videoAdsDismissed + 1 })),

      setAdFree: () =>
        set((s) => ({ flags: { ...s.flags, adFree: true } })),

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

      markCertShared: () =>
        set((s) => ({ flags: { ...s.flags, lastCertShared: true } })),

      addToDebt: (amount) =>
        set((s) => {
          if (s.debt) {
            const now = Date.now();
            const elapsed = Math.max(0, now - s.debt.startedAt);
            const current = s.debt.principal * Math.exp(Math.log(1.2) * elapsed / (7 * 86400 * 1000));
            return { debt: { principal: current + amount, startedAt: now } };
          }
          return { debt: { principal: amount, startedAt: Date.now() } };
        }),

      bumpTokens: (n) =>
        set((s) => ({
          tokens: s.tokens + n,
          waterLiters: +((s.tokens + n) * 0.0009).toFixed(2),
        })),

      setChatMessages: (msgs) => set({ chatMessages: msgs }),

      setCaptchaPassed: () =>
        set((s) => ({ flags: { ...s.flags, captchaPassed: true } })),

      setSignupCompleted: () =>
        set((s) => ({ flags: { ...s.flags, signupCompleted: true } })),

      setCookiesAccepted: () =>
        set((s) => ({ flags: { ...s.flags, cookiesAccepted: true } })),

      addAchievement: (id) =>
        set((s) => ({
          flags: {
            ...s.flags,
            achievements: s.flags.achievements.includes(id)
              ? s.flags.achievements
              : [...s.flags.achievements, id],
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
