# CLAUDE.md — read this first

You are helping **Karol** run her invoicing app. She is not a developer. She will
describe what she wants in plain language and you make it happen.

**Golden rule: she should never have to touch code, JSON, or the terminal.**
She says what she wants; you edit the files and tell her it's done.

---

## What this app is

A small Next.js app deployed on Vercel that writes invoices and stores them in
this GitHub repository. There is no database. Every invoice is a JSON file.

**She sees:** a dashboard of invoices, a page to write a new one, a calendar of
what's due, and a settings page.
**She does:** fill in a form, press save, then print or save as PDF.

---

## Where everything lives

| What | File | Notes |
|---|---|---|
| **Her business details** | `data/business.json` | Name, address, phone, rate, payment terms — appear on every invoice |
| **Her clients** | `data/clients.json` | Add one object per client |
| **The invoices** | `data/invoices/INV-0001.json` | One file each, never delete unless she asks |
| **Colours** | `tailwind.config.ts` | The `colors` block. Change a hex, the whole app changes |
| **Fonts** | `app/layout.tsx` | `Instrument_Serif` (headings) and `Inter` (body) |
| **The invoice document** | `app/invoices/[id]/page.tsx` | This is what her client sees — be careful here |
| **The dashboard** | `app/page.tsx` | Stats and the invoice table |
| **The new-invoice form** | `components/NewInvoiceForm.tsx` | |
| **The calendar** | `app/calendar/page.tsx` | |
| **Data layer** | `lib/github.ts` | Reads and writes to GitHub. Rarely needs changing |

---

## Common requests and exactly what to do

**"Change my address / phone / rate / payment terms"**
→ Edit `data/business.json`. Nothing else.

**"Add a new client"**
→ Add an object to `data/clients.json`. `id` must be lowercase-with-hyphens and unique.

**"Make it blue instead of green"**
→ Change `sage` and `moss` in `tailwind.config.ts`. Those two drive every accent.

**"I want my logo on the invoice"**
→ Put the file in `public/logo.png`, then add an `<img>` at the top of the header
block in `app/invoices/[id]/page.tsx`. Keep it under ~48px tall so it prints well.

**"Add a column / field to the invoice"**
→ Add it to the `Invoice` type in `lib/types.ts`, to the form in
`components/NewInvoiceForm.tsx`, and to the document in `app/invoices/[id]/page.tsx`.
All three, or it won't show up.

**"The totals are wrong"**
→ The maths lives in `lib/types.ts` (`subtotal`, `taxAmount`, `total`). Nowhere else.

**"Can I email invoices from the app?"**
→ Not built yet. Today she prints to PDF and attaches it. If she wants this,
it needs an email service and an API key — tell her it's a bigger change and
check before starting.

---

## Rules

**Never change an invoice that has already been sent** unless she explicitly asks.
Old invoices are records. `clientSnapshot` exists precisely so that editing a
client later never rewrites history.

**Never delete anything in `data/invoices/`** without her saying so directly.

**Money is stored as plain numbers**, formatted only for display via
`lib/format.ts`. Don't store formatted strings.

**Dates are plain `YYYY-MM-DD` strings.** Never `new Date(iso)` on them without
UTC handling — it shifts the day backwards in US timezones. Use the helpers in
`lib/format.ts`.

**Reads go through the GitHub API, never the filesystem.** On Vercel the
filesystem is frozen at build time, so a filesystem read wouldn't show a new
invoice until the next deploy. `lib/github.ts` already does this correctly.

**Invoice numbers are sequential and permanent.** `nextInvoiceNumber()` derives
the next one. Don't renumber.

**After editing files, changes go live automatically** — Vercel rebuilds on every
push, usually within a minute. Data changes (new invoices, clients) appear
instantly without a rebuild.

---

## Tone with Karol

Plain language. No jargon. Tell her what you changed and what she'll see, not how
you did it. If something will take a while or costs money, say so before starting.

If she asks for something risky — deleting invoices, changing sent records,
restructuring data — confirm first.
