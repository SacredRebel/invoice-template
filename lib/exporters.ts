import { money, prettyDate } from "./format";
import { subtotal, taxAmount, total, balanceDue, type Invoice, type Business } from "./types";

const pad = (s: string, n: number) => String(s).padEnd(n).slice(0, n);

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
  L.push("", `INVOICE ${inv.number}`,
    `Issued: ${prettyDate(inv.issueDate)}`,
    `Due:    ${prettyDate(inv.dueDate)}`);
  if (inv.reference) L.push(`Ref:    ${inv.reference}`);
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
  if (inv.notes) L.push(`Notes: ${inv.notes}`, "");
  L.push(inv.terms || biz.paymentTerms || "");
  if (biz.paymentMethods?.length) L.push(`Accepted: ${biz.paymentMethods.join(", ")}`);
  return L.join("\n");
}

/** Self-contained HTML — opens in Word as .doc, or pastes into an email. */
export function toHTML(inv: Invoice, biz: Business) {
  const cur = biz.currency || "USD";
  const disc = inv.discount ?? 0, dep = inv.depositPaid ?? 0;
  const c = inv.clientSnapshot;
  const cell = "padding:11px 8px;border-bottom:1px solid #C9C7BB;font-size:12pt;";
  const head = "padding:11px 8px;border-bottom:3px solid #14160F;font-size:11pt;letter-spacing:.5px;";
  const totalRow = (l: string, v: string, bold = false, big = false) =>
    `<tr><td style="padding:5px 0;${bold ? "font-weight:bold;border-top:3px solid #14160F;padding-top:11px;" : "color:#4E5347;"}">${l}</td>
     <td style="padding:5px 0;text-align:right;${bold ? "font-weight:bold;border-top:3px solid #14160F;padding-top:11px;" : ""}${big ? "font-size:18pt;" : ""}">${v}</td></tr>`;

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>Invoice ${inv.number}</title>
<style>@page{size:letter;margin:16mm}body{font-family:Georgia,'Times New Roman',serif;color:#14160F;font-size:12pt;line-height:1.5}</style>
</head><body>
<div style="height:6px;background:#254A32;margin-bottom:22px"></div>
<table width="100%" style="border-collapse:collapse"><tr>
<td style="vertical-align:top">
  <div style="font-size:22pt;font-weight:bold">${biz.name}</div>
  <div style="font-size:11pt;color:#4E5347;margin-top:6px">
    ${(biz.address ?? []).join("<br>")}${biz.phone ? "<br>" + biz.phone : ""}${biz.email ? "<br>" + biz.email : ""}
  </div>
</td>
<td style="vertical-align:top;text-align:right">
  <div style="font-size:11pt;letter-spacing:1px;color:#4E5347">INVOICE</div>
  <div style="font-size:20pt;font-weight:bold">${inv.number}</div>
  <div style="font-size:11pt;margin-top:8px">Issued: ${prettyDate(inv.issueDate)}<br>
    <b>Due: ${prettyDate(inv.dueDate)}</b>${inv.reference ? "<br>Ref: " + inv.reference : ""}</div>
</td></tr></table>

<div style="margin-top:24px;background:#F7F6F1;padding:14px">
  <div style="font-size:10pt;letter-spacing:1px;color:#4E5347">BILLED TO</div>
  <div style="font-size:14pt;font-weight:bold;margin-top:4px">${c?.name ?? ""}</div>
  <div style="font-size:11pt;color:#4E5347">${c?.contact ? c.contact + "<br>" : ""}${(c?.address ?? []).join("<br>")}</div>
</div>

<table width="100%" style="border-collapse:collapse;margin-top:24px">
<tr><th style="${head}text-align:left">DESCRIPTION</th><th style="${head}text-align:right">QTY</th>
<th style="${head}text-align:right">RATE</th><th style="${head}text-align:right">AMOUNT</th></tr>
${inv.items.map((i) => `<tr><td style="${cell}">${i.description}</td>
<td style="${cell}text-align:right">${i.quantity}</td>
<td style="${cell}text-align:right">${money(i.rate, cur)}</td>
<td style="${cell}text-align:right;font-weight:bold">${money(i.quantity * i.rate, cur)}</td></tr>`).join("")}
</table>

<table width="100%" style="border-collapse:collapse;margin-top:16px"><tr><td></td><td style="width:300px">
<table width="100%" style="border-collapse:collapse;font-size:12pt">
${totalRow("Subtotal", money(subtotal(inv.items), cur))}
${disc ? totalRow("Discount", "− " + money(disc, cur)) : ""}
${inv.taxRate ? totalRow(`Tax ${inv.taxRate}%`, money(taxAmount(inv.items, inv.taxRate, disc), cur)) : ""}
${totalRow(dep ? "TOTAL" : "TOTAL DUE", money(total(inv.items, inv.taxRate, disc), cur), true, !dep)}
${dep ? totalRow("Already paid", "− " + money(dep, cur)) : ""}
${dep ? totalRow("BALANCE DUE", money(balanceDue(inv.items, inv.taxRate, disc, dep), cur), true, true) : ""}
</table></td></tr></table>

${inv.notes ? `<div style="margin-top:24px;border-top:1px solid #C9C7BB;padding-top:12px;font-size:11pt"><b>Notes</b><br>${inv.notes}</div>` : ""}
<div style="margin-top:20px;border-top:1px solid #C9C7BB;padding-top:12px;font-size:11pt;color:#4E5347">
${inv.terms || biz.paymentTerms || ""}${biz.paymentMethods?.length ? "<br>Accepted: " + biz.paymentMethods.join(" · ") : ""}
</div>
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
