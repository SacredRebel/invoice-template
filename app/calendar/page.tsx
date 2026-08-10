import Link from "next/link";
import { getInvoices, getBusiness } from "@/lib/data";
import { money, prettyDate, todayISO, isOverdue } from "@/lib/format";
import { balanceDue } from "@/lib/types";

export const dynamic = "force-dynamic";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const owed = (i: any) => balanceDue(i.items, i.taxRate, i.discount, i.depositPaid);

const state = (i: any) =>
  i.status === "paid" ? "paid" : isOverdue(i.dueDate, i.status) ? "overdue" : "waiting";

const DOT: Record<string, string> = {
  paid: "bg-green", overdue: "bg-red", waiting: "bg-brand",
};

/** ?m=YYYY-MM drives the month, so the arrows are plain links and the
 *  calendar works with no JavaScript at all. */
function monthFrom(m?: string) {
  const t = todayISO();
  const ok = m && /^\d{4}-\d{2}$/.test(m) ? m : t.slice(0, 7);
  const [Y, M] = ok.split("-").map(Number);
  return { Y, M, iso: ok };
}
const shift = (Y: number, M: number, by: number) => {
  const d = new Date(Date.UTC(Y, M - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

export default async function CalendarPage(
  { searchParams }: { searchParams: { m?: string } }
) {
  const [all, business] = await Promise.all([getInvoices(), getBusiness()]);
  const invoices = all.filter((i: any) => i.status !== "void");
  const cur = business.currency || "USD";

  const today = todayISO();
  const { Y, M, iso } = monthFrom(searchParams?.m);
  const first = new Date(Date.UTC(Y, M - 1, 1));
  const days = new Date(Date.UTC(Y, M, 0)).getUTCDate();
  const pad = (first.getUTCDay() + 6) % 7;          // weeks start Monday

  const byDue: Record<string, any[]> = {};
  for (const i of invoices) (byDue[i.dueDate] ||= []).push(i);

  const thisMonth = invoices
    .filter((i) => i.dueDate.slice(0, 7) === iso)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const monthName = first.toLocaleDateString("en-US",
    { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <div className="space-y-6">
      {/* ── Month, with arrows that actually move ── */}
      <div className="flex items-center justify-between gap-3">
        <Link href={`/calendar?m=${shift(Y, M, -1)}`} aria-label="Previous month"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl
                         bg-card text-2xl font-bold text-brand shadow-card">‹</Link>
        <div className="text-center">
          <p className="label">Payments due</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {monthName}
          </h1>
        </div>
        <Link href={`/calendar?m=${shift(Y, M, 1)}`} aria-label="Next month"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl
                         bg-card text-2xl font-bold text-brand shadow-card">›</Link>
      </div>

      {iso !== today.slice(0, 7) && (
        <Link href="/calendar" className="btn-quiet w-full">Back to this month</Link>
      )}

      {/* ── The grid. Now on every screen, phone included. ── */}
      <div className="rounded-3xl bg-card p-3 shadow-card sm:p-5">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {DAYS.map((d, n) => (
            <div key={n} className="pb-2 text-center text-sm font-semibold text-soft">{d}</div>
          ))}
          {Array.from({ length: pad }).map((_, i) => <div key={`p${i}`} />)}

          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1;
            const dayIso = `${Y}-${String(M).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const due = byDue[dayIso] ?? [];
            const isToday = dayIso === today;
            const one = due.length === 1 ? due[0] : null;

            const cell = (
              <>
                <span className={`tnum text-base font-semibold
                  ${isToday ? "text-white" : due.length ? "text-ink" : "text-soft"}`}>
                  {day}
                </span>
                <span className="mt-1 flex h-2 items-center justify-center gap-0.5">
                  {due.slice(0, 3).map((inv, n) => (
                    <span key={n}
                          className={`h-1.5 w-1.5 rounded-full ${
                            isToday ? "bg-white" : DOT[state(inv)]}`} aria-hidden />
                  ))}
                </span>
              </>
            );

            const base = `flex aspect-square flex-col items-center justify-center rounded-xl2
                          ${isToday ? "bg-brand shadow-brand" : due.length ? "bg-wash" : ""}`;

            return one ? (
              <Link key={dayIso} href={`/invoices/${one.id}`}
                    aria-label={`${prettyDate(dayIso)} \u2014 ${one.clientSnapshot?.name}`}
                    className={base}>{cell}</Link>
            ) : (
              <div key={dayIso} className={base}>{cell}</div>
            );
          })}
        </div>

        <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-line/60 pt-4">
          {[["bg-brand", "Waiting"], ["bg-red", "Overdue"], ["bg-green", "Paid"]].map(([c, l]) => (
            <li key={l} className="flex items-center gap-2 text-sm font-medium text-body">
              <span className={`h-2.5 w-2.5 rounded-full ${c}`} aria-hidden />{l}
            </li>
          ))}
        </ul>
      </div>

      {/* ── What is actually due, in date order ── */}
      <section>
        <h2 className="mb-3 text-xl font-bold tracking-tight text-ink">
          Due in {first.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" })}
        </h2>

        {thisMonth.length === 0 ? (
          <p className="rounded-3xl bg-card px-6 py-8 text-center text-base text-soft shadow-card">
            Nothing is due this month.
          </p>
        ) : (
          <ul className="space-y-3">
            {thisMonth.map((inv) => {
              const st = state(inv);
              return (
                <li key={inv.id}>
                  <Link href={`/invoices/${inv.id}`}
                        className="flex items-center gap-4 rounded-3xl bg-card p-4 shadow-card
                                   transition hover:shadow-lift">
                    <span className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center
                                      rounded-2xl ${st === "overdue" ? "bg-red2" : st === "paid" ? "bg-mint" : "bg-tint"}`}>
                      <span className={`tnum text-lg font-bold ${
                        st === "overdue" ? "text-red" : st === "paid" ? "text-green" : "text-brand"}`}>
                        {Number(inv.dueDate.slice(8))}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-bold text-ink">
                        {inv.clientSnapshot?.name ?? "\u2014"}
                      </span>
                      <span className="tnum block text-base text-soft">{inv.number}</span>
                    </span>
                    <span className="tnum shrink-0 text-lg font-bold text-ink">
                      {money(owed(inv), cur)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
