import Link from "next/link";
import { getInvoices, getBusiness, canSave } from "@/lib/data";
import { money, prettyDate, isOverdue, todayISO } from "@/lib/format";
import { balanceDue } from "@/lib/types";
import InvoiceList, { Amount } from "@/components/InvoiceList";

export const dynamic = "force-dynamic";

const owed = (i: any) => balanceDue(i.items, i.taxRate, i.discount, i.depositPaid);

export default async function Dashboard() {
  const [invoices, business] = await Promise.all([getInvoices(), getBusiness()]);
  const cur = business.currency || "USD";

  const sum = (l: any[]) => l.reduce((s, i) => s + owed(i), 0);
  const live    = invoices.filter((i) => i.status !== "void");
  const unpaid  = live.filter((i) => i.status !== "paid" && i.status !== "draft");
  const overdue = unpaid.filter((i) => isOverdue(i.dueDate, i.status));
  const waiting = unpaid.filter((i) => !isOverdue(i.dueDate, i.status));
  const paidNow = live.filter(
    (i) => i.status === "paid" && (i.paidAt ?? i.issueDate).slice(0, 7) === todayISO().slice(0, 7));

  const rows = live.map((i) => {
    const st = i.status === "paid" ? "paid"
             : i.status === "draft" ? "draft"
             : isOverdue(i.dueDate, i.status) ? "overdue" : "waiting";
    const name = i.clientSnapshot?.name ?? "\u2014";
    return {
      id: i.id, number: i.number, name, email: i.clientSnapshot?.email,
      amount: money(owed(i), cur), due: prettyDate(i.dueDate), state: st,
      search: [name, i.number, i.reference ?? "", i.clientSnapshot?.email ?? ""]
        .join(" ").toLowerCase(),
    };
  });

  return (
    <>
      {/* ── Blue band. The white sheet below curves up over it. ── */}
      <header className="app-header -mx-4 -mt-6 px-5 pb-14 pt-7 sm:-mx-7 sm:px-7 lg:-mt-0 lg:pt-10">
        <p className="text-base font-medium text-white/80">
          {prettyDate(todayISO())}
        </p>
        <p className="mt-1 text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
          Owed to you right now
        </p>
        <Amount value={money(sum(unpaid), cur)}
                className="mt-2 block font-display text-4xl font-bold leading-none text-white" />
        <p className="mt-2 text-base text-white/80">
          across {unpaid.length} unpaid invoice{unpaid.length === 1 ? "" : "s"}
        </p>

        <div className="mt-7 grid grid-cols-3 gap-2">
          {[
            { l: "Waiting", v: money(sum(waiting), cur) },
            { l: "Overdue", v: money(sum(overdue), cur) },
            { l: "Paid",    v: money(paidNow.reduce((s, i) => s + owed({ ...i, depositPaid: 0 }), 0), cur) },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl bg-white/15 px-3 py-3 text-center">
              <p className="text-sm font-medium text-white/80">{s.l}</p>
              <p className="tnum mt-1 truncate text-base font-bold text-white">{s.v}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="sheet -mx-4 min-h-[60vh] pb-4 sm:-mx-7">
        {!canSave() && (
          <div className="mb-5 rounded-3xl bg-gold2 px-5 py-4">
            <p className="text-base font-bold text-ink">Set-up not finished yet</p>
            <p className="mt-1 text-base text-body">
              Look around freely — nothing will be saved until GitHub is connected.
            </p>
          </div>
        )}

        {invoices.length === 0 ? (
          <div className="rounded-3xl bg-card px-6 py-14 text-center shadow-card">
            <p className="text-2xl font-bold text-ink">Nothing here yet</p>
            <p className="mx-auto mt-2 max-w-md text-base text-body">
              Write one here, or tell Claude about the job and it will appear.
            </p>
            <Link href="/invoices/new" className="btn-primary mt-7">+ New invoice</Link>
          </div>
        ) : (
          <>
            <h2 className="mb-3 text-xl font-bold tracking-tight text-ink">All invoices</h2>
            <InvoiceList rows={rows} />
          </>
        )}
      </div>
    </>
  );
}
