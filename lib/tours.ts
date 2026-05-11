import type { TourStep } from '@/components/tour/Tour';

export const tours: Record<string, TourStep[]> = {
  free: [
    { target: '#display',   title: 'Welcome!',       body: 'This is your display.' },
    { target: '#key-7',     title: 'Type numbers',   body: 'Tap any digit to enter it.' },
    { target: '#key-eq',    title: 'Hit equals',     body: 'Get your answer instantly.' },
  ],
  paywall: [
    { target: '#tier-max',  title: 'Pick a plan',    body: 'Max is recommended.' },
    { target: '#iou-btn',   title: 'Or, IOU',        body: 'No money down. Pay later.' },
  ],
  iou: [
    { target: '#debt-ticker', title: 'You owe us',   body: 'Compounding at 20% per week.' },
    { target: '#key-eq',    title: 'Keep going',     body: "You can still calculate. We're generous." },
  ],
  surge: [
    { target: '#surge-banner', title: 'Surge pricing', body: 'Demand-based math fees. Industry standard.' },
    { target: '#credit-chip',  title: 'Credits',        body: 'You spend these per calc.' },
    { target: '#key-eq',       title: 'Each press costs', body: 'Cost = base × surge × premium fees.' },
  ],
  premium: [
    { target: '#display',    title: 'Premium feature!', body: 'Did you know prime numbers cost 4×?' },
    { target: '#key-7',      title: 'Lucky 7',          body: 'Any result with a 7 in it is 1.5×.' },
    { target: '#key-eq',     title: 'Stack up',          body: 'Fees multiply. Prime × Lucky 7 = 6×.' },
    { target: '#credit-chip',title: 'Run low? Top up.',  body: 'We make it easy.' },
    { target: '#display',    title: '🎓 You graduated!', body: 'You are now certified in PREMIUM tier. Share?', cta: '📤 Share on LinkedIn' },
  ],
  ads: [
    { target: '#ad-top',     title: 'Welcome to ads!', body: 'Our partners help keep math free*.' },
    { target: '#ad-side',    title: 'More ads',         body: '*not free.' },
    { target: '#key-eq',     title: 'Every 3rd calc',   body: 'Forced video. Standard.' },
    { target: '#display',    title: '🎓 You graduated!', body: 'You are now certified in AD-SUPPORTED tier.', cta: '📤 Share on LinkedIn' },
  ],
  ai: [
    { target: '#chat-input',   title: 'Just chat',          body: 'Ask the AI any arithmetic question.' },
    { target: '#water-meter',  title: 'Water usage',        body: 'Live tracking. For transparency.' },
    { target: '#token-meter',  title: 'Tokens spent',       body: 'Each character costs.' },
    { target: '#model-picker', title: 'Upgrade your model', body: 'Faster + smarter for just $14/calc.' },
    { target: '#chat-input',   title: '🎓 You graduated!',  body: 'You are now certified in AI-NATIVE tier.', cta: '📤 Share on LinkedIn' },
  ],
};
