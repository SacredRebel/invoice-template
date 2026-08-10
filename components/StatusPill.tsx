import { isOverdue } from "@/lib/format";

const styles: Record<string, string> = {
  draft:   "bg-paper text-body border-line",
  sent:    "bg-mint text-green border-green/40",
  paid:    "bg-gold2 text-gold border-gold/40",
  overdue: "bg-red2 text-red border-red/40",
};
const words: Record<string, string> = {
  draft: "Draft", sent: "Waiting for payment", paid: "Paid", overdue: "Overdue",
};

export default function StatusPill({ status, dueDate }: { status: string; dueDate?: string }) {
  const s = dueDate && isOverdue(dueDate, status) ? "overdue" : status;
  return (
    <span className={`inline-flex items-center rounded-full border-2 px-4 py-1.5
                      text-sm font-semibold ${styles[s] ?? styles.draft}`}>
      {words[s] ?? s}
    </span>
  );
}
