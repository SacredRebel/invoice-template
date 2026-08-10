"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const NEXT: Record<string, { to: string; label: string }> = {
  draft: { to: "sent",  label: "Mark as sent" },
  sent:  { to: "paid",  label: "Mark as paid" },
  overdue:{ to: "paid", label: "Mark as paid" },
  paid:  { to: "sent",  label: "Reopen" },
};

export default function InvoiceActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const step = NEXT[status] ?? NEXT.draft;

  async function setStatus(to: string) {
    setBusy(true);
    await fetch(`/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: to }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="ml-auto flex gap-2">
      <button onClick={() => setStatus(step.to)} disabled={busy} className="btn-quiet">
        {busy ? "Saving…" : step.label}
      </button>
      <button onClick={() => window.print()} className="btn-primary">
        Print or save as PDF
      </button>
    </div>
  );
}
