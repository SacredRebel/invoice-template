import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoice, getBusiness } from "@/lib/data";
import { money, prettyDate } from "@/lib/format";
import { subtotal, taxAmount, total, balanceDue } from "@/lib/types";
import StatusPill from "@/components/StatusPill";
import InvoiceActions from "@/components/InvoiceActions";
import ExportBar from "@/components/ExportBar";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const [inv, business] = await Promise.all([getInvoice(params.id), getBusiness()]);
  if (!inv) notFound();

  const cur = business.currency || "USD";
  const disc = inv.discount ?? 0;
  const dep  = inv.depositPaid ?? 0;
  const sub  = subtotal(inv.items);
  const tax  = taxAmount(inv.items, inv.taxRate, disc);
  const grand = total(inv.items, inv.taxRate, disc);
  const due   = balanceDue(inv.items, inv.taxRate, disc, dep);
  const c: any = inv.clientSnapshot ?? {};

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

      {/* ── THE INVOICE ── what the client receives ── */}
      <article className="print-sheet mx-auto max-w-[880px] overflow-hidden rounded-xl2
                          border-2 border-line bg-card shadow-lift">
        <div className="h-2 bg-green" aria-hidden />
        <div className="px-10 py-11 sm:px-14">
          <header className="flex flex-wrap items-start justify-between gap-8">
            <div>
              <h1 className="font-display text-3xl text-ink">{business.name}</h1>
              <div className="mt-3 space-y-1 text-base text-body">
                {business.address?.map((l) => <p key={l}>{l}</p>)}
                {business.phone && <p className="tnum">{business.phone}</p>}
                {business.email && <p>{business.email}</p>}
                {business.license && <p className="text-soft">Lic. {business.license}</p>}
              </div>
            </div>
            <div className="sm:text-right">
              <p className="label">Invoice</p>
              <p className="tnum mt-1 font-display text-3xl text-ink">{inv.number}</p>
              <table className="mt-4 text-base sm:ml-auto">
                <tbody>
                  <tr><td className="pr-6 text-soft">Issued</td>
                      <td className="tnum sm:text-right">{prettyDate(inv.issueDate)}</td></tr>
                  <tr><td className="pr-6 text-soft">Due</td>
                      <td className="tnum font-semibold sm:text-right">{prettyDate(inv.dueDate)}</td></tr>
                  {inv.reference && (
                    <tr><td className="pr-6 text-soft">Reference</td>
                        <td className="tnum sm:text-right">{inv.reference}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </header>

          <div className="mt-9 rounded-lg bg-paper p-5">
            <p className="label">Billed to</p>
            <p className="mt-2 text-xl font-semibold text-ink">{c.name}</p>
            <div className="mt-1 space-y-1 text-base text-body">
              {c.contact && <p>{c.contact}</p>}
              {c.address?.map((l: string) => <p key={l}>{l}</p>)}
              {c.email && <p>{c.email}</p>}
            </div>
          </div>

          {/* Table from 640px up. On a phone each line stacks — no sideways scrolling. */}
          <table className="mt-9 hidden w-full sm:table">
            <thead>
              <tr className="border-b-[3px] border-ink">
                <th className="label pb-3 text-left">Description</th>
                <th className="label pb-3 text-right">Qty</th>
                <th className="label pb-3 text-right">Rate</th>
                <th className="label pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((it, i) => (
                <tr key={i} className="border-b border-line">
                  <td className="py-4 pr-6 text-base text-ink">{it.description}</td>
                  <td className="tnum py-4 text-right text-base text-body">{it.quantity}</td>
                  <td className="tnum py-4 text-right text-base text-body">{money(it.rate, cur)}</td>
                  <td className="tnum py-4 text-right text-base font-semibold text-ink">
                    {money(it.quantity * it.rate, cur)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="mt-8 space-y-4 sm:hidden">
            {inv.items.map((it, i) => (
              <li key={i} className="border-b border-line pb-4">
                <p className="text-base font-semibold text-ink">{it.description}</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="tnum text-base text-soft">
                    {it.quantity} × {money(it.rate, cur)}
                  </span>
                  <span className="tnum text-lg font-bold text-ink">
                    {money(it.quantity * it.rate, cur)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex justify-end">
            <div className="w-full max-w-[340px] space-y-2 text-base">
              <div className="flex justify-between text-body">
                <span>Subtotal</span><span className="tnum">{money(sub, cur)}</span>
              </div>
              {disc > 0 && (
                <div className="flex justify-between text-body">
                  <span>Discount</span><span className="tnum">− {money(disc, cur)}</span>
                </div>
              )}
              {inv.taxRate ? (
                <div className="flex justify-between text-body">
                  <span>Tax ({inv.taxRate}%)</span><span className="tnum">{money(tax, cur)}</span>
                </div>
              ) : null}
              <div className={`flex items-baseline justify-between border-t-[3px] border-ink pt-3
                               ${dep > 0 ? "" : "rounded-b-lg"}`}>
                <span className="text-base font-semibold uppercase tracking-wide text-ink">
                  {dep > 0 ? "Total" : "Total due"}
                </span>
                <span className="tnum font-display text-3xl text-ink">{money(grand, cur)}</span>
              </div>
              {dep > 0 && (
                <>
                  <div className="flex justify-between text-body">
                    <span>Already paid</span><span className="tnum">− {money(dep, cur)}</span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between rounded-lg bg-mint px-4 py-3">
                    <span className="text-base font-semibold uppercase tracking-wide text-green">Balance due</span>
                    <span className="tnum font-display text-3xl text-green">{money(due, cur)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {inv.notes && (
            <div className="mt-9 border-t-2 border-line pt-5">
              <p className="label">Notes</p>
              <p className="mt-2 max-w-2xl text-base text-body">{inv.notes}</p>
            </div>
          )}

          <footer className="mt-9 flex flex-wrap justify-between gap-6 border-t-2 border-line pt-5 text-base">
            <div className="max-w-md">
              <p className="label">Payment</p>
              <p className="mt-2 text-body">{inv.terms || business.paymentTerms}</p>
              {business.paymentMethods?.length > 0 && (
                <p className="mt-1 text-soft">Accepted: {business.paymentMethods.join(" · ")}</p>
              )}
            </div>
            {business.footerNote && (
              <p className="self-end font-display text-2xl text-green">{business.footerNote}</p>
            )}
          </footer>
        </div>
      </article>
    </div>
  );
}
