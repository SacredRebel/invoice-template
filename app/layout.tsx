import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const display = Instrument_Serif({
  weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap",
});
const sans = Inter({
  subsets: ["latin"], variable: "--font-sans", display: "swap",
});

export const metadata: Metadata = {
  title: "Invoices",
  description: "Write, send and track invoices.",
};

function Nav() {
  const links = [
    { href: "/", label: "Invoices" },
    { href: "/calendar", label: "Calendar" },
    { href: "/settings", label: "Settings" },
  ];
  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
        <Link href="/" className="flex items-baseline gap-2.5">
          <span className="h-2 w-2 rounded-full bg-sage" />
          <span className="font-display text-[22px] leading-none">Invoices</span>
        </Link>
        <nav className="flex items-center gap-6 text-[14px] text-slate">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-sage transition">
              {l.label}
            </Link>
          ))}
        </nav>
        <Link href="/invoices/new" className="btn-primary ml-auto">New invoice</Link>
      </div>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <Nav />
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        <footer className="no-print mx-auto max-w-6xl px-6 pb-12 pt-4 text-[12px] text-mute">
          Every invoice is saved to GitHub. Nothing is ever lost.
        </footer>
      </body>
    </html>
  );
}
