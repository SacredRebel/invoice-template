# Invoices

A small, private invoicing app. Write an invoice, save it, print it or send it as
a PDF. Everything is stored in this repository — there is no database and no
subscription.

**Built for Karol.** Setup takes about 20 minutes: **[SETUP.md](SETUP.md)**.

---

## What it does

- **Dashboard** — what's outstanding, what's overdue, what's been paid this month
- **New invoice** — a form with a running total; sequential numbering handled for you
- **The invoice itself** — a clean printable document; *Print → Save as PDF*
- **Calendar** — every due date on a month grid
- **Settings** — your business details and client list

## How it's stored

```
data/
  business.json          your details — appear on every invoice
  clients.json           who you bill
  invoices/
    INV-0001.json        one file per invoice
```

Each invoice keeps a snapshot of the client at the moment it was created, so
updating a client's address never rewrites an invoice you already sent.

## Changing things

Ask Claude. It reads `CLAUDE.md` and knows where everything lives:

> *"Change my hourly rate to $55"*
> *"Add a new client"*
> *"Make the invoice header dark green"*

## Stack

Next.js 14 · Tailwind · GitHub as the database · deployed on Vercel.
Reads and writes both go through the GitHub API, so a new invoice appears
immediately without waiting for a rebuild.
