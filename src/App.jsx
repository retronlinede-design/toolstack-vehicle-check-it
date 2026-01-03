// Vehicle Check-It (ToolStack) — module-ready MVP (Styled v1: grey + lime/green accent)
// Paste into: src/App.jsx
// Requires: Tailwind v4 configured (same as other ToolStack apps).

import React, { useEffect, useMemo, useRef, useState } from "react";

const APP_ID = "vehiclecheckit";
const APP_VERSION = "v1";

const KEY = `toolstack.${APP_ID}.${APP_VERSION}`;
const PROFILE_KEY = "toolstack.profile.v1";

// Put your real ToolStack hub URL here (Wix page)
const HUB_URL = "https://YOUR-WIX-HUB-URL-HERE";

// ---------- utils ----------
function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

const uid = (prefix = "id") => {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    // ignore
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

// ---------- profile / template / state ----------
function loadProfile() {
  return (
    safeParse(localStorage.getItem(PROFILE_KEY), null) || {
      org: "ToolStack",
      user: "",
      language: "EN",
      logo: "",
      vehicles: [
        { id: "bmw-530i", label: "BMW 530i" },
        { id: "vito-119", label: "Mercedes Vito 119" },
      ],
    }
  );
}

function defaultTemplate() {
  const sid = () => uid("s");
  const iid = () => uid("i");

  return {
    name: "Default Vehicle Check",
    sections: [
      {
        id: sid(),
        title: "Exterior",
        items: [
          { id: iid(), label: "Tyres (pressure / condition)", severity: "ok" },
          { id: iid(), label: "Lights (all working)", severity: "ok" },
          { id: iid(), label: "Windows / mirrors clean", severity: "ok" },
          { id: iid(), label: "Body damage check", severity: "ok" },
        ],
      },
      {
        id: sid(),
        title: "Interior",
        items: [
          { id: iid(), label: "Cabin clean", severity: "ok" },
          { id: iid(), label: "Documents present (registration/insurance)", severity: "ok" },
          { id: iid(), label: "Fuel card / toll card", severity: "ok" },
          { id: iid(), label: "Charging cables / accessories", severity: "ok" },
        ],
      },
      {
        id: sid(),
        title: "Safety",
        items: [
          { id: iid(), label: "Warning triangle", severity: "ok" },
          { id: iid(), label: "High-visibility vest", severity: "ok" },
          { id: iid(), label: "First aid kit", severity: "ok" },
          { id: iid(), label: "Spare bulb kit / tools (if applicable)", severity: "ok" },
        ],
      },
      {
        id: sid(),
        title: "Vehicle status",
        items: [
          { id: iid(), label: "Fuel level sufficient", severity: "ok" },
          { id: iid(), label: "No warning lights", severity: "ok" },
          { id: iid(), label: "Wipers / washer fluid", severity: "ok" },
          { id: iid(), label: "AdBlue level (if applicable)", severity: "ok" },
        ],
      },
      {
        id: sid(),
        title: "Post-trip",
        items: [
          { id: iid(), label: "Receipts stored", severity: "ok" },
          { id: iid(), label: "Odometer noted", severity: "ok" },
          { id: iid(), label: "Personal items removed", severity: "ok" },
          { id: iid(), label: "Vehicle locked / keys returned", severity: "ok" },
        ],
      },
    ],
  };
}

function loadState() {
  return (
    safeParse(localStorage.getItem(KEY), null) || {
      meta: { appId: APP_ID, version: APP_VERSION, updatedAt: new Date().toISOString() },
      template: defaultTemplate(),
      checks: [],
    }
  );
}

function saveState(state) {
  const next = { ...state, meta: { ...(state.meta || {}), updatedAt: new Date().toISOString() } };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

function badgeFor(sev) {
  if (sev === "issue") return "bg-red-100 text-red-800 border-red-200";
  if (sev === "note") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-emerald-100 text-emerald-800 border-emerald-200";
}

function labelFor(sev) {
  if (sev === "issue") return "Issue";
  if (sev === "note") return "Note";
  return "OK";
}

// ---------- UI tokens (Styled v1) ----------
const btnSecondary =
  "px-3 py-2 rounded-xl bg-white border border-neutral-200 shadow-sm hover:bg-neutral-50 active:translate-y-[1px] transition disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary =
  "px-3 py-2 rounded-xl bg-neutral-900 text-white border border-neutral-900 shadow-sm hover:bg-neutral-800 active:translate-y-[1px] transition disabled:opacity-50 disabled:cursor-not-allowed";
const btnDanger =
  "px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 shadow-sm hover:bg-red-100 active:translate-y-[1px] transition disabled:opacity-50 disabled:cursor-not-allowed";
const inputBase =
  "w-full mt-1 px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-lime-400/25 focus:border-neutral-300";

// ---------- Report Sheet ----------
function ReportSheet({ profile, date, vehicleLabel, odometer, generalNotes, draft, totals, storageKey }) {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold text-neutral-900">{profile.org || "ToolStack"}</div>
          <div className="text-sm text-neutral-600">Vehicle Check Report</div>
          <div className="mt-3 h-[2px] w-72 rounded-full bg-gradient-to-r from-lime-400/0 via-lime-400 to-emerald-400/0" />
        </div>
        <div className="text-sm text-neutral-600">Generated: {new Date().toLocaleString()}</div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-neutral-200 p-4">
          <div className="text-sm text-neutral-600">Prepared by</div>
          <div className="text-lg font-semibold text-neutral-900 mt-1">{profile.user || "—"}</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 p-4">
          <div className="text-sm text-neutral-600">Vehicle</div>
          <div className="text-sm text-neutral-900 mt-1">{vehicleLabel || "—"}</div>
          <div className="text-xs text-neutral-600 mt-1">Date: {date || "—"}</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 p-4">
          <div className="text-sm text-neutral-600">Summary</div>
          <div className="text-sm text-neutral-900 mt-1">
            Items: <span className="font-semibold">{totals.doneCount}</span>/{totals.totalItems} • Issues:{" "}
            <span className="font-semibold">{totals.issueCount}</span>
          </div>
          <div className="text-xs text-neutral-600 mt-1">Odometer: {odometer || "—"}</div>
        </div>
      </div>

      {generalNotes ? (
        <div className="mt-4 rounded-2xl border border-neutral-200 p-4 text-sm">
          <div className="font-semibold text-neutral-900">General notes</div>
          <div className="mt-1 text-neutral-700 whitespace-pre-wrap">{generalNotes}</div>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {draft.sections.map((s) => (
          <div key={s.id} className="rounded-2xl border border-neutral-200 p-3">
            <div className="font-semibold">{s.title}</div>
            <div className="mt-2 space-y-2">
              {s.items.map((it) => (
                <div
                  key={it.id}
                  className="text-sm flex items-start justify-between gap-3 border-t pt-2 first:border-t-0 first:pt-0"
                >
                  <div>
                    <div className={it.done ? "line-through text-neutral-500" : ""}>{it.label}</div>
                    {it.note ? <div className="text-neutral-600 whitespace-pre-wrap">{it.note}</div> : null}
                  </div>
                  <span className={"text-xs px-2 py-1 rounded-full border " + badgeFor(it.severity)}>
                    {labelFor(it.severity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <div className="text-neutral-600">Prepared by</div>
          <div className="mt-8 border-t pt-2">Signature</div>
        </div>
        <div>
          <div className="text-neutral-600">Approved by</div>
          <div className="mt-8 border-t pt-2">Signature</div>
        </div>
      </div>

      <div className="mt-6 text-xs text-neutral-500">
        Storage key: <span className="font-mono">{storageKey}</span>
      </div>
    </div>
  );
}

export default function App() {
  const [profile, setProfile] = useState(loadProfile());
  const [state, setState] = useState(loadState());

  const [date, setDate] = useState(isoToday());
  const [vehicleId, setVehicleId] = useState(profile.vehicles?.[0]?.id || "");
  const [odometer, setOdometer] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");

  const [previewOpen, setPreviewOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const fileRef = useRef(null);

  // Persist shared profile
  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);

  // Persist app state
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const vehicles = useMemo(() => profile.vehicles || [], [profile.vehicles]);

  // Keep vehicleId valid if profile vehicles change
  useEffect(() => {
    if (!vehicles.length) return;
    const exists = vehicles.some((v) => v.id === vehicleId);
    if (!exists) setVehicleId(vehicles[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles]);

  const vehicleLabel = useMemo(() => vehicles.find((v) => v.id === vehicleId)?.label || "-", [vehicles, vehicleId]);

  // Draft check (mutable per item)
  const [draft, setDraft] = useState(() => {
    const t = state.template;
    return {
      date,
      vehicleId,
      sections: t.sections.map((s) => ({
        id: s.id,
        title: s.title,
        items: s.items.map((it) => ({
          id: it.id,
          label: it.label,
          severity: "ok", // ok | note | issue
          note: "",
          done: false,
        })),
      })),
    };
  });

  // Keep date/vehicle synced into draft
  useEffect(() => {
    setDraft((d) => ({ ...d, date, vehicleId }));
  }, [date, vehicleId]);

  const issueCount = useMemo(() => {
    let n = 0;
    for (const s of draft.sections) for (const it of s.items) if (it.severity === "issue") n++;
    return n;
  }, [draft.sections]);

  const doneCount = useMemo(() => {
    let n = 0;
    for (const s of draft.sections) for (const it of s.items) if (it.done) n++;
    return n;
  }, [draft.sections]);

  const totalItems = useMemo(() => {
    let n = 0;
    for (const s of draft.sections) n += s.items.length;
    return n;
  }, [draft.sections]);

  const totalsForPreview = useMemo(
    () => ({ issueCount, doneCount, totalItems }),
    [issueCount, doneCount, totalItems]
  );

  function updateItem(sectionId, itemId, patch) {
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id !== sectionId
          ? s
          : {
              ...s,
              items: s.items.map((it) => (it.id !== itemId ? it : { ...it, ...patch })),
            }
      ),
    }));
  }

  function resetDraft() {
    const t = state.template;
    setDraft({
      date,
      vehicleId,
      sections: t.sections.map((s) => ({
        id: s.id,
        title: s.title,
        items: s.items.map((it) => ({
          id: it.id,
          label: it.label,
          severity: "ok",
          note: "",
          done: false,
        })),
      })),
    });
    setOdometer("");
    setGeneralNotes("");
  }

  function saveCheck() {
    const check = {
      id: uid("vc"),
      createdAt: new Date().toISOString(),
      date,
      vehicleId,
      vehicleLabel,
      odometer: String(odometer || "").trim(),
      generalNotes: String(generalNotes || "").trim(),
      sections: draft.sections,
      summary: { totalItems, doneCount, issueCount },
    };

    setState((prev) =>
      saveState({
        ...prev,
        checks: [check, ...(prev.checks || [])],
      })
    );

    resetDraft();
  }

  function deleteCheck(id) {
    const ok = window.confirm("Delete this saved check?");
    if (!ok) return;
    setState((prev) => saveState({ ...prev, checks: (prev.checks || []).filter((c) => c.id !== id) }));
  }

  function exportJSON() {
    const payload = { exportedAt: new Date().toISOString(), profile, data: state };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `toolstack-vehicle-check-it-${APP_VERSION}-${isoToday()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ""));
        const incoming = parsed?.data;
        if (!incoming?.checks || !Array.isArray(incoming.checks)) throw new Error("Invalid import file");
        setProfile(parsed?.profile || profile);
        setState(saveState(incoming));
        resetDraft();
      } catch (e) {
        alert("Import failed: " + (e?.message || "unknown error"));
      }
    };
    reader.readAsText(file);
  }

  const openPreview = () => setPreviewOpen(true);

  const printFromPreview = () => {
    setPreviewOpen(true);
    setTimeout(() => window.print(), 50);
  };

  const resetAppData = () => {
    const ok = window.confirm(
      "Reset all Vehicle Check-It data on this device?\n\nThis clears saved checks for this app.\n(Your shared profile may still be used by other ToolStack apps.)"
    );
    if (!ok) return;
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    setState(loadState());
    resetDraft();
    setHelpOpen(false);
  };

  const moduleManifest = useMemo(
    () => ({
      id: APP_ID,
      name: "Vehicle Check-It",
      version: APP_VERSION,
      storageKeys: [KEY, PROFILE_KEY],
      exports: ["print", "json"],
    }),
    []
  );

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:p-0 { padding: 0 !important; }
        }
      `}</style>

      {previewOpen ? (
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            #vc-print-preview, #vc-print-preview * { visibility: visible !important; }
            #vc-print-preview { position: absolute !important; left: 0; top: 0; width: 100%; }
          }
        `}</style>
      ) : null}

      {/* Help Modal */}
      {helpOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setHelpOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between gap-3">
              <div className="font-semibold">Help</div>
              <button className={btnSecondary} onClick={() => setHelpOpen(false)}>
                Close
              </button>
            </div>

            <div className="p-4 space-y-4 text-sm">
              <div className="rounded-2xl border border-neutral-200 p-4 bg-neutral-50">
                <div className="font-semibold text-neutral-900">How saving works</div>
                <ul className="mt-2 space-y-1 text-neutral-700 list-disc pl-5">
                  <li>This app is offline-first. It auto-saves to your browser on this device.</li>
                  <li>Use Export/Import as your backup/restore system.</li>
                  <li>No login: if you clear browser storage, data can be lost unless you exported.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-neutral-200 p-4">
                <div className="font-semibold text-neutral-900">Recommended routine</div>
                <ul className="mt-2 space-y-1 text-neutral-700 list-disc pl-5">
                  <li>Use daily as normal.</li>
                  <li>Export once a week (or after important checks).</li>
                  <li>Import into a new browser/profile to verify your backup occasionally.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-neutral-200 p-4">
                <div className="font-semibold text-neutral-900">Storage keys</div>
                <div className="mt-2 text-neutral-700">
                  <div>
                    App: <span className="font-mono">{KEY}</span>
                  </div>
                  <div>
                    Shared profile: <span className="font-mono">{PROFILE_KEY}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                <button className={btnSecondary} onClick={exportJSON}>
                  Export now
                </button>
                <button className={btnDanger} onClick={resetAppData}>
                  Reset app data
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Preview Modal */}
      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPreviewOpen(false)} />

          <div className="relative w-full max-w-5xl">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="text-lg font-semibold text-white">Print preview</div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-2 rounded-xl text-sm font-medium border border-white/40 bg-white/10 hover:bg-white/15 text-white transition"
                  onClick={() => window.print()}
                >
                  Print / Save PDF
                </button>
                <button
                  className="px-3 py-2 rounded-xl text-sm font-medium border border-white/40 bg-white/10 hover:bg-white/15 text-white transition"
                  onClick={() => setPreviewOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-neutral-200 shadow-lg overflow-auto max-h-[80vh]">
              <div id="vc-print-preview" className="p-6">
                <ReportSheet
                  profile={profile}
                  date={date}
                  vehicleLabel={vehicleLabel}
                  odometer={String(odometer || "").trim()}
                  generalNotes={String(generalNotes || "").trim()}
                  draft={draft}
                  totals={totalsForPreview}
                  storageKey={KEY}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold tracking-tight">Vehicle Check-It</div>
            <div className="text-sm text-neutral-600">
              Module-ready ({moduleManifest.id}.{moduleManifest.version}) • Offline-first • Export/Import + Print
            </div>
            <div className="mt-3 h-[2px] w-80 rounded-full bg-gradient-to-r from-lime-400/0 via-lime-400 to-emerald-400/0" />
          </div>

          {/* Top actions grid (standard) */}
          <div className="w-full sm:w-auto">
            <div className="grid grid-cols-5 gap-2 justify-items-stretch">
              <button className={btnSecondary} onClick={openPreview}>
                Preview
              </button>
              <button className={btnSecondary} onClick={printFromPreview}>
                Print / Save PDF
              </button>
              <button className={btnSecondary} onClick={exportJSON}>
                Export
              </button>
              <button className={btnSecondary} onClick={() => fileRef.current?.click()}>
                Import
              </button>
              <button className={btnSecondary} onClick={() => setHelpOpen(true)} title="Help">
                ?
              </button>

              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importJSON(f);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Profile */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-4 print:shadow-none">
            <div className="font-semibold">Profile (shared)</div>
            <div className="mt-3 space-y-2">
              <label className="block text-sm">
                <div className="text-neutral-600">Organization</div>
                <input className={inputBase} value={profile.org} onChange={(e) => setProfile({ ...profile, org: e.target.value })} />
              </label>

              <label className="block text-sm">
                <div className="text-neutral-600">User</div>
                <input className={inputBase} value={profile.user} onChange={(e) => setProfile({ ...profile, user: e.target.value })} />
              </label>

              <label className="block text-sm">
                <div className="text-neutral-600">Language</div>
                <select className={inputBase} value={profile.language} onChange={(e) => setProfile({ ...profile, language: e.target.value })}>
                  <option value="EN">EN</option>
                  <option value="DE">DE</option>
                </select>
              </label>

              <div className="pt-2 text-xs text-neutral-500">
                Stored at <span className="font-mono">{PROFILE_KEY}</span>
              </div>
            </div>
          </div>

          {/* New check */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-4 lg:col-span-3 print:shadow-none">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="font-semibold">New vehicle check</div>
                <div className="text-sm text-neutral-600">
                  Items: {doneCount}/{totalItems} • Issues: {issueCount}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <label className="text-sm">
                  <div className="text-neutral-600">Date</div>
                  <input type="date" className={inputBase} value={date} onChange={(e) => setDate(e.target.value)} />
                </label>

                <label className="text-sm">
                  <div className="text-neutral-600">Vehicle</div>
                  <select className={inputBase} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm">
                  <div className="text-neutral-600">Odometer</div>
                  <input
                    className={inputBase}
                    placeholder="e.g., 123456"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <label className="block text-sm mt-3">
              <div className="text-neutral-600">General notes</div>
              <input
                className={inputBase}
                placeholder="Anything important about the vehicle today"
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
              />
            </label>

            {/* Sections */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {draft.sections.map((s) => (
                <div key={s.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                  <div className="font-semibold">{s.title}</div>
                  <div className="mt-2 space-y-2">
                    {s.items.map((it) => (
                      <div key={it.id} className="rounded-xl bg-white border border-neutral-200 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-neutral-300 accent-lime-500"
                              checked={it.done}
                              onChange={(e) => updateItem(s.id, it.id, { done: e.target.checked })}
                            />
                            <span className={it.done ? "line-through text-neutral-500" : ""}>{it.label}</span>
                          </label>

                          <div className="flex items-center gap-2">
                            <span className={"text-xs px-2 py-1 rounded-full border " + badgeFor(it.severity)}>
                              {labelFor(it.severity)}
                            </span>
                            <select
                              className="text-sm px-2 py-1 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-lime-400/25"
                              value={it.severity}
                              onChange={(e) => updateItem(s.id, it.id, { severity: e.target.value })}
                            >
                              <option value="ok">OK</option>
                              <option value="note">Note</option>
                              <option value="issue">Issue</option>
                            </select>
                          </div>
                        </div>

                        {it.severity !== "ok" ? (
                          <input
                            className="mt-2 w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lime-400/25"
                            placeholder={it.severity === "issue" ? "Describe the issue" : "Add a note"}
                            value={it.note}
                            onChange={(e) => updateItem(s.id, it.id, { note: e.target.value })}
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button className={btnSecondary} onClick={resetDraft}>
                Reset
              </button>

              <button className={btnPrimary} onClick={saveCheck}>
                Save check
              </button>
            </div>
          </div>
        </div>

        {/* Saved checks */}
        <div className="mt-4 bg-white border border-neutral-200 rounded-2xl shadow-sm p-4 print:shadow-none">
          <div className="font-semibold">Saved checks</div>

          {(state.checks || []).length === 0 ? (
            <div className="mt-2 text-sm text-neutral-500">No saved checks yet.</div>
          ) : (
            <div className="mt-3 overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-neutral-600">
                  <tr className="border-b">
                    <th className="py-2 pr-2">Date</th>
                    <th className="py-2 pr-2">Vehicle</th>
                    <th className="py-2 pr-2">Odometer</th>
                    <th className="py-2 pr-2">Issues</th>
                    <th className="py-2 pr-2">Items</th>
                    <th className="py-2 pr-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(state.checks || []).map((c) => (
                    <tr key={c.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-2 font-medium">{c.date}</td>
                      <td className="py-2 pr-2">{c.vehicleLabel || c.vehicleId}</td>
                      <td className="py-2 pr-2">{c.odometer || "-"}</td>
                      <td className="py-2 pr-2">
                        <span
                          className={
                            "text-xs px-2 py-1 rounded-full border " +
                            (c.summary?.issueCount
                              ? "bg-red-100 text-red-800 border-red-200"
                              : "bg-emerald-100 text-emerald-800 border-emerald-200")
                          }
                        >
                          {c.summary?.issueCount || 0}
                        </span>
                      </td>
                      <td className="py-2 pr-2">
                        {c.summary?.doneCount || 0}/{c.summary?.totalItems || 0}
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <button className={btnDanger} onClick={() => deleteCheck(c.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer link */}
        <div className="mt-6 flex items-center justify-between gap-3 text-sm text-neutral-600">
          <a className="underline hover:text-neutral-900" href={HUB_URL} target="_blank" rel="noreferrer">
            Return to ToolStack hub
          </a>
          <div className="text-xs text-neutral-500">
            Storage key: <span className="font-mono">{KEY}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
