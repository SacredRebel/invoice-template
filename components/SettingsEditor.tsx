"use client";

import { useState } from "react";

const toText = (v: any) => (Array.isArray(v) ? v.join("\n") : v ?? "");
const toLines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);

function Saved({ show }: { show: boolean }) {
  if (!show) return null;
  return <p role="status" className="rounded-xl bg-mint px-4 py-3 text-base font-bold text-green">✓ Saved</p>;
}

export default function SettingsEditor(
  { business, clients: initialClients, connected }:
  { business: any; clients: any[]; connected: boolean }
) {
  const [biz, setBiz] = useState<any>({
    ...business,
    addressText: toText(business.address),
    methodsText: (business.paymentMethods ?? []).join(", "),
  });
  const [clients, setClients] = useState<any[]>(
    (initialClients ?? []).map((c) => ({ ...c, addressText: toText(c.address) }))
  );
  const [bizSaved, setBizSaved] = useState(false);
  const [cliSaved, setCliSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const upd = (k: string, v: any) => setBiz((b: any) => ({ ...b, [k]: v }));
  const setClient = (i: number, k: string, v: string) =>
    setClients((cs) => cs.map((c, n) => (n === i ? { ...c, [k]: v } : c)));

  async function saveBusiness() {
    setBusy(true); setErr(null);
    const res = await fetch("/api/business", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...biz,
        address: toLines(biz.addressText ?? ""),
        paymentMethods: (biz.methodsText ?? "").split(",").map((s: string) => s.trim()).filter(Boolean),
      }),
    });
    setBusy(false);
    if (!res.ok) return setErr((await res.json()).error ?? "Could not save.");
    setBizSaved(true); setTimeout(() => setBizSaved(false), 3500);
  }

  async function saveClients(list = clients) {
    setBusy(true); setErr(null);
    const res = await fetch("/api/clients", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(list.map((c) => ({ ...c, address: toLines(c.addressText ?? "") }))),
    });
    setBusy(false);
    if (!res.ok) return setErr((await res.json()).error ?? "Could not save.");
    setCliSaved(true); setTimeout(() => setCliSaved(false), 3500);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="label">Settings</p>
        <h1 className="mt-2 text-3xl text-ink">Your details</h1>
        <p className="mt-3 max-w-2xl text-base text-body">
          These appear on every invoice you send. Change anything and press Save.
        </p>
      </div>

      {!connected && (
        <div className="panel border-l-8 border-l-gold border-gold/50 bg-gold2 p-5">
          <p className="text-lg font-bold text-ink">Not connected yet</p>
          <p className="mt-1 text-base text-body">Changes won&rsquo;t be kept until GitHub is connected.</p>
        </div>
      )}
      {err && (
        <p role="alert" className="panel border-l-8 border-l-red bg-red2 p-5 text-lg font-bold text-red">{err}</p>
      )}

      <section className="panel border-l-8 border-l-green p-6 sm:p-8">
        <h2 className="text-2xl text-ink">Your business</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="bname" className="label">Business name</label>
            <input id="bname" value={biz.name ?? ""} onChange={(e) => upd("name", e.target.value)}
                   placeholder="How it appears on the invoice" className="field mt-2" />
          </div>
          <div>
            <label htmlFor="bemail" className="label">Email</label>
            <input id="bemail" type="email" value={biz.email ?? ""}
                   onChange={(e) => upd("email", e.target.value)} className="field mt-2" />
          </div>
          <div>
            <label htmlFor="bphone" className="label">Phone</label>
            <input id="bphone" type="tel" value={biz.phone ?? ""}
                   onChange={(e) => upd("phone", e.target.value)} className="field mt-2" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="baddr" className="label">Address</label>
            <p className="mt-1 text-sm text-soft">One line each — press Enter for a new line.</p>
            <textarea id="baddr" rows={3} value={biz.addressText ?? ""}
                      onChange={(e) => upd("addressText", e.target.value)} className="field mt-2 resize-y" />
          </div>
          <div>
            <label htmlFor="blic" className="label">Licence number</label>
            <input id="blic" value={biz.license ?? ""} onChange={(e) => upd("license", e.target.value)}
                   placeholder="Leave blank if none" className="field mt-2" />
          </div>
          <div>
            <label htmlFor="brate" className="label">Usual hourly rate</label>
            <input id="brate" inputMode="decimal" value={biz.defaultRate ?? ""}
                   onChange={(e) => upd("defaultRate", e.target.value)} className="field tnum mt-2" />
          </div>
          <div>
            <label htmlFor="btax" className="label">Usual tax %</label>
            <p className="mt-1 text-sm text-soft">Put 0 if you don&rsquo;t charge tax.</p>
            <input id="btax" inputMode="decimal" value={biz.defaultTaxRate ?? ""}
                   onChange={(e) => upd("defaultTaxRate", e.target.value)} className="field tnum mt-2" />
          </div>
          <div>
            <label htmlFor="bmeth" className="label">How you accept payment</label>
            <p className="mt-1 text-sm text-soft">Separate with commas.</p>
            <input id="bmeth" value={biz.methodsText ?? ""}
                   onChange={(e) => upd("methodsText", e.target.value)} className="field mt-2" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="bterms" className="label">Payment terms</label>
            <textarea id="bterms" rows={2} value={biz.paymentTerms ?? ""}
                      onChange={(e) => upd("paymentTerms", e.target.value)} className="field mt-2 resize-y" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="bfoot" className="label">Closing line on the invoice</label>
            <input id="bfoot" value={biz.footerNote ?? ""} onChange={(e) => upd("footerNote", e.target.value)}
                   placeholder="Thank you." className="field mt-2" />
          </div>
        </div>
        <div className="mt-7 space-y-4">
          <button onClick={saveBusiness} disabled={busy} className="btn-primary w-full sm:w-auto">
            {busy ? "Saving…" : "Save my details"}
          </button>
          <Saved show={bizSaved} />
        </div>
      </section>

      <section className="panel border-l-8 border-l-blue p-6 sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-2xl text-ink">People you bill</h2>
          <span className="text-base text-soft">{clients.length}</span>
        </div>

        <div className="mt-6 space-y-5">
          {clients.length === 0 && (
            <p className="text-base text-soft">Nobody yet. Add your first client below.</p>
          )}
          {clients.map((c, i) => (
            <div key={i} className="rounded-xl border-2 border-line bg-paper p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="label">Client {i + 1}</span>
                <button onClick={() => {
                          if (!confirm(`Remove ${c.name || "this client"}?`)) return;
                          const next = clients.filter((_, n) => n !== i);
                          setClients(next); saveClients(next);
                        }}
                        className="rounded px-3 py-1 text-base font-bold text-red underline">Remove</button>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor={`cn${i}`} className="label">Name</label>
                  <input id={`cn${i}`} value={c.name ?? ""}
                         onChange={(e) => setClient(i, "name", e.target.value)} className="field mt-2" />
                </div>
                <div>
                  <label htmlFor={`cc${i}`} className="label">Contact person</label>
                  <input id={`cc${i}`} value={c.contact ?? ""}
                         onChange={(e) => setClient(i, "contact", e.target.value)} className="field mt-2" />
                </div>
                <div>
                  <label htmlFor={`ce${i}`} className="label">Email</label>
                  <input id={`ce${i}`} type="email" value={c.email ?? ""}
                         onChange={(e) => setClient(i, "email", e.target.value)} className="field mt-2" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`ca${i}`} className="label">Address</label>
                  <textarea id={`ca${i}`} rows={2} value={c.addressText ?? ""}
                            onChange={(e) => setClient(i, "addressText", e.target.value)}
                            className="field mt-2 resize-y" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button onClick={() => setClients([...clients, { name: "", addressText: "" }])}
                  className="btn-quiet">+ Add someone</button>
          <button onClick={() => saveClients()} disabled={busy} className="btn-primary">
            {busy ? "Saving…" : "Save the list"}
          </button>
        </div>
        <div className="mt-4"><Saved show={cliSaved} /></div>
      </section>

      <div className={`panel border-l-8 p-6 ${connected ? "border-l-green bg-mint" : "border-l-gold bg-gold2"}`}>
        <p className="text-lg font-bold text-ink">
          {connected ? "✓ Connected — everything is being saved" : "Not connected yet"}
        </p>
        <p className="mt-1 text-base text-body">
          {connected ? "Your invoices and details are stored safely and can't be lost."
                     : "Nothing will be kept until GitHub is connected. See SETUP.md."}
        </p>
      </div>
    </div>
  );
}
