import { money, prettyDate, isOverdue } from "./format";
import { subtotal, taxAmount, total, balanceDue, type Invoice, type Business } from "./types";

const pad = (s: string, n: number) => String(s).padEnd(n).slice(0, n);

/** Everything that came from a person gets escaped before it goes into HTML.
 *  A client called <script> or a note with an <img onerror=...> would otherwise
 *  run inside whatever email client or Word document opens this. */
const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** For a URL we also refuse anything that is not plain http(s). */
const escUrl = (v: unknown) => {
  const u = String(v ?? "").trim();
  return /^https?:\/\//i.test(u) ? esc(u) : "";
};

/** Plain text — for a text message, notes, or a very plain email. */
export function toPlainText(inv: Invoice, biz: Business) {
  const cur = biz.currency || "USD";
  const disc = inv.discount ?? 0, dep = inv.depositPaid ?? 0;
  const c = inv.clientSnapshot;
  const L: string[] = [];

  L.push(biz.name.toUpperCase());
  biz.address?.forEach((a) => L.push(a));
  if (biz.phone) L.push(biz.phone);
  if (biz.email) L.push(biz.email);
  L.push("", `INVOICE ${esc(inv.number)}`,
    `Issued: ${prettyDate(inv.issueDate)}`,
    `Due:    ${prettyDate(inv.dueDate)}`);
  if (inv.reference) L.push(`Ref:    ${esc(inv.reference)}`);
  L.push("", "BILL TO", c?.name ?? "");
  if (c?.contact) L.push(c.contact);
  c?.address?.forEach((a) => L.push(a));
  L.push("", "-".repeat(64),
    pad("DESCRIPTION", 34) + pad("QTY", 8) + pad("RATE", 11) + "AMOUNT",
    "-".repeat(64));
  inv.items.forEach((i) => L.push(
    pad(i.description, 34) + pad(String(i.quantity), 8) +
    pad(money(i.rate, cur), 11) + money(i.quantity * i.rate, cur)));
  L.push("-".repeat(64));
  const right = (label: string, val: string) => L.push(pad("", 46) + pad(label, 12) + val);
  right("Subtotal", money(subtotal(inv.items), cur));
  if (disc) right("Discount", "-" + money(disc, cur));
  if (inv.taxRate) right(`Tax ${inv.taxRate}%`, money(taxAmount(inv.items, inv.taxRate, disc), cur));
  right(dep ? "Total" : "TOTAL DUE", money(total(inv.items, inv.taxRate, disc), cur));
  if (dep) {
    right("Paid", "-" + money(dep, cur));
    right("BALANCE DUE", money(balanceDue(inv.items, inv.taxRate, disc, dep), cur));
  }
  L.push("");
  if (inv.notes) L.push(`Notes: ${esc(inv.notes)}`, "");
  L.push(inv.terms || biz.paymentTerms || "");
  if (biz.paymentMethods?.length) L.push(`Accepted: ${biz.paymentMethods.join(", ")}`);
  return L.join("\n");
}

/** Self-contained HTML — opens in Word as .doc, or pastes into an email.
 *
 *  These values are the same ones in tailwind.config.ts. If you restyle the
 *  invoice, change them here too or the Word copy stops matching the PDF.
 *  Word ignores a lot of CSS, so the coloured blocks use bgcolor= as well. */
const INK   = "#0B1220";
const BODY  = "#334155";
const LINE  = "#CBD5E1";
const PAPER = "#F5F6F8";
const BRAND = "#4F46E5";
const HERO  = "#1E1B4B";
const GREEN = "#067647";
const GOLD  = "#B45309";
const RED   = "#B91C1C";
const BLUE  = "#4F46E5";
const FONT  = "Inter,'Segoe UI',Calibri,Arial,sans-serif";

