import Link from "next/link";
import { getInvoices, getBusiness } from "@/lib/data";
import { money, prettyDate, todayISO, isOverdue } from "@/lib/format";
import { balanceDue } from "@/lib/types";

export const dynamic = "force-dynamic";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const owed = (i: any) => balanceDue(i.items, i.taxRate, i.discount, i.depositPaid);

export default async function CalendarPage() {
  const [invoices, business] = await Promise.all([getInvoices(), getBusiness()]);
  const cur = business.currency || "USD";

  const today = todayISO();
  const [Y, M] = today.split("-").map(Number);
  const first = new Date(Date.UTC(Y, M - 1, 1));
  const days = new Date(Date.UTC(Y, M, 0)).getUTCDate();
  const pad = (first.getUTCDay() + 6) % 7;

  const byDue: Record<string, any[]> = {};
  for (const i of invoices) (byDue[i.dueDate] ||= []).push(i);

  const waiting = invoices
    .filter((i) => i.status !== "paid" && i.status !== "draft")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const key = [
    { c: "bg-green", l: "Waiting for payment" },
    { c: "bg-red",   l: "Overdue" },
    { c: "bg-gold",  l: "Paid" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Payments due</p>
          <h1 className="mt-2 font-display text-4xl text-ink">
            {first.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}
          </h1>
        </div>
        <ul className="flex flex-wrap gap-4">
          {key.map((k) => (
            <li key={k.l} className="flex items-center gap-2 text-base text-body">
              <span className={`h-4 w-4 rounded ${k.c}`} aria-hidden />{k.l}
            </li>
          ))}
        </ul>
      </div>

      <div className="panel overflow-x-auto p-4">
        <div className="grid min-w-[640px] grid-cols-7 gap-2">
          {DAYS.map((d) => <div key={d} className="label pb-1 text-center">{d}</div>)}
          {Array.from({ length: pad }).map((_, i) => <div key={`p${i}`} />)}
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1;
            const iso = `${Y}-${String(M).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const due = byDue[iso] ?? [];
            const isToday = iso === today;
            return (
              <div key={iso} className={`min-h-[104px] rounded-lg border-2 p-2
                ${isToday ? "border-green bg-mint" : "border-line bg-card"}`}>
                <div className={`tnum text-base font-semibold ${isToday ? "text-green" : "text-soft"}`}>
                  {day}{isToday && <span className="ml-1 text-sm font-normal">today</span>}
                </div>
                <div className="mt-1 space-y-1">
                  {due.map((inv) => (
                    <Link key={inv.id} href={`/invoices/${inv.id}`}
                          className={`block truncate rounded border-l-4 px-2 py-1 text-sm font-semibold
                            ${inv.status === "paid" ? "border-l-gold bg-gold2 text-gold"
                              : isOverdue(inv.dueDate, inv.status) ? "border-l-red bg-red2 text-red"
                              : "border-l-green bg-mint text-green"}`}>
                      {money(owed(inv), cur)}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <section>
        <h2 className="mb-4 font-display text-2xl text-ink">Still waiting on payment</h2>
        {waiting.length === 0 ? (
          <p className="panel p-7 text-lg text-body">Everything is paid.</p>
        ) : (
          <div className="panel divide-y-2 divide-line">
            {waiting.map((inv) => {
              const late = isOverdue(inv.dueDate, inv.status);
              return (
                <Link key={inv.id} href={`/invoices/${inv.id}`}
                      className={`flex flex-wrap items-center gap-x-5 gap-y-1 border-l-8 px-6 py-5
                        ${late ? "border-l-red" : "border-l-green"} hover:bg-mint/50`}>
                  <span className="tnum text-lg font-semibold text-green">{inv.number}</span>
                  <span className="flex-1 text-base text-body">{inv.clientSnapshot?.name}</span>
                  <span className={`tnum text-base font-semibold ${late ? "text-red" : "text-soft"}`}>
                    due {prettyDate(inv.dueDate)}
                  </span>
                  <span className="tnum text-lg font-semibold text-ink">{money(owed(inv), cur)}</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
