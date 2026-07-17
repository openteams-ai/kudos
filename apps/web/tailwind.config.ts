import type { Config } from "tailwindcss";

// Nebari brand palette — mirrors the CSS variables in globals.css so that
// Tailwind utilities and raw CSS always agree. See the UI refactor design spec.
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#BA18DA", // purple — buttons, links, badges
        teal: "#20AAA1", // points / success
        gold: "#EAB54E", // celebration / boosts
        ink: "#0F1015", // primary text
        canvas: "#FBF7FB", // warm lilac-white page background
        card: "#FFFFFF",
        borderx: "#F0E1F5", // soft purple-tinted borders
      },
      borderRadius: {
        card: "18px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 10px 26px rgba(186,24,218,.10)",
        cardHover: "0 14px 32px rgba(186,24,218,.18)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        // Signature purple→teal gradient for value badges + hero accents.
        brand: "linear-gradient(90deg,#BA18DA,#20AAA1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
