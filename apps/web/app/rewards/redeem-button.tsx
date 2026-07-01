"use client";
import { useState } from "react";

export function RedeemButton({ userId, rewardId, affordable }: { userId: string; rewardId: string; affordable: boolean }) {
  const [msg, setMsg] = useState<string | null>(null);
  async function redeem() {
    const res = await fetch("/api/redeem", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, rewardId }),
    });
    const data = await res.json();
    setMsg(data.ok ? "Requested! ✅" : data.error);
  }
  return (
    <div className="mt-2">
      <button onClick={redeem} disabled={!affordable}
        className="rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white disabled:bg-slate-300">
        Redeem
      </button>
      {msg && <p className="mt-1 text-xs text-slate-500">{msg}</p>}
    </div>
  );
}
