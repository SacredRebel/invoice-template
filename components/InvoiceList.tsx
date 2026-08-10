"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const CHIP: Record<string, string> = {
  draft: "bg-gold2 text-gold", waiting: "bg-tint text-brand",
  paid: "bg-mint text-green", overdue: "bg-red2 text-red",
};
const WORD: Record<string, string> = {
  draft: "Draft", waiting: "Waiting", paid: "Paid", overdue: "Overdue",
};
const initials = (n = "") =>
  n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

/** Big figure, small cents — the way the reference shows a total. */
export function Amount({ value, className = "" }: { value: string; className?: string }) {
  const m = value.match(/^(.*?)(\.\d{2})$/);
  return (
    <span className={`tnum ${className}`}>
      {m ? <>{m[1]}<span className="text-[0.55em] align-baseline font-bold">{m[2]}</span></> : value}
    </span>
  );
}

type Row = {
  id: string; number: string; name: string; email?: string;
  amount: string; due: string; state: string; search: string;
};

const TABS = ["All", "Waiting", "Overdue", "Paid"] as const;

export default function InvoiceList({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      const okTab = tab === "All" || r.state === tab.toLowerCase();
      const okQ = !needle || r.search.includes(needle);
      return okTab && okQ;
    });
  }, [rows, q, tab]);

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="sr-only">Search invoices</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} type="search"
               placeholder="Search a name, number or claim\u2026"
               className="field" />
      </label>

      <div className="seg">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} aria-pressed={tab === t}
                  className={`seg-btn ${tab === t ? "seg-on" : ""}`}>
            {t}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-3xl bg-card px-6 py-10 text-center text-base text-soft shadow-card">
          {q ? `Nothing matches \u201c${q}\u201d.` : "Nothing here."}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => (
            <li key={r.id}>
              <Link href={`/invoices/${r.id}`}
                    className="block rounded-3xl bg-card p-4 shadow-card transition
                               hover:shadow-lift sm:p-5">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center
                                   rounded-2xl bg-tint text-base font-bold text-brand">
                    {initials(r.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-ink">{r.name}</p>
                    <p className="tnum truncate text-base text-soft">{r.number}</p>
                  </div>
                  <span className={`chip shrink-0 ${CHIP[r.state] ?? CHIP.draft}`}>
                    {WORD[r.state] ?? "Draft"}
                  </span>
                </div>

                <div className="mt-3.5 flex items-end justify-between gap-3
                                rounded-2xl bg-wash px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-soft">Due</p>
                    <p className={`tnum mt-0.5 text-base font-semibold
                      ${r.state === "overdue" ? "text-red" : "text-ink"}`}>{r.due}</p>
                  </div>
                  <Amount value={r.amount} className="text-xl font-bold text-ink" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
