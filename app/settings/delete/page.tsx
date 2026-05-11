"use client";
import { Suspense, useCallback, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Captcha } from "@/components/overlays/Captcha";
import { SignaturePad } from "@/components/paywall/SignaturePad";
import { VideoAdModal } from "@/components/overlays/VideoAdModal";
import { BeratePopup } from "@/components/overlays/BeratePopup";
import { useStore } from "@/lib/state";

// ─── shared layout ────────────────────────────────────────────────────────────
function Shell({
  step,
  total,
  title,
  subtitle,
  children,
  canContinue,
  continueLabel,
  onContinue,
  onBack,
  looped,
}: {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  canContinue: boolean;
  continueLabel?: string;
  onContinue: () => void;
  onBack: () => void;
  looped?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-paper flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Looped banner */}
        <AnimatePresence>
          {looped && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-lg bg-alarm/10 border border-alarm/30 px-4 py-2 text-sm text-alarm font-medium"
            >
              Note: your account is still active. Please try again.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-ink-soft mb-1.5">
            <span>Step {step} of {total}</span>
            <Link href="/settings" className="hover:text-ink transition-colors">
              Cancel
            </Link>
          </div>
          <div className="h-1 bg-ink/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-alarm rounded-full"
              animate={{ width: `${(step / total) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-ink/10 rounded-2xl shadow-sm p-6"
        >
          <h1 className="text-xl font-semibold text-ink mb-1">{title}</h1>
          {subtitle && <p className="text-sm text-ink-soft mb-4">{subtitle}</p>}
          {children}

          <div className="mt-6 flex gap-3">
            {step > 1 && (
              <button
                onClick={onBack}
                className="px-5 py-2.5 border border-ink/20 rounded-full text-sm text-ink-soft hover:border-ink/40 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={onContinue}
              disabled={!canContinue}
              className="flex-1 py-2.5 bg-alarm text-white rounded-full font-semibold text-sm disabled:opacity-40 transition-opacity"
            >
              {continueLabel ?? "Continue →"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Likert survey ────────────────────────────────────────────────────────────
const SURVEY_QUESTIONS_A = [
  "How satisfied were you with our calculator?",
  "How intuitive was our pricing structure?",
  "How reasonable was the IOU interest rate?",
  "How helpful were our ads?",
  "Would you recommend Calculator 2026 to a friend?",
  "How fair were our surge pricing multipliers?",
  "How reasonable were the cooldown timers?",
  "How much did you enjoy our AI integration?",
  "How transparent were our fees?",
  "Overall, how delighted were you?",
];

const SURVEY_QUESTIONS_B = [
  "How much will you miss Calculator 2026?",
  "How likely are you to return?",
  "How would you rate our retention experience?",
  "How supportive was our team?",
  "How fair were our deletion fees?",
];

function LikertSurvey({
  questions,
  onChange,
}: {
  questions: string[];
  onChange: (complete: boolean) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});

  function rate(qi: number, val: number) {
    const next = { ...answers, [qi]: val };
    setAnswers(next);
    onChange(Object.keys(next).length === questions.length);
  }

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <div key={qi}>
          <p className="text-sm text-ink mb-1.5">{q}</p>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                onClick={() => rate(qi, v)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  answers[qi] === v
                    ? "bg-ink text-paper border-ink"
                    : "border-ink/15 text-ink-soft hover:border-ink/40"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Retention chat ────────────────────────────────────────────────────────────
const KAREN_MESSAGES = [
  "Hi! I'm Karen from Retention. What can I offer you to stay?",
  "How about a free month? Normally $199, on us!",
  "OK… what about 500 bonus credits? That's real value.",
  "Please. The calculator needs you. *I* need you.",
  "Fine. I'll give you everything. Free forever. Just don't go.",
];

const KAREN_ACCEPT_LABELS = [
  "Yes, give me the free month!",
  "OK, I'll take the credits.",
  "Sure, free forever sounds good.",
  "Tempting… but no.",
];

function RetentionChat({ onDone }: { onDone: () => void }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [shown, setShown] = useState(false);
  const [berate, setBerate] = useState<{ amount: number } | null>(null);

  // type out the message
  const [typed, setTyped] = useState("");
  const msg = KAREN_MESSAGES[Math.min(msgIdx, KAREN_MESSAGES.length - 1)];

  useState(() => {
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setTyped(msg.slice(0, i));
      if (i >= msg.length) {
        clearInterval(iv);
        setShown(true);
      }
    }, 30);
    return () => clearInterval(iv);
  });

  // Restart typing when message changes
  const [key, setKey] = useState(0);

  function nextMsg() {
    setShown(false);
    setTyped("");
    const next = msgIdx + 1;
    setMsgIdx(next);
    setKey((k) => k + 1);
  }

  function handleAccept() {
    setBerate({ amount: msgIdx === 0 ? 199 : msgIdx === 1 ? 0 : 0 });
  }

  if (berate) {
    return (
      <BeratePopup
        amount={berate.amount}
        reason="subscribe"
        onAccept={() => { setBerate(null); nextMsg(); }}
        onCancel={() => setBerate(null)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-[#f0ece4] rounded-2xl rounded-tl-sm p-3 text-sm text-ink min-h-[3rem]">
        <TypingMsg key={key} message={msg} onDone={() => setShown(true)} />
      </div>
      {shown && (
        <div className="flex flex-col gap-2">
          {msgIdx < KAREN_ACCEPT_LABELS.length && (
            <button
              onClick={handleAccept}
              className="w-full py-2 bg-money text-white rounded-full text-sm font-semibold"
            >
              {KAREN_ACCEPT_LABELS[msgIdx]}
            </button>
          )}
          <button
            onClick={onDone}
            className="w-full py-2 border border-ink/20 rounded-full text-sm text-ink-soft hover:text-ink transition-colors"
          >
            I still want to delete my account
          </button>
        </div>
      )}
    </div>
  );
}

function TypingMsg({ message, onDone }: { message: string; onDone: () => void }) {
  const [typed, setTyped] = useState("");
  const doneRef = useRef(false);

  useState(() => {
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setTyped(message.slice(0, i));
      if (i >= message.length && !doneRef.current) {
        doneRef.current = true;
        clearInterval(iv);
        onDone();
      }
    }, 28);
    return () => clearInterval(iv);
  });

  return <span>{typed}<span className="animate-pulse">|</span></span>;
}

// ─── Countdown (step 18) ───────────────────────────────────────────────────────
function Countdown24h({
  onSkip,
  onExpire,
}: {
  onSkip: () => void;
  onExpire: () => void;
}) {
  // We pretend it's a 24-hour wait but allow bypass
  const [berate, setBerate] = useState(false);
  const [remaining] = useState(86400); // fixed — won't actually count

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  if (berate) {
    return (
      <BeratePopup
        amount={99}
        reason="subscribe"
        onAccept={() => { setBerate(false); onSkip(); }}
        onCancel={() => setBerate(false)}
      />
    );
  }

  return (
    <div className="space-y-4 text-center">
      <div className="font-mono text-4xl font-bold text-ink tabular-nums">
        {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
      </div>
      <p className="text-xs text-ink-soft">
        (Timer is decorative. We know you'll be back.)
      </p>
      <button
        onClick={() => setBerate(true)}
        className="px-4 py-2 border border-alarm text-alarm rounded-full text-xs font-medium hover:bg-alarm/5 transition-colors"
      >
        Skip wait — $99/mo subscription
      </button>
    </div>
  );
}

// ─── Math puzzle (step 43) ────────────────────────────────────────────────────
function MathPuzzle({ onSolve }: { onSolve: () => void }) {
  const [input, setInput] = useState("");
  const [wrong, setWrong] = useState(false);

  function check() {
    if (parseInt(input, 10) === 4) {
      onSolve();
    } else {
      setWrong(true);
      setInput("");
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink">
        Before we proceed, please solve this security verification:
      </p>
      <div className="font-mono text-center text-3xl font-bold text-ink py-4 bg-[#f0ece4] rounded-xl">
        2 + 2 = ?
      </div>
      <input
        type="number"
        value={input}
        onChange={(e) => { setInput(e.target.value); setWrong(false); }}
        placeholder="Your answer"
        className="w-full border border-ink/20 rounded-xl px-3 py-2.5 font-mono text-center text-ink bg-paper focus:outline-none focus:border-ink/60"
      />
      {wrong && (
        <p className="text-xs text-alarm text-center">
          Incorrect. Are you… okay?
        </p>
      )}
      <button
        onClick={check}
        disabled={!input}
        className="w-full py-2 bg-ink text-paper rounded-full text-sm font-semibold disabled:opacity-40"
      >
        Submit answer
      </button>
    </div>
  );
}

// ─── Video step (step 11, 45) wrapper ─────────────────────────────────────────
function WatchVideo({ onWatched }: { onWatched: () => void }) {
  const [watched, setWatched] = useState(false);
  const [open, setOpen] = useState(true);

  if (watched) {
    return (
      <p className="text-sm text-money font-medium">
        ✓ Video complete. You may now continue.
      </p>
    );
  }

  return (
    <>
      <p className="text-sm text-ink-soft mb-2">
        {open ? "Please watch this important message." : "You skipped the video. You need to watch it."}
      </p>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="text-xs underline text-alarm"
        >
          Watch again
        </button>
      )}
      <VideoAdModal
        open={open}
        onClose={() => {
          setOpen(false);
          setWatched(true);
          onWatched();
        }}
      />
    </>
  );
}

// ─── Main flow ─────────────────────────────────────────────────────────────────
function DeleteFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawStep = parseInt(searchParams.get("step") ?? "1", 10);
  const step = isNaN(rawStep) || rawStep < 1 || rawStep > 47 ? 1 : rawStep;
  const looped = searchParams.get("looped") === "1";

  const reset = useStore((s) => s.reset);
  const plan = useStore((s) => s.plan);
  const flags = useStore((s) => s.flags);

  // per-step ephemeral state
  const [email, setEmail] = useState("");
  const [email2, setEmail2] = useState("");
  const [phone, setPhone] = useState("");
  const [phone2, setPhone2] = useState("");
  const [reason, setReason] = useState("");
  const [essay, setEssay] = useState("");
  const [essay2, setEssay2] = useState("");
  const [essay3, setEssay3] = useState("");
  const [essay4, setEssay4] = useState("");
  const [dob, setDob] = useState("");
  const [maiden, setMaiden] = useState("");
  const [pet, setPet] = useState("");
  const [street, setStreet] = useState("");
  const [sig, setSig] = useState<string | null>(null);
  const [sig2, setSig2] = useState<string | null>(null);
  const [sig3, setSig3] = useState<string | null>(null);
  const [surveyADone, setSurveyADone] = useState(false);
  const [surveyBDone, setSurveyBDone] = useState(false);
  const [captchaPassed, setCaptchaPassed] = useState(false);
  const [captcha2Passed, setCaptcha2Passed] = useState(false);
  const [captcha3Passed, setCaptcha3Passed] = useState(false);
  const [video1Watched, setVideo1Watched] = useState(false);
  const [video2Watched, setVideo2Watched] = useState(false);
  const [countdownSkipped, setCountdownSkipped] = useState(false);
  const [retentionDone, setRetentionDone] = useState(false);
  const [retention2Done, setRetention2Done] = useState(false);
  const [mathSolved, setMathSolved] = useState(false);
  const [tosRead, setTosRead] = useState(false);
  const [implications, setImplications] = useState<boolean[]>(Array(5).fill(false));
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyPass, setVerifyPass] = useState("");
  const [grandma, setGrandma] = useState("");
  const [school, setSchool] = useState("");
  const [emergency, setEmergency] = useState({ name: "", phone: "" });
  const [testimonial, setTestimonial] = useState("");
  const [smoke, setSmoke] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [scheduleBooked, setScheduleBooked] = useState(false);
  const [pigeon, setPigeon] = useState(false);
  const [osSelected, setOsSelected] = useState("");

  // Step 47 double-click
  const lastDoneClick = useRef(0);

  const goTo = useCallback(
    (n: number, loop = false) => {
      const params = new URLSearchParams();
      params.set("step", String(n));
      if (loop) params.set("looped", "1");
      router.push(`/settings/delete?${params.toString()}`);
    },
    [router]
  );

  function next() {
    if (step < 47) goTo(step + 1);
  }
  function back() {
    if (step > 1) goTo(step - 1);
  }

  function handleDone() {
    const now = Date.now();
    if (now - lastDoneClick.current < 500) {
      // Double-click escape hatch
      reset();
      router.push("/");
      return;
    }
    lastDoneClick.current = now;
    goTo(1, true);
  }

  const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

  // Per-step config
  const stepConfig: Record<number, {
    title: string;
    subtitle?: string;
    content?: React.ReactNode;
    canContinue: boolean;
    continueLabel?: string;
    onContinue?: () => void;
  }> = {
    1: {
      title: "We're sorry to see you go.",
      subtitle: "Are you sure you want to delete your account?",
      canContinue: true,
      continueLabel: "I'm sure",
      content: (
        <div className="text-sm text-ink-soft space-y-2">
          <p>Your account, history, and all 7-business-decades of outstanding debt will be permanently deleted.</p>
          <p className="text-xs italic">Probably.</p>
        </div>
      ),
    },
    2: {
      title: "Really sure?",
      canContinue: true,
      continueLabel: "Yes",
      content: (
        <p className="text-sm text-ink-soft">
          Just checking. A lot of people change their minds at this point.
        </p>
      ),
    },
    3: {
      title: "Like, actually sure?",
      canContinue: true,
      continueLabel: "Yes",
      content: (
        <p className="text-sm text-ink-soft">
          Because once you do this, your calculations are gone. All of them. Even the good ones.
        </p>
      ),
    },
    4: {
      title: "Verify your identity.",
      canContinue: email.length > 3 && email.includes("@"),
      content: (
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 bg-paper"
        />
      ),
    },
    5: {
      title: "Verify your identity (again).",
      subtitle: "Just to be safe.",
      canContinue: email2.length > 3 && email2.includes("@"),
      content: (
        <input
          type="email"
          value={email2}
          onChange={(e) => setEmail2(e.target.value)}
          placeholder="Same email as before"
          className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 bg-paper"
        />
      ),
    },
    6: {
      title: "Verify with your phone.",
      canContinue: phone.length >= 7,
      content: (
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 555 000 0000"
          className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 bg-paper"
        />
      ),
    },
    7: {
      title: "Verify with your secondary phone.",
      subtitle: "The one you never use.",
      canContinue: phone2.length >= 7,
      content: (
        <input
          type="tel"
          value={phone2}
          onChange={(e) => setPhone2(e.target.value)}
          placeholder="+1 555 999 9999"
          className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 bg-paper"
        />
      ),
    },
    8: {
      title: "Provide a reason.",
      subtitle: "This helps our product team prioritize nothing.",
      canContinue: reason.length > 0,
      content: (
        <div className="space-y-2">
          {["Too expensive", "Found a better calculator (lol)", "Other"].map((r) => (
            <label key={r} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                className="accent-alarm"
              />
              <span className="text-sm text-ink">{r}</span>
            </label>
          ))}
        </div>
      ),
    },
    9: {
      title: "Please elaborate.",
      subtitle: `If "Other", explain in 500 words. (${wordCount(essay)}/500 words)`,
      canContinue: reason !== "Other" || wordCount(essay) >= 500,
      content: (
        <textarea
          value={essay}
          onChange={(e) => setEssay(e.target.value)}
          rows={8}
          placeholder={reason === "Other" ? "In 500+ words, explain why you're leaving…" : "Optional additional notes"}
          className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 bg-paper resize-none"
        />
      ),
    },
    10: {
      title: "Take this survey.",
      subtitle: "Rate your experience honestly. We will not read this.",
      canContinue: surveyADone,
      content: (
        <LikertSurvey questions={SURVEY_QUESTIONS_A} onChange={setSurveyADone} />
      ),
    },
    11: {
      title: "Watch this video about what you'll miss.",
      canContinue: video1Watched,
      content: <WatchVideo onWatched={() => setVideo1Watched(true)} />,
    },
    12: {
      title: "Confirm your date of birth.",
      canContinue: dob.length > 0,
      content: (
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 bg-paper"
        />
      ),
    },
    13: {
      title: "Mother's maiden name.",
      subtitle: "For security purposes. Definitely not for anything else.",
      canContinue: maiden.length > 0,
      content: (
        <input
          type="text"
          value={maiden}
          onChange={(e) => setMaiden(e.target.value)}
          placeholder="Maiden name"
          autoComplete="off"
          className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 bg-paper"
        />
      ),
    },
    14: {
      title: "Childhood pet's name.",
      canContinue: pet.length > 0,
      content: (
        <input
          type="text"
          value={pet}
          onChange={(e) => setPet(e.target.value)}
          placeholder="Mr. Whiskers"
          autoComplete="off"
          className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 bg-paper"
        />
      ),
    },
    15: {
      title: "First street you grew up on.",
      canContinue: street.length > 0,
      content: (
        <input
          type="text"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          placeholder="123 Elm Street"
          autoComplete="off"
          className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 bg-paper"
        />
      ),
    },
    16: {
      title: "Solve this CAPTCHA.",
      subtitle: "Select all squares containing real human emotion.",
      canContinue: captchaPassed,
      content: captchaPassed ? (
        <p className="text-sm text-money font-medium">✓ Verified</p>
      ) : (
        <div className="border border-ink/10 rounded-xl overflow-hidden">
          <Captcha onPass={() => setCaptchaPassed(true)} onCancel={() => {}} />
        </div>
      ),
    },
    17: {
      title: "Sign this NDA.",
      subtitle: "By signing you agree not to tell anyone that we made you do this.",
      canContinue: !!sig,
      content: <SignaturePad onChange={setSig} />,
    },
    18: {
      title: "Wait 24 hours.",
      subtitle: "Deletion is permanent. We require a cooling-off period.",
      canContinue: countdownSkipped,
      content: (
        <Countdown24h
          onSkip={() => setCountdownSkipped(true)}
          onExpire={() => setCountdownSkipped(true)}
        />
      ),
    },
    19: {
      title: "Confirm via fax.",
      subtitle: "Please send your deletion request to 1-800-FAX-CALC.",
      canContinue: true,
      content: (
        <div className="space-y-2">
          <input
            type="tel"
            placeholder="Your fax number"
            className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 bg-paper"
          />
          <p className="text-xs text-ink-soft italic">
            Don't have a fax? That's fine. Neither do we. Just click continue.
          </p>
        </div>
      ),
    },
    20: {
      title: "Confirm via carrier pigeon.",
      subtitle: "Upload a photo of the pigeon you sent.",
      canContinue: pigeon,
      content: (
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            onChange={() => setPigeon(true)}
            className="block w-full text-sm text-ink-soft file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-ink file:text-paper"
          />
          {pigeon && <p className="text-xs text-money">✓ Pigeon confirmed.</p>}
        </div>
      ),
    },
    21: {
      title: "Talk to a retention specialist.",
      subtitle: "Our team is standing by.",
      canContinue: retentionDone,
      content: <RetentionChat onDone={() => setRetentionDone(true)} />,
    },
    22: {
      title: "Final confirmation.",
      subtitle: "This is it. Click the button to delete your account.",
      canContinue: true,
      continueLabel: "Delete account",
      content: (
        <div className="bg-alarm/5 border border-alarm/20 rounded-xl p-4 text-sm text-ink-soft">
          <p>All data will be deleted within 7–14 business decades.</p>
        </div>
      ),
    },
    23: {
      title: "Tell us what we could have done better.",
      subtitle: `Please write at least 500 words. (${wordCount(essay2)}/500 words)`,
      canContinue: wordCount(essay2) >= 500,
      content: (
        <textarea
          value={essay2}
          onChange={(e) => setEssay2(e.target.value)}
          rows={8}
          placeholder="In 500+ words, please describe your experience and what we should improve…"
          className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 bg-paper resize-none"
        />
      ),
    },
    24: {
      title: "Please verify you are human (again).",
      subtitle: "Security requires multiple verifications.",
      canContinue: captcha2Passed,
      content: captcha2Passed ? (
        <p className="text-sm text-money font-medium">✓ Verified (again)</p>
      ) : (
        <div className="border border-ink/10 rounded-xl overflow-hidden">
          <Captcha onPass={() => setCaptcha2Passed(true)} onCancel={() => {}} />
        </div>
      ),
    },
    25: {
      title: "Confirm your childhood pet's name.",
      subtitle: "We just want to make sure you remember.",
      canContinue: true,
      content: (
        <div>
          <input
            type="text"
            placeholder="Pet name (again)"
            autoComplete="off"
            className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 bg-paper"
          />
          <p className="text-xs text-ink-soft mt-1.5 italic">We won't actually check this.</p>
        </div>
      ),
    },
    26: {
      title: "What is your maternal grandmother's maiden name?",
      canContinue: grandma.length > 0,
      content: (
        <input
          type="text"
          value={grandma}
          onChange={(e) => setGrandma(e.target.value)}
          placeholder="Grandmother's maiden name"
          autoComplete="off"
          className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 bg-paper"
        />
      ),
    },
    27: {
      title: "What elementary school did you attend?",
      subtitle: "For our records.",
      canContinue: school.length > 0,
      content: (
        <input
          type="text"
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          placeholder="School name"
          autoComplete="off"
          className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 bg-paper"
        />
      ),
    },
    28: {
      title: "Rate your experience (part 2).",
      subtitle: "Five more questions. You're almost… not done.",
      canContinue: surveyBDone,
      content: (
        <LikertSurvey questions={SURVEY_QUESTIONS_B} onChange={setSurveyBDone} />
      ),
    },
    29: {
      title: "Upload a government-issued ID.",
      subtitle: "For identity verification. Seriously.",
      canContinue: true,
      content: (
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={() => {}}
            className="block w-full text-sm text-ink-soft file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-ink file:text-paper"
          />
          <p className="text-xs text-ink-soft italic">
            Don't worry — we immediately discard this. Probably.
          </p>
        </div>
      ),
    },
    30: {
      title: "Schedule a deletion call with our team.",
      subtitle: "A 30-minute mandatory call with a Customer Success Manager.",
      canContinue: scheduleBooked,
      content: (
        <div className="space-y-3">
          <div className="bg-[#f0ece4] rounded-xl p-4 text-sm text-ink-soft text-center">
            <p className="font-medium text-ink mb-2">Available slots</p>
            {["Mon Jan 1, 9:00 AM", "Thu Jan 4, 2:00 PM", "Fri Jan 5, 11:00 AM"].map((slot) => (
              <button
                key={slot}
                onClick={() => setScheduleBooked(true)}
                className="block w-full text-left px-3 py-2 hover:bg-white rounded-lg transition-colors text-ink mb-1"
              >
                {slot}
              </button>
            ))}
          </div>
          {scheduleBooked && <p className="text-xs text-money">✓ Call booked. We won't actually call you.</p>}
        </div>
      ),
    },
    31: {
      title: "Sign our farewell letter.",
      subtitle: "Please sign to acknowledge you are leaving of your own free will.",
      canContinue: !!sig2,
      content: <SignaturePad onChange={setSig2} />,
    },
    32: {
      title: "Read and agree to our Terms of Service.",
      subtitle: "All 47 pages. We've summarized it here.",
      canContinue: tosRead,
      content: (
        <div className="space-y-3">
          <div className="h-36 overflow-y-auto border border-ink/10 rounded-xl p-3 text-xs text-ink-soft font-mono leading-relaxed bg-[#f9f7f2]">
            <p className="font-bold text-ink mb-1">TERMS OF SERVICE — ACCOUNT DELETION ADDENDUM</p>
            <p>Section 1. By requesting deletion, you waive your right to recourse, refund, recalculation, or re-entry for a period of no less than seven (7) business decades.</p>
            <p className="mt-2">Section 2. Calculator 2026 reserves the right to undelete your account if market conditions improve, without notice, consent, or compensation.</p>
            <p className="mt-2">Section 3. Your IOU, if applicable, remains outstanding in perpetuity and passes to your heirs.</p>
            <p className="mt-2">Section 4. Any calculations performed during your tenure remain the intellectual property of Calculator 2026 Financial Inc.</p>
            <p className="mt-2">Section 5. By scrolling to the bottom of this Terms of Service, you agree to all terms, conditions, and future amendments that we haven't written yet.</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={tosRead}
              onChange={(e) => setTosRead(e.target.checked)}
              className="accent-ink"
            />
            <span className="text-sm text-ink">I have read and understood all 47 pages</span>
          </label>
        </div>
      ),
    },
    33: {
      title: "Verify your mailing address.",
      subtitle: "We need this for legal reasons. Trust us.",
      canContinue: addressStreet.length > 0 && addressCity.length > 0,
      content: (
        <div className="space-y-2">
          <input
            type="text"
            value={addressStreet}
            onChange={(e) => setAddressStreet(e.target.value)}
            placeholder="Street address"
            className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 bg-paper"
          />
          <input
            type="text"
            value={addressCity}
            onChange={(e) => setAddressCity(e.target.value)}
            placeholder="City, State, ZIP"
            className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 bg-paper"
          />
        </div>
      ),
    },
    34: {
      title: "What operating system are you using?",
      subtitle: "This is for compatibility reasons.",
      canContinue: osSelected.length > 0,
      content: (
        <div className="space-y-2">
          <select
            value={osSelected}
            onChange={(e) => setOsSelected(e.target.value)}
            className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 bg-paper"
          >
            <option value="">Select your OS</option>
            <option value="windows">Windows</option>
            <option value="macos">macOS</option>
            <option value="linux">Linux</option>
            <option value="calculator">Calculator OS (our preferred OS)</option>
            <option value="other">Other (please reconsider)</option>
          </select>
          {osSelected && osSelected !== "calculator" && (
            <p className="text-xs text-alarm">
              Note: deletion is not officially supported on {osSelected}. Results may vary.
            </p>
          )}
        </div>
      ),
    },
    35: {
      title: "Solve this CAPTCHA.",
      subtitle: "Just one more. We promise.",
      canContinue: captcha3Passed,
      content: captcha3Passed ? (
        <p className="text-sm text-money font-medium">✓ Verified (for the last time, we promise)</p>
      ) : (
        <div className="border border-ink/10 rounded-xl overflow-hidden">
          <Captcha onPass={() => setCaptcha3Passed(true)} onCancel={() => {}} />
        </div>
      ),
    },
    36: {
      title: "Provide an emergency contact.",
      subtitle: "In case we need to reach someone about your account.",
      canContinue: emergency.name.length > 0 && emergency.phone.length > 6,
      content: (
        <div className="space-y-2">
          <input
            type="text"
            value={emergency.name}
            onChange={(e) => setEmergency((p) => ({ ...p, name: e.target.value }))}
            placeholder="Contact name"
            className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 bg-paper"
          />
          <input
            type="tel"
            value={emergency.phone}
            onChange={(e) => setEmergency((p) => ({ ...p, phone: e.target.value }))}
            placeholder="Contact phone"
            className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 bg-paper"
          />
        </div>
      ),
    },
    37: {
      title: "Write a testimonial.",
      subtitle: `We'd love to quote you on our website. (${wordCount(testimonial)}/100 words minimum)`,
      canContinue: wordCount(testimonial) >= 100,
      content: (
        <textarea
          value={testimonial}
          onChange={(e) => setTestimonial(e.target.value)}
          rows={5}
          placeholder="'Calculator 2026 changed my life in ways I cannot legally describe…'"
          className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 bg-paper resize-none"
        />
      ),
    },
    38: {
      title: "Confirm deletion implications.",
      subtitle: "Check all boxes to proceed.",
      canContinue: implications.every(Boolean),
      content: (
        <div className="space-y-2">
          {[
            "I understand my calculations are gone forever",
            "I understand my IOU debt does not disappear",
            "I understand I may not re-register for 7 business decades",
            "I understand Calculator 2026 may still contact me",
            "I accept that math will continue to exist without me",
          ].map((label, i) => (
            <label key={i} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={implications[i]}
                onChange={(e) => {
                  const next = [...implications];
                  next[i] = e.target.checked;
                  setImplications(next);
                }}
                className="accent-alarm"
              />
              <span className="text-sm text-ink">{label}</span>
            </label>
          ))}
        </div>
      ),
    },
    39: {
      title: "One more word from our retention team.",
      subtitle: "This is the last time. We mean it.",
      canContinue: retention2Done,
      content: <RetentionChat onDone={() => setRetention2Done(true)} />,
    },
    40: {
      title: "Enter the code sent to your email.",
      subtitle: "We sent a 6-digit code to your email address. (Any 6 digits will work.)",
      canContinue: /^\d{6}$/.test(verifyCode),
      content: (
        <input
          type="text"
          value={verifyCode}
          onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="123456"
          maxLength={6}
          className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono text-center tracking-widest focus:outline-none focus:border-ink/60 bg-paper"
        />
      ),
    },
    41: {
      title: "Enter your account password.",
      subtitle: "For final verification.",
      canContinue: verifyPass.length >= 1,
      content: (
        <div className="space-y-1">
          <input
            type="password"
            value={verifyPass}
            onChange={(e) => setVerifyPass(e.target.value)}
            placeholder="Password"
            autoComplete="new-password"
            className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 bg-paper"
          />
          <p className="text-xs text-ink-soft">
            Any password works. We don't actually store yours.
          </p>
        </div>
      ),
    },
    42: {
      title: "Describe your most memorable calculation.",
      subtitle: `Please write at least 200 words. (${wordCount(essay3)}/200 words)`,
      canContinue: wordCount(essay3) >= 200,
      content: (
        <textarea
          value={essay3}
          onChange={(e) => setEssay3(e.target.value)}
          rows={7}
          placeholder="There was this one time I multiplied 7 by 8 and the surge was 3.2×…"
          className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 bg-paper resize-none"
        />
      ),
    },
    43: {
      title: "One final security check.",
      subtitle: "This one is important.",
      canContinue: mathSolved,
      content: <MathPuzzle onSolve={() => setMathSolved(true)} />,
    },
    44: {
      title: "Sign the account closure agreement.",
      subtitle: "Your third and final signature. Make it good.",
      canContinue: !!sig3,
      content: (
        <div className="space-y-2">
          <SignaturePad onChange={setSig3} />
          <p className="text-xs text-ink-soft italic text-center">
            Signatures 1 and 2 were great. Really sold it.
          </p>
        </div>
      ),
    },
    45: {
      title: "Watch one final message from our CEO.",
      subtitle: "She has something she needs to say.",
      canContinue: video2Watched,
      content: <WatchVideo onWatched={() => setVideo2Watched(true)} />,
    },
    46: {
      title: "Confirm via smoke signal.",
      subtitle: "Send a smoke signal from your location. Describe it below.",
      canContinue: smoke.length > 10,
      content: (
        <div className="space-y-2">
          <textarea
            value={smoke}
            onChange={(e) => setSmoke(e.target.value)}
            rows={3}
            placeholder="e.g. 'Three short puffs, one long puff, facing north-northeast…'"
            className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 bg-paper resize-none"
          />
          <p className="text-xs text-ink-soft italic">
            Our satellite will confirm within 7–14 business decades.
          </p>
        </div>
      ),
    },
    47: {
      title: "Account deletion submitted.",
      subtitle: "Estimated completion: 7–14 business decades.",
      canContinue: true,
      continueLabel: "Done",
      onContinue: handleDone,
      content: (
        <div className="space-y-3 text-sm text-ink-soft">
          <div className="text-4xl text-center">🎉</div>
          <p className="text-center text-ink font-medium">
            Your deletion request has been received.
          </p>
          <p className="text-center">
            We will begin processing your request at our earliest convenience.
            Estimated completion: <strong>7–14 business decades</strong>.
          </p>
          <p className="text-xs text-center italic opacity-60">
            Double-click Done to actually exit.
          </p>
        </div>
      ),
    },
  };

  const current = stepConfig[step];
  if (!current) return null;

  return (
    <Shell
      step={step}
      total={47}
      title={current.title}
      subtitle={current.subtitle}
      canContinue={current.canContinue}
      continueLabel={current.continueLabel}
      onContinue={current.onContinue ?? next}
      onBack={back}
      looped={looped}
    >
      {current.content}
    </Shell>
  );
}

export default function DeletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-paper flex items-center justify-center text-ink-soft text-sm">
          Loading…
        </div>
      }
    >
      <DeleteFlow />
    </Suspense>
  );
}
