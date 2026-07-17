// Signature purple→teal gradient pill used to surface the recognized value.
export function ValueBadge({ emoji, label }: { emoji?: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-brand px-3 py-1 text-xs font-display font-semibold text-white">
      {emoji && <span aria-hidden="true">{emoji}</span>}
      {label}
    </span>
  );
}
