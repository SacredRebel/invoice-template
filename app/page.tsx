import Link from "next/link";
import { getInvoices, getBusiness, canSave } from "@/lib/data";
import { money, prettyDate, isOverdue, todayISO } from "@/lib/format";
import { balanceDue } from "@/lib/types";
import StatusPill from "@/components/StatusPill";

export const dynamic = "force-dynamic";

const owed = (i: any) => balanceDue(i.items, i.taxRate, i.discount, i.depositPaid);

export default async function Dashboard() {
  const [invoices, business] = await Promise.all([getInvoices(), getBusiness()]);
  const cur = business.currency || "USD";

  const sum = (l: any[]) => l.reduce((s, i) => s + owed(i), 0);
  const unpaid  = invoices.filter((i) => i.status !== "paid" && i.status !== "draft");
  const overdue = unpaid.filter((i) => isOverdue(i.dueDate, i.status));
  const paidNow = invoices.filter(
    (i) => i.status === "paid" && i.issueDate.slice(0, 7) === todayISO().slice(0, 7));

  /* One colour per meaning, used identically everywhere in the app. */
  const stats = [
    { label: "Waiting for payment", value: money(sum(unpaid), cur),
      note: `${unpaid.length} invoice${unpaid.length === 1 ? "" : "s"}`,
      bar: "bg-green", tone: "text-ink" },
    { label: "Overdue", value: money(sum(overdue), cur),
      note: overdue.length ? `${overdue.length} past the due date` : "Nothing overdue",
      bar: overdue.length ? "bg-red" : "bg-line",
      tone: overdue.length ? "text-red" : "text-soft",
      fill: overdue.length ? "bg-red2" : "" },
    { label: "Paid this month",
      value: money(paidNow.reduce((s, i) => s + owed({ ...i, depositPaid: 0 }), 0), cur),
      note: `${paidNow.length} received`, bar: "bg-gold", tone: "text-ink" },
  ];

  return (
    <div className="space-y-8">
      {!canSave() && (
        <div className="panel border-l-8 border-l-gold border-gold/50 bg-gold2 p-5">
          <p className="text-lg font-semibold text-ink">Set-up not finished yet</p>
          <p className="mt-1 text-base text-body">
            Look around freely — but new invoices won&rsquo;t be saved until GitHub is connected.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">{prettyDate(todayISO())}</p>
          <h1 className="mt-2 text-3xl text-ink sm:text-4xl">
            {invoices.length ? "Where things stand" : "Let’s write your first invoice"}
          </h1>
        </div>
        <p className="rounded-lg border-2 border-line bg-card px-4 py-2 text-base text-soft">
          Tip: ask Claude to write an invoice and it appears here.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className={`panel overflow-hidden ${s.fill ?? ""}`}>
            <div className={`h-2 ${s.bar}`} aria-hidden />
            <div className="p-6">
              <p className="label">{s.label}</p>
              <p className={`tnum mt-3 text-3xl ${s.tone}`}>{s.value}</p>
              <p className="mt-2 text-base text-soft">{s.note}</p>
            </div>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-4 text-2xl text-ink">All invoices</h2>

        {invoices.length === 0 ? (
          <div className="panel p-10 text-center">
            <p className="text-2xl text-ink">Nothing here yet</p>
            <p className="mx-auto mt-2 max-w-md text-base text-body">
              Write one on this site, or just tell Claude about the job and it will
              appear here.
            </p>
            <Link href="/invoices/new" className="btn-primary mt-6">+ New invoice</Link>
          </div>
        ) : (
          <>
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
                  {invoices.map((inv) => {
                    const late = isOverdue(inv.dueDate, inv.status);
                    const bar = inv.status === "paid" ? "border-l-gold"
                              : late ? "border-l-red"
                              : inv.status === "draft" ? "border-l-line" : "border-l-green";
                    return (
                      <tr key={inv.id}
                          className={`border-b border-l-8 border-line ${bar} last:border-b-0 hover:bg-mint/50`}>
                        <td className="px-6 py-5">
                          <Link href={`/invoices/${inv.id}`}
                                className="tnum text-lg font-semibold text-green underline underline-offset-4">
                            {inv.number}
                          </Link>
                        </td>
                        <td className="px-6 py-5 text-base text-body">{inv.clientSnapshot?.name ?? "—"}</td>
                        <td className={`tnum px-6 py-5 text-base ${late ? "font-semibold text-red" : "text-body"}`}>
                          {prettyDate(inv.dueDate)}
                        </td>
                        <td className="px-6 py-5"><StatusPill status={inv.status} dueDate={inv.dueDate} /></td>
                        <td className="tnum px-6 py-5 text-right text-lg font-semibold text-ink">
                          {money(owed(inv), cur)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 md:hidden">
              {invoices.map((inv) => {
                const late = isOverdue(inv.dueDate, inv.status);
                const bar = inv.status === "paid" ? "border-l-gold"
                          : late ? "border-l-red"
                          : inv.status === "draft" ? "border-l-line" : "border-l-green";
                return (
                  <Link key={inv.id} href={`/invoices/${inv.id}`}
                        className={`panel block border-l-8 ${bar} p-5`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="tnum text-lg font-semibold text-green">{inv.number}</span>
                      <StatusPill status={inv.status} dueDate={inv.dueDate} />
                    </div>
                    <p className="mt-2 text-base text-body">{inv.clientSnapshot?.name}</p>
                    <div className="mt-3 flex items-baseline justify-between">
                      <span className={`tnum text-base ${late ? "font-semibold text-red" : "text-soft"}`}>
                        Due {prettyDate(inv.dueDate)}
                      </span>
                      <span className="tnum text-2xl text-ink">{money(owed(inv), cur)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
