"use client";

type BeratePopupProps = {
  amount: number;
  onCharge: () => void;
  onClose: () => void;
};

export function BeratePopupStub({ amount, onCharge, onClose }: BeratePopupProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm">
      <div className="bg-paper border-2 border-alarm rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-2xl font-bold text-alarm">WAIT. STOP.</h2>
        <p className="mt-3 text-ink">
          You were about to pay <strong>${amount}</strong> for a calculator.
        </p>
        <p className="mt-2 text-sm italic text-ink-soft">[Real popup ships in phase 08.]</p>
        <div className="mt-6 flex gap-3 justify-end">
          <button
            className="px-4 py-2 border border-ink/20 rounded-lg text-ink hover:bg-ink/5 transition-colors text-sm"
            onClick={onClose}
          >
            OK
          </button>
          <button
            className="px-4 py-2 bg-ink text-paper rounded-lg hover:bg-ink/80 transition-colors text-sm font-medium"
            onClick={onCharge}
          >
            Charge me anyway
          </button>
        </div>
      </div>
    </div>
  );
}

export default BeratePopupStub;
