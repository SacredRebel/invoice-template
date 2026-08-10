import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

/* Fonts load via <link> rather than next/font so the BUILD never depends on
   reaching Google. If the fonts are slow the app still renders in the fallback
   face — it degrades, it doesn't fail. */

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
            <Link key={l.href} href={l.href} className="transition hover:text-sage">
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap"
        />
      </head>
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
