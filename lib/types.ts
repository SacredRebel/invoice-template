export type LineItem = {
  description: string;
  quantity: number;
  rate: number;
};

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export type Invoice = {
  id: string;              // "INV-0007"
  number: string;          // shown on the document
  status: InvoiceStatus;
  issueDate: string;       // YYYY-MM-DD
  dueDate: string;         // YYYY-MM-DD
  clientId: string;
  clientSnapshot: Client;  // frozen at creation so old invoices never change
  items: LineItem[];
  notes?: string;
  reference?: string;      // claim number, policy number, PO
  taxRate?: number;        // percent, e.g. 7.25
  createdAt: string;
};

export type Client = {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  address?: string[];
};

export type Business = {
  name: string;
  owner: string;
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

export const subtotal = (items: LineItem[]) =>
  items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.rate) || 0), 0);

export const taxAmount = (items: LineItem[], taxRate = 0) =>
  subtotal(items) * (Number(taxRate) || 0) / 100;

export const total = (items: LineItem[], taxRate = 0) =>
  subtotal(items) + taxAmount(items, taxRate);
