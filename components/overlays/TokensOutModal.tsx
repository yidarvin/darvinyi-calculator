"use client";

type TokensOutModalProps = {
  tokens: number;
  onTopUp: () => void;
  onDismiss: () => void;
};

const TIERS = [
  { label: "100k tokens", price: "$9.99" },
  { label: "1M tokens", price: "$79.99", recommended: true },
  { label: "∞ tokens", price: "$499/mo" },
];

export default function TokensOutModal({ tokens, onTopUp, onDismiss }: TokensOutModalProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm">
      <div className="bg-paper border border-ink/15 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <h2 className="font-sans text-lg font-semibold text-ink">
          You&apos;ve used{" "}
          <span className="text-ai font-mono">{tokens.toLocaleString()}</span>{" "}
          tokens this session.
        </h2>
        <p className="mt-2 text-sm text-ink-soft font-sans">
          Top up to continue calculating:
        </p>

        <div className="mt-4 space-y-2">
          {TIERS.map((tier) => (
            <button
              key={tier.label}
              onClick={onTopUp}
              className="w-full flex justify-between items-center px-4 py-3 rounded-xl border border-ink/10 hover:border-ai/40 hover:bg-ai/5 transition-all text-sm font-sans"
            >
              <span className="text-ink font-medium">
                {tier.label}
                {tier.recommended && (
                  <span className="ml-2 text-[10px] uppercase tracking-wider bg-ai text-white rounded px-1.5 py-0.5">
                    recommended
                  </span>
                )}
              </span>
              <span className="text-ink-soft font-mono">{tier.price}</span>
            </button>
          ))}
        </div>

        <button
          onClick={onDismiss}
          className="mt-4 w-full text-center text-xs text-ink-soft hover:text-ink transition-colors py-2"
        >
          I&apos;ll be quick
        </button>
      </div>
    </div>
  );
}
