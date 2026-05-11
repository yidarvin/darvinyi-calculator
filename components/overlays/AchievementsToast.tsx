"use client";
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { on, off } from '@/lib/events';
import { useStore } from '@/lib/state';

type Milestone = { uses: number; id: string; label: string };

const MILESTONES: Milestone[] = [
  { uses: 5,   id: 'five',     label: '🏆 First five! You did math!' },
  { uses: 10,  id: 'ten',      label: '🏆 Decimator' },
  { uses: 25,  id: 'twenty5',  label: '🏆 Math Apprentice' },
  { uses: 50,  id: 'fifty',    label: '🏆 Mathlete' },
  { uses: 100, id: 'hundred',  label: '🏆 Math Olympian' },
];

export function AchievementsToast() {
  const [toast, setToast] = useState<string | null>(null);
  const { uses, flags, addAchievement, debt } = useStore();

  // Show toast for 4s then clear
  function show(label: string) {
    setToast(label);
    setTimeout(() => setToast(null), 4000);
  }

  // Listen for calc.success to check milestones
  useEffect(() => {
    function handler() {
      const currentUses = useStore.getState().uses;
      const achieved = useStore.getState().flags.achievements;
      for (const m of MILESTONES) {
        if (currentUses >= m.uses && !achieved.includes(m.id)) {
          addAchievement(m.id);
          show(m.label);
          return; // show one at a time
        }
      }
    }
    on('calc.success', handler);
    return () => off('calc.success', handler);
  }, [addAchievement]);

  // Check IOU debt-for-a-week milestone
  useEffect(() => {
    if (!debt) return;
    const WEEK_MS = 7 * 86400 * 1000;
    const elapsed = Date.now() - debt.startedAt;
    if (elapsed >= WEEK_MS && !flags.achievements.includes('iou-week')) {
      addAchievement('iou-week');
      show('🏆 In Debt for a Week!');
    }
  }, [debt, flags.achievements, addAchievement]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] pointer-events-none">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="bg-ink text-paper px-5 py-3 rounded-full text-sm font-semibold shadow-2xl whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AchievementsToast;
