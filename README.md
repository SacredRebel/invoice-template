# Invoices

A simple, private invoicing app. Write an invoice, save it, then print it, save it
as a PDF, download it for Word, or copy it into an email.

Everything is stored in this repository. No database, no subscription, nothing to lose.

**Built for Karol.** Setup takes about 20 minutes: **[SETUP.md](SETUP.md)**.

---

## What it does

- **Dashboard** — what you're owed, what's overdue, what's been paid this month
- **New invoice** — three plain steps, a running total, numbering handled for you
- **The invoice** — a clean document, with four ways to send it:
  - **Print / Save as PDF**
  - **Download for Word**
  - **Copy for email** *(keeps the layout)*
  - **Copy as plain text**
- **Calendar** — every due date on a month grid
- **Settings** — your details and your client list

## Built to be easy to read

18px body text, 52px buttons, thick borders, high-contrast colours, and status written
in words rather than colour alone. Those choices are deliberate — see `CLAUDE.md`
before changing the look.

## It works before it's set up

Deploy it and every page works straight away using the files in this repo. Connect
GitHub when you're ready and invoices start saving permanently. **It never shows an
error page just because setup isn't finished.**

## How it's stored

```
data/
  business.json          your details — appear on every invoice
  clients.json           who you bill
  invoices/
    INV-0001.json        one file per invoice
```

Each invoice keeps a snapshot of the client as they were at the time, so updating an
address later never changes an invoice you already sent.

## Changing things

Ask Claude. It reads `CLAUDE.md` and knows where everything is:

> *"Change my hourly rate to $55"* · *"Add a new client"* · *"Make the text bigger"*

## Stack

Next.js 14 · Tailwind · GitHub as the database · Vercel.
