import type { Config } from "tailwindcss";

/* ─────────────────────────────────────────────────────────────
   PALETTE — chosen for high contrast and easy reading.
   Every text colour here passes WCAG AA on its background,
   and the body text passes AAA. Change a hex to restyle the app.
   ───────────────────────────────────────────────────────────── */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink:    "#14160F",   // headings + body — near-black (AAA on white)
        body:   "#2C2F26",   // long text
        soft:   "#4E5347",   // secondary — still AA at 17px
        paper:  "#F7F6F1",   // page background
        card:   "#FFFFFF",   // panels
        line:   "#C9C7BB",   // borders — deliberately visible
        green:  "#254A32",   // PRIMARY. White text on this is AAA
        green2: "#38684A",   // hover
        mint:   "#E4EDE6",   // pale green fill
        gold:   "#6E5210",   // PAID — dark enough to read on white
        gold2:  "#F5EDD8",   // paid fill
        red:    "#8A2B1B",   // OVERDUE
        red2:   "#F8E4E0",   // overdue fill
      },
      fontFamily: {
        display: ["Instrument Serif", "Georgia", "Times New Roman", "serif"],
        sans:    ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      fontSize: {
        /* Deliberately large. Body text is 18px, never smaller than 16px. */
        xs:   ["15px", { lineHeight: "1.5" }],
        sm:   ["16px", { lineHeight: "1.55" }],
        base: ["18px", { lineHeight: "1.6" }],
        lg:   ["20px", { lineHeight: "1.5" }],
        xl:   ["24px", { lineHeight: "1.35" }],
        "2xl":["30px", { lineHeight: "1.25" }],
        "3xl":["38px", { lineHeight: "1.15" }],
        "4xl":["48px", { lineHeight: "1.1" }],
      },
      boxShadow: {
        panel: "0 1px 3px rgba(20,22,15,.06), 0 6px 18px -10px rgba(20,22,15,.12)",
        lift:  "0 2px 6px rgba(20,22,15,.08), 0 20px 44px -20px rgba(20,22,15,.22)",
      },
      borderRadius: { xl2: "12px" },
    },
  },
  plugins: [],
};
export default config;
