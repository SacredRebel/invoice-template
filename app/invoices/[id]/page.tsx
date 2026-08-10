import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoice, getBusiness } from "@/lib/github";
import { money, prettyDate } from "@/lib/format";
import { subtotal, taxAmount, total } from "@/lib/types";
import StatusPill from "@/components/StatusPill";
import InvoiceActions from "@/components/InvoiceActions";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const [inv, business] = await Promise.all([getInvoice(params.id), getBusiness()]);
  if (!inv) notFound();

  const cur = business?.currency ?? "USD";
  const sub = subtotal(inv.items);
  const tax = taxAmount(inv.items, inv.taxRate);
  const grand = total(inv.items, inv.taxRate);
  const client = inv.clientSnapshot ?? {};

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center gap-3">
        <Link href="/" className="text-[14px] text-slate hover:text-sage transition">← All invoices</Link>
        <StatusPill status={inv.status} dueDate={inv.dueDate} />
        <InvoiceActions id={inv.id} status={inv.status} />
      </div>

      {/* ── THE DOCUMENT ── this is what the client sees ── */}
      <article className="print-sheet mx-auto max-w-[860px] bg-card px-12 py-14 shadow-lift
                          border border-line rounded-xl2">
        <header className="flex flex-wrap items-start justify-between gap-8">
          <div>
            <h1 className="font-display text-[34px] leading-none">{business?.name}</h1>
            <div className="mt-3 space-y-0.5 text-[13px] leading-relaxed text-slate">
              {business?.address?.map((l: string) => <p key={l}>{l}</p>)}
              {business?.phone && <p className="tnum">{business.phone}</p>}
              {business?.email && <p>{business.email}</p>}
              {business?.license && <p className="text-mute">Lic. {business.license}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="label">Invoice</p>
            <p className="tnum mt-1 font-display text-[30px] leading-none">{inv.number}</p>
            <dl className="mt-4 space-y-1 text-[13px]">
              <div className="flex justify-end gap-4">
                <dt className="text-mute">Issued</dt>
                <dd className="tnum w-28 text-right">{prettyDate(inv.issueDate)}</dd>
              </div>
              <div className="flex justify-end gap-4">
                <dt className="text-mute">Due</dt>
                <dd className="tnum w-28 text-right font-medium">{prettyDate(inv.dueDate)}</dd>
              </div>
              {inv.reference && (
                <div className="flex justify-end gap-4">
                  <dt className="text-mute">Reference</dt>
                  <dd className="tnum w-28 text-right">{inv.reference}</dd>
                </div>
              )}
            </dl>
          </div>
        </header>

        <div className="mt-10 border-t border-line pt-6">
          <p className="label">Billed to</p>
          <p className="mt-2 text-[17px] font-medium">{client.name}</p>
          <div className="mt-1 space-y-0.5 text-[13px] leading-relaxed text-slate">
            {client.contact && <p>{client.contact}</p>}
            {client.address?.map((l: string) => <p key={l}>{l}</p>)}
            {client.email && <p>{client.email}</p>}
          </div>
        </div>

        <table className="mt-10 w-full text-[14px]">
          <thead>
            <tr className="border-b border-ink/15">
              <th className="label pb-2 text-left font-medium">Description</th>
              <th className="label pb-2 text-right font-medium">Qty</th>
              <th className="label pb-2 text-right font-medium">Rate</th>
              <th className="label pb-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((it: any, i: number) => (
              <tr key={i} className="border-b border-line">
                <td className="py-3.5 pr-6">{it.description}</td>
                <td className="tnum py-3.5 text-right text-slate">{it.quantity}</td>
                <td className="tnum py-3.5 text-right text-slate">{money(it.rate, cur)}</td>
                <td className="tnum py-3.5 text-right font-medium">{money(it.quantity * it.rate, cur)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-[300px] space-y-2 text-[14px]">
            <div className="flex justify-between text-slate">
              <span>Subtotal</span><span className="tnum">{money(sub, cur)}</span>
            </div>
            {inv.taxRate ? (
              <div className="flex justify-between text-slate">
                <span>Tax ({inv.taxRate}%)</span><span className="tnum">{money(tax, cur)}</span>
              </div>
            ) : null}
            <div className="mt-3 flex items-baseline justify-between border-t-2 border-ink pt-3">
              <span className="label">Total due</span>
              <span className="tnum font-display text-[30px] leading-none">{money(grand, cur)}</span>
            </div>
          </div>
        </div>

        {inv.notes && (
          <div className="mt-10 border-t border-line pt-5">
            <p className="label">Notes</p>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-slate">{inv.notes}</p>
          </div>
        )}

        <footer className="mt-10 flex flex-wrap justify-between gap-6 border-t border-line pt-5
                           text-[13px] text-slate">
          <div className="max-w-sm">
            <p className="label">Payment</p>
            <p className="mt-2">{business?.paymentTerms}</p>
            {business?.paymentMethods?.length > 0 && (
              <p className="mt-1 text-mute">Accepted: {business.paymentMethods.join(" · ")}</p>
            )}
          </div>
          {business?.footerNote && (
            <p className="self-end font-display text-[19px] text-sage">{business.footerNote}</p>
          )}
        </footer>
      </article>
    </div>
  );
}
