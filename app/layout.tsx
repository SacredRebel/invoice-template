import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Invoices",
  description: "Write, send and keep track of invoices.",
};

function Nav() {
  const links = [
    { href: "/", label: "Invoices" },
    { href: "/calendar", label: "Calendar" },
    { href: "/settings", label: "Settings" },
  ];
  return (
    <header className="no-print border-b-2 border-line bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-6 py-4">
        <Link href="/" className="font-display text-2xl text-ink">Invoices</Link>
        <nav className="flex items-center gap-6 text-base font-semibold">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
                  className="rounded px-1 py-2 text-body underline-offset-4 hover:text-green hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
        <Link href="/invoices/new" className="btn-primary ml-auto">+ New invoice</Link>
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
        <link rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Inter:wght@400;500;600;700&display=swap" />
      </head>
      <body>
        <Nav />
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
