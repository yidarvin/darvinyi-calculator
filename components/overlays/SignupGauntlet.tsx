"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/state';
import { Captcha } from './Captcha';

type Props = { onClose: () => void };

type FormData = {
  email: string;
  emailConfirm: string;
  password: string;
  passwordConfirm: string;
  firstName: string;
  lastName: string;
  phone: string;
  dob: string;
  maiden: string;
  photo: string;
};

const INITIAL: FormData = {
  email: '', emailConfirm: '', password: '', passwordConfirm: '',
  firstName: '', lastName: '', phone: '', dob: '', maiden: '', photo: '',
};

const STEPS = [
  { label: 'Email address', field: 'email', type: 'email', placeholder: 'you@example.com' },
  { label: 'Confirm email', field: 'emailConfirm', type: 'email', placeholder: 'Same as above' },
  { label: 'Password', field: 'password', type: 'password', placeholder: 'Min 8 chars' },
  { label: 'Confirm password', field: 'passwordConfirm', type: 'password', placeholder: 'Same as above' },
  { label: 'First name', field: 'firstName', type: 'text', placeholder: 'Given name' },
  { label: 'Last name', field: 'lastName', type: 'text', placeholder: 'Family name' },
  { label: 'Verify phone number via fax', field: 'phone', type: 'tel', placeholder: '+1 555 000 0000', isFax: true },
  { label: 'Date of birth', field: 'dob', type: 'date', placeholder: '' },
  { label: "Mother's maiden name", field: 'maiden', type: 'text', placeholder: 'For security questions' },
  { label: 'Upload a photo of yourself holding today\'s newspaper', field: 'photo', type: 'file', placeholder: '' },
  { label: 'Final security check', field: '', type: 'captcha', placeholder: '' },
] as const;

export function SignupGauntlet({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(INITIAL);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [captchaPassed, setCaptchaPassed] = useState(false);
  const setSignupCompleted = useStore((s) => s.setSignupCompleted);
  const setCaptchaPassedGlobal = useStore((s) => s.setCaptchaPassed);

  const totalSteps = STEPS.length;
  const current = STEPS[step];

  function validate(): boolean {
    const field = current.field as keyof FormData | '';
    if (!field) return captchaPassed;
    const val = data[field as keyof FormData];
    if (typeof val === 'string' && val.trim().length < 1) {
      setError('This field is required.');
      return false;
    }
    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        setError('Please enter a valid email address.');
        return false;
      }
    }
    if (field === 'emailConfirm' && data.email !== data.emailConfirm) {
      setError('Emails do not match.');
      return false;
    }
    if (field === 'password' && data.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return false;
    }
    if (field === 'passwordConfirm' && data.password !== data.passwordConfirm) {
      setError('Passwords do not match.');
      return false;
    }
    if (field === 'dob') {
      const dob = new Date(data.dob);
      if (isNaN(dob.getTime())) {
        setError('Please enter a valid date.');
        return false;
      }
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      if (age < 13) {
        setError('You must be at least 13 years old to use Calculator 2026.');
        return false;
      }
      if (age > 120) {
        setError('Please enter a valid date of birth.');
        return false;
      }
    }
    return true;
  }

  function next() {
    setError('');
    if (!validate()) return;
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  }

  function back() {
    setError('');
    setStep((s) => Math.max(0, s - 1));
  }

  function finish() {
    setSignupCompleted();
    setDone(true);
    setTimeout(onClose, 2500);
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-paper rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center"
        >
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-xl font-semibold text-ink">Welcome to Calculator 2026!</h2>
          <p className="text-ink-soft text-sm mt-2">Thanks for joining. Let's calculate!</p>
        </motion.div>
      </div>
    );
  }

  // Step 11: inline captcha
  if (current.type === 'captcha') {
    if (!captchaPassed) {
      return (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4">
          <div className="bg-paper rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-ink-soft font-mono">Step {step + 1} of {totalSteps}</span>
                <button onClick={onClose} className="text-xs text-ink-soft/50 hover:text-ink-soft">
                  Continue without signing up
                </button>
              </div>
              <div className="h-1 bg-ink/10 rounded-full">
                <div
                  className="h-full bg-ink rounded-full transition-all"
                  style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                />
              </div>
            </div>
            <Captcha onPass={() => { setCaptchaPassedGlobal(); setCaptchaPassed(true); }} onCancel={onClose} />
          </div>
        </div>
      );
    }
    // Captcha passed — show finish step
    return (
      <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-paper rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        >
          <p className="text-sm text-ink-soft text-center mb-4">You're verified! Click Finish to complete signup.</p>
          <div className="flex gap-2">
            <button onClick={back} className="px-4 py-2 text-sm text-ink-soft border border-ink/20 rounded-full">
              Back
            </button>
            <button onClick={finish} className="flex-1 py-2 bg-ink text-paper rounded-full font-semibold text-sm">
              Finish
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const fieldKey = current.field as keyof FormData;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.18 }}
          className="bg-paper rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        >
          {/* Progress */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-ink-soft font-mono">Step {step + 1} of {totalSteps}</span>
              <button
                onClick={onClose}
                className="text-[10px] text-ink-soft/40 hover:text-ink-soft/70 transition-colors"
              >
                Continue without signing up
              </button>
            </div>
            <div className="h-1 bg-ink/10 rounded-full">
              <div
                className="h-full bg-ink rounded-full transition-all duration-300"
                style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          <label className="block mb-1 text-sm font-semibold text-ink">
            {current.label}
          </label>

          {current.type === 'file' ? (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setData((d) => ({ ...d, photo: file.name }));
                  setError('');
                }
              }}
              className="block w-full text-sm text-ink-soft file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-ink file:text-paper mb-4"
            />
          ) : (
            <input
              type={current.type}
              value={data[fieldKey] ?? ''}
              placeholder={current.placeholder}
              onChange={(e) => {
                setData((d) => ({ ...d, [fieldKey]: e.target.value }));
                setError('');
              }}
              className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-ink/60 mb-1 bg-paper"
              autoComplete="off"
            />
          )}


          {error && <p className="text-xs text-alarm mb-3">{error}</p>}

          <div className="flex gap-2 mt-4">
            {step > 0 && (
              <button
                onClick={back}
                className="px-4 py-2.5 text-sm text-ink-soft border border-ink/20 rounded-full hover:border-ink/40 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              className="flex-1 py-2.5 bg-ink text-paper rounded-full font-semibold text-sm"
            >
              {step === totalSteps - 1 ? 'Finish' : 'Next →'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default SignupGauntlet;
