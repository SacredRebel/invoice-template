import Link from "next/link";
import { getInvoices, getBusiness, canSave } from "@/lib/data";
import { money, prettyDate, isOverdue, todayISO } from "@/lib/format";
import { balanceDue } from "@/lib/types";

export const dynamic = "force-dynamic";

const owed = (i: any) => balanceDue(i.items, i.taxRate, i.discount, i.depositPaid);

const CHIP: Record<string, string> = {
  draft:   "bg-wash text-body",
  sent:    "bg-tint text-brand",
  paid:    "bg-mint text-green",
  overdue: "bg-red2 text-red",
};
const WORD: Record<string, string> = {
  draft: "Draft", sent: "Waiting", paid: "Paid", overdue: "Overdue",
};
const initials = (n = "") =>
  n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

export default async function Dashboard() {
  const [invoices, business] = await Promise.all([getInvoices(), getBusiness()]);
  const cur = business.currency || "USD";

  const sum = (l: any[]) => l.reduce((s, i) => s + owed(i), 0);
  const unpaid  = invoices.filter((i) => i.status !== "paid" && i.status !== "draft");
  const overdue = unpaid.filter((i) => isOverdue(i.dueDate, i.status));
  const waiting = unpaid.filter((i) => !isOverdue(i.dueDate, i.status));
  const paidNow = invoices.filter(
    (i) => i.status === "paid" && i.issueDate.slice(0, 7) === todayISO().slice(0, 7));
  const drafts  = invoices.filter((i) => i.status === "draft");

  const counts = [
    { n: waiting.length, label: "Waiting" },
    { n: overdue.length, label: "Overdue" },
    { n: paidNow.length, label: "Paid" },
    { n: drafts.length,  label: "Draft"   },
  ];

  return (
    <div className="space-y-7">
      {!canSave() && (
        <div className="rounded-3xl bg-gold2 px-6 py-5">
          <p className="text-lg font-bold text-ink">Set-up not finished yet</p>
          <p className="mt-1 text-base text-body">
            Look around freely — new invoices won&rsquo;t be saved until GitHub is connected.
          </p>
        </div>
      )}

      <div>
        <p className="label">{prettyDate(todayISO())}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {invoices.length ? "Where things stand" : "Let’s write your first invoice"}
        </h1>
      </div>

      {/* ── Hero. The one number she actually wants, on a deep surface. ── */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-forest to-forest2
                          px-7 py-8 text-white shadow-lift sm:px-9 sm:py-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/75">
          Owed to you right now
        </p>
        <p className="tnum mt-3 font-display text-4xl font-bold leading-none">
          {money(sum(unpaid), cur)}
        </p>
        <p className="mt-2.5 text-base text-white/80">
          across {unpaid.length} unpaid invoice{unpaid.length === 1 ? "" : "s"}
        </p>

        <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/20 pt-6">
          {[
            { label: "Waiting",  value: money(sum(waiting), cur) },
            { label: "Overdue",  value: money(sum(overdue), cur) },
            { label: "Paid this month",
              value: money(paidNow.reduce((s, i) => s + owed({ ...i, depositPaid: 0 }), 0), cur) },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-sm font-medium text-white/70">{s.label}</p>
              <p className="tnum mt-1.5 text-lg font-bold sm:text-xl">{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How many of each, at a glance ── */}
      <div className="grid grid-cols-4 gap-2 rounded-3xl bg-card p-2.5 shadow-card">
        {counts.map((c) => (
          <div key={c.label} className="rounded-2xl py-3 text-center">
            <p className="tnum text-2xl font-bold text-ink">{c.n}</p>
            <p className="mt-0.5 text-sm font-medium text-soft">{c.label}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-4 text-2xl font-bold tracking-tight text-ink">All invoices</h2>

        {invoices.length === 0 ? (
          <div className="card px-8 py-14 text-center">
            <p className="text-2xl font-bold text-ink">Nothing here yet</p>
            <p className="mx-auto mt-2 max-w-md text-base text-body">
              Write one here, or tell Claude about the job and it will appear.
            </p>
            <Link href="/invoices/new" className="btn-primary mt-7">+ New invoice</Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {invoices.map((inv) => {
              const late  = isOverdue(inv.dueDate, inv.status);
              const state = late ? "overdue" : inv.status;
              return (
                <li key={inv.id}>
                  <Link href={`/invoices/${inv.id}`}
                        className="block rounded-3xl bg-card p-5 shadow-card transition
                                   hover:shadow-lift sm:p-6">
                    <div className="flex items-center gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center
                                       rounded-2xl bg-tint text-base font-bold text-brand">
                        {initials(inv.clientSnapshot?.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-bold text-ink">
                          {inv.clientSnapshot?.name ?? "—"}
                        </p>
                        {inv.clientSnapshot?.email && (
                          <p className="truncate text-base text-soft">{inv.clientSnapshot.email}</p>
                        )}
                      </div>
                      <span className={`chip shrink-0 ${CHIP[state] ?? CHIP.draft}`}>
                        {WORD[state] ?? "Draft"}
                      </span>
                    </div>

                    {/* Labelled columns — this is what stops it reading as loose text */}
                    <div className="mt-4 grid grid-cols-3 gap-3 rounded-2xl bg-wash px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-soft">Amount</p>
                        <p className="tnum mt-1 text-base font-bold text-ink">
                          {money(owed(inv), cur)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-soft">Invoice</p>
                        <p className="tnum mt-1 text-base font-semibold text-ink">{inv.number}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-soft">Due</p>
                        <p className={`tnum mt-1 text-base font-semibold ${late ? "text-red" : "text-ink"}`}>
                          {prettyDate(inv.dueDate)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
