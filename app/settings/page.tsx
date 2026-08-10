import { getBusiness, getClients } from "@/lib/github";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [business, clients] = await Promise.all([getBusiness(), getClients()]);

  return (
    <div className="space-y-8">
      <div>
        <p className="label">Settings</p>
        <h1 className="mt-1 font-display text-[40px] leading-tight">Your details</h1>
        <p className="mt-2 max-w-xl text-[15px] text-slate">
          These appear on every invoice. To change them, edit
          <code className="mx-1 rounded bg-wash px-1.5 py-0.5 text-[13px] text-sage">data/business.json</code>
          in GitHub — or just ask Claude to do it.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="panel p-6">
          <h2 className="font-display text-[20px]">Business</h2>
          <dl className="mt-4 space-y-2.5 text-[14px]">
            {[
              ["Name", business?.name],
              ["Email", business?.email],
              ["Phone", business?.phone],
              ["Address", business?.address?.join(", ")],
              ["Default rate", business?.defaultRate ? `$${business.defaultRate}/hr` : "—"],
              ["Terms", business?.paymentTerms],
              ["Accepts", business?.paymentMethods?.join(" · ")],
            ].map(([k, v]) => (
              <div key={k as string} className="flex gap-4">
                <dt className="w-28 shrink-0 text-mute">{k}</dt>
                <dd className="flex-1">{v || <span className="text-mute/60">not set</span>}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="panel p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-[20px]">Clients</h2>
            <span className="text-[13px] text-mute">{clients.length}</span>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {clients.map((c: any) => (
              <li key={c.id} className="py-3">
                <p className="font-medium">{c.name}</p>
                <p className="text-[13px] text-slate">
                  {[c.contact, c.email, c.address?.[0]].filter(Boolean).join(" · ") || "—"}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[12px] text-mute">
            Add clients in <code className="rounded bg-wash px-1 text-sage">data/clients.json</code>.
          </p>
        </section>
      </div>
    </div>
  );
}
