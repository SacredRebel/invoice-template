import { getBusiness, getClients, canSave } from "@/lib/data";
import SettingsEditor from "@/components/SettingsEditor";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [business, clients] = await Promise.all([getBusiness(), getClients()]);
  return <SettingsEditor business={business} clients={clients} connected={canSave()} />;
}
