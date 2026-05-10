import Link from 'next/link';
import { clsx } from 'clsx';

const TIERS = [
  {
    id: 'pro',
    name: 'PRO',
    price: 49,
    features: ['+', '−', '×', '÷'],
    cta: 'Choose Pro',
    recommended: false,
  },
  {
    id: 'max',
    name: 'MAX',
    price: 199,
    features: ['Everything in Pro', '%, ±, decimals'],
    cta: 'Choose Max',
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    price: 2400,
    features: ['Everything in Max', 'SOC2 + SSO', 'The "=" key'],
    cta: 'Contact Sales',
    recommended: false,
  },
] as const;

export function PricingTiers() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="font-sans text-3xl font-semibold text-ink tracking-tight">
          Choose your plan
        </h1>
        <p className="mt-2 text-ink-soft text-sm">
          Continue calculating with Calculator 2026™
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            className={clsx(
              'relative rounded-2xl border bg-white p-7 flex flex-col',
              tier.recommended
                ? 'border-alarm shadow-lg ring-1 ring-alarm/20'
                : 'border-ink/10 shadow-sm',
            )}
          >
            {tier.recommended && (
              <span className="absolute -top-3.5 right-5 bg-alarm text-paper text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow">
                Recommended
              </span>
            )}

            <p className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-4">
              {tier.name}
            </p>

            <div className="flex items-end gap-1 mb-6">
              <span className="font-mono text-4xl font-bold text-ink leading-none">
                ${tier.price.toLocaleString()}
              </span>
              <span className="text-ink-soft text-sm mb-0.5">/mo</span>
            </div>

            <ul className="flex-1 space-y-2.5 mb-8">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-ink">
                  <span className="text-money font-mono mt-0.5">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href={`/paywall/checkout?tier=${tier.id}`}
              className={clsx(
                'block text-center py-3 rounded-full text-sm font-semibold transition-colors',
                tier.recommended
                  ? 'bg-alarm text-paper hover:bg-alarm/90'
                  : 'border border-ink/20 text-ink hover:bg-ink/5',
              )}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>

      <p className="text-center text-ink-soft text-xs mt-8">
        All plans billed monthly. Cancel anytime (47 steps).
      </p>
    </div>
  );
}

export default PricingTiers;
