"use client";
import Link from "next/link";
import { useStore } from "@/lib/state";

const PLAN_LABELS: Record<string, string> = {
  pro: "PRO — $49/mo",
  max: "MAX — $199/mo",
  enterprise: "ENTERPRISE — $2,400/mo",
};

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-ink/8 last:border-0">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-ink-soft mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
          checked ? "bg-ink" : "bg-ink/20"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function exportData() {
  const raw = localStorage.getItem("calc2026");
  if (!raw) return;
  const state = JSON.parse(raw);
  const cards = (state.state?.cardsAttempted ?? []) as Array<{
    ts: number;
    last4Hash: string;
    amount: number;
    context: string;
  }>;

  const rows = [
    ["timestamp", "last4_hash", "amount", "context"],
    ...cards.map((c) => [
      new Date(c.ts).toISOString(),
      c.last4Hash,
      c.amount.toFixed(2),
      c.context,
    ]),
  ];

  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "calculator2026-data.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function SettingsPage() {
  const plan = useStore((s) => s.plan);
  const flags = useStore((s) => s.flags);
  const stage = useStore((s) => s.stage);
  const setSoundEnabled = useStore((s) => s.setSoundEnabled);
  const setReduceMotion = useStore((s) => s.setReduceMotion);

  const displayName = flags.signupCompleted ? "Valued Customer" : null;

  return (
    <main className="min-h-dvh bg-paper">
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/"
            className="text-ink-soft text-sm hover:text-ink underline transition-colors"
          >
            ← Back
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-ink mb-8">Settings</h1>

        {/* Profile */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-soft mb-3">
            Profile
          </h2>
          <div className="bg-white border border-ink/10 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-ink/10 flex items-center justify-center text-lg">
                {displayName ? "🧮" : "👤"}
              </div>
              <div>
                <p className="text-sm font-medium text-ink">
                  {displayName ?? "Anonymous Calculator User"}
                </p>
                <p className="text-xs text-ink-soft">
                  {flags.signupCompleted
                    ? "Account verified (stage " + stage + ")"
                    : "No account — sign up to track your debt"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Plan */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-soft mb-3">
            Plan
          </h2>
          <div className="bg-white border border-ink/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">
                {plan ? PLAN_LABELS[plan] : "Free (10 calcs total)"}
              </p>
              {plan && (
                <p className="text-xs text-money mt-0.5">Active subscription</p>
              )}
            </div>
            <Link
              href="/paywall"
              className="text-xs font-medium text-ink-soft border border-ink/20 rounded-full px-3 py-1.5 hover:border-ink/40 transition-colors"
            >
              {plan ? "Change plan" : "Upgrade"}
            </Link>
          </div>
        </section>

        {/* Preferences */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-soft mb-3">
            Preferences
          </h2>
          <div className="bg-white border border-ink/10 rounded-2xl px-4">
            <Toggle
              label="Sound effects"
              description="Mechanical clicks, cha-ching, and alarm stings"
              checked={flags.soundEnabled}
              onChange={setSoundEnabled}
            />
            <Toggle
              label="Reduce motion"
              description="Disables spring animations and transitions"
              checked={flags.reduceMotion}
              onChange={setReduceMotion}
            />
          </div>
        </section>

        {/* Data */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-soft mb-3">
            Data
          </h2>
          <div className="bg-white border border-ink/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Export data</p>
                <p className="text-xs text-ink-soft">Download your card attempts as CSV</p>
              </div>
              <button
                onClick={exportData}
                className="text-xs font-medium text-ink-soft border border-ink/20 rounded-full px-3 py-1.5 hover:border-ink/40 transition-colors"
              >
                Download CSV
              </button>
            </div>
            <div className="border-t border-ink/8 pt-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">View receipts</p>
                <p className="text-xs text-ink-soft">All your near-payment attempts</p>
              </div>
              <Link
                href="/receipts"
                className="text-xs font-medium text-ink-soft border border-ink/20 rounded-full px-3 py-1.5 hover:border-ink/40 transition-colors"
              >
                View →
              </Link>
            </div>
          </div>
        </section>

        {/* Danger zone */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-alarm/70 mb-3">
            Danger Zone
          </h2>
          <div className="bg-white border border-alarm/20 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Delete account</p>
                <p className="text-xs text-ink-soft">
                  Permanently delete your account. (47 steps.)
                </p>
              </div>
              <Link
                href="/settings/delete"
                className="text-xs font-medium text-alarm border border-alarm/30 rounded-full px-3 py-1.5 hover:bg-alarm/5 transition-colors"
              >
                Delete →
              </Link>
            </div>
          </div>
        </section>

        <p className="mt-10 text-center text-[11px] text-ink-soft/40">
          Calculator 2026 v1.0.0 · No real money. No real PII. All satire.
        </p>
      </div>
    </main>
  );
}
