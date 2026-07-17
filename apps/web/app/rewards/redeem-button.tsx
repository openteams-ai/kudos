"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function RedeemButton({ rewardId, affordable }: { rewardId: string; affordable: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function redeem() {
    setPending(true);
    try {
      const res = await fetch("/api/redeem", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId }),
      });
      const data = await res.json();
      setMsg(data.ok ? "Requested! ✅" : data.error);
      if (data.ok) router.refresh();
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="mt-4">
      <button
        onClick={redeem}
        disabled={!affordable || pending}
        className="w-full rounded-pill bg-primary px-4 py-2 text-sm font-display font-semibold text-white shadow-card transition hover:bg-[#a012c0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:bg-borderx disabled:text-ink/40 disabled:shadow-none"
      >
        {pending ? "Redeeming…" : "Redeem"}
      </button>
      {msg && <p className="mt-2 text-xs text-ink/50">{msg}</p>}
    </div>
  );
}
