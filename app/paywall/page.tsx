import { PricingTiers } from '@/components/paywall/PricingTiers';
import { RestartButton } from '@/components/chrome/RestartButton';

export default function PaywallPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center py-16 px-4">
      <div className="absolute top-4 right-4">
        <RestartButton />
      </div>
      <PricingTiers />
    </main>
  );
}
