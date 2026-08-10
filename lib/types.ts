export type LineItem = {
  description: string;
  quantity: number;
  rate: number;
};

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export type Client = {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  address?: string[];
};

export type Invoice = {
  id: string;                 // same as number, e.g. "INV-0007"
  number: string;
  status: InvoiceStatus;
  issueDate: string;          // YYYY-MM-DD
  dueDate: string;            // YYYY-MM-DD
  clientId: string;
  clientSnapshot: Client;     // frozen at creation — old invoices never change
  items: LineItem[];
  taxRate?: number;           // percent
  discount?: number;          // flat amount off, before tax
  depositPaid?: number;       // already received
  reference?: string;         // claim / policy / PO number
  terms?: string;             // overrides the business default
  notes?: string;
  createdAt: string;
};

export type Business = {
  name: string;
  owner?: string;
  email: string;
  phone: string;
  address: string[];
  license?: string;
  paymentTerms: string;
  paymentMethods: string[];
  defaultRate: number;
  defaultTaxRate: number;
  currency: string;
  footerNote?: string;
};

/* ── the only place money is calculated ── */

const n = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export const subtotal = (items: LineItem[] = []) =>
  items.reduce((s, i) => s + n(i.quantity) * n(i.rate), 0);

/** Subtotal after any discount, never below zero. */
export const afterDiscount = (items: LineItem[] = [], discount = 0) =>
  Math.max(0, subtotal(items) - n(discount));

export const taxAmount = (items: LineItem[] = [], taxRate = 0, discount = 0) =>
  afterDiscount(items, discount) * n(taxRate) / 100;

export const total = (items: LineItem[] = [], taxRate = 0, discount = 0) =>
  afterDiscount(items, discount) + taxAmount(items, taxRate, discount);

/** What the client still owes after any deposit. */
export const balanceDue = (
  items: LineItem[] = [], taxRate = 0, discount = 0, depositPaid = 0
) => Math.max(0, total(items, taxRate, discount) - n(depositPaid));
