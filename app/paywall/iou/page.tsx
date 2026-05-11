"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/state';
import { SignaturePad } from '@/components/paywall/SignaturePad';

const LEGAL_TEXT = `CALCULATOR 2026 IOU FINANCIAL INSTRUMENT — TERMS AND CONDITIONS

This IOU Agreement ("Agreement") constitutes a legally binding financial obligation between you ("Borrower") and Calculator 2026 Financial Inc., a Delaware corporation registered at 1600 Arithmetic Avenue, Wilmington, DE 19801 ("Lender"). By rendering your signature upon the signature pad below, Borrower acknowledges having read, understood, and agreed to every provision hereof, including those in subsection 7(b)(iii), which Borrower has specifically agreed to even though it does not exist.

1. LOAN TERMS. Lender hereby extends to Borrower a micro-loan of $0.01 USD (the "Principal"), subject to a compound interest rate of twenty percent (20%) per calendar week, calculated continuously and accruing from the moment of signing. For illustrative purposes only: after one (1) year, the outstanding balance shall approximate $13,948,387.04, assuming no payments are made. This is not a projection. This is a promise.

2. REPAYMENT. Borrower may repay the outstanding balance at any time via the "Pay off debt" interface within the Application. Lender makes no representations that such repayment shall be accepted, processed, or acknowledged. Payments rejected at Lender's sole discretion shall nonetheless be recorded as "attempted" and may subject Borrower to a $49.99 "declined payment fee."

3. JURISDICTION. This Agreement shall be governed exclusively by the laws of the State of Delaware, the Cayman Islands, and, in the event of a lunar eclipse coinciding with a market correction exceeding 3%, the laws of the Principality of Liechtenstein.

4. ARBITRATION. All disputes arising under this Agreement shall be resolved by binding arbitration conducted in person at Lender's offices, which are located at a physical address that Lender is not required to disclose. Borrower waives all rights to class action participation, jury trial, and the general concept of recourse.

5. NON-DISCLOSURE. Borrower agrees not to discuss the terms of this Agreement with any third party, including but not limited to: financial advisors, attorneys, family members, pets, or anyone who has previously passed a calculus course. Borrower further agrees to characterize any debt incurred hereunder as "vibes-based" in all future tax filings.

6. ACKNOWLEDGMENT OF RISK. Borrower acknowledges that Calculator 2026 Financial Inc. is not a licensed financial institution, money transmitter, or calculator company in any jurisdiction in which those licenses are required. Borrower further acknowledges that this does not matter.

7. SEVERABILITY. If any provision of this Agreement is found to be unenforceable, it shall be replaced by a provision that is enforceable and that most closely approximates the intent of the original provision, including its unreasonableness.

IN WITNESS WHEREOF, Borrower has affixed their signature below, accepting all terms, including those yet to be written.`;

const PLANS = [
  { id: 'pro' as const,  label: 'PRO',  price: 49,  desc: '+, −, ×, ÷' },
  { id: 'max' as const,  label: 'MAX',  price: 199, desc: '+, %, ±, decimals', recommended: true },
];

export default function IOUPage() {
  const router = useRouter();
  const { setDebt, advance, setPlan } = useStore();
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'max'>('max');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [legalOpen, setLegalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = PLANS.find((p) => p.id === selectedPlan)!;

  function handleSign() {
    if (!signatureData) {
      setError('Please sign the agreement before proceeding.');
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('iouSignature', signatureData);
    }
    setDebt(plan.price);
    setPlan(selectedPlan);
    advance('iou');
    router.push('/');
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center py-16 px-4">
      <div className="w-full max-w-lg border-2 border-money rounded-2xl bg-white p-8 shadow-lg">
        <h1
          className="text-4xl text-ink mb-6 text-center"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}
        >
          One moment…
        </h1>

        <p className="text-ink text-sm leading-relaxed mb-5">
          By signing, you agree to a{' '}
          <strong className="text-money">20% per week, compounding</strong> loan from{' '}
          <strong>Calculator 2026 Financial Inc.</strong>
        </p>

        {/* Plan selector */}
        <div className="mb-6">
          <p className="text-[10px] text-ink-soft uppercase tracking-widest mb-2">Select your plan</p>
          <div className="flex flex-col gap-2">
            {PLANS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlan(p.id)}
                className={`relative flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${
                  selectedPlan === p.id
                    ? 'border-money bg-money/5 text-ink'
                    : 'border-ink/15 text-ink-soft hover:border-ink/30'
                }`}
              >
                <span className="font-medium">
                  {p.label}
                  <span className="ml-2 text-xs text-ink-soft font-normal">{p.desc}</span>
                </span>
                <span className="flex items-center gap-2">
                  {p.recommended && (
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-money text-paper rounded-full px-2 py-0.5">
                      recommended
                    </span>
                  )}
                  <span className="font-mono">${p.price}/mo</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Collapsible fine print */}
        <div className="mb-6">
          <button
            type="button"
            className="text-ink-soft text-xs underline hover:text-ink transition-colors"
            onClick={() => setLegalOpen((o) => !o)}
          >
            {legalOpen ? 'Hide' : 'Read'} full terms &amp; conditions
          </button>
          {legalOpen && (
            <div className="mt-3 p-3 bg-paper border border-ink/10 rounded-lg text-[10px] text-ink-soft font-mono leading-relaxed h-44 overflow-y-auto whitespace-pre-wrap">
              {LEGAL_TEXT}
            </div>
          )}
        </div>

        <div className="mb-1">
          <p className="text-[10px] text-ink-soft uppercase tracking-widest mb-2">Your signature</p>
          <SignaturePad onChange={setSignatureData} />
        </div>

        {error && (
          <p className="text-alarm text-sm mt-3">{error}</p>
        )}

        <button
          type="button"
          onClick={handleSign}
          className="w-full mt-6 bg-money text-paper rounded-xl py-4 font-bold text-base hover:bg-money/90 transition-colors shadow"
        >
          I solemnly swear — charge ${plan.price}/mo to my IOU
        </button>

        <div className="mt-4 text-center">
          <Link
            href={`/paywall/checkout?tier=${selectedPlan}`}
            className="text-ink-soft text-xs hover:text-ink underline transition-colors"
          >
            Actually I&apos;ll pay ${plan.price} with a card →
          </Link>
        </div>
      </div>
    </main>
  );
}
