import { NextResponse } from "next/server";
import { getInvoice, saveInvoice, deleteInvoice } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const inv = await getInvoice(params.id);
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(inv);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const existing = await getInvoice(params.id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const merged = { ...existing, ...(await req.json()), id: params.id, number: params.id };
    await saveInvoice(merged);
    return NextResponse.json(merged);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try { await deleteInvoice(params.id); return NextResponse.json({ ok: true }); }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
