"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { money, todayISO, addDays } from "@/lib/format";
import {
  subtotal, afterDiscount, taxAmount, total, balanceDue, type LineItem,
} from "@/lib/types";

/* Numbers are held as STRINGS while typing.
   Storing them as numbers means clearing the box gives 0, which then blocks
   typing a new value — she'd have to select-all every time. */
type Row = { description: string; quantity: string; rate: string };

const BLANK = (rate = ""): Row => ({ description: "", quantity: "1", rate });
const num = (s: string) => (s.trim() === "" ? 0 : Number(s) || 0);
const rows = (r: Row[]): LineItem[] =>
  r.map((x) => ({ description: x.description, quantity: num(x.quantity), rate: num(x.rate) }));

const NEW_CLIENT = "__new__";

export default function NewInvoiceForm({ existing }: { existing?: any } = {}) {
  const editing = Boolean(existing);
  const router = useRouter();
  const [meta, setMeta] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [clientId, setClientId] = useState("");
  const [newClient, setNewClient] = useState({ name: "", contact: "", email: "", address: "" });
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(addDays(todayISO(), 14));
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [discount, setDiscount] = useState("");
  const [deposit, setDeposit] = useState("");
  const [items, setItems] = useState<Row[]>([BLANK()]);

  useEffect(() => {
    fetch("/api/meta").then((r) => r.json()).then((m) => {
      setMeta(m);

      if (existing) {
        /* Editing: every field comes off the saved invoice, never the defaults. */
        setClientId(existing.clientId ?? NEW_CLIENT);
        setIssueDate(existing.issueDate ?? todayISO());
        setDueDate(existing.dueDate ?? addDays(todayISO(), 14));
        setReference(existing.reference ?? "");
        setNotes(existing.notes ?? "");
        setTerms(existing.terms ?? m.business?.paymentTerms ?? "");
        setTaxRate(String(existing.taxRate ?? 0));
        setDiscount(existing.discount ? String(existing.discount) : "");
        setDeposit(existing.depositPaid ? String(existing.depositPaid) : "");
        setItems(
          (existing.items ?? []).length
            ? existing.items.map((i: any) => ({
                description: i.description ?? "",
                quantity: String(i.quantity ?? ""),
                rate: String(i.rate ?? ""),
              }))
            : [BLANK()]
        );
        return;
      }

      setClientId(m.clients?.[0]?.id ?? NEW_CLIENT);
      setItems([BLANK(m.business?.defaultRate ? String(m.business.defaultRate) : "")]);
      setTaxRate(String(m.business?.defaultTaxRate ?? 0));
      setTerms(m.business?.paymentTerms ?? "");
    }).catch(() => setErr("Could not load your details. Please refresh the page."));
  }, [existing]);

  const cur = meta?.business?.currency ?? "USD";
  const li = rows(items);
  const set = (i: number, p: Partial<Row>) =>
    setItems((prev) => prev.map((r, n) => (n === i ? { ...r, ...p } : r)));

  const setDue = (days: number) => setDueDate(addDays(issueDate, days));

  async function save(status: "draft" | "sent") {
    setErr(null);
    let client: any;

    if (clientId === NEW_CLIENT) {
      if (!newClient.name.trim()) return setErr("Type the client's name.");
      client = {
        id: newClient.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        name: newClient.name.trim(),
        contact: newClient.contact.trim() || undefined,
        email: newClient.email.trim() || undefined,
        address: newClient.address.split("\n").map((s) => s.trim()).filter(Boolean),
      };
    } else {
      client = meta?.clients?.find((c: any) => c.id === clientId);
      /* The client may have been removed from the list since this invoice was
         written — fall back to the snapshot rather than blocking the edit. */
      if (!client && existing?.clientSnapshot?.id === clientId) client = existing.clientSnapshot;
      if (!client) return setErr("Choose who this invoice is for.");
    }

    const clean = li.filter((i) => i.description.trim());
    if (!clean.length) return setErr("Add at least one line describing the work.");

    setSaving(true);
    const res = await fetch(editing ? `/api/invoices/${existing.id}` : "/api/invoices", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status, issueDate, dueDate,
        clientId: client.id, clientSnapshot: client, items: clean,
        taxRate: num(taxRate),
        discount: num(discount) || undefined,
        depositPaid: num(deposit) || undefined,
        reference: reference.trim() || undefined,
        terms: terms.trim() && terms !== meta?.business?.paymentTerms ? terms.trim() : undefined,
        notes: notes.trim() || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setErr(data.error ?? "Could not save.");
    router.push(`/invoices/${data.id}`);
  }

  if (!meta) return <p className="text-lg text-soft">Loading…</p>;

  const Step = ({ n, title, hint }: { n: number; title: string; hint?: string }) => (
    <div className="flex items-start gap-4">
      <span className="tnum grid h-11 w-11 shrink-0 place-items-center rounded-full
                       bg-brand text-lg font-bold text-white">{n}</span>
      <div>
        <h2 className="text-2xl text-ink">{title}</h2>
        {hint && <p className="mt-0.5 text-base text-soft">{hint}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">{editing ? "Editing invoice" : "New invoice"}</p>
          <h1 className="tnum mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {editing ? existing.number : meta.nextNumber}
          </h1>
        </div>
        <p className="rounded-2xl bg-card px-4 py-2.5 text-base text-soft shadow-card">
          Prefer to talk? Ask Claude and it writes this for you.
        </p>
      </div>

      {!meta.canSave && (
        <div className="rounded-3xl bg-gold2 px-6 py-5">
          <p className="text-lg font-semibold text-ink">Saving is turned off</p>
          <p className="mt-1 text-base text-body">Connect GitHub first or this invoice won&rsquo;t be kept.</p>
        </div>
      )}

      {err && (
        <p role="alert" className="panel border-l-8 border-l-red border-red/50 bg-red2 p-5
                                   text-lg font-semibold text-red">{err}</p>
      )}

      {/* 1 · client */}
      <section className="panel border-l-8 border-l-green p-7">
        <Step n={1} title="Who is this for?" />
        <div className="mt-5 space-y-5">
          <div>
            <label htmlFor="client" className="label">Client</label>
            <select id="client" value={clientId} onChange={(e) => setClientId(e.target.value)}
                    className="field mt-2">
              {meta.clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value={NEW_CLIENT}>+ Someone new…</option>
            </select>
          </div>

          {clientId === NEW_CLIENT && (
            <div className="grid gap-4 rounded-lg border-2 border-green/30 bg-mint p-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="cn" className="label">Their name</label>
                <input id="cn" value={newClient.name} autoFocus
                       onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                       className="field mt-2" placeholder="Company or person" />
              </div>
              <div>
                <label htmlFor="cc" className="label">Contact person</label>
                <input id="cc" value={newClient.contact}
                       onChange={(e) => setNewClient({ ...newClient, contact: e.target.value })}
                       className="field mt-2" placeholder="Optional" />
              </div>
              <div>
                <label htmlFor="ce" className="label">Email</label>
                <input id="ce" type="email" value={newClient.email}
                       onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                       className="field mt-2" placeholder="Optional" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="ca" className="label">Address — one line each</label>
                <textarea id="ca" rows={3} value={newClient.address}
                          onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                          className="field mt-2 resize-y" placeholder="Optional" />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="ref" className="label">Claim, policy or job number</label>
            <input id="ref" value={reference} onChange={(e) => setReference(e.target.value)}
                   className="field tnum mt-2" placeholder="Optional" />
          </div>
        </div>
      </section>

      {/* 2 · dates */}
      <section className="panel border-l-8 border-l-green p-7">
        <Step n={2} title="When?" />
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="issued" className="label">Date of this invoice</label>
            <input id="issued" type="date" value={issueDate}
                   onChange={(e) => { setIssueDate(e.target.value); setDueDate(addDays(e.target.value, 14)); }}
                   className="field tnum mt-2" />
          </div>
          <div>
            <label htmlFor="due" className="label">Payment due by</label>
            <input id="due" type="date" value={dueDate}
                   onChange={(e) => setDueDate(e.target.value)} className="field tnum mt-2" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {[["On receipt", 0], ["In 7 days", 7], ["In 14 days", 14], ["In 30 days", 30]].map(([l, d]) => (
            <button key={l as string} type="button" onClick={() => setDue(d as number)}
                    className="rounded-lg border-2 border-line bg-card px-4 py-2 text-base
                               font-semibold text-body hover:border-green hover:text-green">
              {l}
            </button>
          ))}
        </div>
      </section>

      {/* 3 · work */}
      <section className="panel border-l-8 border-l-green p-7">
        <Step n={3} title="What was the work?" hint="One line per item. Quantity can be hours or things." />
        <div className="mt-5 space-y-5">
          {items.map((it, i) => (
            <div key={i} className="rounded-lg border-2 border-line bg-paper p-5">
              <div className="flex items-center justify-between">
                <span className="label">Line {i + 1}</span>
                {items.length > 1 && (
                  <button type="button" onClick={() => setItems(items.filter((_, n) => n !== i))}
                          className="rounded px-3 py-1 text-base font-semibold text-red underline">
                    Remove
                  </button>
                )}
              </div>
              <label htmlFor={`d${i}`} className="label mt-4 block">Description</label>
              <input id={`d${i}`} value={it.description}
                     onChange={(e) => set(i, { description: e.target.value })}
                     className="field mt-2" placeholder="What did you do?" />
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`q${i}`} className="label">Quantity</label>
                  <input id={`q${i}`} type="text" inputMode="decimal" value={it.quantity}
                         onChange={(e) => set(i, { quantity: e.target.value })}
                         className="field tnum mt-2" />
                </div>
                <div>
                  <label htmlFor={`r${i}`} className="label">Price each</label>
                  <input id={`r${i}`} type="text" inputMode="decimal" value={it.rate}
                         onChange={(e) => set(i, { rate: e.target.value })}
                         className="field tnum mt-2" />
                </div>
              </div>
              <p className="tnum mt-4 border-t-2 border-line pt-3 text-right text-lg font-semibold text-ink">
                {money(num(it.quantity) * num(it.rate), cur)}
              </p>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setItems([...items, BLANK(String(meta.business?.defaultRate ?? ""))])}
                className="btn-quiet mt-5 w-full">+ Add another line</button>
      </section>

      {/* 4 · adjustments */}
      <section className="panel border-l-8 border-l-line p-7">
        <Step n={4} title="Anything to adjust?" hint="All optional — leave blank if not needed." />
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="disc" className="label">Discount</label>
            <input id="disc" type="text" inputMode="decimal" value={discount}
                   onChange={(e) => setDiscount(e.target.value)}
                   className="field tnum mt-2" placeholder="0.00" />
          </div>
          <div>
            <label htmlFor="tax" className="label">Tax %</label>
            <input id="tax" type="text" inputMode="decimal" value={taxRate}
                   onChange={(e) => setTaxRate(e.target.value)} className="field tnum mt-2" />
          </div>
          <div>
            <label htmlFor="dep" className="label">Already paid</label>
            <input id="dep" type="text" inputMode="decimal" value={deposit}
                   onChange={(e) => setDeposit(e.target.value)}
                   className="field tnum mt-2" placeholder="0.00" />
          </div>
        </div>
        <div className="mt-5">
          <label htmlFor="terms" className="label">Payment terms on this invoice</label>
          <input id="terms" value={terms} onChange={(e) => setTerms(e.target.value)} className="field mt-2" />
        </div>
        <div className="mt-5">
          <label htmlFor="notes" className="label">Notes shown on the invoice</label>
          <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                    className="field mt-2 resize-y" placeholder="Optional" />
        </div>
      </section>

      {/* total */}
      <section className="panel border-l-8 border-l-green bg-mint p-7">
        <div className="space-y-2 text-lg">
          <div className="flex justify-between text-body">
            <span>Subtotal</span><span className="tnum">{money(subtotal(li), cur)}</span>
          </div>
          {num(discount) > 0 && (
            <div className="flex justify-between text-body">
              <span>Discount</span><span className="tnum">− {money(num(discount), cur)}</span>
            </div>
          )}
          {num(taxRate) > 0 && (
            <div className="flex justify-between text-body">
              <span>Tax ({taxRate}%)</span>
              <span className="tnum">{money(taxAmount(li, num(taxRate), num(discount)), cur)}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between border-t-2 border-line pt-3">
            <span className="font-semibold uppercase tracking-wide text-ink">
              {num(deposit) > 0 ? "Total" : "Total due"}
            </span>
            <span className="tnum text-4xl text-ink">
              {money(total(li, num(taxRate), num(discount)), cur)}
            </span>
          </div>
          {num(deposit) > 0 && (
            <>
              <div className="flex justify-between text-body">
                <span>Already paid</span><span className="tnum">− {money(num(deposit), cur)}</span>
              </div>
              <div className="flex items-baseline justify-between border-t-2 border-ink pt-2">
                <span className="font-semibold uppercase tracking-wide text-ink">Balance due</span>
                <span className="tnum text-4xl text-brand">
                  {money(balanceDue(li, num(taxRate), num(discount), num(deposit)), cur)}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button onClick={() => save(editing ? (existing.status ?? "sent") : "sent")}
                  disabled={saving} className="btn-primary">
            {saving ? "Saving…" : editing ? "Save changes" : "Save invoice"}
          </button>
          <button onClick={() => (editing ? router.push(`/invoices/${existing.id}`) : save("draft"))}
                  disabled={saving} className="btn-quiet">
            {editing ? "Cancel" : "Save as a draft"}
          </button>
        </div>
      </section>
    </div>
  );
}
