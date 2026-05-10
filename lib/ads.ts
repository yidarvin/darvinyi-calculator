export type AdUnit = {
  id: string;
  size: '728x90' | '320x50' | '300x250' | '100x100' | '160x600';
  bg: string;
  headline: string;
  sub?: string;
  cta?: string;
};

export const ads: AdUnit[] = [
  // 728x90 — leaderboard
  { id: 'crypto1',  size: '728x90',  bg: 'bg-orange-200', headline: '$DOGE TO THE MOON',          sub: '47% in 24h. Allegedly.',                 cta: 'Buy now'     },
  { id: 'fintech',  size: '728x90',  bg: 'bg-blue-200',   headline: 'Earn 4.9% APY*',              sub: '*on balances under $0.12. Terms apply.'                      },

  // 320x50 — mobile banner
  { id: 'mattress', size: '320x50',  bg: 'bg-blue-100',   headline: 'Sleep Number — $4,200',       sub: 'You will not sleep on it.'                                   },
  { id: 'delivery', size: '320x50',  bg: 'bg-purple-100', headline: 'DoorMath: Calculator Delivery', sub: '$1.99 fee per digit. Free over $9.99.' },

  // 300x250 — medium rectangle
  { id: 'auto',     size: '300x250', bg: 'bg-yellow-100', headline: 'Refinance Your Car',           sub: "Even if you don't have one.",            cta: 'Apply now'   },
  { id: 'crypto2',  size: '300x250', bg: 'bg-orange-100', headline: '$CALC Coin — Pre-Sale',        sub: 'Backed by math. Probably.',              cta: 'Invest'       },

  // 100x100 — small square
  { id: 'vpn',      size: '100x100', bg: 'bg-green-100',  headline: 'Protect Your Math',            sub: 'NumberVPN'                                                   },
  { id: 'fat',      size: '100x100', bg: 'bg-red-100',    headline: 'One Weird Trick',              sub: 'Doctors hate it'                                             },
  { id: 'aiboy',    size: '100x100', bg: 'bg-pink-100',   headline: 'AI Girlfriend',                sub: 'She likes math too'                                          },

  // 160x600 — wide skyscraper
  { id: 'legal',    size: '160x600', bg: 'bg-gray-100',   headline: 'Sued for Math?',               sub: '1-800-MATH-LAW',                         cta: 'Free consult' },
];
