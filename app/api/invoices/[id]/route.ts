import { NextResponse } from "next/server";
import { getInvoice, saveInvoice } from "@/lib/data";
import { invoiceInputSchema, firstProblem, isInvoiceId, STORED_STATUS } from "@/lib/validate";

export const dynamic = "force-dynamic";

const badId = () =>
  NextResponse.json({ error: "That is not an invoice number." }, { status: 400 });

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!isInvoiceId(params.id)) return badId();
  const inv = await getInvoice(params.id);
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(inv);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!isInvoiceId(params.id)) return badId();

  let body: any;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "That request was not readable." }, { status: 400 }); }

  const existing = await getInvoice(params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  /* A status-only change (Mark as paid, Void) is allowed on its own. */
  const statusOnly = Object.keys(body).length === 1 && typeof body.status === "string";

  if (statusOnly && !STORED_STATUS.includes(body.status)) {
    return NextResponse.json({ error: "That is not a status we store." }, { status: 400 });
  }

  const merged: any = { ...existing, ...body };
  if (!statusOnly) {
    const parsed = invoiceInputSchema.safeParse(merged);
    if (!parsed.success) {
      return NextResponse.json({ error: firstProblem(parsed.error) }, { status: 400 });
    }
    Object.assign(merged, parsed.data);
  }

  /* The number and the creation time belong to the original invoice, always. */
  merged.id = existing.id;
  merged.number = existing.number;
  merged.createdAt = existing.createdAt;

  /* Paid keeps a date; unpaid clears it. "Paid this month" reads this, not the
     issue date, so an old invoice paid today counts in today's month. */
  if (merged.status === "paid" && existing.status !== "paid") {
    merged.paidAt = new Date().toISOString();
  } else if (merged.status !== "paid") {
    delete merged.paidAt;
  }

  try {
    await saveInvoice(merged);
    return NextResponse.json(merged);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

/* Hard delete is gone. An invoice is a financial record and its number must
   never come round again — voiding keeps the file and the number. */
export async function DELETE() {
  return NextResponse.json(
    { error: "Invoices are never deleted. Void it instead so the number is kept." },
    { status: 405 }
  );
}
