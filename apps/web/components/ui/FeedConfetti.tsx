"use client";

import { useEffect, useState } from "react";
import { Confetti } from "./Confetti";

const KEY = "kudos:lastSeenId";

/**
 * Fires a one-time confetti burst when the newest kudos in the feed is one this
 * browser has not seen before (tracked in sessionStorage), so a fresh piece of
 * recognition greets the viewer with a small celebration.
 */
export function FeedConfetti({ latestId }: { latestId?: string }) {
  const [fire, setFire] = useState(false);

  useEffect(() => {
    if (!latestId) return;
    let seen: string | null = null;
    try {
      seen = window.sessionStorage.getItem(KEY);
      window.sessionStorage.setItem(KEY, latestId);
    } catch {
      // sessionStorage unavailable (private mode / SSR mismatch) — skip celebration.
      return;
    }
    if (seen && seen !== latestId) setFire(true);
  }, [latestId]);

  return <Confetti fire={fire} />;
}
