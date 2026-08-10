# CLAUDE.md — read this first

You are helping **Karol** run her invoicing app. She is in her eighties, she is not
a developer, and this is for her professional work at an event centre. It has to
work, and it has to be easy to read.

**Golden rule: she never touches code, JSON, or a terminal.** She says what she
wants in plain words; you edit the files and tell her plainly what changed.

---

## Design rules — do not undo these

This app was deliberately built for easy reading. If you change the look, keep all
of the following. They are not decoration.

- **Body text is 18px and never smaller than 16px.** The scale is in `tailwind.config.ts`.
- **Every button and input is at least 52px tall.** Easy to see, easy to click.
- **High contrast only.** Body text passes WCAG AAA on its background. Never put
  grey text on a light background, and never use a colour lighter than `soft` (#4E5347) for text.
- **Status is written in words** — "Waiting for payment", "Paid", "Overdue" — not colour alone.
- **Focus rings are thick and visible.** Never remove them.
- **Borders are 2px.** Hairlines disappear for older eyes.

If she says *"make it bigger"*, raise the `fontSize` scale in `tailwind.config.ts`.
That one change scales the whole app.

---

## How saving works

Two modes, switched automatically in `lib/data.ts`:

| | |
|---|---|
| **No GitHub token** | Reads the files in the repo. Everything displays. Saving is off, and the app says so. |
| **Token set** | Reads and writes through GitHub. Invoices save permanently and appear instantly. |

**The app must never crash because setup isn't finished.** If you touch `lib/data.ts`,
keep every failure path returning a fallback rather than throwing.

---

## Where everything lives

| What | File |
|---|---|
| Her business details | `data/business.json` |
| Her clients | `data/clients.json` |
| The invoices | `data/invoices/INV-0001.json` |
| Colours, text sizes | `tailwind.config.ts` |
| Buttons, inputs, print styles | `app/globals.css` |
| **The invoice document** | `app/invoices/[id]/page.tsx` |
| Copy / Word / PDF exports | `lib/exporters.ts` + `components/ExportBar.tsx` |
| Dashboard | `app/page.tsx` |
| New invoice form | `components/NewInvoiceForm.tsx` |
| Calendar | `app/calendar/page.tsx` |
| Reading and writing data | `lib/data.ts` |

---

## Common requests

**"Change my address / phone / rate / payment terms"** → `data/business.json`. Nothing else.

**"Add a client"** → add an object to `data/clients.json`. `id` lowercase-with-hyphens, unique.

**"Make the text bigger"** → raise the `fontSize` values in `tailwind.config.ts`.

**"I don't like the green"** → change `green`, `green2` and `mint` in `tailwind.config.ts`.
Keep `green` dark enough that white text on it stays readable.

**"Put my logo on the invoice"** → file into `public/logo.png`, then an `<img>` in the
header of `app/invoices/[id]/page.tsx`. Max ~56px tall so it prints cleanly.

**"Add a field to the invoice"** → three places, all of them: the `Invoice` type in
`lib/types.ts`, the form in `components/NewInvoiceForm.tsx`, the document in
`app/invoices/[id]/page.tsx`. Add it to `lib/exporters.ts` too or it won't appear
in the Word and email versions.

**"The totals are wrong"** → the maths is only in `lib/types.ts`.

---

## Rules

**Never change an invoice that has been sent** unless she asks directly. `clientSnapshot`
exists so that updating a client later never rewrites an invoice already issued.

**Never delete anything in `data/invoices/`** without her explicit say-so.

**Money is stored as plain numbers.** Format only for display, via `lib/format.ts`.

**Dates are plain `YYYY-MM-DD` strings.** Never `new Date(iso)` without UTC handling —
it shifts the day backwards in US timezones. Use the helpers in `lib/format.ts`.

**Reads go through the GitHub API, not the filesystem**, when a token exists. On Vercel
the filesystem is frozen at build time, so a filesystem read would not show a new invoice
until the next deploy.

**Invoice numbers are sequential and permanent.** Never renumber.

---

## Tone with Karol

Plain words. No jargon, no file paths, no code. Tell her what changed and what she
will see. If something is risky — deleting invoices, changing a sent one — ask first.
