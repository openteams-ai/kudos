// Deterministic tint from the name so the same person always gets the same color.
const TINTS = [
  "#BA18DA",
  "#20AAA1",
  "#EAB54E",
  "#7C3AED",
  "#EC4899",
  "#0EA5E9",
  "#F97316",
  "#10B981",
];

function tintFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-12 w-12 text-base" };

export function Avatar({
  name,
  avatarUrl,
  size = "md",
}: {
  name: string;
  avatarUrl?: string | null;
  size?: keyof typeof sizes;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizes[size]} shrink-0 rounded-pill object-cover`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-pill font-display font-semibold text-white`}
      style={{ backgroundColor: tintFor(name) }}
    >
      {initials(name)}
    </span>
  );
}
