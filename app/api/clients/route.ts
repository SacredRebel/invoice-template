import { NextResponse } from "next/server";
import { getClients, saveClients } from "@/lib/data";
import type { Client } from "@/lib/types";

export const dynamic = "force-dynamic";

const slug = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "client";

export async function GET() {
  return NextResponse.json(await getClients());
}

/** Add one client. */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name?.trim()) throw new Error("The client needs a name.");
    const clients = await getClients();

    let id = slug(body.name);
    let n = 2;
    while (clients.some((c) => c.id === id)) id = `${slug(body.name)}-${n++}`;

    const client: Client = {
      id, name: body.name.trim(),
      contact: body.contact?.trim() || undefined,
      email: body.email?.trim() || undefined,
      phone: body.phone?.trim() || undefined,
      address: Array.isArray(body.address)
        ? body.address.map((s: string) => s.trim()).filter(Boolean)
        : String(body.address ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
    };
    await saveClients([...clients, client]);
    return NextResponse.json(client, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

/** Replace the whole list — used for editing and removing. */
export async function PUT(req: Request) {
  try {
    const list = await req.json();
    if (!Array.isArray(list)) throw new Error("Expected a list of clients.");
    await saveClients(list.map((c: any) => ({
      id: c.id || slug(c.name),
      name: String(c.name ?? "").trim(),
      contact: c.contact?.trim() || undefined,
      email: c.email?.trim() || undefined,
      phone: c.phone?.trim() || undefined,
      address: Array.isArray(c.address)
        ? c.address.map((s: string) => s.trim()).filter(Boolean)
        : String(c.address ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
    })));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
