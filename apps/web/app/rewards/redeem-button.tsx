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
    <div className="mt-2">
      <button onClick={redeem} disabled={!affordable || pending}
        className="rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white disabled:bg-slate-300">
        Redeem
      </button>
      {msg && <p className="mt-1 text-xs text-slate-500">{msg}</p>}
    </div>
  );
}
