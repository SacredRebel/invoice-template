/**
 * Reading and writing everything.
 *
 * Two modes, switched automatically:
 *   NO TOKEN  — reads the JSON shipped with the deployment. Everything displays,
 *               saving is off, and the app says so. Never crashes.
 *   TOKEN SET — reads and writes through the GitHub API. Saves are permanent and
 *               appear immediately, with no redeploy.
 */
import fs from "node:fs/promises";
import path from "node:path";
import type { Invoice, Client, Business } from "./types";

const OWNER  = process.env.GITHUB_OWNER;
const REPO   = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TOKEN  = process.env.GITHUB_TOKEN;
const API    = "https://api.github.com";

export const canSave = () => Boolean(OWNER && REPO && TOKEN);

const H = () => ({
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
});
const enc = (s: string) => Buffer.from(s, "utf-8").toString("base64");
const dec = (s: string) => Buffer.from(s.replace(/\s/g, ""), "base64").toString("utf-8");

async function ghRead(p: string) {
  if (!canSave()) return null;
  try {
    const r = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${p}?ref=${BRANCH}`,
      { headers: H(), cache: "no-store" });
    if (!r.ok) return null;
    const d = await r.json();
    return { json: JSON.parse(dec(d.content)), sha: d.sha as string };
  } catch { return null; }
}

async function ghList(p: string): Promise<string[] | null> {
  if (!canSave()) return null;
  try {
    const r = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${p}?ref=${BRANCH}`,
      { headers: H(), cache: "no-store" });
    if (!r.ok) return null;
    const d = await r.json();
    return Array.isArray(d)
      ? d.filter((x: any) => x.type === "file" && x.name.endsWith(".json")).map((x: any) => x.name)
      : null;
  } catch { return null; }
}

async function ghWrite(p: string, json: any, message: string) {
  if (!canSave()) throw new Error("Not connected to GitHub yet, so nothing can be saved. See SETUP.md.");
  const existing = await ghRead(p);
  const r = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${p}`, {
    method: "PUT",
    headers: { ...H(), "Content-Type": "application/json" },
    body: JSON.stringify({
      message, content: enc(JSON.stringify(json, null, 2) + "\n"), branch: BRANCH,
      ...(existing ? { sha: existing.sha } : {}),
    }),
  });
  if (!r.ok) throw new Error(`Could not save (${r.status}). Check the GitHub token has write access.`);
  return json;
}

const localRead = async (p: string) => {
  try { return JSON.parse(await fs.readFile(path.join(process.cwd(), p), "utf-8")); }
  catch { return null; }
};
const localList = async (p: string) => {
  try { return (await fs.readdir(path.join(process.cwd(), p))).filter((n) => n.endsWith(".json")); }
  catch { return []; }
};

/* ── business ───────────────────────────────────────────────── */

const FALLBACK: Business = {
  name: "Your business name", email: "", phone: "",
  address: [], paymentTerms: "Payment due within 14 days of receipt.",
  paymentMethods: ["Check", "Bank transfer", "Cash"],
  defaultRate: 45, defaultTaxRate: 0, currency: "USD", footerNote: "Thank you.",
};

export async function getBusiness(): Promise<Business> {
  const gh = await ghRead("data/business.json");
  if (gh) return { ...FALLBACK, ...gh.json };
  return { ...FALLBACK, ...((await localRead("data/business.json")) ?? {}) };
}

export const saveBusiness = (b: Business) =>
  ghWrite("data/business.json", b, "settings: update business details");

/* ── clients ────────────────────────────────────────────────── */

export async function getClients(): Promise<Client[]> {
  const gh = await ghRead("data/clients.json");
  if (gh) return gh.json ?? [];
  return (await localRead("data/clients.json")) ?? [];
}

export const saveClients = (c: Client[]) =>
  ghWrite("data/clients.json", c, "settings: update client list");

/* ── invoices ───────────────────────────────────────────────── */

export async function getInvoices(): Promise<Invoice[]> {
  const names = (await ghList("data/invoices")) ?? (await localList("data/invoices"));
  const rows = await Promise.all(names.map(async (n) => {
    const gh = await ghRead(`data/invoices/${n}`);
    return gh ? gh.json : await localRead(`data/invoices/${n}`);
  }));
  return rows.filter(Boolean).sort((a: any, b: any) =>
    String(b.issueDate).localeCompare(a.issueDate) || String(b.number).localeCompare(a.number));
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const gh = await ghRead(`data/invoices/${id}.json`);
  if (gh) return gh.json;
  return await localRead(`data/invoices/${id}.json`);
}

export async function nextInvoiceNumber() {
  const names = (await ghList("data/invoices")) ?? (await localList("data/invoices"));
  const nums = names.map((n) => parseInt(n.replace(/\D/g, ""), 10)).filter(Number.isFinite);
  return `INV-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, "0")}`;
}

export const saveInvoice = (inv: Invoice) =>
  ghWrite(`data/invoices/${inv.id}.json`, inv, `invoice: save ${inv.id}`);

export async function deleteInvoice(id: string) {
  if (!canSave()) throw new Error("Not connected to GitHub yet.");
  const existing = await ghRead(`data/invoices/${id}.json`);
  if (!existing) throw new Error("That invoice no longer exists.");
  const r = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/data/invoices/${id}.json`, {
    method: "DELETE",
    headers: { ...H(), "Content-Type": "application/json" },
    body: JSON.stringify({ message: `invoice: delete ${id}`, sha: existing.sha, branch: BRANCH }),
  });
  if (!r.ok) throw new Error(`Could not delete (${r.status}).`);
}
