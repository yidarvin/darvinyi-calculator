'use client';
import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';
import { initial, press, type CalcState } from './evaluator';
import { useStore } from '@/lib/state';
import { emit } from '@/lib/events';
import { evaluateTriggers } from '@/lib/triggers';
import { Display } from './Display';
import { FreeTrialBanner } from './FreeTrialBanner';
import { CostToast, type CostToastData } from '@/components/overlays/CostToast';
import { CooldownModal } from '@/components/overlays/CooldownModal';
import { BuyCredits } from '@/components/overlays/BuyCredits';
import { BigSpenderUpsell } from '@/components/overlays/BigSpenderUpsell';
import { VideoAdModal } from '@/components/overlays/VideoAdModal';
import { playSound } from '@/lib/sounds';

// Easter egg: BOOBS sequence (stage 'free' only)
const BOOBS_SEQ = ['8', '0', '0', '8', '5', '='];

type LastUseData = { a: number; op: string; b: number };

type KeyDef = { label: string; key: string; wide?: boolean };

const ROWS: KeyDef[][] = [
  [
    { label: 'AC', key: 'AC' },
    { label: '±', key: '±' },
    { label: '%', key: '%' },
    { label: '÷', key: '÷' },
  ],
  [
    { label: '7', key: '7' },
    { label: '8', key: '8' },
    { label: '9', key: '9' },
    { label: '×', key: '×' },
  ],
  [
    { label: '4', key: '4' },
    { label: '5', key: '5' },
    { label: '6', key: '6' },
    { label: '−', key: '−' },
  ],
  [
    { label: '1', key: '1' },
    { label: '2', key: '2' },
    { label: '3', key: '3' },
    { label: '+', key: '+' },
  ],
  [
    { label: '0', key: '0', wide: true },
    { label: '.', key: '.' },
    { label: '=', key: '=' },
  ],
];

const FN_KEYS = new Set(['AC', '±', '%']);
const OP_KEYS = new Set(['÷', '×', '−', '+', '=']);
const SURGE_STAGES = new Set(['surge', 'premium', 'ads']);

function keyClass(key: string, wide?: boolean) {
  const isFn = FN_KEYS.has(key);
  const isOp = OP_KEYS.has(key);

  return clsx(
    'flex items-center justify-center h-16 rounded-full select-none cursor-pointer',
    'transition-transform active:scale-95',
    wide && 'col-span-2 justify-start pl-7 text-left',
    isFn && 'bg-[#ccc8bf] text-ink font-sans text-lg font-medium',
    isOp && 'bg-ink text-paper font-mono text-xl font-medium',
    !isFn && !isOp && 'bg-[#e8e2d7] text-ink font-mono text-xl',
  );
}

const KEY_ID: Record<string, string> = {
  '=': 'key-eq', 'AC': 'key-ac', '±': 'key-pm', '%': 'key-pct',
  '÷': 'key-div', '×': 'key-mul', '−': 'key-sub', '+': 'key-add', '.': 'key-dot',
  '0': 'key-0', '1': 'key-1', '2': 'key-2', '3': 'key-3', '4': 'key-4',
  '5': 'key-5', '6': 'key-6', '7': 'key-7', '8': 'key-8', '9': 'key-9',
};

const BASE_COST = 10;
const COOLDOWN_MS = 47_000;
const RAPID_WINDOW_MS = 10_000;
const RAPID_THRESHOLD = 3;

