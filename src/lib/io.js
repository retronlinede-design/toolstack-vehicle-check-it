import { isoToday } from "./core";

export function buildCheckSummaryText(check) {
  const c = check || {};

  const lines = [];
  lines.push("Vehicle Check Report");
  lines.push("-------------------");
  lines.push(`Date: ${c.date || "-"}`);
  lines.push(`Vehicle: ${c.vehicleLabel || c.vehicleId || "-"}`);
  lines.push(`Odometer: ${c.odometer || "-"}`);
  lines.push(`Items: ${(c.summary?.doneCount ?? 0)}/${(c.summary?.totalItems ?? 0)}`);
  lines.push(`Issues: ${(c.summary?.issueCount ?? 0)}`);

  if (c.generalNotes) {
    lines.push("");
    lines.push("General notes:");
    lines.push(String(c.generalNotes));
  }

  const findings = [];
  for (const s of c.sections || []) {
    for (const it of s.items || []) {
      if (it?.severity === "issue" || it?.severity === "note") {
        const note = it.note ? ` — ${it.note}` : "";
        findings.push(`• ${s.title}: ${it.label}${note}`);
      }
    }
  }

  if (findings.length) {
    lines.push("");
    lines.push("Findings:");
    for (const f of findings.slice(0, 80)) lines.push(f);
    if (findings.length > 80) lines.push(`…and ${findings.length - 80} more`);
  }

  lines.push("");
  lines.push("Tip: Open this check in the app and use Preview → Print/Save PDF to attach a clean PDF.");

  return lines.join("\n");
}

export function buildCheckEmail(check) {
  const c = check || {};
  const subject = `Vehicle Check — ${c.date || isoToday()} — ${c.vehicleLabel || c.vehicleId || ""}`.trim();
  const body = buildCheckSummaryText(c);
  return { subject, body };
}

export function copyTextToClipboard(text) {
  const t = String(text ?? "");
  if (!t) return Promise.resolve(false);

  if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard
      .writeText(t)
      .then(() => true)
      .catch(() => false);
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = t;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return Promise.resolve(!!ok);
  } catch {
    return Promise.resolve(false);
  }
}

export function parseImportPayload(text) {
  const parsed = JSON.parse(String(text || ""));
  if (parsed?.data?.checks && Array.isArray(parsed.data.checks)) {
    return { kind: "full", profile: parsed?.profile || null, data: parsed.data };
  }
  if (parsed?.check && typeof parsed.check === "object") {
    return { kind: "check", profile: parsed?.profile || null, check: parsed.check };
  }
  throw new Error("Invalid import file");
}
