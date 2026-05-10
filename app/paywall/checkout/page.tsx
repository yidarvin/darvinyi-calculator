import { StripeForm } from '@/components/paywall/StripeForm';

type Tier = 'pro' | 'max' | 'enterprise';
const VALID_TIERS: Tier[] = ['pro', 'max', 'enterprise'];

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>;
}) {
  const { tier: rawTier } = await searchParams;
  const tier: Tier = VALID_TIERS.includes(rawTier as Tier) ? (rawTier as Tier) : 'max';
  return <StripeForm tier={tier} />;
}