export function toHTML(inv: Invoice, biz: Business) {
  const cur  = biz.currency || "USD";
  const disc = inv.discount ?? 0, dep = inv.depositPaid ?? 0;
  const c    = inv.clientSnapshot;
  const grand = total(inv.items, inv.taxRate, disc);
  const due   = balanceDue(inv.items, inv.taxRate, disc, dep);

  const state = isOverdue(inv.dueDate, inv.status) ? "overdue" : inv.status;
  const stamp: Record<string, { word: string; fg: string; bg: string }> = {
    draft:   { word: "Draft",               fg: BODY,  bg: PAPER     },
    sent:    { word: "Waiting for payment", fg: BRAND, bg: "#E0E7FF" },
    paid:    { word: "Paid",                fg: GREEN, bg: "#D1FAE5" },
    overdue: { word: "Overdue",             fg: RED,   bg: "#FEE2E2" },
  };
  const st   = stamp[state] ?? stamp.draft;
  const bandBg = state === "paid" ? GREEN : state === "overdue" ? RED
               : state === "draft" ? INK : HERO;
  const bandLabel = state === "paid" ? "PAID IN FULL" : dep ? "BALANCE DUE" : "AMOUNT DUE";

  const cell = `padding:12px 10px;border-bottom:2px solid ${LINE};font-size:12pt;color:${INK};`;
  const head = "padding:12px 10px;font-size:11pt;font-weight:bold;letter-spacing:.6px;color:#FFFFFF;";
  const row  = (l: string, v: string, strong = false) =>
    `<tr><td style="padding:6px 0;font-size:12pt;color:${strong ? INK : BODY};${strong ? `font-weight:bold;border-top:2px solid ${INK};padding-top:12px;` : ""}">${l}</td>
     <td style="padding:6px 0;text-align:right;font-size:12pt;color:${strong ? INK : BODY};${strong ? `font-weight:bold;border-top:2px solid ${INK};padding-top:12px;` : ""}">${v}</td></tr>`;

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>Invoice ${esc(inv.number)}</title>
<style>@page{size:letter;margin:16mm}
body{font-family:${FONT};color:${BODY};font-size:12pt;line-height:1.55}</style>
</head><body>

<table width="100%" bgcolor="${HERO}" style="border-collapse:collapse;background:${HERO}">
  <tr><td style="height:8px;line-height:8px;font-size:1pt">&nbsp;</td></tr>
</table>

<table width="100%" style="border-collapse:collapse;margin-top:22px"><tr>
<td style="vertical-align:top">
  ${biz.logoUrl ? `<div style="margin-bottom:8px"><img src="${escUrl(biz.logoUrl)}" alt="${esc(biz.name)}" style="max-height:52px"></div>` : ""}
  <div style="font-size:22pt;font-weight:bold;color:${INK}">${esc(biz.name)}</div>
  <div style="font-size:12pt;color:${BODY};margin-top:6px">
    ${(biz.address ?? []).map(esc).join("<br>")}${biz.phone ? "<br>" + esc(biz.phone) : ""}${biz.email ? "<br>" + esc(biz.email) : ""}${biz.license ? "<br>Lic. " + esc(biz.license) : ""}
  </div>
</td>
<td style="vertical-align:top;text-align:right">
  <div style="font-size:26pt;font-weight:bold;letter-spacing:-1px;color:${INK}">INVOICE</div>
  <div style="font-size:15pt;font-weight:bold;color:${BRAND};margin-top:2px">${esc(inv.number)}</div>
  <div style="margin-top:10px"><table style="border-collapse:collapse;float:right"><tr>
    <td bgcolor="${st.bg}" style="background:${st.bg};border:2px solid ${st.fg};padding:7px 14px;
        font-size:12pt;font-weight:bold;color:${st.fg}">${esc(st.word)}</td>
  </tr></table></div>
</td></tr></table>

<table width="100%" style="border-collapse:collapse;margin-top:26px"><tr>
<td width="50%" bgcolor="${PAPER}" style="background:${PAPER};border:2px solid ${LINE};padding:14px;vertical-align:top">
  <div style="font-size:11pt;font-weight:bold;letter-spacing:.6px;color:${BODY}">BILLED TO</div>
  <div style="font-size:14pt;font-weight:bold;margin-top:5px;color:${INK}">${esc(c?.name ?? "")}</div>
  <div style="font-size:12pt;color:${BODY}">${c?.contact ? esc(c.contact) + "<br>" : ""}${(c?.address ?? []).map(esc).join("<br>")}${c?.email ? "<br>" + esc(c.email) : ""}</div>
</td>
<td width="10">&nbsp;</td>
<td width="50%" style="border:2px solid ${LINE};padding:14px;vertical-align:top">
  <table width="100%" style="border-collapse:collapse;font-size:12pt">
    <tr><td style="padding:3px 0;font-weight:bold;color:${BODY}">Invoice date</td>
        <td style="padding:3px 0;text-align:right;color:${INK}">${prettyDate(inv.issueDate)}</td></tr>
    <tr><td style="padding:3px 0;font-weight:bold;color:${BODY}">Payment due</td>
        <td style="padding:3px 0;text-align:right;font-weight:bold;color:${INK}">${prettyDate(inv.dueDate)}</td></tr>
    ${inv.reference ? `<tr><td style="padding:3px 0;font-weight:bold;color:${BODY}">Reference</td>
        <td style="padding:3px 0;text-align:right;color:${BLUE}">${esc(inv.reference)}</td></tr>` : ""}
  </table>
</td></tr></table>

<table width="100%" style="border-collapse:collapse;margin-top:26px">
<tr bgcolor="${INK}" style="background:${INK}">
  <th align="left"  bgcolor="${INK}" style="${head}background:${INK};text-align:left">DESCRIPTION</th>
  <th align="right" bgcolor="${INK}" style="${head}background:${INK};text-align:right">QTY</th>
  <th align="right" bgcolor="${INK}" style="${head}background:${INK};text-align:right">RATE</th>
  <th align="right" bgcolor="${INK}" style="${head}background:${INK};text-align:right">AMOUNT</th>
</tr>
${inv.items.map((i) => `<tr><td style="${cell}">${esc(i.description)}</td>
<td style="${cell}text-align:right">${i.quantity}</td>
<td style="${cell}text-align:right">${money(i.rate, cur)}</td>
<td style="${cell}text-align:right;font-weight:bold">${money(i.quantity * i.rate, cur)}</td></tr>`).join("")}
</table>

<table width="100%" style="border-collapse:collapse;margin-top:18px"><tr><td></td><td style="width:330px">
<table width="100%" style="border-collapse:collapse">
${row("Subtotal", money(subtotal(inv.items), cur))}
${disc ? row("Discount", "− " + money(disc, cur)) : ""}
${inv.taxRate ? row(`Tax ${inv.taxRate}%`, money(taxAmount(inv.items, inv.taxRate, disc), cur)) : ""}
${row("Total", money(grand, cur), true)}
${dep ? row("Already paid", "− " + money(dep, cur)) : ""}
</table>
<table width="100%" bgcolor="${bandBg}" style="border-collapse:collapse;background:${bandBg};margin-top:10px">
<tr><td bgcolor="${bandBg}" style="background:${bandBg};padding:14px;font-size:12pt;font-weight:bold;color:#FFFFFF;letter-spacing:.6px">${esc(bandLabel)}</td>
<td bgcolor="${bandBg}" style="background:${bandBg};padding:14px;text-align:right;font-size:19pt;font-weight:bold;color:#FFFFFF">${money(due, cur)}</td></tr>
</table>
</td></tr></table>

${inv.notes ? `<div style="margin-top:26px;border-top:2px solid ${LINE};padding-top:14px;font-size:12pt;color:${BODY}"><b style="color:${INK}">Notes</b><br>${esc(inv.notes)}</div>` : ""}
<table width="100%" style="border-collapse:collapse;margin-top:22px;border-top:2px solid ${LINE}"><tr>
<td style="padding-top:14px;font-size:12pt;color:${BODY};vertical-align:bottom">
  <b style="color:${INK}">Payment</b><br>${esc(inv.terms || biz.paymentTerms || "")}${biz.paymentMethods?.length ? "<br>Accepted: " + biz.paymentMethods.map(esc).join(" · ") : ""}
</td>
${biz.footerNote ? `<td style="padding-top:14px;text-align:right;vertical-align:bottom;font-size:17pt;font-weight:bold;color:${BRAND}">${esc(biz.footerNote)}</td>` : ""}
</tr></table>
</body></html>`;
}

export function download(filename: string, content: string, mime: string) {
  const blob = new Blob(["\ufeff", content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
