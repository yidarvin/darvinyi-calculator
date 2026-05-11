"use client";
import { useStore } from "./state";

type SoundName = "click" | "ding" | "levelup" | "alarm" | "whoosh" | "boing";

let _ctx: AudioContext | null = null;
function ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  return _ctx;
}

function playClick(ac: AudioContext) {
  const buf = ac.createBuffer(1, ac.sampleRate * 0.03, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.2));
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  const gain = ac.createGain();
  gain.gain.value = 0.18;
  src.connect(gain);
  gain.connect(ac.destination);
  src.start();
}

function playDing(ac: AudioContext) {
  const t = ac.currentTime;
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t + i * 0.06);
    gain.gain.linearRampToValueAtTime(0.22, t + i * 0.06 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.5);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t + i * 0.06);
    osc.stop(t + i * 0.06 + 0.5);
  });
}

function playLevelUp(ac: AudioContext) {
  const t = ac.currentTime;
  [330, 392, 494, 659].forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t + i * 0.1);
    gain.gain.linearRampToValueAtTime(0.2, t + i * 0.1 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.35);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t + i * 0.1);
    osc.stop(t + i * 0.1 + 0.35);
  });
}

function playAlarm(ac: AudioContext) {
  const t = ac.currentTime;
  for (let rep = 0; rep < 3; rep++) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(440, t + rep * 0.5);
    osc.frequency.linearRampToValueAtTime(880, t + rep * 0.5 + 0.4);
    gain.gain.setValueAtTime(0.25, t + rep * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, t + rep * 0.5 + 0.45);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t + rep * 0.5);
    osc.stop(t + rep * 0.5 + 0.45);
  }
}

function playWhoosh(ac: AudioContext) {
  const t = ac.currentTime;
  const buf = ac.createBuffer(1, ac.sampleRate * 0.2, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1800, t);
  filter.frequency.exponentialRampToValueAtTime(400, t + 0.2);
  filter.Q.value = 0.5;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  src.start();
}

function playBoing(ac: AudioContext) {
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(80, t);
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.12);
  osc.frequency.exponentialRampToValueAtTime(200, t + 0.35);
  gain.gain.setValueAtTime(0.4, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.5);
}

const players: Record<SoundName, (ac: AudioContext) => void> = {
  click: playClick,
  ding: playDing,
  levelup: playLevelUp,
  alarm: playAlarm,
  whoosh: playWhoosh,
  boing: playBoing,
};

export function playSound(name: SoundName) {
  if (typeof window === "undefined") return;
  const { flags } = useStore.getState();
  if (!flags.soundEnabled) return;
  try {
    const ac = ctx();
    if (ac.state === "suspended") ac.resume();
    players[name](ac);
  } catch {
    // AudioContext not available — silently ignore
  }
}

export function useSound(name: SoundName): () => void {
  return () => playSound(name);
}
