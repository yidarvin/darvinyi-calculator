"use client";
import { useEffect, useRef, useState } from "react";

type MetersProps = {
  tokens: number;
  waterLiters: number;
};

function AnimatedValue({ value, format }: { value: number; format: (v: number) => string }) {
  const [bump, setBump] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (value !== prev.current) {
      prev.current = value;
      setBump(true);
      const t = setTimeout(() => setBump(false), 200);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <span
      className="tabular-nums transition-transform"
      style={{ display: "inline-block", transform: bump ? "scale(1.15)" : "scale(1)" }}
    >
      {format(value)}
    </span>
  );
}

export default function Meters({ tokens, waterLiters }: MetersProps) {
  return (
    <div className="flex items-center gap-3 text-xs font-mono text-ink-soft">
      <span title="Water usage estimate">
        💧{" "}
        <AnimatedValue
          value={waterLiters}
          format={(v) => `${v.toFixed(1)} L`}
        />
      </span>
      <span title="Tokens consumed">
        🪙{" "}
        <AnimatedValue
          value={tokens}
          format={(v) => v.toLocaleString() + " tok"}
        />
      </span>
    </div>
  );
}
