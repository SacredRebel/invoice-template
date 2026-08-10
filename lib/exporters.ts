import { money, prettyDate } from "./format";
import { subtotal, taxAmount, total, type Invoice, type Business } from "./types";

/** Plain text — for pasting into an email or a text message. */
export function toPlainText(inv: Invoice, biz: Business) {
  const cur = biz.currency || "USD";
  const c = inv.clientSnapshot;
  const pad = (s: string, n: number) => s.padEnd(n).slice(0, n);
  const L: string[] = [];

  L.push(biz.name.toUpperCase());
  biz.address?.forEach((a) => L.push(a));
  if (biz.phone) L.push(biz.phone);
  if (biz.email) L.push(biz.email);
  L.push("");
  L.push(`INVOICE ${inv.number}`);
  L.push(`Issued: ${prettyDate(inv.issueDate)}`);
  L.push(`Due:    ${prettyDate(inv.dueDate)}`);
  if (inv.reference) L.push(`Ref:    ${inv.reference}`);
  L.push("");
  L.push("BILL TO");
  L.push(c?.name ?? "");
  if (c?.contact) L.push(c.contact);
  c?.address?.forEach((a) => L.push(a));
  L.push("");
  L.push("-".repeat(64));
  L.push(pad("DESCRIPTION", 34) + pad("QTY", 8) + pad("RATE", 11) + "AMOUNT");
  L.push("-".repeat(64));
  inv.items.forEach((i) =>
    L.push(
      pad(i.description, 34) +
      pad(String(i.quantity), 8) +
      pad(money(i.rate, cur), 11) +
      money(i.quantity * i.rate, cur)
    )
  );
  L.push("-".repeat(64));
  L.push(pad("", 53) + `Subtotal  ${money(subtotal(inv.items), cur)}`);
  if (inv.taxRate)
    L.push(pad("", 53) + `Tax ${inv.taxRate}%  ${money(taxAmount(inv.items, inv.taxRate), cur)}`);
  L.push(pad("", 53) + `TOTAL DUE  ${money(total(inv.items, inv.taxRate), cur)}`);
  L.push("");
  if (inv.notes) { L.push(`Notes: ${inv.notes}`); L.push(""); }
  if (biz.paymentTerms) L.push(biz.paymentTerms);
  if (biz.paymentMethods?.length) L.push(`Accepted: ${biz.paymentMethods.join(", ")}`);
  return L.join("\n");
}

/** Self-contained HTML — opens in Word as .doc, or pastes into an email. */
export function toHTML(inv: Invoice, biz: Business) {
  const cur = biz.currency || "USD";
  const c = inv.clientSnapshot;
  const row = (a: string, b: string, cc: string, d: string, head = false) => {
    const tag = head ? "th" : "td";
    const st = head
      ? "padding:10px 8px;border-bottom:2px solid #14160F;text-align:left;font-size:12pt;"
      : "padding:10px 8px;border-bottom:1px solid #C9C7BB;font-size:12pt;";
    const r = head ? "text-align:right;" : "text-align:right;";
    return `<tr><${tag} style="${st}">${a}</${tag}><${tag} style="${st}${r}">${b}</${tag}><${tag} style="${st}${r}">${cc}</${tag}><${tag} style="${st}${r}">${d}</${tag}></tr>`;
  };

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>Invoice ${inv.number}</title>
<style>@page{size:letter;margin:16mm}body{font-family:Georgia,'Times New Roman',serif;color:#14160F;font-size:12pt;line-height:1.5}</style>
</head><body>
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
  <div style="font-size:11pt;margin-top:8px">
    Issued: ${prettyDate(inv.issueDate)}<br>
    <b>Due: ${prettyDate(inv.dueDate)}</b>
    ${inv.reference ? "<br>Ref: " + inv.reference : ""}
  </div>
</td></tr></table>

<div style="margin-top:26px;border-top:1px solid #C9C7BB;padding-top:14px">
  <div style="font-size:11pt;letter-spacing:1px;color:#4E5347">BILLED TO</div>
  <div style="font-size:14pt;font-weight:bold;margin-top:4px">${c?.name ?? ""}</div>
  <div style="font-size:11pt;color:#4E5347">
    ${c?.contact ? c.contact + "<br>" : ""}${(c?.address ?? []).join("<br>")}
  </div>
</div>

<table width="100%" style="border-collapse:collapse;margin-top:26px">
${row("DESCRIPTION", "QTY", "RATE", "AMOUNT", true)}
${inv.items.map((i) => row(i.description, String(i.quantity), money(i.rate, cur), money(i.quantity * i.rate, cur))).join("")}
</table>

<table width="100%" style="border-collapse:collapse;margin-top:14px"><tr><td></td>
<td style="width:270px">
  <table width="100%" style="border-collapse:collapse;font-size:12pt">
    <tr><td style="padding:4px 0;color:#4E5347">Subtotal</td><td style="text-align:right">${money(subtotal(inv.items), cur)}</td></tr>
    ${inv.taxRate ? `<tr><td style="padding:4px 0;color:#4E5347">Tax ${inv.taxRate}%</td><td style="text-align:right">${money(taxAmount(inv.items, inv.taxRate), cur)}</td></tr>` : ""}
    <tr><td style="padding:10px 0 0;border-top:2px solid #14160F;font-weight:bold">TOTAL DUE</td>
        <td style="padding:10px 0 0;border-top:2px solid #14160F;text-align:right;font-size:18pt;font-weight:bold">${money(total(inv.items, inv.taxRate), cur)}</td></tr>
  </table>
</td></tr></table>

${inv.notes ? `<div style="margin-top:26px;border-top:1px solid #C9C7BB;padding-top:12px;font-size:11pt"><b>Notes</b><br>${inv.notes}</div>` : ""}
<div style="margin-top:22px;border-top:1px solid #C9C7BB;padding-top:12px;font-size:11pt;color:#4E5347">
  ${biz.paymentTerms ?? ""}${biz.paymentMethods?.length ? "<br>Accepted: " + biz.paymentMethods.join(" · ") : ""}
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
