"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/state';
import { isLuhnValid, isPlausibleExpiry, hashLast4 } from '@/lib/luhn';
import { BeratePopupStub } from '@/components/overlays/BeratePopup';

const TIER_PRICES: Record<string, number> = { pro: 49, max: 199, enterprise: 2400 };
const TIER_NAMES: Record<string, string> = { pro: 'PRO', max: 'MAX', enterprise: 'ENTERPRISE' };

type Tier = 'pro' | 'max' | 'enterprise';

export function StripeForm({ tier }: { tier: Tier }) {
  const router = useRouter();
  const { recordCardAttempt, advance, setPlan } = useStore();

  const price = TIER_PRICES[tier];
  const tierName = TIER_NAMES[tier];

  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [country, setCountry] = useState('US');
  const [zip, setZip] = useState('');
  const [cardError, setCardError] = useState<string | null>(null);
  const [showBerate, setShowBerate] = useState(false);

  function onCardChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
    setCardNumber(digits.replace(/(.{4})/g, '$1 ').trim());
    setCardError(null);
  }

  function onExpiryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    setExpiry(digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits);
  }

  function handlePay(e: React.FormEvent) {
    e.preventDefault();
    const raw = cardNumber.replace(/\s/g, '');
    if (!isLuhnValid(raw)) {
      setCardError('Your card number is invalid.');
      return;
    }
    if (!isPlausibleExpiry(expiry)) {
      setCardError('Your card expiration date is invalid.');
      return;
    }
    recordCardAttempt({ last4Hash: hashLast4(raw), amount: price, context: 'subscribe' });
    setShowBerate(true);
  }

  function handleCharge() {
    setShowBerate(false);
    setPlan(tier);
    advance('surge');
    router.push('/');
  }

  const inputClass =
    'w-full border border-ink/20 rounded-lg px-3 py-2.5 text-sm bg-white placeholder:text-ink/30 focus:outline-none focus:border-ink/50 transition-colors';

  return (
    <>
      <div className="min-h-dvh flex items-start justify-center pt-10 pb-24 px-4">
        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-[1fr_280px] gap-10 sm:gap-16">

          {/* Left — payment form */}
          <div>
            <p className="text-ink-soft text-xs mb-1">
              <Link href="/paywall" className="hover:text-ink underline">← Plans</Link>
            </p>
            <h1 className="font-sans text-xl font-semibold text-ink mb-6">
              Pay ${price.toLocaleString()}.00
            </h1>

            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-ink-soft mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-ink-soft mb-1.5">Card number</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={onCardChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className={`${inputClass} font-mono ${cardError ? 'border-alarm focus:border-alarm' : ''}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-ink-soft mb-1.5">MM / YY</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={expiry}
                    onChange={onExpiryChange}
                    placeholder="MM / YY"
                    maxLength={7}
                    className={`${inputClass} font-mono`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-ink-soft mb-1.5">CVC</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    maxLength={4}
                    className={`${inputClass} font-mono`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-ink-soft mb-1.5">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={inputClass}
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="JP">Japan</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-ink-soft mb-1.5">ZIP</label>
                  <input
                    type="text"
                    value={zip}
                    onChange={(e) => setZip(e.target.value.slice(0, 10))}
                    placeholder="10001"
                    className={`${inputClass} font-mono`}
                  />
                </div>
              </div>

              {cardError && (
                <p className="text-alarm text-sm">{cardError}</p>
              )}

              <button
                type="submit"
                className="w-full bg-alarm text-paper rounded-lg py-3 font-semibold text-sm hover:bg-alarm/90 transition-colors"
              >
                Pay ${price.toLocaleString()}.00
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-ink/10" />
              </div>
              <div className="relative flex justify-center text-xs text-ink-soft">
                <span className="bg-paper px-3 italic">or, skip the card —</span>
              </div>
            </div>

            {/* IOU CTA — visually louder */}
            <div className="relative">
              <span className="absolute -top-3 right-4 z-10 bg-money text-paper text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm">
                recommended
              </span>
              <Link
                href="/paywall/iou"
                className="relative block w-full text-center bg-money text-paper rounded-xl py-4 px-4 font-bold text-base hover:bg-money/90 transition-colors shadow"
              >
                📝 Pay later with IOU™
              </Link>
            </div>
            <p className="text-center text-ink-soft text-xs mt-2">
              0% down. Pay it off whenever.
            </p>
          </div>

          {/* Right — order summary */}
          <div className="sm:pt-8 text-sm">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-1">
              Calculator 2026™
            </p>
            <p className="font-semibold text-ink text-base mb-1">{tierName} Plan</p>
            <p className="text-ink-soft text-xs">Billed monthly</p>

            <div className="mt-5 border-t border-ink/10 pt-4 space-y-2">
              <div className="flex justify-between text-ink-soft">
                <span>Subtotal</span>
                <span className="font-mono text-ink">${price.toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>Tax</span>
                <span className="font-mono text-ink">$0.00</span>
              </div>
              <div className="flex justify-between font-semibold text-ink pt-2 border-t border-ink/10">
                <span>Total due today</span>
                <span className="font-mono">${price.toLocaleString()}.00</span>
              </div>
            </div>

            <p className="text-ink-soft text-[10px] mt-4 leading-relaxed">
              Renews monthly. Cancel anytime (only 47 steps, most are optional*).
              <br />
              <span className="italic">*they are not optional</span>
            </p>
          </div>

        </div>
      </div>

      {showBerate && (
        <BeratePopupStub
          amount={price}
          onClose={() => setShowBerate(false)}
          onCharge={handleCharge}
        />
      )}
    </>
  );
}

export default StripeForm;
