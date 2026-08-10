"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const NEXT: Record<string, { to: string; label: string }> = {
  draft:   { to: "sent", label: "Mark as sent" },
  sent:    { to: "paid", label: "\u2713 Mark as paid" },
  overdue: { to: "paid", label: "\u2713 Mark as paid" },
  paid:    { to: "sent", label: "Mark as unpaid" },
};

export default function InvoiceActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "status" | "delete">(null);
  const [err, setErr] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const step = NEXT[status] ?? NEXT.draft;

  async function setStatus() {
    setBusy("status"); setErr(null);
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: step.to }),
    });
    setBusy(null);
    if (!res.ok) { setErr((await res.json()).error ?? "Could not save."); return; }
    router.refresh();
  }

  async function remove() {
    setBusy("delete"); setErr(null);
    const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) { setErr((await res.json()).error ?? "Could not delete."); return; }
    router.push("/");
  }

  return (
    <div className="ml-auto flex flex-wrap items-center gap-3">
      {err && <span className="text-base font-semibold text-red">{err}</span>}

      <Link href={`/invoices/${id}/edit`} className="btn-quiet">Edit</Link>

      <button onClick={setStatus} disabled={busy !== null} className="btn-quiet">
        {busy === "status" ? "Saving\u2026" : step.label}
      </button>

      {confirming ? (
        <span className="flex items-center gap-2">
          <span className="text-base font-semibold text-ink">Delete it?</span>
          <button onClick={remove} disabled={busy !== null} className="btn-danger !min-h-[48px] !px-4">
            {busy === "delete" ? "Deleting\u2026" : "Yes, delete"}
          </button>
          <button onClick={() => setConfirming(false)} className="btn-ghost !min-h-[48px] !px-4">
            Keep it
          </button>
        </span>
      ) : (
        <button onClick={() => setConfirming(true)} className="btn-ghost">Delete</button>
      )}
    </div>
  );
}
