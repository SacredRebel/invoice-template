"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const NEXT: Record<string, { to: string; label: string }> = {
  draft:   { to: "sent", label: "Mark as sent" },
  sent:    { to: "paid", label: "✓ Mark as paid" },
  overdue: { to: "paid", label: "✓ Mark as paid" },
  paid:    { to: "sent", label: "Mark as unpaid" },
};

export default function InvoiceActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const step = NEXT[status] ?? NEXT.draft;

  async function go() {
    setBusy(true); setErr(null);
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: step.to }),
    });
    setBusy(false);
    if (!res.ok) { setErr((await res.json()).error ?? "Could not save."); return; }
    router.refresh();
  }

  return (
    <div className="ml-auto flex flex-wrap items-center gap-3">
      {err && <span className="text-sm font-semibold text-red">{err}</span>}
      <button onClick={go} disabled={busy} className="btn-quiet">
        {busy ? "Saving…" : step.label}
      </button>
    </div>
  );
}
