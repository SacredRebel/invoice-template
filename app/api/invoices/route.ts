import { NextResponse } from "next/server";
import { getInvoices, writeFile, nextInvoiceNumber, readFile } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getInvoices());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const number = body.number || (await nextInvoiceNumber());
    const invoice = { ...body, id: number, number, createdAt: new Date().toISOString() };

    const existing = await readFile(`data/invoices/${number}.json`);
    await writeFile(
      `data/invoices/${number}.json`,
      invoice,
      `invoice: ${existing ? "update" : "create"} ${number}`,
      existing?.sha
    );
    return NextResponse.json(invoice, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
