/**
 * Reading and writing invoices.
 *
 * The app works in two modes and switches automatically:
 *
 *   NO TOKEN  — reads the JSON files shipped with the deployment. Everything
 *               displays correctly, but saving is turned off. This is what you
 *               get the moment you deploy, before any setup.
 *
 *   TOKEN SET — reads and writes through the GitHub API, so new invoices are
 *               saved permanently and appear immediately.
 *
 * Nothing here ever throws on a missing token. A half-configured app should
 * still render, not show an error page.
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

const ghHeaders = () => ({
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
});

const enc = (s: string) => Buffer.from(s, "utf-8").toString("base64");
const dec = (s: string) => Buffer.from(s.replace(/\s/g, ""), "base64").toString("utf-8");

/* ── low level ─────────────────────────────────────────────── */

async function ghRead(p: string) {
  if (!canSave()) return null;
  try {
    const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${p}?ref=${BRANCH}`,
      { headers: ghHeaders(), cache: "no-store" });
    if (!res.ok) return null;
    const d = await res.json();
    return { json: JSON.parse(dec(d.content)), sha: d.sha as string };
  } catch { return null; }
}

async function ghList(p: string): Promise<string[] | null> {
  if (!canSave()) return null;
  try {
    const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${p}?ref=${BRANCH}`,
      { headers: ghHeaders(), cache: "no-store" });
    if (!res.ok) return null;
    const d = await res.json();
    return Array.isArray(d)
      ? d.filter((x: any) => x.type === "file" && x.name.endsWith(".json")).map((x: any) => x.name)
      : null;
  } catch { return null; }
}

async function localRead(p: string) {
  try { return JSON.parse(await fs.readFile(path.join(process.cwd(), p), "utf-8")); }
  catch { return null; }
}

async function localList(p: string) {
  try {
    const names = await fs.readdir(path.join(process.cwd(), p));
    return names.filter((n) => n.endsWith(".json"));
  } catch { return []; }
}

/* ── public API ────────────────────────────────────────────── */

const FALLBACK_BUSINESS: Business = {
  name: "Your business name",
  owner: "",
  email: "you@example.com",
  phone: "(805) 000-0000",
  address: ["Street address", "Ojai, CA 93023"],
  paymentTerms: "Payment due within 14 days of receipt.",
  paymentMethods: ["Check", "Bank transfer", "Cash"],
  defaultRate: 45,
  defaultTaxRate: 0,
  currency: "USD",
  footerNote: "Thank you.",
};

export async function getBusiness(): Promise<Business> {
  const gh = await ghRead("data/business.json");
  if (gh) return gh.json;
  return (await localRead("data/business.json")) ?? FALLBACK_BUSINESS;
}

export async function getClients(): Promise<Client[]> {
  const gh = await ghRead("data/clients.json");
  if (gh) return gh.json;
  return (await localRead("data/clients.json")) ?? [];
}

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

/* ── writes (require a token) ──────────────────────────────── */

export async function saveInvoice(inv: Invoice) {
  if (!canSave())
    throw new Error("Saving is turned off until GitHub is connected. See SETUP.md.");
  const p = `data/invoices/${inv.id}.json`;
  const existing = await ghRead(p);
  const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${p}`, {
    method: "PUT",
    headers: { ...ghHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `invoice: ${existing ? "update" : "create"} ${inv.id}`,
      content: enc(JSON.stringify(inv, null, 2) + "\n"),
      branch: BRANCH,
      ...(existing ? { sha: existing.sha } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Could not save (${res.status}). Check the GitHub token.`);
  return inv;
}

export async function deleteInvoice(id: string) {
  if (!canSave()) throw new Error("Saving is turned off until GitHub is connected.");
  const p = `data/invoices/${id}.json`;
  const existing = await ghRead(p);
  if (!existing) throw new Error("That invoice no longer exists.");
  const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${p}`, {
    method: "DELETE",
    headers: { ...ghHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ message: `invoice: delete ${id}`, sha: existing.sha, branch: BRANCH }),
  });
  if (!res.ok) throw new Error(`Could not delete (${res.status}).`);
}
