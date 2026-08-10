import type { Config } from "tailwindcss";

/* ───────────────────────────────────────────────────
   Crisp neutrals + one vivid accent. The greys are COOL and
   neutral — no green mixed in, which is what made the old
   palette look muddy. Every text colour still passes WCAG AA
   on its background; body text passes AAA.
   ─────────────────────────────────────────────────── */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink:    "#0B1220",   // headings — cool near-black (19:1 on white)
        body:   "#334155",   // body text (10.9:1 — AAA)
        soft:   "#5B6B7B",   // secondary (5.3:1 — AA)
        paper:  "#EFF1F5",   // page background — soft, not stark white
        card:   "#FFFFFF",
        line:   "#CBD5E1",   // borders — visible but not heavy
        brand:  "#2563EB",   // PRIMARY — the blue from the reference app
        brand2: "#1D4ED8",   // hover / pressed
        tint:   "#DBEAFE",   // pale brand fill
        forest: "#1D4ED8",   // hero surface — white on it passes AA
        forest2:"#3B82F6",   // lighter end of the hero gradient
        green:  "#067647",   // PAID only. Nothing else is green.
        green2: "#055C38",
        mint:   "#D1FAE5",   // pale green fill — paid
        wash:   "#F5F6F8",   // panel inside a card
        gold:   "#B45309",   // DRAFT / caution
        gold2:  "#FEF3C7",
        red:    "#B91C1C",   // OVERDUE
        red2:   "#FEE2E2",
        blue:   "#0E7490",   // REFERENCE / info — teal, distinct from the brand
        blue2:  "#CFFAFE",
        plum:   "#7E22CE",   // money already received
        plum2:  "#F3E8FF",
        field:  "#FBFCFD",   // input fill — lighter than the card it sits on
        fieldline: "#94A3B8", // input edge — visibly darker than a divider
      },
      fontFamily: {
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
        card:  "0 1px 2px rgba(11,18,32,.04), 0 8px 24px -12px rgba(11,18,32,.10)",
        lift:  "0 2px 8px rgba(11,18,32,.05), 0 32px 64px -32px rgba(11,18,32,.28)",
        brand: "0 8px 20px -8px rgba(37,99,235,.45)",
        green: "0 8px 20px -8px rgba(6,118,71,.40)",
        panel: "0 1px 2px rgba(11,18,32,.04), 0 8px 24px -12px rgba(11,18,32,.10)",
      },
      borderRadius: { xl2: "20px", "3xl": "24px" },
    },
  },
  plugins: [],
};
export default config;
