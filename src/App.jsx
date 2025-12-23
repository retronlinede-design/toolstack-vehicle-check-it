// Vehicle Check-It (ToolStack) — module-ready MVP
// Paste into: src/App.jsx
// Requires: Tailwind v4 configured (same as other ToolStack apps).

import React, { useEffect, useMemo, useRef, useState } from "react";

const APP_ID = "vehiclecheckit";
const APP_VERSION = "v1";

const KEY = `toolstack.${APP_ID}.${APP_VERSION}`;
const PROFILE_KEY = "toolstack.profile.v1";

// Optional: set later
const HUB_URL = "https://YOUR-WIX-HUB-URL-HERE";

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
  return {
    name: "Default Vehicle Check",
    sections: [
      {
        id: crypto?.randomUUID?.() || "s1",
        title: "Exterior",
        items: [
          { id: crypto?.randomUUID?.() || "i1", label: "Tyres (pressure / condition)", severity: "ok" },
          { id: crypto?.randomUUID?.() || "i2", label: "Lights (all working)", severity: "ok" },
          { id: crypto?.randomUUID?.() || "i3", label: "Windows / mirrors clean", severity: "ok" },
          { id: crypto?.randomUUID?.() || "i4", label: "Body damage check", severity: "ok" },
        ],
      },
      {
        id: crypto?.randomUUID?.() || "s2",
        title: "Interior",
        items: [
          { id: crypto?.randomUUID?.() || "i5", label: "Cabin clean", severity: "ok" },
          { id: crypto?.randomUUID?.() || "i6", label: "Documents present (registration/insurance)", severity: "ok" },
          { id: crypto?.randomUUID?.() || "i7", label: "Fuel card / toll card", severity: "ok" },
          { id: crypto?.randomUUID?.() || "i8", label: "Charging cables / accessories", severity: "ok" },
        ],
      },
      {
        id: crypto?.randomUUID?.() || "s3",
        title: "Safety",
        items: [
          { id: crypto?.randomUUID?.() || "i9", label: "Warning triangle", severity: "ok" },
          { id: crypto?.randomUUID?.() || "i10", label: "High-visibility vest", severity: "ok" },
          { id: crypto?.randomUUID?.() || "i11", label: "First aid kit", severity: "ok" },
          { id: crypto?.randomUUID?.() || "i12", label: "Spare bulb kit / tools (if applicable)", severity: "ok" },
        ],
      },
      {
        id: crypto?.randomUUID?.() || "s4",
        title: "Vehicle status",
        items: [
          { id: crypto?.randomUUID?.() || "i13", label: "Fuel level sufficient", severity: "ok" },
          { id: crypto?.randomUUID?.() || "i14", label: "No warning lights", severity: "ok" },
          { id: crypto?.randomUUID?.() || "i15", label: "Wipers / washer fluid", severity: "ok" },
          { id: crypto?.randomUUID?.() || "i16", label: "AdBlue level (if applicable)", severity: "ok" },
        ],
      },
      {
        id: crypto?.randomUUID?.() || "s5",
        title: "Post-trip",
        items: [
          { id: crypto?.randomUUID?.() || "i17", label: "Receipts stored", severity: "ok" },
          { id: crypto?.randomUUID?.() || "i18", label: "Odometer noted", severity: "ok" },
          { id: crypto?.randomUUID?.() || "i19", label: "Personal items removed", severity: "ok" },
          { id: crypto?.randomUUID?.() || "i20", label: "Vehicle locked / keys returned", severity: "ok" },
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
  const next = {
    ...state,
    meta: { ...state.meta, updatedAt: new Date().toISOString() },
  };
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

export default function App() {
  const [profile, setProfile] = useState(loadProfile());
  const [state, setState] = useState(loadState());

  const [date, setDate] = useState(isoToday());
  const [vehicleId, setVehicleId] = useState(profile.vehicles?.[0]?.id || "");
  const [odometer, setOdometer] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");

  const [previewOpen, setPreviewOpen] = useState(false);
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
  const vehicleLabel = useMemo(() => vehicles.find((v) => v.id === vehicleId)?.label || "-", [vehicles, vehicleId]);

  // Draft check (mutable per item)
  const [draft, setDraft] = useState(() => {
    const t = state.template;
    return {
      date,
      vehicleId,
      odometer: "",
      generalNotes: "",
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
      odometer: "",
      generalNotes: "",
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
      id: crypto?.randomUUID?.() || String(Date.now()),
      createdAt: new Date().toISOString(),
      date,
      vehicleId,
      vehicleLabel,
      odometer: String(odometer || "").trim(),
      generalNotes: String(generalNotes || "").trim(),
      sections: draft.sections,
      summary: {
        totalItems,
        doneCount,
        issueCount,
      },
    };

    setState((prev) =>
      saveState({
        ...prev,
        checks: [check, ...prev.checks],
      })
    );

    resetDraft();
  }

  function deleteCheck(id) {
    setState((prev) => saveState({ ...prev, checks: prev.checks.filter((c) => c.id !== id) }));
  }

  function exportJSON() {
    const payload = {
      exportedAt: new Date().toISOString(),
      profile,
      data: state,
    };
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

  function printPreview() {
    setPreviewOpen(true);
    setTimeout(() => window.print(), 50);
  }

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
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-bold">Vehicle Check-It</div>
            <div className="text-sm text-neutral-600">
              Module-ready ({moduleManifest.id}.{moduleManifest.version}) • Offline-first • Export/Import + Print
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <button
              className="px-3 py-2 rounded-xl bg-white border border-neutral-200 shadow-sm hover:bg-neutral-50"
              onClick={() => setPreviewOpen(true)}
            >
              Preview
            </button>
            <button
              className="px-3 py-2 rounded-xl bg-white border border-neutral-200 shadow-sm hover:bg-neutral-50"
              onClick={printPreview}
            >
              Print / Save PDF
            </button>
            <button
              className="px-3 py-2 rounded-xl bg-white border border-neutral-200 shadow-sm hover:bg-neutral-50"
              onClick={exportJSON}
            >
              Export
            </button>
            <button
              className="px-3 py-2 rounded-xl bg-white border border-neutral-200 shadow-sm hover:bg-neutral-50"
              onClick={() => fileRef.current?.click()}
            >
              Import
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

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Profile */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-4">
            <div className="font-semibold">Profile (shared)</div>
            <div className="mt-3 space-y-2">
              <label className="block text-sm">
                <div className="text-neutral-600">Organization</div>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-neutral-200"
                  value={profile.org}
                  onChange={(e) => setProfile({ ...profile, org: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <div className="text-neutral-600">User</div>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-neutral-200"
                  value={profile.user}
                  onChange={(e) => setProfile({ ...profile, user: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <div className="text-neutral-600">Language</div>
                <select
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-neutral-200 bg-white"
                  value={profile.language}
                  onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                >
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
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-4 lg:col-span-3">
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
                  <input
                    type="date"
                    className="mt-1 px-3 py-2 rounded-xl border border-neutral-200"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>

                <label className="text-sm">
                  <div className="text-neutral-600">Vehicle</div>
                  <select
                    className="mt-1 px-3 py-2 rounded-xl border border-neutral-200 bg-white"
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                  >
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
                    className="mt-1 px-3 py-2 rounded-xl border border-neutral-200"
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
                className="w-full mt-1 px-3 py-2 rounded-xl border border-neutral-200"
                placeholder="Anything important about the vehicle today"
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
              />
            </label>

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
                              checked={it.done}
                              onChange={(e) => updateItem(s.id, it.id, { done: e.target.checked })}
                            />
                            <span className={it.done ? "line-through text-neutral-500" : ""}>{it.label}</span>
                          </label>

                          <div className="flex items-center gap-2">
                            <span
                              className={
                                "text-xs px-2 py-1 rounded-full border " + badgeFor(it.severity)
                              }
                            >
                              {labelFor(it.severity)}
                            </span>
                            <select
                              className="text-sm px-2 py-1 rounded-xl border border-neutral-200 bg-white"
                              value={it.severity}
                              onChange={(e) => updateItem(s.id, it.id, { severity: e.target.value })}
                            >
                              <option value="ok">OK</option>
                              <option value="note">Note</option>
                              <option value="issue">Issue</option>
                            </select>
                          </div>
                        </div>

                        {(it.severity === "note" || it.severity === "issue") && (
                          <input
                            className="mt-2 w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm"
                            placeholder={it.severity === "issue" ? "Describe the issue" : "Add a note"}
                            value={it.note}
                            onChange={(e) => updateItem(s.id, it.id, { note: e.target.value })}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                className="px-3 py-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50"
                onClick={resetDraft}
              >
                Reset
              </button>

              <button
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800"
                onClick={saveCheck}
              >
                Save check
              </button>
            </div>
          </div>
        </div>

        {/* Saved checks */}
        <div className="mt-4 bg-white border border-neutral-200 rounded-2xl shadow-sm p-4">
          <div className="font-semibold">Saved checks</div>

          {state.checks.length === 0 ? (
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
                  {state.checks.map((c) => (
                    <tr key={c.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-2 font-medium">{c.date}</td>
                      <td className="py-2 pr-2">{c.vehicleLabel || c.vehicleId}</td>
                      <td className="py-2 pr-2">{c.odometer || "-"}</td>
                      <td className="py-2 pr-2">
                        <span className={
                          "text-xs px-2 py-1 rounded-full border " +
                          (c.summary?.issueCount ? "bg-red-100 text-red-800 border-red-200" : "bg-emerald-100 text-emerald-800 border-emerald-200")
                        }>
                          {c.summary?.issueCount || 0}
                        </span>
                      </td>
                      <td className="py-2 pr-2">
                        {c.summary?.doneCount || 0}/{c.summary?.totalItems || 0}
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <button
                          className="px-3 py-1.5 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50"
                          onClick={() => deleteCheck(c.id)}
                        >
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

        {/* Preview modal */}
        {previewOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-3 z-50">
            <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden">
              <div className="p-3 border-b flex items-center justify-between">
                <div className="font-semibold">Preview</div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50"
                    onClick={printPreview}
                  >
                    Print / Save PDF
                  </button>
                  <button
                    className="px-3 py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800"
                    onClick={() => setPreviewOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-auto max-h-[80vh]">
                <div className="text-xl font-bold">{profile.org || "ToolStack"}</div>
                <div className="text-sm text-neutral-600">Vehicle Check Report</div>

                <div className="mt-2 text-sm">
                  <div><span className="text-neutral-600">User:</span> {profile.user || "-"}</div>
                  <div><span className="text-neutral-600">Date:</span> {date}</div>
                  <div><span className="text-neutral-600">Vehicle:</span> {vehicleLabel}</div>
                  <div><span className="text-neutral-600">Odometer:</span> {odometer || "-"}</div>
                  <div><span className="text-neutral-600">Generated:</span> {new Date().toLocaleString()}</div>
                </div>

                {generalNotes && (
                  <div className="mt-4 text-sm">
                    <div className="font-semibold">General notes</div>
                    <div className="text-neutral-700">{generalNotes}</div>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {draft.sections.map((s) => (
                    <div key={s.id} className="rounded-2xl border border-neutral-200 p-3">
                      <div className="font-semibold">{s.title}</div>
                      <div className="mt-2 space-y-2">
                        {s.items.map((it) => (
                          <div key={it.id} className="text-sm flex items-start justify-between gap-3 border-t pt-2 first:border-t-0 first:pt-0">
                            <div>
                              <div className={it.done ? "line-through text-neutral-500" : ""}>{it.label}</div>
                              {it.note && <div className="text-neutral-600">{it.note}</div>}
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
                  Storage key: <span className="font-mono">{KEY}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-sm text-neutral-600">
          <a className="underline hover:text-neutral-900" href={HUB_URL} target="_blank" rel="noreferrer">
            Return to ToolStack hub
          </a>
        </div>
      </div>
    </div>
  );
}
