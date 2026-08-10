import { isOverdue } from "@/lib/format";

const styles: Record<string, string> = {
  draft:   "bg-line/60 text-slate",
  sent:    "bg-wash text-sage",
  paid:    "bg-amber/12 text-amber",
  overdue: "bg-rust/12 text-rust",
};

export default function StatusPill({ status, dueDate }: { status: string; dueDate?: string }) {
  const s = dueDate && isOverdue(dueDate, status) ? "overdue" : status;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px]
                      font-medium capitalize tracking-wide ${styles[s] ?? styles.draft}`}>
      {s}
    </span>
  );
}
