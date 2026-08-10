"use client";

import { useState } from "react";

const toText  = (v: any) => (Array.isArray(v) ? v.join("\n") : v ?? "");
const toLines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);

const TABS = [
  { id: "business", label: "Your business",    hint: "Name, address and contact details" },
  { id: "brand",    label: "Logo & look",      hint: "What sits at the top of an invoice" },
  { id: "invoice",  label: "Invoice defaults", hint: "Rate, tax, terms and due date" },
  { id: "clients",  label: "People you bill",  hint: "Saved clients" },
] as const;
type Tab = (typeof TABS)[number]["id"];

function Saved({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p role="status" className="rounded-2xl bg-mint px-4 py-3 text-base font-bold text-green">
      \u2713 Saved
    </p>
  );
}

function Field({ label, hint, ...rest }: any) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {hint && <span className="mb-1.5 block text-sm text-soft">{hint}</span>}
      <input className="field" {...rest} />
    </label>
  );
}

function Area({ label, hint, ...rest }: any) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {hint && <span className="mb-1.5 block text-sm text-soft">{hint}</span>}
      <textarea className="field !min-h-[120px] py-4" {...rest} />
    </label>
  );
}

export default function SettingsEditor(
  { business, clients: initialClients, connected }:
  { business: any; clients: any[]; connected: boolean }
) {
  const [tab, setTab] = useState<Tab>("business");
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
        defaultRate: Number(biz.defaultRate) || 0,
        defaultTaxRate: Number(biz.defaultTaxRate) || 0,
        defaultDueDays: Number(biz.defaultDueDays) || 14,
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

  const addClient = () =>
    setClients((cs) => [...cs, {
      id: `client-${Date.now()}`, name: "", contact: "", email: "", phone: "", addressText: "",
    }]);

  const removeClient = (i: number) => {
    const next = clients.filter((_, n) => n !== i);
    setClients(next); saveClients(next);
  };

  return (
    <div className="space-y-7">
      <div>
        <p className="label">Settings</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          How your invoices work
        </h1>
      </div>

      {!connected && (
        <div className="rounded-3xl bg-gold2 px-6 py-5">
          <p className="text-lg font-bold text-ink">Saving is turned off</p>
          <p className="mt-1 text-base text-body">
            You can change anything here, but it won&rsquo;t be kept until GitHub is connected.
          </p>
        </div>
      )}
      {err && (
        <p className="rounded-2xl bg-red2 px-5 py-4 text-base font-semibold text-red">{err}</p>
      )}

      {/* \u2500\u2500 Sections \u2500\u2500 */}
      <div className="grid gap-2 sm:grid-cols-4">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id}
                  className={`rounded-2xl px-4 py-4 text-left transition ${
                    tab === t.id
                      ? "bg-brand text-white shadow-brand"
                      : "bg-card text-ink shadow-card hover:bg-tint"
                  }`}>
            <span className="block text-base font-bold">{t.label}</span>
            <span className={`mt-0.5 block text-sm ${tab === t.id ? "text-white/80" : "text-soft"}`}>
              {t.hint}
            </span>
          </button>
        ))}
      </div>

      {tab === "business" && (
        <section className="section space-y-5">
          <h2 className="text-2xl font-bold tracking-tight text-ink">Your business</h2>
          <p className="-mt-3 text-base text-soft">This appears at the top of every invoice.</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Business name" value={biz.name ?? ""} onChange={(e: any) => upd("name", e.target.value)} />
            <Field label="Your name" value={biz.owner ?? ""} onChange={(e: any) => upd("owner", e.target.value)} />
            <Field label="Email" type="email" value={biz.email ?? ""} onChange={(e: any) => upd("email", e.target.value)} />
            <Field label="Phone" value={biz.phone ?? ""} onChange={(e: any) => upd("phone", e.target.value)} />
            <Field label="Licence number" hint="Leave empty if you don't have one"
                   value={biz.license ?? ""} onChange={(e: any) => upd("license", e.target.value)} />
            <Field label="Currency" value={biz.currency ?? "USD"} onChange={(e: any) => upd("currency", e.target.value)} />
          </div>
          <Area label="Address" hint="One line each"
                value={biz.addressText ?? ""} onChange={(e: any) => upd("addressText", e.target.value)} />
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={saveBusiness} disabled={busy} className="btn-primary">
              {busy ? "Saving\u2026" : "Save business details"}
            </button>
            <Saved show={bizSaved} />
          </div>
        </section>
      )}

      {tab === "brand" && (
        <section className="section space-y-5">
          <h2 className="text-2xl font-bold tracking-tight text-ink">Logo &amp; look</h2>
          <p className="-mt-3 text-base text-soft">
            Paste a web address for your logo. It shows at the top of the invoice.
          </p>

          <Field label="Logo address" hint="Something ending in .png or .jpg"
                 placeholder="https://\u2026/logo.png"
                 value={biz.logoUrl ?? ""} onChange={(e: any) => upd("logoUrl", e.target.value)} />

          {biz.logoUrl ? (
            <div className="rounded-2xl bg-wash p-5">
              <p className="label">Preview</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={biz.logoUrl} alt="Your logo" className="mt-3 max-h-16 w-auto" />
            </div>
          ) : (
            <p className="rounded-2xl bg-wash px-5 py-4 text-base text-soft">
              No logo yet \u2014 invoices show your business name instead.
            </p>
          )}

          <Field label="Closing line" hint="The friendly line at the bottom of an invoice"
                 value={biz.footerNote ?? ""} onChange={(e: any) => upd("footerNote", e.target.value)} />

          <div className="flex flex-wrap items-center gap-4">
            <button onClick={saveBusiness} disabled={busy} className="btn-primary">
              {busy ? "Saving\u2026" : "Save"}
            </button>
            <Saved show={bizSaved} />
          </div>
        </section>
      )}

      {tab === "invoice" && (
        <section className="section space-y-5">
          <h2 className="text-2xl font-bold tracking-tight text-ink">Invoice defaults</h2>
          <p className="-mt-3 text-base text-soft">
            What a new invoice starts with. You can still change any of it per invoice.
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Hourly rate" inputMode="decimal" value={biz.defaultRate ?? ""}
                   onChange={(e: any) => upd("defaultRate", e.target.value)} />
            <Field label="Tax rate" hint="Percent \u2014 0 if none" inputMode="decimal"
                   value={biz.defaultTaxRate ?? ""} onChange={(e: any) => upd("defaultTaxRate", e.target.value)} />
            <Field label="Days until due" inputMode="numeric" value={biz.defaultDueDays ?? 14}
                   onChange={(e: any) => upd("defaultDueDays", e.target.value)} />
          </div>
          <Area label="Payment terms" value={biz.paymentTerms ?? ""}
                onChange={(e: any) => upd("paymentTerms", e.target.value)} />
          <Field label="How you accept payment" hint="Separate with commas"
                 value={biz.methodsText ?? ""} onChange={(e: any) => upd("methodsText", e.target.value)} />
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={saveBusiness} disabled={busy} className="btn-primary">
              {busy ? "Saving\u2026" : "Save defaults"}
            </button>
            <Saved show={bizSaved} />
          </div>
        </section>
      )}

      {tab === "clients" && (
        <section className="space-y-4">
          <div className="section">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-ink">People you bill</h2>
                <p className="mt-1 text-base text-soft">{clients.length} saved</p>
              </div>
              <button onClick={addClient} className="btn-quiet">+ Add someone</button>
            </div>
          </div>

          {clients.map((c, i) => (
            <div key={c.id ?? i} className="section space-y-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-lg font-bold text-ink">{c.name || "New client"}</p>
                <button onClick={() => removeClient(i)} className="btn-ghost !min-h-[48px] !px-4 text-red">
                  Remove
                </button>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Name" value={c.name ?? ""} onChange={(e: any) => setClient(i, "name", e.target.value)} />
                <Field label="Contact person" value={c.contact ?? ""} onChange={(e: any) => setClient(i, "contact", e.target.value)} />
                <Field label="Email" type="email" value={c.email ?? ""} onChange={(e: any) => setClient(i, "email", e.target.value)} />
                <Field label="Phone" value={c.phone ?? ""} onChange={(e: any) => setClient(i, "phone", e.target.value)} />
              </div>
              <Area label="Address" hint="One line each"
                    value={c.addressText ?? ""} onChange={(e: any) => setClient(i, "addressText", e.target.value)} />
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-4">
            <button onClick={() => saveClients()} disabled={busy} className="btn-primary">
              {busy ? "Saving\u2026" : "Save everyone"}
            </button>
            <Saved show={cliSaved} />
          </div>
        </section>
      )}
    </div>
  );
}
