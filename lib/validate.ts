import { z } from "zod";

/* Everything that arrives from a browser is untrusted, including our own form.
   Nothing reaches data.ts until it has been through here. */

export const INVOICE_ID = /^INV-\d{4,}$/;
export const isInvoiceId = (s: string) => INVOICE_ID.test(s);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/* A real calendar date, not just the right shape. "2026-02-31" is rejected. */
const dateString = z.string().regex(ISO_DATE, "Dates must look like 2026-08-24").refine((s) => {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}, "That date does not exist");

const amount = z.coerce.number().finite("Must be a number").min(0, "Cannot be negative");

export const clientSchema = z.object({
  id: z.string().trim().min(1).regex(/^[a-z0-9-]+$/, "Client id must be lowercase letters, numbers and hyphens"),
  name: z.string().trim().min(1, "The client needs a name"),
  contact: z.string().trim().optional(),
  email: z.string().trim().email("That email does not look right").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  address: z.array(z.string()).optional(),
});

export const lineItemSchema = z.object({
  description: z.string().trim().min(1, "Every line needs a description"),
  quantity: amount,
  rate: amount,
});

/* Stored statuses only. "overdue" is worked out from the due date, never saved. */
export const STORED_STATUS = ["draft", "sent", "paid", "void"] as const;

export const invoiceInputSchema = z.object({
  status: z.enum(STORED_STATUS).default("sent"),
  issueDate: dateString,
  dueDate: dateString,
  clientId: z.string().trim().min(1, "Choose who this invoice is for"),
  clientSnapshot: clientSchema,
  items: z.array(lineItemSchema).min(1, "Add at least one line of work"),
  taxRate: amount.max(100, "Tax cannot be over 100%").optional().default(0),
  discount: amount.optional(),
  depositPaid: amount.optional(),
  reference: z.string().trim().optional(),
  terms: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  paidAt: z.string().optional(),
})
  /* id, number and createdAt are the server's to decide. Anything a client
     sends for them is dropped before it can overwrite a saved invoice. */
  .strip();

export type InvoiceInput = z.infer<typeof invoiceInputSchema>;

/** Turns a Zod failure into one plain sentence she could actually read. */
export function firstProblem(e: z.ZodError): string {
  const i = e.issues[0];
  return i?.message ?? "Something in that invoice was not right.";
}
