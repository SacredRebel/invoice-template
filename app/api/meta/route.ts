import { NextResponse } from "next/server";
import { getBusiness, getClients, nextInvoiceNumber, canSave } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const [business, clients, nextNumber] = await Promise.all([
    getBusiness(), getClients(), nextInvoiceNumber(),
  ]);
  return NextResponse.json({ business, clients, nextNumber, canSave: canSave() });
}
