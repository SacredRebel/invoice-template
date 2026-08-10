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
  const [busy, setBusy] = useState<null | "status" | "void">(null);
  const [err, setErr] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const step = NEXT[status] ?? NEXT.draft;
  const voided = status === "void";

  async function put(body: any, which: "status" | "void") {
    setBusy(which); setErr(null);
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(null);
    if (!res.ok) { setErr((await res.json()).error ?? "Could not save."); return; }
    setConfirming(false);
    router.refresh();
  }

  if (voided) {
    return (
      <div className="flex w-full flex-col gap-3 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
        {err && <span className="text-base font-semibold text-red">{err}</span>}
        <span className="text-base text-soft">This invoice was voided.</span>
        <button onClick={() => put({ status: "draft" }, "status")} disabled={busy !== null}
                className="btn-quiet">
          {busy ? "Saving\u2026" : "Bring it back"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
      {err && <span className="text-base font-semibold text-red">{err}</span>}

      <Link href={`/invoices/${id}/edit`} className="btn-quiet w-full sm:w-auto">Edit</Link>

      <button onClick={() => put({ status: step.to }, "status")} disabled={busy !== null}
              className="btn-quiet w-full sm:w-auto">
        {busy === "status" ? "Saving\u2026" : step.label}
      </button>

      {confirming ? (
        <span className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <span className="text-base font-semibold text-ink">
            Void it? The invoice stays on file and keeps its number.
          </span>
          <button onClick={() => put({ status: "void" }, "void")} disabled={busy !== null}
                  className="btn-danger !min-h-[48px] !px-4">
            {busy === "void" ? "Voiding\u2026" : "Yes, void it"}
          </button>
          <button onClick={() => setConfirming(false)} className="btn-ghost !min-h-[48px] !px-4">
            Keep it
          </button>
        </span>
      ) : (
        <button onClick={() => setConfirming(true)} className="btn-ghost w-full sm:w-auto">Void invoice</button>
      )}
    </div>
  );
}
