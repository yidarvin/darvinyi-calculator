'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/lib/state';
import { submitCard } from '@/lib/cardSubmit';

type Pack = { credits: number; price: number; label: string; badge?: string };

const PACKS: Pack[] = [
  { credits: 100,   price: 9.99,  label: '100 credits' },
  { credits: 1000,  price: 89.99, label: '1,000 credits', badge: '10% off' },
  { credits: Infinity, price: 0, label: '∞ credits' },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function BuyCredits({ open, onClose }: Props) {
  const { addCredits, addToDebt } = useStore();
  const [selected, setSelected] = useState(0);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardError, setCardError] = useState<string | null>(null);
  const [showEnterprise, setShowEnterprise] = useState(false);

  const pack = PACKS[selected];

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
    if (pack.credits === Infinity) {
      setShowEnterprise(true);
      return;
    }
    const result = submitCard(
      { number: cardNumber, expiry, amount: pack.price, context: 'top-up' },
      () => {
        addCredits(pack.credits);
        onClose();
      }
    );
    if (!result.ok) setCardError(result.error);
  }

  function resetForm() {
    setCardNumber(''); setExpiry(''); setCvc(''); setCardError(null);
    setShowEnterprise(false);
  }

  function handleClose() { resetForm(); onClose(); }

  function handleIOU() {
    addToDebt(pack.credits === Infinity ? 999 : pack.price);
    addCredits(pack.credits === Infinity ? 99999 : pack.credits);
    resetForm();
    onClose();
  }

  const inputClass =
    'w-full border border-ink/20 rounded-lg px-3 py-2.5 text-sm bg-white placeholder:text-ink/30 focus:outline-none focus:border-ink/50 transition-colors';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="buy-credits-backdrop"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-paper rounded-2xl p-6 w-full max-w-sm mx-4 mb-8 sm:mb-0 shadow-2xl"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-sans text-lg font-semibold text-ink">Buy credits</h2>
              <button onClick={handleClose} className="text-ink-soft hover:text-ink text-xl leading-none">×</button>
            </div>
            <p className="text-ink-soft text-sm mb-4">You need more credits to keep calculating.</p>

            {/* Pack selector */}
            <div className="flex flex-col gap-2 mb-5">
              {PACKS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`relative flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${
                    selected === i
                      ? 'border-ink bg-ink/5 text-ink'
                      : 'border-ink/15 text-ink-soft hover:border-ink/30'
                  }`}
                >
                  <span className="font-medium">{p.label}</span>
                  <span className="flex items-center gap-2">
                    {p.badge && (
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-money text-paper rounded-full px-2 py-0.5">
                        {p.badge}
                      </span>
                    )}
                    {p.credits === Infinity ? (
                      <span className="font-mono text-ink-soft">Contact sales</span>
                    ) : (
                      <span className="font-mono">${p.price}</span>
                    )}
                  </span>
                </button>
              ))}
            </div>

            {pack.credits === Infinity ? (
              <button
                onClick={() => setShowEnterprise(true)}
                className="w-full bg-ink text-paper rounded-full py-3 font-semibold text-sm hover:bg-ink/80 transition-colors"
              >
                Contact sales
              </button>
            ) : (
              <form onSubmit={handlePay} className="space-y-3">
                <div>
                  <input
                    type="text" inputMode="numeric"
                    value={cardNumber} onChange={onCardChange}
                    placeholder="Card number" maxLength={19}
                    className={`${inputClass} font-mono ${cardError ? 'border-alarm' : ''}`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text" inputMode="numeric"
                    value={expiry} onChange={onExpiryChange}
                    placeholder="MM / YY" maxLength={7}
                    className={`${inputClass} font-mono`}
                  />
                  <input
                    type="text" inputMode="numeric"
                    value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="CVC" maxLength={4}
                    className={`${inputClass} font-mono`}
                  />
                </div>
                {cardError && <p className="text-alarm text-xs">{cardError}</p>}
                <button
                  type="submit"
                  className="w-full bg-ink text-paper rounded-full py-3 font-semibold text-sm hover:bg-ink/80 transition-colors"
                >
                  Buy {pack.label} — ${pack.price}
                </button>
              </form>
            )}

            {/* IoU divider + CTA */}
            {pack.credits !== Infinity && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-ink/10" />
                  </div>
                  <div className="relative flex justify-center text-xs text-ink-soft">
                    <span className="bg-paper px-3 italic">or, skip the card —</span>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute -top-3 right-4 z-10 bg-money text-paper text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm">
                    recommended
                  </span>
                  <button
                    type="button"
                    onClick={handleIOU}
                    className="w-full bg-money text-paper rounded-xl py-3.5 px-4 font-bold text-sm hover:bg-money/90 transition-colors shadow"
                  >
                    📝 Pay with IOU™ — add ${pack.price} to your tab
                  </button>
                </div>
              </>
            )}
          </motion.div>

          {/* Enterprise fake modal */}
          {showEnterprise && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-ink/60 backdrop-blur-sm">
              <div className="bg-paper rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
                <h3 className="font-sans text-base font-semibold text-ink mb-2">Talk to Sales</h3>
                <p className="text-ink-soft text-sm mb-4">Our enterprise team will reach out within 3–5 business decades.</p>
                <input className={inputClass} placeholder="Work email" type="email" />
                <input className={`${inputClass} mt-2`} placeholder="Company name" />
                <input className={`${inputClass} mt-2`} placeholder="Number of calculators needed" />
                <button
                  className="mt-4 w-full bg-ink text-paper rounded-full py-3 font-semibold text-sm"
                  onClick={() => { setShowEnterprise(false); handleClose(); }}
                >
                  Submit (we&apos;ll be in touch never)
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

    </AnimatePresence>
  );
}
