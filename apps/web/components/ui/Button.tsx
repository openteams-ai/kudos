import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "subtle";

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill px-5 py-2 text-sm font-display font-semibold transition " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white shadow-card hover:bg-[#a012c0]",
  subtle: "border border-borderx bg-card text-ink hover:border-primary hover:text-primary",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
