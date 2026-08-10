import { NextResponse } from "next/server";
import { getBusiness, getClients, nextInvoiceNumber } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [business, clients, nextNumber] = await Promise.all([
      getBusiness(), getClients(), nextInvoiceNumber(),
    ]);
    return NextResponse.json({ business, clients, nextNumber });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
