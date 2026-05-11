"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const KONAMI = [
  "ArrowUp", "ArrowUp",
  "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight",
  "ArrowLeft", "ArrowRight",
  "b", "a",
];

export function KonamiListener() {
  const router = useRouter();
  const seqRef = useRef<string[]>([]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const key = e.key;
      const seq = seqRef.current;
      seq.push(key);
      if (seq.length > KONAMI.length) seq.shift();
      if (
        seq.length === KONAMI.length &&
        seq.every((k, i) => k === KONAMI[i])
      ) {
        seqRef.current = [];
        router.push("/dev");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return null;
}
