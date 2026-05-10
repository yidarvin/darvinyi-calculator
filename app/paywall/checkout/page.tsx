import { StripeForm } from '@/components/paywall/StripeForm';

type Tier = 'pro' | 'max' | 'enterprise' | 'ad-free';
const VALID_TIERS: Tier[] = ['pro', 'max', 'enterprise', 'ad-free'];

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; price?: string }>;
}) {
  const { tier: rawTier, price: rawPrice } = await searchParams;
  const tier: Tier = VALID_TIERS.includes(rawTier as Tier) ? (rawTier as Tier) : 'max';
  const overridePrice = rawPrice ? parseInt(rawPrice, 10) : undefined;
  return <StripeForm tier={tier} overridePrice={overridePrice} />;
}
