"use client";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/state";

export function RestartButton() {
  const reset = useStore((s) => s.reset);
  const router = useRouter();

  return (
    <button
      onClick={() => { reset(); router.replace("/"); }}
      className="text-xs text-ink/40 hover:text-ink/70 transition-colors"
    >
      Restart
    </button>
  );
}
