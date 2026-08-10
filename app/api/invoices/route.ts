import { NextResponse } from "next/server";
import { getInvoices, createInvoice } from "@/lib/data";
import { invoiceInputSchema, firstProblem } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET() {
  try { return NextResponse.json(await getInvoices()); }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "That request was not readable." }, { status: 400 }); }

  /* .strip() drops any id, number or createdAt the caller sent, so nobody can
     aim a "new" invoice at an existing file and overwrite it. */
  const parsed = invoiceInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstProblem(parsed.error) }, { status: 400 });
  }

  try {
    const invoice = await createInvoice(parsed.data as any);
    return NextResponse.json(invoice, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
