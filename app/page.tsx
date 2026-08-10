import Link from "next/link";
import { getInvoices, getBusiness, canSave } from "@/lib/data";
import { money, prettyDate, isOverdue, todayISO } from "@/lib/format";
import { total } from "@/lib/types";
import StatusPill from "@/components/StatusPill";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [invoices, business] = await Promise.all([getInvoices(), getBusiness()]);
  const cur = business.currency || "USD";

  const sum = (l: any[]) => l.reduce((s, i) => s + total(i.items, i.taxRate), 0);
  const unpaid  = invoices.filter((i) => i.status !== "paid" && i.status !== "draft");
  const overdue = unpaid.filter((i) => isOverdue(i.dueDate, i.status));
  const paidNow = invoices.filter(
    (i) => i.status === "paid" && i.issueDate.slice(0, 7) === todayISO().slice(0, 7));

  const stats = [
    { label: "Waiting for payment", value: money(sum(unpaid), cur),
      note: `${unpaid.length} invoice${unpaid.length === 1 ? "" : "s"}` },
    { label: "Overdue", value: money(sum(overdue), cur),
      note: overdue.length ? `${overdue.length} past the due date` : "Nothing overdue",
      alert: overdue.length > 0 },
    { label: "Paid this month", value: money(sum(paidNow), cur),
      note: `${paidNow.length} received` },
  ];

  return (
    <div className="space-y-8">
      {!canSave() && (
        <div className="panel border-gold/50 bg-gold2 p-5">
          <p className="text-lg font-semibold text-ink">Set-up not finished yet</p>
          <p className="mt-1 text-base text-body">
            You can look around, but new invoices won&rsquo;t save until GitHub is connected.
            The steps are in <strong>SETUP.md</strong>.
          </p>
        </div>
      )}

      <div>
        <p className="label">{prettyDate(todayISO())}</p>
        <h1 className="mt-2 font-display text-4xl text-ink">
          {invoices.length ? "Where things stand" : "Let’s write your first invoice"}
        </h1>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className={`panel p-6 ${s.alert ? "border-red/50 bg-red2" : ""}`}>
            <p className="label">{s.label}</p>
            <p className={`tnum mt-3 font-display text-3xl ${s.alert ? "text-red" : "text-ink"}`}>{s.value}</p>
            <p className="mt-2 text-base text-soft">{s.note}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-4 font-display text-2xl text-ink">All invoices</h2>

        {invoices.length === 0 ? (
          <div className="panel p-10 text-center">
            <p className="font-display text-2xl text-ink">Nothing here yet</p>
            <p className="mx-auto mt-2 max-w-md text-base text-body">
              Write an invoice and it appears here. You can print it, save it as a
              PDF, or copy it into an email.
            </p>
            <Link href="/invoices/new" className="btn-primary mt-6">+ New invoice</Link>
          </div>
        ) : (
          <>
            {/* Table on wide screens */}
            <div className="panel hidden overflow-hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-line bg-paper text-left">
                    {["Invoice", "Client", "Due", "Status", "Amount"].map((h, i) => (
                      <th key={h} className={`label px-6 py-4 ${i === 4 ? "text-right" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-line last:border-0 hover:bg-mint/60">
                      <td className="px-6 py-5">
                        <Link href={`/invoices/${inv.id}`}
                              className="tnum text-lg font-semibold text-green underline underline-offset-4">
                          {inv.number}
                        </Link>
                      </td>
                      <td className="px-6 py-5 text-base text-body">{inv.clientSnapshot?.name ?? "—"}</td>
                      <td className="tnum px-6 py-5 text-base text-body">{prettyDate(inv.dueDate)}</td>
                      <td className="px-6 py-5"><StatusPill status={inv.status} dueDate={inv.dueDate} /></td>
                      <td className="tnum px-6 py-5 text-right text-lg font-semibold text-ink">
                        {money(total(inv.items, inv.taxRate), cur)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards on phones */}
            <div className="space-y-4 md:hidden">
              {invoices.map((inv) => (
                <Link key={inv.id} href={`/invoices/${inv.id}`} className="panel block p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="tnum text-lg font-semibold text-green">{inv.number}</span>
                    <StatusPill status={inv.status} dueDate={inv.dueDate} />
                  </div>
                  <p className="mt-2 text-base text-body">{inv.clientSnapshot?.name}</p>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="tnum text-base text-soft">Due {prettyDate(inv.dueDate)}</span>
                    <span className="tnum font-display text-2xl text-ink">
                      {money(total(inv.items, inv.taxRate), cur)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