export function CalcPad() {
  const router = useRouter();
  const [calc, setCalc] = useState<CalcState>(initial);
  const [lastUseModal, setLastUseModal] = useState<LastUseData | null>(null);

  // Surge/credit state
  const [recentCalcs, setRecentCalcs] = useState<number[]>([]);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [showCooldown, setShowCooldown] = useState(false);
  const [toastData, setToastData] = useState<CostToastData | null>(null);
  const [toastKey, setToastKey] = useState(0);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [showBigSpender, setShowBigSpender] = useState(false);
  const [bigSpenderCost, setBigSpenderCost] = useState(0);
  const [showVideoAd, setShowVideoAd] = useState(false);
  const videoAdCalcCountRef = useRef(0);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boobsSeqRef = useRef<string[]>([]);
  const [boobsMode, setBoobsMode] = useState(false);
  const [eggToast, setEggToast] = useState<string | null>(null);
  const eggToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    bumpUses, bumpInteractions, uses, stage, advance,
    credits, surgeMultiplier, surgeCalcs, premiumTriggerCount,
    spendCredits, incrementSurgeCalcs, addPremiumTriggers, plan,
    flags,
  } = useStore();

  function goPaywall() {
    advance('paywall');
    router.push('/paywall');
  }

  function afterCalcSuccess() {
    emit('calc.success', {});
    // Signup gauntlet fires the first time uses reaches 3 (uses is pre-bump value here)
    if (uses === 2 && !flags.signupCompleted) {
      emit('overlay.open', { key: 'signup', props: {} });
    }
  }

  const iouCalcsRef = useRef(0);

  function showToast(data: CostToastData) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastData(data);
    setToastKey((k) => k + 1);
    toastTimerRef.current = setTimeout(() => setToastData(null), 2500);
  }

  const handleCooldownExpire = useCallback(() => {
    setShowCooldown(false);
    setCooldownUntil(null);
  }, []);

  function executeEquals(state: CalcState) {
    const { state: next, computed } = press(state, '=');

    if (!computed) {
      setCalc(next);
      return;
    }

    // IOU → surge transition
    if (stage === 'iou') {
      setCalc(next);
      bumpUses();
      afterCalcSuccess();
      iouCalcsRef.current += 1;
      if (iouCalcsRef.current >= 1) advance('surge');
      return;
    }

    // Credit-gated stages
    if (SURGE_STAGES.has(stage)) {
      const now = Date.now();

      // Cooldown gate: still in cooldown?
      if (cooldownUntil && now < cooldownUntil) {
        setShowCooldown(true);
        return;
      }

      // Rapid-calc check: ≥3 in last 10s → start new cooldown
      const recentWindow = recentCalcs.filter((t) => now - t < RAPID_WINDOW_MS);
      if (recentWindow.length >= RAPID_THRESHOLD) {
        const expiry = now + COOLDOWN_MS;
        setCooldownUntil(expiry);
        setShowCooldown(true);
        return;
      }

      // Evaluate triggers (only apply premium mult in 'premium'/'ads')
      const { hit, mult: premiumMult } = evaluateTriggers(
        computed.a, computed.b, computed.r, computed.op,
      );
      const effectiveMult = (stage === 'premium' || stage === 'ads') ? premiumMult : 1;
      const cost = Math.ceil(BASE_COST * surgeMultiplier * effectiveMult);

      // Insufficient credits?
      if (credits < cost) {
        setShowBuyCredits(true);
        return; // display unchanged; user must buy credits then press = again
      }

      // Commit the calc
      setCalc(next);
      bumpUses();
      afterCalcSuccess();
      spendCredits(cost);
      setRecentCalcs([...recentCalcs, now].slice(-10));

      // Toast
      showToast({
        expression: `${computed.a} ${computed.op} ${computed.b}`,
        result: next.display,
        baseCost: BASE_COST,
        surge: surgeMultiplier,
        hits: hit,
        total: cost,
        showPremium: stage === 'premium' || stage === 'ads',
      });

      // Big spender upsell (skip if already on max or enterprise)
      if (cost > 50 && plan !== 'max' && plan !== 'enterprise') {
        setBigSpenderCost(cost);
        setShowBigSpender(true);
      }

      // Stage transitions
      const newSurgeCalcs = surgeCalcs + 1;
      incrementSurgeCalcs();
      if (stage === 'surge' && newSurgeCalcs >= 5) {
        advance('premium');
        return;
      }

      if ((stage === 'premium' || stage === 'ads') && hit.length > 0) {
        const newTriggerCount = premiumTriggerCount + hit.length;
        addPremiumTriggers(hit.length);
        if (stage === 'premium' && newTriggerCount >= 3) {
          advance('ads');
        }
      }

      // Video ad every 3rd successful calc in ads stage
      if (stage === 'ads') {
        videoAdCalcCountRef.current += 1;
        if (videoAdCalcCountRef.current % 3 === 0) {
          setShowVideoAd(true);
        }
      }

      return;
    }

    // Free stage
    setCalc(next);
    bumpUses();
    afterCalcSuccess();
  }

  function showEggToast(msg: string) {
    if (eggToastTimer.current) clearTimeout(eggToastTimer.current);
    setEggToast(msg);
    eggToastTimer.current = setTimeout(() => setEggToast(null), 3000);
  }

  function onKey(key: string) {
    bumpInteractions();
    playSound('click');

    // Easter egg: BOOBS sequence (stage 'free' only)
    if (stage === 'free') {
      const seq = boobsSeqRef.current;
      seq.push(key);
      if (seq.length > BOOBS_SEQ.length) seq.shift();
      if (seq.length === BOOBS_SEQ.length && seq.every((k, i) => k === BOOBS_SEQ[i])) {
        boobsSeqRef.current = [];
        setBoobsMode(true);
        setTimeout(() => setBoobsMode(false), 2000);
        return;
      }
    }

    if (key === '=') {
      if (stage === 'paywall' || (stage === 'free' && uses >= 10)) {
        goPaywall();
        return;
      }
      if (stage === 'free' && uses === 9 && calc.op !== null && calc.pending !== null) {
        setLastUseModal({ a: calc.pending, op: calc.op, b: parseFloat(calc.display) });
        return;
      }
      executeEquals(calc);
      return;
    }

    const { state: next } = press(calc, key);

    // Easter egg: "42" toast
    if (next.display === '42' && stage === 'free') {
      showEggToast("Don't panic.");
    }

    setCalc(next);
  }

  function handleLastUseConfirm() {
    setLastUseModal(null);
    executeEquals(calc);
  }

  function handleLastUseUpgrade() {
    setLastUseModal(null);
    goPaywall();
  }

  return (
    <div className="w-full max-w-xs">
      <div
        className="rounded-[2rem] bg-[#f0ece4] p-5 shadow-md border border-black/5"
        style={boobsMode ? { transform: 'rotate(180deg)', transition: 'transform 0.3s' } : {}}
      >
        <Display value={boobsMode ? 'BOOBS' : calc.display} />

        <div className="grid grid-cols-4 gap-[10px]">
          {ROWS.map((row, ri) =>
            row.map(({ label, key, wide }) => (
              <button
                key={`${ri}-${key}`}
                id={KEY_ID[key]}
                className={keyClass(key, wide)}
                onClick={() => onKey(key)}
                aria-label={key}
              >
                {label}
              </button>
            )),
          )}
        </div>

        {stage === 'free' && (
          <FreeTrialBanner uses={uses} onUpgrade={goPaywall} />
        )}
      </div>

      {/* Last use modal */}
      <AnimatePresence>
        {lastUseModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-paper rounded-2xl p-6 w-full max-w-sm mx-4 mb-8 sm:mb-0 shadow-2xl"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <h2 className="font-sans text-lg font-semibold text-ink mb-1">Last free use!</h2>
              <p className="text-ink-soft text-sm mb-5">
                Are you <em>sure</em> you want to spend it on{' '}
                <span className="font-mono text-ink">
                  {lastUseModal.a} {lastUseModal.op} {lastUseModal.b}
                </span>
                ?
              </p>
              <div className="flex flex-col gap-2">
                <button
                  className="w-full bg-ink text-paper rounded-full py-3 font-sans font-semibold text-sm tracking-widest uppercase"
                  onClick={handleLastUseConfirm}
                >
                  Use my last one
                </button>
                <button
                  className="w-full text-ink-soft rounded-full py-3 font-sans text-sm hover:text-ink transition-colors"
                  onClick={handleLastUseUpgrade}
                >
                  Upgrade instead →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Surge modals & toast */}
      <CooldownModal
        open={showCooldown}
        expiresAt={cooldownUntil ?? Date.now() + COOLDOWN_MS}
        onSkip={() => {
          if (credits >= 10) {
            spendCredits(10);
            setRecentCalcs([]);
            setCooldownUntil(null);
            setShowCooldown(false);
          }
        }}
        onWait={() => setShowCooldown(false)}
        onExpire={handleCooldownExpire}
      />

      <BuyCredits open={showBuyCredits} onClose={() => setShowBuyCredits(false)} />

      <BigSpenderUpsell
        open={showBigSpender}
        cost={bigSpenderCost}
        onClose={() => setShowBigSpender(false)}
      />

      <CostToast toast={toastData} toastKey={toastKey} />

      <VideoAdModal open={showVideoAd} onClose={() => setShowVideoAd(false)} />

      {/* Easter egg toasts */}
      <AnimatePresence>
        {eggToast && (
          <motion.div
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-ai text-white rounded-2xl px-5 py-3 shadow-xl pointer-events-none text-sm font-medium"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            {eggToast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
