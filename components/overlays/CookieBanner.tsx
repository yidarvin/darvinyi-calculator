"use client";
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/lib/state';

type SubToggle = { label: string; checked: boolean };
type Category = {
  id: string;
  label: string;
  locked?: boolean;
  expanded: boolean;
  checked: boolean;
  subs: SubToggle[];
};

function makeCategories(): Category[] {
  return [
    {
      id: 'essential', label: 'Essential', locked: true, expanded: false, checked: true,
      subs: [],
    },
    {
      id: 'performance', label: 'Performance', expanded: false, checked: false,
      subs: Array.from({ length: 12 }, (_, i) => ({ label: `Perf tracker ${i + 1}`, checked: true })),
    },
    {
      id: 'personalization', label: 'Personalization', expanded: false, checked: false,
      subs: Array.from({ length: 8 }, (_, i) => ({ label: `Personalization signal ${i + 1}`, checked: true })),
    },
    {
      id: 'marketing', label: 'Marketing', expanded: false, checked: false,
      subs: Array.from({ length: 23 }, (_, i) => ({ label: `Marketing partner ${i + 1}`, checked: true })),
    },
    {
      id: 'vendors', label: 'Other / Vendors / Affiliates', expanded: false, checked: false,
      subs: [
        ...Array.from({ length: 46 }, (_, i) => ({ label: `Vendor ${i + 1}`, checked: true })),
        { label: 'Share my heart rate with insurance partners', checked: true },
      ],
    },
  ];
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [cats, setCats] = useState<Category[]>(makeCategories);
  const [clickCount, setClickCount] = useState(0);
  const setCookiesAccepted = useStore((s) => s.setCookiesAccepted);

  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    if (!sessionStorage.getItem('cookieBannerShown')) {
      setVisible(true);
    }
  }, []);

  function accept() {
    sessionStorage.setItem('cookieBannerShown', '1');
    setCookiesAccepted();
    setVisible(false);
  }

  function savePrefs() {
    const next = clickCount + 1;
    setClickCount(next);
    if (next >= 3) {
      sessionStorage.setItem('cookieBannerShown', '1');
      setVisible(false);
    }
  }

  function toggleExpand(id: string) {
    setCats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, expanded: !c.expanded } : c))
    );
  }

  function toggleCat(id: string) {
    setCats((prev) =>
      prev.map((c) =>
        c.id === id && !c.locked ? { ...c, checked: !c.checked } : c
      )
    );
  }

  function toggleSub(catId: string, idx: number) {
    setCats((prev) =>
      prev.map((c) =>
        c.id === catId
          ? {
              ...c,
              subs: c.subs.map((s, i) =>
                i === idx ? { ...s, checked: !s.checked } : s
              ),
            }
          : c
      )
    );
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[200]">
      <AnimatePresence>
        {!showManage ? (
          <motion.div
            key="bar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="bg-ink text-paper px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 shadow-2xl"
          >
            <p className="text-sm flex-1">
              We use cookies and{' '}
              <span className="font-semibold text-ad">47 third-party trackers</span>{' '}
              to improve your experience.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={accept}
                className="bg-paper text-ink text-sm font-semibold px-4 py-2 rounded hover:bg-paper/90 transition-colors"
              >
                Accept all
              </button>
              <button
                onClick={() => setShowManage(true)}
                className="text-ink-soft text-sm underline px-2 py-2 hover:text-paper transition-colors"
              >
                Reject all
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="manage"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="bg-paper border-t-2 border-ink shadow-2xl max-h-[70vh] overflow-y-auto"
          >
            <div className="p-4 border-b border-ink/10">
              <h3 className="font-semibold text-ink text-sm">Manage cookie preferences</h3>
              <p className="text-xs text-ink-soft mt-1">
                You can customize which categories of cookies you allow below.
              </p>
            </div>
            <div className="divide-y divide-ink/10">
              {cats.map((cat) => (
                <div key={cat.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleExpand(cat.id)}
                      className="text-xs text-ink-soft w-4"
                      aria-label="expand"
                    >
                      {cat.subs.length > 0 ? (cat.expanded ? '▼' : '▶') : ''}
                    </button>
                    <label className="flex items-center gap-2 flex-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={cat.checked}
                        disabled={cat.locked}
                        onChange={() => toggleCat(cat.id)}
                        className="w-4 h-4 accent-ink"
                      />
                      <span className="text-sm font-medium text-ink">{cat.label}</span>
                      {cat.locked && (
                        <span className="text-[10px] text-ink-soft ml-1">(always on)</span>
                      )}
                    </label>
                  </div>
                  {cat.expanded && cat.subs.length > 0 && (
                    <div className="ml-10 mt-2 space-y-1 max-h-40 overflow-y-auto">
                      {cat.subs.map((sub, i) => (
                        <label key={i} className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={sub.checked}
                            onChange={() => toggleSub(cat.id, i)}
                            className="w-3.5 h-3.5 accent-ink"
                          />
                          <span className="text-xs text-ink-soft">{sub.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-ink/10 flex items-center gap-3">
              <button
                onClick={savePrefs}
                className="bg-ink text-paper text-sm font-semibold px-4 py-2 rounded hover:bg-ink/80 transition-colors"
              >
                {clickCount < 2 ? 'Save preferences' : 'Save preferences (final)'}
              </button>
              <button
                onClick={accept}
                className="text-sm text-ink-soft underline hover:text-ink transition-colors"
              >
                Accept all instead →
              </button>
              {clickCount > 0 && clickCount < 3 && (
                <span className="text-xs text-alarm ml-auto">
                  Click {3 - clickCount} more time{3 - clickCount !== 1 ? 's' : ''} to confirm
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CookieBanner;
