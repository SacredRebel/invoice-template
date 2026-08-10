"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { money, todayISO, addDays } from "@/lib/format";
import { subtotal, taxAmount, total, type LineItem } from "@/lib/types";

const BLANK: LineItem = { description: "", quantity: 1, rate: 0 };

export default function NewInvoiceForm() {
  const router = useRouter();
  const [meta, setMeta] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [clientId, setClientId] = useState("");
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(addDays(todayISO(), 14));
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [items, setItems] = useState<LineItem[]>([{ ...BLANK }]);

  useEffect(() => {
    fetch("/api/meta").then((r) => r.json()).then((m) => {
      setMeta(m);
      if (m.clients?.[0]) setClientId(m.clients[0].id);
      if (m.business?.defaultRate) setItems([{ ...BLANK, rate: m.business.defaultRate }]);
      if (m.business?.defaultTaxRate) setTaxRate(m.business.defaultTaxRate);
    }).catch(() => setErr("Could not load your details. Refresh the page."));
  }, []);

  const cur = meta?.business?.currency ?? "USD";
  const set = (i: number, patch: Partial<LineItem>) =>
    setItems((p) => p.map((it, n) => (n === i ? { ...it, ...patch } : it)));

  async function save(status: "draft" | "sent") {
    const client = meta?.clients?.find((c: any) => c.id === clientId);
    if (!client) return setErr("Choose who this invoice is for.");
    const clean = items.filter((i) => i.description.trim());
    if (!clean.length) return setErr("Add at least one line describing the work.");

    setSaving(true); setErr(null);
    const res = await fetch("/api/invoices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status, issueDate, dueDate, clientId, clientSnapshot: client, items: clean,
        reference: reference || undefined, notes: notes || undefined,
        taxRate: Number(taxRate) || 0,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setErr(data.error ?? "Could not save.");
    router.push(`/invoices/${data.id}`);
  }

  if (!meta) return <p className="text-lg text-soft">Loading…</p>;

  return (
    <div className="space-y-7">
      <div>
        <p className="label">New invoice</p>
        <h1 className="tnum mt-2 font-display text-4xl text-ink">{meta.nextNumber}</h1>
      </div>

      {!meta.canSave && (
        <div className="panel border-gold/50 bg-gold2 p-5">
          <p className="text-lg font-semibold text-ink">Saving is turned off</p>
          <p className="mt-1 text-base text-body">
            Connect GitHub first, or this invoice won&rsquo;t be kept. See SETUP.md.
          </p>
        </div>
      )}

      {err && (
        <p role="alert" className="panel border-red/50 bg-red2 p-5 text-lg font-semibold text-red">
          {err}
        </p>
      )}

      <section className="panel p-7">
        <h2 className="font-display text-2xl text-ink">1. Who is this for?</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="client" className="label">Client</label>
            <select id="client" value={clientId} onChange={(e) => setClientId(e.target.value)}
                    className="field mt-2">
              {meta.clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ref" className="label">Claim or reference number</label>
            <input id="ref" value={reference} onChange={(e) => setReference(e.target.value)}
                   placeholder="Optional" className="field tnum mt-2" />
          </div>
          <div>
            <label htmlFor="issued" className="label">Date of this invoice</label>
            <input id="issued" type="date" value={issueDate}
                   onChange={(e) => { setIssueDate(e.target.value); setDueDate(addDays(e.target.value, 14)); }}
                   className="field tnum mt-2" />
          </div>
          <div>
            <label htmlFor="due" className="label">Payment due by</label>
            <input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                   className="field tnum mt-2" />
          </div>
        </div>
      </section>

      <section className="panel p-7">
        <h2 className="font-display text-2xl text-ink">2. What was the work?</h2>
        <p className="mt-1 text-base text-soft">One line per item. Quantity can be hours or units.</p>

        <div className="mt-5 space-y-5">
          {items.map((it, i) => (
            <div key={i} className="rounded-lg border-2 border-line bg-paper p-4">
              <div className="flex items-center justify-between">
                <span className="label">Line {i + 1}</span>
                {items.length > 1 && (
                  <button onClick={() => setItems(items.filter((_, n) => n !== i))}
                          className="rounded px-3 py-1 text-base font-semibold text-red underline">
                    Remove
                  </button>
                )}
              </div>
              <input value={it.description} onChange={(e) => set(i, { description: e.target.value })}
                     placeholder="Describe the work" className="field mt-3" />
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Quantity</label>
                  <input type="number" step="0.25" min="0" value={it.quantity}
                         onChange={(e) => set(i, { quantity: Number(e.target.value) })}
                         className="field tnum mt-2" />
                </div>
                <div>
                  <label className="label">Price each</label>
                  <input type="number" step="0.01" min="0" value={it.rate}
                         onChange={(e) => set(i, { rate: Number(e.target.value) })}
                         className="field tnum mt-2" />
                </div>
              </div>
              <p className="tnum mt-3 text-right text-lg font-semibold text-ink">
                {money(it.quantity * it.rate, cur)}
              </p>
            </div>
          ))}
        </div>

        <button onClick={() => setItems([...items, { ...BLANK, rate: meta.business?.defaultRate ?? 0 }])}
                className="btn-quiet mt-5 w-full">+ Add another line</button>
      </section>

      <section className="panel p-7">
        <h2 className="font-display text-2xl text-ink">3. Anything to add?</h2>
        <label htmlFor="notes" className="label mt-4 block">Notes shown on the invoice</label>
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                  placeholder="Optional" className="field mt-2 resize-y" />
        <div className="mt-5 max-w-[220px]">
          <label htmlFor="tax" className="label">Tax %</label>
          <input id="tax" type="number" step="0.01" min="0" value={taxRate}
                 onChange={(e) => setTaxRate(Number(e.target.value))} className="field tnum mt-2" />
        </div>
      </section>

      <section className="panel bg-mint p-7">
        <div className="space-y-2 text-lg">
          <div className="flex justify-between text-body">
            <span>Subtotal</span><span className="tnum">{money(subtotal(items), cur)}</span>
          </div>
          {taxRate > 0 && (
            <div className="flex justify-between text-body">
              <span>Tax ({taxRate}%)</span><span className="tnum">{money(taxAmount(items, taxRate), cur)}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between border-t-[3px] border-ink pt-3">
            <span className="font-semibold uppercase tracking-wide text-ink">Total</span>
            <span className="tnum font-display text-4xl text-ink">{money(total(items, taxRate), cur)}</span>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button onClick={() => save("sent")} disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save invoice"}
          </button>
          <button onClick={() => save("draft")} disabled={saving} className="btn-quiet bg-card">
            Save as a draft
          </button>
        </div>
      </section>
    </div>
  );
}
