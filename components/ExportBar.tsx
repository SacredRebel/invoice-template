"use client";

import { useState } from "react";
import { toPlainText, toHTML, download } from "@/lib/exporters";
import type { Invoice, Business } from "@/lib/types";

export default function ExportBar({ invoice, business }:{ invoice: Invoice; business: Business }) {
  const [said, setSaid] = useState<string | null>(null);

  const flash = (m: string) => { setSaid(m); setTimeout(() => setSaid(null), 2600); };

  async function copyText() {
    const text = toPlainText(invoice, business);
    try {
      await navigator.clipboard.writeText(text);
      flash("Copied. Paste it into an email.");
    } catch {
      // Older browsers and non-secure contexts
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); ta.remove();
      flash("Copied. Paste it into an email.");
    }
  }

  async function copyFormatted() {
    const html = toHTML(invoice, business);
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html":  new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([toPlainText(invoice, business)], { type: "text/plain" }),
        }),
      ]);
      flash("Copied with formatting. Paste into your email.");
    } catch {
      await copyText();
    }
  }

  const saveWord = () => {
    download(`Invoice-${invoice.number}.doc`, toHTML(invoice, business), "application/msword");
    flash("Downloaded. It opens in Word.");
  };

  const buttons = [
    { label: "Print / Save as PDF", onClick: () => window.print(), primary: true,
      hint: "Choose “Save as PDF” in the print box" },
    { label: "Download for Word",   onClick: saveWord,   hint: "Opens in Microsoft Word" },
    { label: "Copy for email",      onClick: copyFormatted, hint: "Keeps the layout" },
    { label: "Copy as plain text",  onClick: copyText,   hint: "For a text message or notes" },
  ];

  return (
    <div className="no-print panel p-5">
      <h2 className="text-lg font-semibold text-ink">Send this invoice</h2>
      <p className="mt-1 text-sm text-soft">Pick whichever suits how you&rsquo;re sending it.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {buttons.map((b) => (
          <button key={b.label} onClick={b.onClick}
                  className={`${b.primary ? "btn-primary" : "btn-quiet"} w-full flex-col !items-start !py-3 text-left`}>
            <span>{b.label}</span>
            <span className={`text-xs font-normal ${b.primary ? "text-white/80" : "text-soft"}`}>{b.hint}</span>
          </button>
        ))}
      </div>

      <div aria-live="polite" className="mt-3 min-h-[28px]">
        {said && (
          <p className="rounded-2xl bg-mint px-4 py-2 text-sm font-semibold text-green">✓ {said}</p>
        )}
      </div>
    </div>
  );
}
