import { NextResponse } from "next/server";
import { getBusiness, saveBusiness } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getBusiness());
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const current = await getBusiness();
    const merged = {
      ...current, ...body,
      address: Array.isArray(body.address)
        ? body.address.map((s: string) => s.trim()).filter(Boolean) : current.address,
      paymentMethods: Array.isArray(body.paymentMethods)
        ? body.paymentMethods.map((s: string) => s.trim()).filter(Boolean) : current.paymentMethods,
      defaultRate: Number(body.defaultRate) || 0,
      defaultTaxRate: Number(body.defaultTaxRate) || 0,
    };
    await saveBusiness(merged);
    return NextResponse.json(merged);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
