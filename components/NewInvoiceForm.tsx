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
    fetch("/api/meta")
      .then((r) => r.json())
      .then((m) => {
        setMeta(m);
        if (m.clients?.[0]) setClientId(m.clients[0].id);
        if (m.business?.defaultRate)
          setItems([{ ...BLANK, rate: m.business.defaultRate }]);
        if (m.business?.defaultTaxRate) setTaxRate(m.business.defaultTaxRate);
      })
      .catch((e) => setErr(e.message));
  }, []);

  const cur = meta?.business?.currency ?? "USD";
  const update = (i: number, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((it, n) => (n === i ? { ...it, ...patch } : it)));

  async function save(status: "draft" | "sent") {
    const client = meta?.clients?.find((c: any) => c.id === clientId);
    if (!client) return setErr("Choose a client first.");
    const clean = items.filter((i) => i.description.trim());
    if (!clean.length) return setErr("Add at least one line with a description.");

    setSaving(true); setErr(null);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status, issueDate, dueDate, clientId,
        clientSnapshot: client, items: clean,
        reference: reference || undefined,
        notes: notes || undefined,
        taxRate: Number(taxRate) || 0,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setErr(data.error ?? "Could not save.");
    router.push(`/invoices/${data.id}`);
  }

  if (err && !meta) return <p className="panel p-6 text-rust">{err}</p>;
  if (!meta) return <p className="text-mute">Loading…</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">New invoice</p>
          <h1 className="tnum mt-1 font-display text-[40px] leading-tight">{meta.nextNumber}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => save("draft")} disabled={saving} className="btn-quiet">Save as draft</button>
          <button onClick={() => save("sent")} disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save and open"}
          </button>
        </div>
      </div>

      {err && <p className="panel border-rust/30 bg-rust/5 p-4 text-[14px] text-rust">{err}</p>}

      <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
        <div className="space-y-6">
          <section className="panel p-6">
            <h2 className="font-display text-[20px]">Who is it for?</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Client</label>
                <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="field mt-1.5">
                  {meta.clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Reference <span className="text-mute/70">— claim or PO number</span></label>
                <input value={reference} onChange={(e) => setReference(e.target.value)}
                       placeholder="Claim #00000000" className="field mt-1.5 tnum" />
              </div>
              <div>
                <label className="label">Issue date</label>
                <input type="date" value={issueDate}
                       onChange={(e) => { setIssueDate(e.target.value); setDueDate(addDays(e.target.value, 14)); }}
                       className="field mt-1.5 tnum" />
              </div>
              <div>
                <label className="label">Due date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="field mt-1.5 tnum" />
              </div>
            </div>
          </section>

          <section className="panel p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-[20px]">What was the work?</h2>
              <button onClick={() => setItems([...items, { ...BLANK, rate: meta.business?.defaultRate ?? 0 }])}
                      className="text-[13px] text-sage hover:underline">+ Add a line</button>
            </div>

            <div className="mt-4 space-y-3">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-[1fr,72px,96px,auto] items-end gap-3">
                  <div>
                    {i === 0 && <label className="label">Description</label>}
                    <input value={it.description} onChange={(e) => update(i, { description: e.target.value })}
                           placeholder="Site assessment and documentation" className="field mt-1.5" />
                  </div>
                  <div>
                    {i === 0 && <label className="label">Qty</label>}
                    <input type="number" step="0.25" min="0" value={it.quantity}
                           onChange={(e) => update(i, { quantity: Number(e.target.value) })}
                           className="field mt-1.5 tnum text-right" />
                  </div>
                  <div>
                    {i === 0 && <label className="label">Rate</label>}
                    <input type="number" step="0.01" min="0" value={it.rate}
                           onChange={(e) => update(i, { rate: Number(e.target.value) })}
                           className="field mt-1.5 tnum text-right" />
                  </div>
                  <button onClick={() => setItems(items.filter((_, n) => n !== i))}
                          disabled={items.length === 1}
                          className="mb-1 px-1 text-[18px] leading-none text-mute
                                     hover:text-rust disabled:opacity-25"
                          aria-label="Remove line">×</button>
                </div>
              ))}
            </div>
          </section>

          <section className="panel p-6">
            <label className="label">Notes <span className="text-mute/70">— appears on the invoice</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                      placeholder="Work completed on site. Photographs available on request."
                      className="field mt-1.5 resize-y" />
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="panel p-6">
            <p className="label">Running total</p>
            <div className="mt-4 space-y-2 text-[14px]">
              <div className="flex justify-between text-slate">
                <span>Subtotal</span><span className="tnum">{money(subtotal(items), cur)}</span>
              </div>
              <div className="flex items-center justify-between text-slate">
                <label htmlFor="tax">Tax %</label>
                <input id="tax" type="number" step="0.01" min="0" value={taxRate}
                       onChange={(e) => setTaxRate(Number(e.target.value))}
                       className="field tnum w-20 py-1 text-right" />
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between text-slate">
                  <span>Tax</span><span className="tnum">{money(taxAmount(items, taxRate), cur)}</span>
                </div>
              )}
              <div className="mt-3 flex items-baseline justify-between border-t-2 border-ink pt-3">
                <span className="label">Total</span>
                <span className="tnum font-display text-[30px] leading-none">
                  {money(total(items, taxRate), cur)}
                </span>
              </div>
            </div>
            <p className="mt-5 text-[12px] leading-relaxed text-mute">
              Saving writes the invoice to GitHub. You can edit the status later,
              print it, or save it as a PDF.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
