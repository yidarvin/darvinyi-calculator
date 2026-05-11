import { isLuhnValid, isPlausibleExpiry, hashLast4 } from './luhn';
import { emit } from './events';
import { useStore } from './state';

type CardInput = {
  number: string;
  expiry: string;
  amount: number;
  context: 'subscribe' | 'iou-payoff' | 'ad-free' | 'top-up';
};

type CardResult =
  | { ok: true }
  | { ok: false; error: string };

export function submitCard(input: CardInput, onCharge: () => void): CardResult {
  const digits = input.number.replace(/\D/g, '');
  if (!isLuhnValid(digits)) return { ok: false, error: 'Your card number is invalid.' };
  if (!isPlausibleExpiry(input.expiry)) return { ok: false, error: 'Your card expiration date is invalid.' };

  function proceed() {
    useStore.getState().recordCardAttempt({
      last4Hash: hashLast4(digits),
      amount: input.amount,
      context: input.context,
    });
    emit('berate.open', {
      amount: input.amount,
      reason: input.context,
      onAccept: onCharge,
    });
  }

  if (!useStore.getState().flags.captchaPassed) {
    emit('overlay.open', {
      key: 'captcha',
      props: {
        onPass: () => {
          useStore.getState().setCaptchaPassed();
          proceed();
        },
      },
    });
    return { ok: true };
  }

  proceed();
  return { ok: true };
}
