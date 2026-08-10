import Link from "next/link";
import { getInvoices, getBusiness } from "@/lib/github";
import { money, prettyDate, todayISO, isOverdue } from "@/lib/format";
import { total } from "@/lib/types";

export const dynamic = "force-dynamic";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function CalendarPage() {
  const [invoices, business] = await Promise.all([getInvoices(), getBusiness()]);
  const cur = business?.currency ?? "USD";

  const today = todayISO();
  const [Y, M] = today.split("-").map(Number);
  const first = new Date(Date.UTC(Y, M - 1, 1));
  const daysInMonth = new Date(Date.UTC(Y, M, 0)).getUTCDate();
  const startPad = (first.getUTCDay() + 6) % 7; // Monday-first

  const byDue: Record<string, any[]> = {};
  for (const inv of invoices) (byDue[inv.dueDate] ||= []).push(inv);

  const monthName = first.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const upcoming = invoices
    .filter((i) => i.status !== "paid" && i.status !== "draft")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div className="space-y-8">
      <div>
        <p className="label">Payments due</p>
        <h1 className="mt-1 font-display text-[40px] leading-tight">{monthName}</h1>
      </div>

      <div className="panel overflow-hidden p-4">
        <div className="grid grid-cols-7 gap-px">
          {DAYS.map((d) => (
            <div key={d} className="label pb-2 text-center">{d}</div>
          ))}
          {Array.from({ length: startPad }).map((_, i) => <div key={`pad${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const iso = `${Y}-${String(M).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const due = byDue[iso] ?? [];
            const isToday = iso === today;
            return (
              <div key={iso}
                   className={`min-h-[92px] rounded-lg border p-2 transition
                     ${isToday ? "border-sage bg-wash/60" : "border-line/70 bg-card"}`}>
                <div className={`tnum text-[12px] ${isToday ? "font-semibold text-sage" : "text-mute"}`}>{day}</div>
                <div className="mt-1 space-y-1">
                  {due.map((inv) => (
                    <Link key={inv.id} href={`/invoices/${inv.id}`}
                          className={`block truncate rounded px-1.5 py-1 text-[11px] font-medium transition
                            ${inv.status === "paid" ? "bg-amber/12 text-amber"
                              : isOverdue(inv.dueDate, inv.status) ? "bg-rust/12 text-rust"
                              : "bg-sage/10 text-sage hover:bg-sage/20"}`}>
                      {money(total(inv.items, inv.taxRate), cur)}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-display text-[22px]">Waiting on payment</h2>
        {upcoming.length === 0 ? (
          <p className="panel p-6 text-[15px] text-slate">Everything is paid. Nice.</p>
        ) : (
          <div className="panel divide-y divide-line">
            {upcoming.map((inv) => (
              <Link key={inv.id} href={`/invoices/${inv.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-wash/50 transition">
                <span className="tnum w-24 font-medium">{inv.number}</span>
                <span className="flex-1 truncate text-slate">{inv.clientSnapshot?.name}</span>
                <span className={`tnum text-[13px] ${isOverdue(inv.dueDate, inv.status) ? "text-rust" : "text-mute"}`}>
                  due {prettyDate(inv.dueDate)}
                </span>
                <span className="tnum w-28 text-right font-medium">
                  {money(total(inv.items, inv.taxRate), cur)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
