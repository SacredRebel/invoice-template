import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoice, getBusiness } from "@/lib/data";
import { money, prettyDate, isOverdue } from "@/lib/format";
import { subtotal, taxAmount, total, balanceDue } from "@/lib/types";
import InvoiceActions from "@/components/InvoiceActions";
import ExportBar from "@/components/ExportBar";

export const dynamic = "force-dynamic";

const WORD: Record<string, string> = {
  draft: "Draft", sent: "Waiting for payment", paid: "Paid", overdue: "Overdue",
  void: "Voided — not payable",
};
const CHIP: Record<string, string> = {
  draft: "bg-gold2 text-gold", sent: "bg-tint text-brand", void: "bg-wash text-soft",
  paid: "bg-mint text-green", overdue: "bg-red2 text-red",
};
const initials = (n = "") =>
  n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const [inv, business] = await Promise.all([getInvoice(params.id), getBusiness()]);
  if (!inv) notFound();

  const cur   = business.currency || "USD";
  const disc  = inv.discount ?? 0;
  const dep   = inv.depositPaid ?? 0;
  const sub   = subtotal(inv.items);
  const tax   = taxAmount(inv.items, inv.taxRate, disc);
  const grand = total(inv.items, inv.taxRate, disc);
  const due   = balanceDue(inv.items, inv.taxRate, disc, dep);
  const c: any = inv.clientSnapshot ?? {};

  const state    = isOverdue(inv.dueDate, inv.status) ? "overdue" : inv.status;
  const dueLabel = state === "paid" ? "Paid in full" : dep > 0 ? "Balance due" : "Amount due";

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <Link href="/" className="btn-ghost !min-h-[48px] justify-start !px-4 sm:justify-center">← All invoices</Link>
        <InvoiceActions id={inv.id} status={inv.status} />
      </div>

      <ExportBar invoice={inv} business={business} />

      {/* ── THE INVOICE ── what the client receives ── */}
      <article className="print-sheet mx-auto max-w-[880px] overflow-hidden rounded-3xl bg-card shadow-lift">
        <div className="sheet-inner px-6 py-8 sm:px-10 sm:py-10">

          {/* ── Masthead ── */}
          <header className="flex flex-wrap items-start justify-between gap-x-8 gap-y-5">
            <div>
              {business.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={business.logoUrl} alt={business.name} className="mb-3 max-h-14 w-auto" />
              ) : null}
              <p className="font-display text-xl font-bold tracking-tight text-ink">
                {business.name}
              </p>
              <div className="mt-2 space-y-0.5 text-base text-soft">
                {business.address?.map((l) => <p key={l}>{l}</p>)}
                {business.phone && <p className="tnum">{business.phone}</p>}
                {business.email && <p>{business.email}</p>}
              </div>
            </div>
            <div className="sm:text-right">
              <p className="font-display text-3xl font-bold tracking-tight text-ink">Invoice</p>
              <p className="tnum mt-1 text-lg font-semibold text-soft">{inv.number}</p>
            </div>
          </header>

          {/* ── Who it's for ── */}
          <section className="mt-8 rounded-3xl bg-wash p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="label">Billed to</p>
              <span className={`chip ${CHIP[state] ?? CHIP.draft}`}>{WORD[state] ?? "Draft"}</span>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl
                               bg-card text-base font-bold text-brand">
                {initials(c.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-ink">{c.name}</p>
                {c.contact && <p className="truncate text-base text-soft">{c.contact}</p>}
              </div>
            </div>

            {(c.address?.length || c.email) && (
              <div className="mt-3 space-y-0.5 text-base text-body">
                {c.address?.map((l: string) => <p key={l}>{l}</p>)}
                {c.email && <p>{c.email}</p>}
              </div>
            )}

            {/* Labelled columns — issued / due / reference */}
            <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 rounded-2xl bg-card px-5 py-4 sm:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-soft">Issued</p>
                <p className="tnum mt-1 text-base font-semibold text-ink">{prettyDate(inv.issueDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-soft">Due</p>
                <p className={`tnum mt-1 text-base font-semibold ${state === "overdue" ? "text-red" : "text-ink"}`}>
                  {prettyDate(inv.dueDate)}
                </p>
              </div>
              {inv.reference && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-sm font-medium text-soft">Reference</p>
                  <p className="tnum mt-1 text-base font-semibold text-blue">{inv.reference}</p>
                </div>
              )}
            </div>
          </section>

          {/* ── The work ── */}
          <section className="mt-8">
            <p className="label">The work</p>

            <div className="mt-3.5 hidden gap-4 pb-2.5 sm:grid sm:grid-cols-[1fr_4.5rem_6.5rem_7.5rem]">
              <p className="text-sm font-medium text-soft">Item</p>
              <p className="text-sm font-medium text-soft text-right">Qty</p>
              <p className="text-sm font-medium text-soft text-right">Rate</p>
              <p className="text-sm font-medium text-soft text-right">Amount</p>
            </div>

            <ul className="divide-y divide-line/60 border-t border-line/60">
              {inv.items.map((it, i) => (
                <li key={i}
                    className="avoid-break gap-4 py-4 sm:grid sm:grid-cols-[1fr_4.5rem_6.5rem_7.5rem] sm:items-baseline">
                  <p className="text-base font-semibold text-ink">{it.description}</p>
                  <p className="tnum hidden text-right text-base text-body sm:block">{it.quantity}</p>
                  <p className="tnum hidden text-right text-base text-body sm:block">{money(it.rate, cur)}</p>
                  <div className="mt-1.5 flex items-baseline justify-between sm:mt-0 sm:block sm:text-right">
                    <span className="tnum text-base text-soft sm:hidden">
                      {it.quantity} × {money(it.rate, cur)}
                    </span>
                    <span className="tnum text-base font-bold text-ink">
                      {money(it.quantity * it.rate, cur)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* ── What it comes to ── */}
          <section className="avoid-break mt-8 sm:ml-auto sm:max-w-[400px]">
            <dl className="space-y-3 rounded-3xl bg-wash px-6 py-5">
              <div className="flex justify-between text-base">
                <dt className="text-soft">Subtotal</dt>
                <dd className="tnum font-semibold text-ink">{money(sub, cur)}</dd>
              </div>
              {disc > 0 && (
                <div className="flex justify-between text-base">
                  <dt className="text-soft">Discount</dt>
                  <dd className="tnum font-semibold text-ink">− {money(disc, cur)}</dd>
                </div>
              )}
              {inv.taxRate ? (
                <div className="flex justify-between text-base">
                  <dt className="text-soft">Tax ({inv.taxRate}%)</dt>
                  <dd className="tnum font-semibold text-ink">{money(tax, cur)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-line/70 pt-3 text-base">
                <dt className="font-semibold text-ink">Total</dt>
                <dd className="tnum font-bold text-ink">{money(grand, cur)}</dd>
              </div>
              {dep > 0 && (
                <div className="flex justify-between text-base">
                  <dt className="text-plum">Already paid</dt>
                  <dd className="tnum font-semibold text-plum">− {money(dep, cur)}</dd>
                </div>
              )}
            </dl>

            {/* The deep hero amount row, straight from the reference */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl
                            bg-gradient-to-br from-forest to-forest2 px-6 py-5 text-white shadow-brand">
              <span className="text-base font-semibold uppercase tracking-[0.12em] text-white/85">
                {dueLabel}
              </span>
              <span className="tnum font-display text-2xl font-bold sm:text-3xl">
                {money(due, cur)}
              </span>
            </div>
          </section>

          {inv.notes && (
            <div className="avoid-break mt-8 rounded-3xl bg-wash px-6 py-5">
              <p className="label">Notes</p>
              <p className="mt-2 max-w-2xl text-base text-body">{inv.notes}</p>
            </div>
          )}

          <footer className="avoid-break mt-8 flex flex-wrap items-end justify-between gap-6
                             border-t border-line/60 pt-6">
            <div className="max-w-md">
              <p className="label">Payment</p>
              <p className="mt-2 text-base text-body">{inv.terms || business.paymentTerms}</p>
              {business.paymentMethods?.length > 0 && (
                <p className="mt-1 text-base text-soft">
                  Accepted: {business.paymentMethods.join(" · ")}
                </p>
              )}
            </div>
            {business.footerNote && (
              <p className="font-display text-xl font-bold text-brand">{business.footerNote}</p>
            )}
          </footer>
        </div>
      </article>
    </div>
  );
}
