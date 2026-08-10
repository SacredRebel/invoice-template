/**
 * GitHub as the database.
 *
 * Every invoice is a JSON file in data/invoices/. Reads and writes both go
 * through the GitHub API — NOT the local filesystem. That matters: on Vercel
 * the filesystem is a build-time snapshot, so a filesystem read would not show
 * a new invoice until the next deploy. Going through the API means an invoice
 * appears the moment it is saved.
 */
const OWNER  = process.env.GITHUB_OWNER!;
const REPO   = process.env.GITHUB_REPO!;
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TOKEN  = process.env.GITHUB_TOKEN!;

const API = "https://api.github.com";

function headers() {
  if (!TOKEN) throw new Error("GITHUB_TOKEN is not set. See SETUP.md.");
  return {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

const b64encode = (s: string) => Buffer.from(s, "utf-8").toString("base64");
const b64decode = (s: string) => Buffer.from(s.replace(/\s/g, ""), "base64").toString("utf-8");

/** Read one file. Returns null if it doesn't exist. */
export async function readFile(path: string): Promise<{ json: any; sha: string } | null> {
  const res = await fetch(
    `${API}/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers: headers(), cache: "no-store" }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub read failed (${res.status}) for ${path}`);
  const data = await res.json();
  return { json: JSON.parse(b64decode(data.content)), sha: data.sha };
}

/** List the filenames in a directory. Returns [] if the directory is absent. */
export async function listDir(path: string): Promise<string[]> {
  const res = await fetch(
    `${API}/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers: headers(), cache: "no-store" }
  );
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub list failed (${res.status}) for ${path}`);
  const data = await res.json();
  return Array.isArray(data)
    ? data.filter((f: any) => f.type === "file" && f.name.endsWith(".json")).map((f: any) => f.name)
    : [];
}

/** Create or update a file. Pass sha when replacing an existing one. */
export async function writeFile(path: string, json: any, message: string, sha?: string) {
  const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: "PUT",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: b64encode(JSON.stringify(json, null, 2) + "\n"),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) throw new Error(`GitHub write failed (${res.status}): ${await res.text()}`);
  return res.json();
}

export async function deleteFile(path: string, sha: string, message: string) {
  const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: "DELETE",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({ message, sha, branch: BRANCH }),
  });
  if (!res.ok) throw new Error(`GitHub delete failed (${res.status})`);
  return res.json();
}

/* ── domain helpers ─────────────────────────────────────────── */

export const getBusiness = async () => (await readFile("data/business.json"))?.json;
export const getClients  = async () => (await readFile("data/clients.json"))?.json ?? [];

export async function getInvoices() {
  const names = await listDir("data/invoices");
  const all = await Promise.all(
    names.map(async (n) => (await readFile(`data/invoices/${n}`))?.json)
  );
  return all.filter(Boolean).sort((a: any, b: any) =>
    b.issueDate.localeCompare(a.issueDate) || b.number.localeCompare(a.number)
  );
}

export const getInvoice = async (id: string) =>
  (await readFile(`data/invoices/${id}.json`))?.json ?? null;

/** Next sequential number, e.g. INV-0008. */
export async function nextInvoiceNumber() {
  const names = await listDir("data/invoices");
  const nums = names
    .map((n) => parseInt(n.replace(/\D/g, ""), 10))
    .filter((n) => Number.isFinite(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `INV-${String(next).padStart(4, "0")}`;
}
