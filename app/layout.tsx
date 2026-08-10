import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar, TopBar, BottomTabs } from "@/components/Nav";

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
          <Sidebar />
          <TopBar />

          <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-7 sm:pt-9 lg:px-10 lg:pb-14">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>
        </div>

        <BottomTabs />
      </body>
    </html>
  );
}
