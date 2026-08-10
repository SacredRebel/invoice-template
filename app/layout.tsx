import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Invoices",
  description: "Write, send and keep track of invoices.",
};

/* Without this the phone renders a desktop-width page and everything
   is tiny and cut off. This is the mobile fix. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,       // never block pinch-zoom
  viewportFit: "cover",
};

function Nav() {
  const links = [
    { href: "/", label: "Invoices" },
    { href: "/calendar", label: "Calendar" },
    { href: "/settings", label: "Settings" },
  ];
  return (
    <header className="no-print border-b-2 border-line bg-card">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
          <Link href="/" className="text-2xl font-bold tracking-tight text-ink">Invoices</Link>
          <Link href="/invoices/new" className="btn-primary ml-auto !px-5 text-base">
            + New
          </Link>
        </div>
        <nav className="-mx-1 flex flex-wrap gap-1 pb-2">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
                  className="rounded-lg px-4 py-2.5 text-base font-bold
                             text-body hover:bg-mint hover:text-green">
              {l.label}
            </Link>
          ))}
        </nav>
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />
      </head>
      <body>
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      </body>
    </html>
  );
}
