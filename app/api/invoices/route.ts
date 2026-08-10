import { NextResponse } from "next/server";
import { getInvoices, saveInvoice, nextInvoiceNumber } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try { return NextResponse.json(await getInvoices()); }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const number = body.number || (await nextInvoiceNumber());
    const invoice = { ...body, id: number, number, createdAt: new Date().toISOString() };
    await saveInvoice(invoice);
    return NextResponse.json(invoice, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
