import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Invoices",
  description: "Write, send and keep track of invoices.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const LINKS = [
  { href: "/",         label: "Invoices", icon: "M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" },
  { href: "/calendar", label: "Calendar", icon: "M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Zm0 4h18M8 2v4m8-4v4" },
  { href: "/settings", label: "Settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3a8 8 0 0 1-.1 1.2l2 1.6-2 3.4-2.4-1a8 8 0 0 1-2 1.2l-.4 2.6h-4l-.4-2.6a8 8 0 0 1-2-1.2l-2.4 1-2-3.4 2-1.6A8 8 0 0 1 4 12c0-.4 0-.8.1-1.2l-2-1.6 2-3.4 2.4 1a8 8 0 0 1 2-1.2L11 3h4l.4 2.6a8 8 0 0 1 2 1.2l2.4-1 2 3.4-2 1.6c.1.4.1.8.1 1.2Z" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 shrink-0" aria-hidden>
      <path d={d} />
    </svg>
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
        <div className="lg:flex">

          {/* ── Sidebar, desktop ── */}
          <aside className="no-print sticky top-0 hidden h-screen w-[264px] shrink-0
                            flex-col gap-2 bg-card px-5 py-7 lg:flex">
            <Link href="/" className="mb-6 flex items-center gap-3 px-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl
                               bg-brand text-xl font-bold text-white shadow-brand">K</span>
              <span className="text-xl font-bold tracking-tight text-ink">Invoices</span>
            </Link>

            <Link href="/invoices/new" className="btn-primary mb-4 w-full">+ New invoice</Link>

            <nav className="flex flex-col gap-1">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="nav-item">
                  <Icon d={l.icon} />{l.label}
                </Link>
              ))}
            </nav>

            <p className="mt-auto rounded-2xl bg-paper px-4 py-3 text-sm text-soft">
              Tip: tell Claude about a job and the invoice appears here.
            </p>
          </aside>

          {/* ── Top bar, mobile ── */}
          <header className="no-print sticky top-0 z-20 flex items-center gap-3
                             bg-card px-4 py-3.5 shadow-card lg:hidden">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl2
                               bg-brand text-lg font-bold text-white">K</span>
              <span className="text-xl font-bold tracking-tight text-ink">Invoices</span>
            </Link>
            <Link href="/invoices/new"
                  className="btn-primary ml-auto !min-h-[46px] !rounded-xl2 !px-4 text-base">
              + New
            </Link>
          </header>

          <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-7 sm:pt-9 lg:px-10 lg:pb-14">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>
        </div>

        {/* ── Bottom tab bar, mobile ── */}
        <nav className="no-print fixed inset-x-0 bottom-0 z-20 flex bg-card
                        px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgba(11,18,32,.18)] lg:hidden">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}
                  className="flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-3
                             text-sm font-semibold text-body">
              <Icon d={l.icon} />{l.label}
            </Link>
          ))}
        </nav>
      </body>
    </html>
  );
}
