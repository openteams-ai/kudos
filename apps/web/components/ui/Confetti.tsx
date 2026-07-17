"use client";

import { useEffect, useState } from "react";

const COLORS = ["#BA18DA", "#20AAA1", "#EAB54E", "#EC4899", "#7C3AED"];
const PIECES = 80;
const DURATION = 1400;

type Piece = {
  id: number;
  left: number;
  color: string;
  size: number;
  delay: number;
  dx: number;
  dy: number;
  rot: number;
};

function buildPieces(): Piece[] {
  return Array.from({ length: PIECES }, (_, id) => ({
    id,
    left: Math.random() * 100,
    color: COLORS[id % COLORS.length],
    size: 6 + Math.random() * 8,
    delay: Math.random() * 150,
    dx: (Math.random() - 0.5) * 240,
    dy: 320 + Math.random() * 260,
    rot: (Math.random() - 0.5) * 720,
  }));
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Dependency-free celebratory burst. Renders a fixed, non-interactive overlay of
 * falling confetti pieces whenever `fire` transitions to true, then clears itself.
 * Fully disabled under prefers-reduced-motion.
 */
export function Confetti({ fire }: { fire: boolean }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!fire || prefersReducedMotion()) return;
    setPieces(buildPieces());
    const t = setTimeout(() => setPieces([]), DURATION + 200);
    return () => clearTimeout(t);
  }, [fire]);

  if (pieces.length === 0) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            top: "-16px",
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            backgroundColor: p.color,
            borderRadius: "2px",
            animation: `kudos-confetti ${DURATION}ms ${p.delay}ms ease-out forwards`,
            ["--dx" as string]: `${p.dx}px`,
            ["--dy" as string]: `${p.dy}px`,
            ["--rot" as string]: `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}
