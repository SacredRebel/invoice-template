import type { Config } from "tailwindcss";

/* ─────────────────────────────────────────────────────────────
   THE PALETTE — change these hex values to restyle the whole app.
   Everything (dashboard, buttons, the invoice itself) reads from here.
   ───────────────────────────────────────────────────────────── */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink:    "#1B1D1A",   // main text — near-black, warm
        slate:  "#565B54",   // secondary text
        mute:   "#8A9086",   // faint text, labels
        paper:  "#FBFAF7",   // page background
        card:   "#FFFFFF",   // panels
        line:   "#E4E3DC",   // hairlines and borders
        sage:   "#3F5347",   // PRIMARY — deep eucalyptus
        moss:   "#6E8472",   // lighter green
        wash:   "#EEF1EC",   // pale green tint
        amber:  "#B8873A",   // paid / money highlight
        rust:   "#9C5B3F",   // overdue
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans:    ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(27,29,26,.04), 0 8px 24px -12px rgba(27,29,26,.10)",
        lift:  "0 2px 4px rgba(27,29,26,.05), 0 18px 40px -18px rgba(27,29,26,.18)",
      },
      borderRadius: { xl2: "14px" },
    },
  },
  plugins: [],
};
export default config;
