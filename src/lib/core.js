import { HUB_URL } from "../app/constants";

export function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

export const uid = (prefix = "id") => {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    // ignore
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function badgeFor(sev) {
  if (sev === "issue") return "bg-red-100 text-red-800 border-red-200";
  if (sev === "note") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-emerald-100 text-emerald-800 border-emerald-200";
}

export function labelFor(sev) {
  if (sev === "issue") return "Issue";
  if (sev === "note") return "Note";
  return "OK";
}

export function normalizeVehicleId(seed) {
  const base = String(seed || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || uid("veh");
}

export function formatVehicleLabel(v) {
  if (!v) return "-";
  const mm = [v.make, v.model].filter(Boolean).join(" ").trim();
  const base = mm || v.label || "Vehicle";
  const plate = String(v.plate || "").trim();
  return plate ? `${plate} • ${base}` : base;
}

export function isTestsMode() {
  try {
    return typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tests") === "1";
  } catch {
    return false;
  }
}

export function isHubPlaceholder() {
  return !HUB_URL || HUB_URL.includes("YOUR-WIX-HUB-URL-HERE");
}
