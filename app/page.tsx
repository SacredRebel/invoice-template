import Link from "next/link";
import { getInvoices, getBusiness } from "@/lib/github";
import { money, prettyDate, isOverdue, todayISO } from "@/lib/format";
import { total } from "@/lib/types";
import StatusPill from "@/components/StatusPill";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  let invoices: any[] = [];
  let business: any = null;
  let error: string | null = null;

  try {
    [invoices, business] = await Promise.all([getInvoices(), getBusiness()]);
  } catch (e: any) {
    error = e.message;
  }

  const currency = business?.currency ?? "USD";

  if (error) {
    return (
      <div className="panel p-8">
        <h1 className="font-display text-2xl">Not connected yet</h1>
        <p className="mt-2 max-w-lg text-[15px] text-slate">
          The app can&rsquo;t reach GitHub. Add the four environment variables in Vercel,
          then redeploy. The steps are in <span className="font-medium">SETUP.md</span>.
        </p>
        <p className="mt-4 rounded-lg bg-wash px-3 py-2 font-mono text-[12px] text-sage">{error}</p>
      </div>
    );
  }

  const sum = (list: any[]) => list.reduce((s, i) => s + total(i.items, i.taxRate), 0);
  const unpaid  = invoices.filter((i) => i.status !== "paid" && i.status !== "draft");
  const overdue = unpaid.filter((i) => isOverdue(i.dueDate, i.status));
  const paidThisMonth = invoices.filter(
    (i) => i.status === "paid" && i.issueDate.slice(0, 7) === todayISO().slice(0, 7)
  );

  const stats = [
    { label: "Outstanding", value: money(sum(unpaid), currency),        note: `${unpaid.length} invoice${unpaid.length === 1 ? "" : "s"}` },
    { label: "Overdue",     value: money(sum(overdue), currency),       note: overdue.length ? `${overdue.length} past due` : "None", alert: overdue.length > 0 },
    { label: "Paid this month", value: money(sum(paidThisMonth), currency), note: `${paidThisMonth.length} received` },
  ];

  return (
    <div className="space-y-10">
      <div>
        <p className="label">{prettyDate(todayISO())}</p>
        <h1 className="mt-1 font-display text-[40px] leading-tight">
          {invoices.length ? "Here’s where things stand." : "Let’s write your first invoice."}
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="panel p-5">
            <p className="label">{s.label}</p>
            <p className={`tnum mt-2 font-display text-[32px] leading-none
                          ${s.alert ? "text-rust" : "text-ink"}`}>{s.value}</p>
            <p className="mt-2 text-[13px] text-mute">{s.note}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-[22px]">All invoices</h2>
          <span className="text-[13px] text-mute">{invoices.length} total</span>
        </div>

        {invoices.length === 0 ? (
          <div className="panel p-10 text-center">
            <p className="font-display text-[22px]">Nothing here yet</p>
            <p className="mx-auto mt-2 max-w-sm text-[15px] text-slate">
              Create an invoice and it saves straight to GitHub. You can print it,
              save it as a PDF, or email it.
            </p>
            <Link href="/invoices/new" className="btn-primary mt-6">Write an invoice</Link>
          </div>
        ) : (
          <div className="panel overflow-hidden">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-line text-left">
                  {["Invoice", "Client", "Issued", "Due", "Status", "Amount"].map((h, i) => (
                    <th key={h} className={`label px-5 py-3 font-medium ${i === 5 ? "text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="group border-b border-line/70 last:border-0 hover:bg-wash/50 transition">
                    <td className="px-5 py-4">
                      <Link href={`/invoices/${inv.id}`} className="tnum font-medium hover:text-sage transition">
                        {inv.number}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-slate">{inv.clientSnapshot?.name ?? "—"}</td>
                    <td className="tnum px-5 py-4 text-slate">{prettyDate(inv.issueDate)}</td>
                    <td className="tnum px-5 py-4 text-slate">{prettyDate(inv.dueDate)}</td>
                    <td className="px-5 py-4"><StatusPill status={inv.status} dueDate={inv.dueDate} /></td>
                    <td className="tnum px-5 py-4 text-right font-medium">
                      {money(total(inv.items, inv.taxRate), currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
