import { NextResponse } from "next/server";
import { getInvoice, writeFile, readFile, deleteFile } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const inv = await getInvoice(params.id);
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(inv);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const path = `data/invoices/${params.id}.json`;
    const existing = await readFile(path);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const merged = { ...existing.json, ...body, id: params.id, number: params.id };
    await writeFile(path, merged, `invoice: update ${params.id}`, existing.sha);
    return NextResponse.json(merged);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const path = `data/invoices/${params.id}.json`;
    const existing = await readFile(path);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await deleteFile(path, existing.sha, `invoice: delete ${params.id}`);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
