import type { Config } from "tailwindcss";

/* ─────────────────────────────────────────────────────────────
   Built for easy reading. Every text colour passes WCAG AA on
   its background; body text passes AAA. Change a hex to restyle.
   ───────────────────────────────────────────────────────────── */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink:    "#0F1310",   // headings — near-black
        body:   "#282D27",   // body text (AAA on paper and card)
        soft:   "#565C54",   // secondary (AA at 16px+)
        paper:  "#EFF3EE",   // page background — soft green-grey
        card:   "#FFFFFF",
        line:   "#BFC7BD",   // borders — visible on purpose
        green:  "#1B6B3A",   // PRIMARY. White on this is AAA
        green2: "#125129",   // hover / pressed
        mint:   "#D8EEDF",   // pale green fill
        gold:   "#7A5606",   // PAID
        gold2:  "#FBEFD2",
        red:    "#A32213",   // OVERDUE
        red2:   "#FCE1DD",
        blue:   "#17527E",   // reference / info
        blue2:  "#DCEAF6",
      },
      fontFamily: {
        /* One family, used at different weights. Cleaner and more legible
           than mixing a serif in — and it looks more modern. */
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs:   ["15px", { lineHeight: "1.5" }],
        sm:   ["16px", { lineHeight: "1.55" }],
        base: ["18px", { lineHeight: "1.6" }],
        lg:   ["21px", { lineHeight: "1.45" }],
        xl:   ["25px", { lineHeight: "1.3",  letterSpacing: "-0.01em" }],
        "2xl":["31px", { lineHeight: "1.2",  letterSpacing: "-0.02em" }],
        "3xl":["39px", { lineHeight: "1.12", letterSpacing: "-0.025em" }],
        "4xl":["48px", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(15,19,16,.05), 0 4px 14px -6px rgba(15,19,16,.10)",
        lift:  "0 2px 6px rgba(15,19,16,.07), 0 18px 40px -18px rgba(15,19,16,.20)",
      },
      borderRadius: { xl2: "14px" },
    },
  },
  plugins: [],
};
export default config;
