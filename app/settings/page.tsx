import { getBusiness, getClients, canSave } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [business, clients] = await Promise.all([getBusiness(), getClients()]);

  return (
    <div className="space-y-8">
      <div>
        <p className="label">Settings</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Your details</h1>
        <p className="mt-3 max-w-2xl text-base text-body">
          These appear on every invoice you send. To change any of them, ask Claude —
          for example: <em>&ldquo;change my hourly rate to $55&rdquo;</em>.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-7">
          <h2 className="font-display text-2xl text-ink">Business</h2>
          <dl className="mt-5 space-y-4">
            {[
              ["Name", business.name],
              ["Email", business.email],
              ["Phone", business.phone],
              ["Address", business.address?.join(", ")],
              ["Usual rate", business.defaultRate ? `$${business.defaultRate} per hour` : ""],
              ["Payment terms", business.paymentTerms],
              ["You accept", business.paymentMethods?.join(" · ")],
            ].map(([k, v]) => (
              <div key={k as string} className="border-b border-line pb-3 last:border-0">
                <dt className="label">{k}</dt>
                <dd className="mt-1 text-lg text-ink">
                  {v || <span className="text-soft">not set yet</span>}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="panel p-7">
          <h2 className="font-display text-2xl text-ink">Clients</h2>
          {clients.length === 0 ? (
            <p className="mt-4 text-base text-body">No clients yet.</p>
          ) : (
            <ul className="mt-5 divide-y-2 divide-line">
              {clients.map((c: any) => (
                <li key={c.id} className="py-4">
                  <p className="text-lg font-semibold text-ink">{c.name}</p>
                  <p className="mt-1 text-base text-body">
                    {[c.contact, c.email, c.address?.[0]].filter(Boolean).join(" · ") || "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className={`panel p-6 ${canSave() ? "border-green/40 bg-mint" : "border-gold/50 bg-gold2"}`}>
        <p className="text-lg font-semibold text-ink">
          {canSave() ? "✓ Connected — invoices are being saved" : "Set-up not finished"}
        </p>
        <p className="mt-1 text-base text-body">
          {canSave()
            ? "Every invoice is stored safely and can't be lost."
            : "New invoices won't be kept until GitHub is connected. See SETUP.md."}
        </p>
      </div>
    </div>
  );
}
