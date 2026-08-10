import { notFound } from "next/navigation";
import { getInvoice } from "@/lib/data";
import NewInvoiceForm from "@/components/NewInvoiceForm";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const inv = await getInvoice(params.id);
  if (!inv) notFound();
  return <NewInvoiceForm existing={inv} />;
}
