"use client";

import { useEffect, useState } from "react";

type Client = {
  id?: string; name: string; contact?: string; email?: string;
  phone?: string; address?: string[] | string;
};

const linesToText = (v: any) => (Array.isArray(v) ? v.join("\n") : v ?? "");
const textToLines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);

function Saved({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p role="status" className="rounded-xl bg-mint px-4 py-3 text-base font-bold text-green">
      ✓ Saved
    </p>
  );
}

export default function SettingsEditor() {
  const [biz, setBiz] = useState<any>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [canSave, setCanSave] = useState(true);
  const [bizSaved, setBizSaved] = useState(false);
  const [clientsSaved, setClientsSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/meta").then((r) => r.json()).then((m) => {
      setBiz({
        ...m.business,
        addressText: linesToText(m.business?.address),
        methodsText: (m.business?.paymentMethods ?? []).join(", "),
      });
      setClients((m.clients ?? []).map((c: any) => ({ ...c, addressText: linesToText(c.address) })));
      setCanSave(m.canSave);
    }).catch(() => setErr("Could not load your details. Please refresh."));
  }, []);

  const upd = (k: string, v: any) => setBiz((b: any) => ({ ...b, [k]: v }));

  async function saveBusiness() {
    setBusy(true); setErr(null);
    const res = await fetch("/api/business", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...biz,
        address: textToLines(biz.addressText ?? ""),
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
      body: JSON.stringify(list.map((c: any) => ({ ...c, address: textToLines(c.addressText ?? "") }))),
    });
    setBusy(false);
    if (!res.ok) return setErr((await res.json()).error ?? "Could not save.");
    setClientsSaved(true); setTimeout(() => setClientsSaved(false), 3500);
  }

  const setClient = (i: number, k: string, v: string) =>
    setClients((cs) => cs.map((c, n) => (n === i ? { ...c, [k]: v } : c)));

  if (err && !biz) return <p className="panel border-l-8 border-l-red p-6 text-lg text-red">{err}</p>;
  if (!biz) return <p className="text-lg text-soft">Loading…</p>;

  const Field = ({ id, label, value, onChange, type = "text", placeholder = "", hint = "" }: any) => (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {hint && <p className="mt-1 text-sm text-soft">{hint}</p>}
      <input id={id} type={type} value={value ?? ""} placeholder={placeholder}
             onChange={(e) => onChange(e.target.value)} className="field mt-2" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="label">Settings</p>
        <h1 className="mt-2 text-3xl text-ink">Your details</h1>
        <p className="mt-3 max-w-2xl text-base text-body">
          These appear on every invoice you send. Change anything here and press Save.
        </p>
      </div>

      {!canSave && (
        <div className="panel border-l-8 border-l-gold border-gold/50 bg-gold2 p-5">
          <p className="text-lg font-bold text-ink">Not connected yet</p>
          <p className="mt-1 text-base text-body">Changes won&rsquo;t stick until GitHub is connected.</p>
        </div>
      )}
      {err && <p role="alert" className="panel border-l-8 border-l-red bg-red2 p-5 text-lg font-bold text-red">{err}</p>}

      {/* BUSINESS */}
      <section className="panel border-l-8 border-l-green p-6 sm:p-8">
        <h2 className="text-2xl text-ink">Your business</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field id="bname" label="Business name" value={biz.name}
                   onChange={(v: string) => upd("name", v)} placeholder="How it appears on the invoice" />
          </div>
          <Field id="bemail" label="Email" type="email" value={biz.email}
                 onChange={(v: string) => upd("email", v)} />
          <Field id="bphone" label="Phone" type="tel" value={biz.phone}
                 onChange={(v: string) => upd("phone", v)} />
          <div className="sm:col-span-2">
            <label htmlFor="baddr" className="label">Address</label>
            <p className="mt-1 text-sm text-soft">One line each. Press Enter for a new line.</p>
            <textarea id="baddr" rows={3} value={biz.addressText}
                      onChange={(e) => upd("addressText", e.target.value)}
                      className="field mt-2 resize-y" />
          </div>
          <Field id="blic" label="Licence number" value={biz.license}
                 onChange={(v: string) => upd("license", v)} placeholder="Leave blank if none" />
          <Field id="brate" label="Usual hourly rate" type="text" value={biz.defaultRate}
                 onChange={(v: string) => upd("defaultRate", v)} />
          <Field id="btax" label="Usual tax %" type="text" value={biz.defaultTaxRate}
                 onChange={(v: string) => upd("defaultTaxRate", v)}
                 hint="Put 0 if you don't charge tax" />
          <Field id="bmeth" label="Payment methods you accept" value={biz.methodsText}
                 onChange={(v: string) => upd("methodsText", v)}
                 hint="Separate with commas" />
          <div className="sm:col-span-2">
            <label htmlFor="bterms" className="label">Payment terms</label>
            <textarea id="bterms" rows={2} value={biz.paymentTerms}
                      onChange={(e) => upd("paymentTerms", e.target.value)}
                      className="field mt-2 resize-y" />
          </div>
          <div className="sm:col-span-2">
            <Field id="bfoot" label="Closing line on the invoice" value={biz.footerNote}
                   onChange={(v: string) => upd("footerNote", v)} placeholder="Thank you." />
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <button onClick={saveBusiness} disabled={busy} className="btn-primary w-full sm:w-auto">
            {busy ? "Saving…" : "Save my details"}
          </button>
          <Saved show={bizSaved} />
        </div>
      </section>

      {/* CLIENTS */}
      <section className="panel border-l-8 border-l-blue p-6 sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-2xl text-ink">People you bill</h2>
          <span className="text-base text-soft">{clients.length}</span>
        </div>

        <div className="mt-6 space-y-5">
          {clients.map((c: any, i) => (
            <div key={i} className="rounded-xl border-2 border-line bg-paper p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="label">Client {i + 1}</span>
                <button onClick={() => { if (confirm(`Remove ${c.name || "this client"}?`)) {
                          const next = clients.filter((_, n) => n !== i);
                          setClients(next); saveClients(next);
                        }}}
                        className="rounded px-3 py-1 text-base font-bold text-red underline">
                  Remove
                </button>
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
          <button onClick={() => setClients([...clients, { name: "", addressText: "" } as any])}
                  className="btn-quiet">+ Add someone</button>
          <button onClick={() => saveClients()} disabled={busy} className="btn-primary">
            {busy ? "Saving…" : "Save the list"}
          </button>
        </div>
        <div className="mt-4"><Saved show={clientsSaved} /></div>
      </section>

      <div className={`panel border-l-8 p-6 ${canSave ? "border-l-green bg-mint" : "border-l-gold bg-gold2"}`}>
        <p className="text-lg font-bold text-ink">
          {canSave ? "✓ Connected — everything is being saved" : "Not connected yet"}
        </p>
        <p className="mt-1 text-base text-body">
          {canSave
            ? "Your invoices and details are stored safely and can't be lost."
            : "Nothing will be kept until GitHub is connected. See SETUP.md."}
        </p>
      </div>
    </div>
  );
}
