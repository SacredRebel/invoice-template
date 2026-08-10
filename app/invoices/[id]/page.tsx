import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoice, getBusiness } from "@/lib/data";
import { money, prettyDate, isOverdue } from "@/lib/format";
import { subtotal, taxAmount, total, balanceDue } from "@/lib/types";
import StatusPill from "@/components/StatusPill";
import InvoiceActions from "@/components/InvoiceActions";
import ExportBar from "@/components/ExportBar";

export const dynamic = "force-dynamic";

/* Status shown ON the document, so it survives print, PDF and Word.
   The word is always there; the colour is only ever the backup. */
const STAMP: Record<string, { word: string; box: string }> = {
  draft:   { word: "Draft",               box: "border-line bg-paper text-body" },
  sent:    { word: "Waiting for payment", box: "border-green bg-mint  text-green" },
  paid:    { word: "Paid",                box: "border-gold  bg-gold2 text-gold"  },
  overdue: { word: "Overdue",             box: "border-red   bg-red2  text-red"   },
};

/* The money band at the foot of the totals — the loudest thing on the page. */
const BAND: Record<string, string> = {
  draft:   "bg-ink   text-white",
  sent:    "bg-green text-white",
  paid:    "bg-gold  text-white",
  overdue: "bg-red   text-white",
};

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

  const state = isOverdue(inv.dueDate, inv.status) ? "overdue" : inv.status;
  const stamp = STAMP[state] ?? STAMP.draft;
  const band  = BAND[state]  ?? BAND.draft;

  return (
    <div className="space-y-7">
      <div className="no-print flex flex-wrap items-center gap-4">
        <Link href="/" className="text-base font-semibold text-green underline underline-offset-4">
          ← Back to all invoices
        </Link>
        <StatusPill status={inv.status} dueDate={inv.dueDate} />
        <InvoiceActions id={inv.id} status={inv.status} />
      </div>

      <ExportBar invoice={inv} business={business} />

      {/* ── THE INVOICE ── this is what the client receives ── */}
      <article className="print-sheet mx-auto max-w-[880px] overflow-hidden rounded-xl2
                          border-2 border-line bg-card shadow-lift">
        <div className="h-3 bg-green" aria-hidden />

        <div className="sheet-inner px-7 py-9 sm:px-12 sm:py-11">

          {/* ── Header: who it's from, and the wordmark ── */}
          <header className="flex flex-wrap items-start justify-between gap-x-10 gap-y-7">
            <div>
              <h1 className="font-display text-2xl text-ink sm:text-3xl">{business.name}</h1>
              <div className="mt-3 space-y-1 text-base text-body">
                {business.address?.map((l) => <p key={l}>{l}</p>)}
                {business.phone && <p className="tnum">{business.phone}</p>}
                {business.email && <p>{business.email}</p>}
                {business.license && <p>Lic. {business.license}</p>}
              </div>
            </div>

            <div className="sm:text-right">
              <p className="font-display text-3xl font-bold uppercase tracking-tight text-ink sm:text-4xl">
                Invoice
              </p>
              <p className="tnum mt-1 text-xl font-bold text-green">{inv.number}</p>

              <span className={`mt-4 inline-flex items-center rounded-lg border-2 px-4 py-2
                                text-base font-bold ${stamp.box}`}>
                {stamp.word}
              </span>
            </div>
          </header>

          {/* ── Billed to  |  Dates ── stacks on a phone, side by side above 640px ── */}
          <div className="mt-9 grid gap-5 sm:grid-cols-2">
            <div className="rounded-lg border-2 border-line bg-paper p-5">
              <p className="label">Billed to</p>
              <p className="mt-2 text-xl font-bold text-ink">{c.name}</p>
              <div className="mt-1 space-y-1 text-base text-body">
                {c.contact && <p>{c.contact}</p>}
                {c.address?.map((l: string) => <p key={l}>{l}</p>)}
                {c.email && <p>{c.email}</p>}
              </div>
            </div>

            <div className="rounded-lg border-2 border-line p-5">
              <dl className="space-y-3 text-base">
                <div className="flex justify-between gap-4">
                  <dt className="font-semibold text-body">Invoice date</dt>
                  <dd className="tnum text-right text-ink">{prettyDate(inv.issueDate)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-semibold text-body">Payment due</dt>
                  <dd className="tnum text-right font-bold text-ink">{prettyDate(inv.dueDate)}</dd>
                </div>
                {inv.reference && (
                  <div className="flex justify-between gap-4 border-t-2 border-line pt-3">
                    <dt className="font-semibold text-body">Reference</dt>
                    <dd className="tnum text-right text-blue">{inv.reference}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* ── Line items ── real table from 640px up ── */}
          <table className="mt-9 hidden w-full border-collapse sm:table">
            <thead>
              <tr className="bg-ink text-white">
                <th className="rounded-l-lg px-4 py-3 text-left text-sm font-bold uppercase tracking-wide">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-sm font-bold uppercase tracking-wide">Qty</th>
                <th className="px-4 py-3 text-right text-sm font-bold uppercase tracking-wide">Rate</th>
                <th className="rounded-r-lg px-4 py-3 text-right text-sm font-bold uppercase tracking-wide">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((it, i) => (
                <tr key={i} className="avoid-break border-b-2 border-line">
                  <td className="px-4 py-4 text-base text-ink">{it.description}</td>
                  <td className="tnum px-4 py-4 text-right text-base text-body">{it.quantity}</td>
                  <td className="tnum px-4 py-4 text-right text-base text-body">{money(it.rate, cur)}</td>
                  <td className="tnum px-4 py-4 text-right text-base font-bold text-ink">
                    {money(it.quantity * it.rate, cur)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Same lines on a phone, stacked. Never scrolls sideways. ── */}
          <ul className="mt-8 space-y-4 sm:hidden">
            {inv.items.map((it, i) => (
              <li key={i} className="avoid-break rounded-lg border-2 border-line p-4">
                <p className="text-base font-bold text-ink">{it.description}</p>
                <div className="mt-2 flex items-baseline justify-between gap-4">
                  <span className="tnum text-base text-body">
                    {it.quantity} × {money(it.rate, cur)}
                  </span>
                  <span className="tnum text-lg font-bold text-ink">
                    {money(it.quantity * it.rate, cur)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {/* ── Totals ── */}
          <div className="mt-8 flex justify-end">
            <div className="avoid-break w-full space-y-3 sm:max-w-[380px]">
              <div className="flex justify-between text-base text-body">
                <span>Subtotal</span><span className="tnum">{money(sub, cur)}</span>
              </div>

              {disc > 0 && (
                <div className="flex justify-between text-base text-body">
                  <span>Discount</span><span className="tnum">− {money(disc, cur)}</span>
                </div>
              )}

              {inv.taxRate ? (
                <div className="flex justify-between text-base text-body">
                  <span>Tax ({inv.taxRate}%)</span><span className="tnum">{money(tax, cur)}</span>
                </div>
              ) : null}

              <div className="flex items-baseline justify-between border-t-2 border-ink pt-3
                              text-base font-bold text-ink">
                <span>Total</span><span className="tnum text-lg">{money(grand, cur)}</span>
              </div>

              {dep > 0 && (
                <div className="flex justify-between text-base text-body">
                  <span>Already paid</span><span className="tnum">− {money(dep, cur)}</span>
                </div>
              )}

              <div className={`flex flex-wrap items-baseline justify-between gap-2
                               rounded-lg px-5 py-4 ${band}`}>
                <span className="text-base font-bold uppercase tracking-wide">
                  {state === "paid" ? "Paid in full" : dep > 0 ? "Balance due" : "Amount due"}
                </span>
                <span className="tnum font-display text-2xl font-bold sm:text-3xl">
                  {money(due, cur)}
                </span>
              </div>
            </div>
          </div>

          {inv.notes && (
            <div className="avoid-break mt-9 border-t-2 border-line pt-5">
              <p className="label">Notes</p>
              <p className="mt-2 max-w-2xl text-base text-body">{inv.notes}</p>
            </div>
          )}

          <footer className="avoid-break mt-9 flex flex-wrap items-end justify-between gap-6
                             border-t-2 border-line pt-5">
            <div className="max-w-md">
              <p className="label">Payment</p>
              <p className="mt-2 text-base text-body">{inv.terms || business.paymentTerms}</p>
              {business.paymentMethods?.length > 0 && (
                <p className="mt-1 text-base text-body">
                  Accepted: {business.paymentMethods.join(" · ")}
                </p>
              )}
            </div>
            {business.footerNote && (
              <p className="font-display text-2xl font-bold text-green">{business.footerNote}</p>
            )}
          </footer>
        </div>
      </article>
    </div>
  );
}
