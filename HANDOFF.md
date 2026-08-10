# Handoff

Everything a developer or an AI agent needs to pick this up cold.

---

## What this is

A private invoicing app for **Karol** — eighties, manages an event centre in
Ojai, California, does property work on the side, bills insurance companies and
private clients. Not technical.

She writes invoices **by talking to an AI agent**, which writes JSON files into
this repo. The website is where she looks at them, prints them, and sends them.

`CLAUDE.md` is the agent's operating protocol. **Read it before writing invoices.**

---

## Stack

Next.js 14.2.35 · App Router · TypeScript · Tailwind · Zod · deployed on Vercel.
**GitHub is the database** — one JSON file per invoice. There is no database.

### Two modes, automatic

| | Behaviour |
|---|---|
| **No `GITHUB_TOKEN`** | Reads the JSON bundled with the deployment. Everything displays. Saving is off, and the app says so. |
| **`GITHUB_TOKEN` set** | Reads and writes through the GitHub API. Invoices appear instantly, no rebuild. |

The app must never crash because set-up is unfinished. Every failure path in
`lib/data.ts` returns a fallback instead of throwing.

---

## Environment variables (Vercel → Settings → Environment Variables)

| Name | Value | Needed for |
|---|---|---|
| `GITHUB_OWNER` | the GitHub username that owns the repo | saving |
| `GITHUB_REPO` | the repo name | saving |
| `GITHUB_TOKEN` | fine-grained PAT, **Contents: Read and write**, scoped to this repo only | saving |
| `GITHUB_BRANCH` | optional, defaults to `main` | |

**Without these, nothing saves** — not invoices, not settings, not edits. The app
looks fine and quietly refuses every write. This is the single most common
reason "nothing works".

---

## What it does

**Dashboard** — what she's owed on a blue header, waiting/overdue/paid split,
search by name, number, claim reference or email, and a status filter.

**The invoice** — the document a client receives. Four exports, all working:
Print/PDF · Word `.doc` · rich email (clipboard) · plain text.

**Calendar** — month grid of due dates with ‹ › navigation, coloured dots,
tap a day to open its invoice.

**Settings** — four sections: business details, logo, invoice defaults, clients.

**Editing** — any invoice can be edited. Invoices are **voided, never deleted.**

---

## Rules that are enforced in code

- **Invoice numbers are permanent.** Assigned by the server only. Written with a
  create-only GitHub PUT (no SHA) so a race loses instead of overwriting; the
  loser recalculates and retries. Numbers are never reused, including from
  voided invoices.
- **Everything is validated** by `lib/validate.ts` before it is saved: at least
  one line, real calendar dates, non-negative finite money, stored statuses only
  (`draft` `sent` `paid` `void` — `overdue` is calculated, never stored).
- **Client-supplied `id`, `number` and `createdAt` are stripped**, so a request
  cannot aim at an existing file and overwrite it.
- **Invoice IDs in routes must match `^INV-\d{4,}$`** — blocks path traversal.
- **Every dynamic value in the exporter is escaped.** A client called `<script>`
  cannot inject markup into the Word document or the email.
- **DELETE returns 405.** Void keeps the file and the number.
- **`paidAt`** is set when marked paid, cleared when not. "Paid this month" reads
  `paidAt`, not `issueDate`.

---

## Design rules — accessibility, not taste

18px body · 54px+ controls · WCAG AAA body contrast · status always in words ·
inputs have a visible border before focus · visible focus rings · **no horizontal
scrolling on mobile, ever** (zero `min-w-[` in the codebase — keep it that way).

**One colour, one meaning:** blue = primary & waiting · red = overdue ·
green = paid · gold = draft · grey = void · teal = reference numbers.

**If you restyle the invoice, restyle `lib/exporters.ts` too**, or the Word and
email copies drift away from the PDF.

---

## Verifying a change — do not skip

A passing build proves nothing. Actually load the pages.

```bash
npm install
npx next build
npx next start -p 3000 &
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/invoices/INV-0001
```

Check the totals actually render, not just that it returned 200.

---

## Known gaps

- **No authentication.** Deliberate — Karol should not have to log in. A private
  repo does **not** make the Vercel site private; the URL is unguessable but
  public. Vercel → Deployment Protection is a one-click fix if wanted.
- `npm audit --omit=dev` shows 2 high findings. The advisory range covers every
  stable Next.js below 16, so they cannot be cleared on the 14.x line. They
  affect the image optimiser, i18n and custom servers — none of which this uses.
- No committed lockfile, so builds are not byte-reproducible.
- No automated test suite. Validation, numbering, void, `paidAt` and HTML
  escaping were verified by hand.
- The invoice document has no progress stepper (Sent → Viewed → Paid).

---

## If something is wrong

| Symptom | Cause |
|---|---|
| Nothing saves, "not connected to GitHub" | Env vars missing |
| Dashboard empty, invoice 404s in production | `data/` not bundled — `next.config.js` needs `outputFileTracingIncludes` |
| Colours missing from the printed PDF | Tick **Background graphics** in the print dialog |
| Word doc looks unlike the PDF | `lib/exporters.ts` drifted from `tailwind.config.ts` |
