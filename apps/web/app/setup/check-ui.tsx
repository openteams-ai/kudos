import type { ReactNode } from "react";

// Presentational, server-rendered building blocks for the /setup checklist.
// Status is never conveyed by color alone: every badge pairs a distinct glyph
// with a distinct visible word, and the word always renders in near-black ink
// so contrast passes WCAG 2.2 AA regardless of the tint behind it.

export type Status = "pass" | "warn" | "fail" | "info";

const BADGE: Record<Status, { glyph: string; word: string; wrap: string; glyphClass: string }> = {
  pass: { glyph: "✓", word: "Ready", wrap: "bg-teal/15", glyphClass: "text-teal-ink" },
  warn: { glyph: "!", word: "Check", wrap: "bg-gold/25", glyphClass: "text-ink" },
  fail: { glyph: "✕", word: "Set up", wrap: "bg-primary/12", glyphClass: "text-primary" },
  info: { glyph: "•", word: "Info", wrap: "bg-ink/5", glyphClass: "text-ink/60" },
};

/** Small pill: colored glyph + ink word. Both are real text for screen readers. */
export function StatusBadge({ status }: { status: Status }) {
  const b = BADGE[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-display font-semibold text-ink ${b.wrap}`}
    >
      <span aria-hidden="true" className={`text-sm leading-none ${b.glyphClass}`}>
        {b.glyph}
      </span>
      {b.word}
    </span>
  );
}

export type CheckItem = {
  status: Status;
  label: string;
  /** Current state, shown always. */
  detail: ReactNode;
  /** What to do about it — shown for everything except a clean pass. */
  fix?: ReactNode;
};

/** One diagnostic row inside a checklist. Rendered as a list item by CheckList. */
export function CheckRow({ status, label, detail, fix }: CheckItem) {
  return (
    <li className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:gap-4">
      <div className="flex items-center gap-3 sm:w-32 sm:shrink-0">
        <StatusBadge status={status} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-semibold text-ink">{label}</p>
        <p className="mt-0.5 text-sm text-ink/70">{detail}</p>
        {status !== "pass" && fix ? (
          <p className="mt-1.5 text-sm text-ink/60">
            <span className="font-semibold text-ink/80">Fix:</span> {fix}
          </p>
        ) : null}
      </div>
    </li>
  );
}

/** A titled card wrapping a list of check rows with dividers. */
export function CheckList({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-borderx bg-card shadow-card">
      <h2 className="border-b border-borderx px-5 py-3 font-display text-xs font-semibold uppercase tracking-wide text-ink/50">
        {title}
      </h2>
      <ul className="divide-y divide-borderx">{children}</ul>
    </section>
  );
}

/** Inline monospace token — used for env var names, commands, and file paths. */
export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-ink/5 px-1.5 py-0.5 font-body text-[0.85em] text-ink/80">
      {children}
    </code>
  );
}
