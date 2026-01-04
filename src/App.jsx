import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * ToolStack — Vehicle Check-It — module-ready MVP
 * Styled to match the Check-It (master) UI Lock.
 * - Offline-first autosave (localStorage)
 * - Vehicle check template (sections/items)
 * - Save checks history
 * - Print Preview (prints only preview sheet)
 * - Export/Import JSON
 * - Help Pack v1 (pinned ?)
 */

const APP_ID = "vehiclecheckit";
const APP_VERSION = "v1";

// Per-module storage namespace
const KEY = `toolstack.${APP_ID}.${APP_VERSION}`;

// Shared profile (used by all modules later)
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

// ---------- profile / template / state ----------
function loadProfile() {
  if (typeof window === "undefined") {
    return {
      org: "ToolStack",
      user: "",
      language: "EN",
      logo: "",
      vehicles: [],
    };
  }

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
  if (typeof window === "undefined") {
    return {
      meta: { appId: APP_ID, version: APP_VERSION, updatedAt: new Date().toISOString() },
      template: defaultTemplate(),
      checks: [],
    };
  }

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

// ---------- UI tokens (Check-It master) ----------
const btnSecondary =
  "px-3 py-2 rounded-xl bg-white border border-neutral-200 shadow-sm hover:bg-neutral-50 active:translate-y-[1px] transition disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary =
  "px-3 py-2 rounded-xl bg-neutral-700 text-white border border-neutral-700 shadow-sm hover:bg-neutral-600 active:translate-y-[1px] transition disabled:opacity-50 disabled:cursor-not-allowed";
const btnDanger =
  "px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 shadow-sm hover:bg-red-100 active:translate-y-[1px] transition disabled:opacity-50 disabled:cursor-not-allowed";
const inputBase =
  "w-full mt-1 px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-lime-400/25 focus:border-neutral-300";

const card = "rounded-2xl bg-white border border-neutral-200 shadow-sm";
const cardHead = "px-4 py-3 border-b border-neutral-100";
const cardPad = "p-4";

function Pill({ children, tone = "default" }) {
  const cls =
    tone === "accent"
      ? "border-lime-200 bg-lime-50 text-neutral-800"
      : tone === "warn"
      ? "border-amber-200 bg-amber-50 text-neutral-800"
      : tone === "danger"
      ? "border-red-200 bg-red-50 text-neutral-800"
      : "border-neutral-200 bg-white text-neutral-800";

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${cls}`}>
      {children}
    </span>
  );
}

// ---------- Normalized Top Actions (master) ----------
const ACTION_BASE =
  "print:hidden h-10 w-full rounded-xl text-sm font-medium border transition shadow-sm active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";

function ActionButton({ children, onClick, tone = "default", disabled, title }) {
  const cls =
    tone === "primary"
      ? "bg-neutral-700 hover:bg-neutral-600 text-white border-neutral-700"
      : tone === "danger"
      ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
      : "bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200";

  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} className={`${ACTION_BASE} ${cls}`}>
      {children}
    </button>
  );
}

function ActionFileButton({ children, onFile, accept = "application/json", tone = "primary", title }) {
  const cls =
    tone === "primary"
      ? "bg-neutral-700 hover:bg-neutral-600 text-white border-neutral-700"
      : "bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200";

  return (
    <label title={title} className={`${ACTION_BASE} ${cls} cursor-pointer`}>
      <span>{children}</span>
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          onFile?.(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function HelpIconButton({ onClick, title = "Help" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={
        "print:hidden h-10 w-10 shrink-0 rounded-xl border border-neutral-200 bg-white shadow-sm " +
        "hover:bg-neutral-50 active:translate-y-[1px] transition flex items-center justify-center " +
        "focus:outline-none focus:ring-2 focus:ring-lime-400/25 focus:border-neutral-300"
      }
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4" />
        <path d="M12 17h.01" />
        <path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
      </svg>
    </button>
  );
}

// ---------- Help Pack v1 (canonical) ----------
function HelpModal({ open, onClose, appName = "ToolStack App", storageKey = "(unknown)", actions = [] }) {
  if (!open) return null;

  const Section = ({ title, children }) => (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      <div className="text-sm text-neutral-700 leading-relaxed space-y-2">{children}</div>
    </section>
  );

  const Bullet = ({ children }) => <li className="ml-4 list-disc">{children}</li>;

  const ActionRow = ({ name, desc }) => (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-neutral-100 last:border-b-0">
      <div className="text-sm font-medium text-neutral-900">{name}</div>
      <div className="text-sm text-neutral-600 text-right">{desc}</div>
    </div>
  );

  const baseActions = [
    { name: "Preview", desc: "Shows a clean report sheet inside the app (print-safe)." },
    { name: "Print / Save PDF", desc: "Uses your browser print dialog to print or save a PDF." },
    { name: "Export", desc: "Downloads a JSON backup file of your saved data." },
    { name: "Import", desc: "Loads a JSON backup file and replaces the current saved data." },
  ];

  const extra = (actions || []).map((a) => ({ name: a, desc: "Extra tool for this app." }));

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white shadow-xl overflow-hidden">
          <div className="p-4 border-b border-neutral-100 flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-neutral-500">ToolStack • Help Pack v1</div>
              <h2 className="text-lg font-semibold text-neutral-900">{appName} — how your data works</h2>
              <div className="mt-3 h-[2px] w-56 rounded-full bg-gradient-to-r from-lime-400/0 via-lime-400 to-emerald-400/0" />
            </div>

            <button
              type="button"
              className="print:hidden px-3 py-2 rounded-xl text-sm font-medium border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-900 transition"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <div className="p-4 space-y-5 max-h-[70vh] overflow-auto">
            <Section title="Quick start (daily use)">
              <ul className="space-y-1">
                <Bullet>Use the app normally — it autosaves as you type.</Bullet>
                <Bullet>
                  Use <b>Preview</b> → then <b>Print / Save PDF</b> for a clean report.
                </Bullet>
                <Bullet>
                  Use <b>Export</b> regularly to create backups.
                </Bullet>
              </ul>
            </Section>

            <Section title="Where your data lives (important)">
              <p>
                Your data is saved automatically in your browser on <b>this device</b> using local storage (localStorage).
              </p>
              <ul className="space-y-1">
                <Bullet>No login is required (for now).</Bullet>
                <Bullet>If you switch device/browser/profile, your data will not follow automatically.</Bullet>
              </ul>
            </Section>

            <Section title="Backup routine (recommended)">
              <ul className="space-y-1">
                <Bullet>
                  Export after major changes, or at least <b>weekly</b>.
                </Bullet>
                <Bullet>Keep 2–3 older exports as a fallback.</Bullet>
                <Bullet>Save exports somewhere safe (Drive/Dropbox/OneDrive) or email them to yourself.</Bullet>
              </ul>
            </Section>

            <Section title="Restore / move to a new device (Import)">
              <p>
                On a new device/browser (or after clearing site data), use <b>Import</b> and select your latest exported JSON.
              </p>
              <ul className="space-y-1">
                <Bullet>Import replaces the current saved data with the file’s contents.</Bullet>
                <Bullet>If an import fails, try an older export (versions can differ).</Bullet>
              </ul>
            </Section>

            <Section title="Buttons glossary (same meaning across ToolStack)">
              <div className="rounded-2xl border border-neutral-200 bg-white px-3">
                {[...baseActions, ...extra].map((a) => (
                  <ActionRow key={a.name} name={a.name} desc={a.desc} />
                ))}
              </div>
            </Section>

            <Section title="What can erase local data">
              <ul className="space-y-1">
                <Bullet>Clearing browser history / site data.</Bullet>
                <Bullet>Private/incognito mode.</Bullet>
                <Bullet>Some “cleanup/optimizer” tools.</Bullet>
                <Bullet>Reinstalling the browser or using a different browser profile.</Bullet>
              </ul>
            </Section>

            <Section title="Storage key (for troubleshooting)">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
                <span className="font-medium">localStorage key:</span> <span className="font-mono">{storageKey}</span>
              </div>
              <div className="mt-2 text-xs text-neutral-500">
                Shared profile key: <span className="font-mono">{PROFILE_KEY}</span>
              </div>
            </Section>

            <Section title="Privacy">
              <p>By default, your data stays on your device. It only leaves your device if you export it or share it yourself.</p>
            </Section>
          </div>

          <div className="p-4 border-t border-neutral-100 flex items-center justify-end gap-2">
            <button
              type="button"
              className="print:hidden px-3 py-2 rounded-xl text-sm font-medium border border-neutral-700 bg-neutral-700 text-white hover:bg-neutral-600 transition"
              onClick={onClose}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
            Done: <span className="font-semibold">{totals.doneCount}</span>/{totals.totalItems} • Issues:{" "}
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

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const notify = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  };

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

  const totalsForPreview = useMemo(() => ({ issueCount, doneCount, totalItems }), [issueCount, doneCount, totalItems]);

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
    notify("Reset");
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
    notify("Saved check");
  }

  function deleteCheck(id) {
    const ok = window.confirm("Delete this saved check?");
    if (!ok) return;
    setState((prev) => saveState({ ...prev, checks: (prev.checks || []).filter((c) => c.id !== id) }));
    notify("Deleted");
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
    notify("Exported");
  }

  function importJSON(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ""));
        const incoming = parsed?.data;
        if (!incoming?.checks || !Array.isArray(incoming.checks)) throw new Error("Invalid import file");
        setProfile(parsed?.profile || profile);
        setState(saveState(incoming));
        resetDraft();
        notify("Imported");
      } catch (e) {
        alert("Import failed: " + (e?.message || "unknown error"));
      }
    };
    reader.readAsText(file);
  }

  const openPreview = () => setPreviewOpen(true);

  // Top bar print should print ONLY the preview sheet
  const printFromTop = () => {
    setPreviewOpen(true);
    setTimeout(() => window.print(), 60);
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
    <div className="min-h-screen bg-neutral-50 text-neutral-800">
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
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

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} appName="Vehicle Check-It" storageKey={KEY} />

      {/* Preview Modal */}
      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPreviewOpen(false)} />

          <div className="relative w-full max-w-5xl">
            <div className="mb-3 rounded-2xl bg-white border border-neutral-200 shadow-sm p-3 flex items-center justify-between gap-3">
              <div className="text-lg font-semibold text-neutral-800">Print preview</div>
              <div className="flex items-center gap-2">
                <button className={btnSecondary} onClick={() => window.print()}>
                  Print / Save PDF
                </button>
                <button className={btnPrimary} onClick={() => setPreviewOpen(false)}>
                  Close
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-neutral-200 shadow-xl overflow-auto max-h-[80vh]">
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-sm text-neutral-600"></div>
            <div className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-700">
              <span>Vehicle-Check</span>
              <span className="text-[D#5FF00]">It</span>
            </div>
            <div className="text-sm text-neutral-700">Safety inspection list for your vehicle</div>
            <div className="mt-3 h-[2px] w-80 rounded-full bg-gradient-to-r from-lime-400/0 via-lime-400 to-emerald-400/0" />

            <div className="mt-3 flex flex-wrap gap-2">
              <Pill tone="accent">{doneCount} done</Pill>
              <Pill>{totalItems} total</Pill>
              {issueCount ? <Pill tone="danger">{issueCount} issues</Pill> : <Pill>0 issues</Pill>}
              <Pill>Module: {moduleManifest.id}.{moduleManifest.version}</Pill>
            </div>
          </div>

          {/* Normalized top actions + pinned help icon */}
          <div className="w-full sm:w-[560px]">
            <div className="relative">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 pr-12">
                <ActionButton onClick={openPreview} disabled={totalItems === 0}>
                  Preview
                </ActionButton>
                <ActionButton onClick={printFromTop} disabled={totalItems === 0}>
                  Print / Save PDF
                </ActionButton>
                <ActionButton onClick={exportJSON}>Export</ActionButton>
                <ActionFileButton onFile={(f) => importJSON(f)} tone="primary">
                  Import
                </ActionFileButton>
              </div>

              <div className="absolute right-0 top-0">
                <HelpIconButton onClick={() => setHelpOpen(true)} />
              </div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Profile */}
          <div className={`${card}`}>
            <div className={cardHead}>
              <div className="font-semibold text-neutral-800">Profile (shared)</div>
              <div className="text-xs text-neutral-600 mt-1">Stored at <span className="font-mono">{PROFILE_KEY}</span></div>
            </div>
            <div className={`${cardPad} space-y-3`}>
              <label className="block text-sm">
                <div className="text-neutral-700 font-medium">Organization</div>
                <input className={inputBase} value={profile.org} onChange={(e) => setProfile({ ...profile, org: e.target.value })} />
              </label>

              <label className="block text-sm">
                <div className="text-neutral-700 font-medium">User</div>
                <input className={inputBase} value={profile.user} onChange={(e) => setProfile({ ...profile, user: e.target.value })} />
              </label>

              <label className="block text-sm">
                <div className="text-neutral-700 font-medium">Language</div>
                <select className={inputBase} value={profile.language} onChange={(e) => setProfile({ ...profile, language: e.target.value })}>
                  <option value="EN">EN</option>
                  <option value="DE">DE</option>
                </select>
              </label>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                <div className="text-sm font-semibold text-neutral-800">Quick status</div>
                <div className="mt-1 text-sm text-neutral-700">Done: <span className="font-semibold">{doneCount}</span> / {totalItems}</div>
                <div className="text-sm text-neutral-700">Issues: <span className="font-semibold">{issueCount}</span></div>
                <div className="text-xs text-neutral-600 mt-2">App key: <span className="font-mono">{KEY}</span></div>
              </div>
            </div>
          </div>

          {/* Current check */}
          <div className={`${card} lg:col-span-3`}>
            <div className={`${cardHead} flex flex-wrap items-end justify-between gap-3`}>
              <div>
                <div className="font-semibold text-neutral-800">New vehicle check</div>
                <div className="text-sm text-neutral-700">Items: {doneCount}/{totalItems} • Issues: {issueCount}</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <label className="text-sm">
                  <div className="text-neutral-700 font-medium">Date</div>
                  <input type="date" className={inputBase} value={date} onChange={(e) => setDate(e.target.value)} />
                </label>

                <label className="text-sm">
                  <div className="text-neutral-700 font-medium">Vehicle</div>
                  <select className={inputBase} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm">
                  <div className="text-neutral-700 font-medium">Odometer</div>
                  <input className={inputBase} placeholder="e.g., 123456" value={odometer} onChange={(e) => setOdometer(e.target.value)} />
                </label>
              </div>
            </div>

            <div className={cardPad}>
              <label className="block text-sm">
                <div className="text-neutral-700 font-medium">General notes</div>
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
                    <div className="font-semibold text-neutral-800">{s.title}</div>
                    <div className="mt-2 space-y-2">
                      {s.items.map((it) => (
                        <div key={it.id} className="rounded-2xl bg-white border border-neutral-200 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-neutral-300 accent-lime-500"
                                checked={it.done}
                                onChange={(e) => updateItem(s.id, it.id, { done: e.target.checked })}
                              />
                              <span className={it.done ? "line-through text-neutral-500" : "text-neutral-800"}>{it.label}</span>
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

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <button className={btnSecondary} onClick={resetDraft}>
                  Reset
                </button>

                <div className="flex items-center gap-2">
                  <button className={btnSecondary} onClick={openPreview}>
                    Preview
                  </button>
                  <button className={btnPrimary} onClick={saveCheck}>
                    Save check
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Saved checks */}
        <div className={`mt-4 ${card}`}>
          <div className={cardHead}>
            <div className="font-semibold text-neutral-800">Saved checks</div>
            <div className="text-sm text-neutral-700">Your history (stored locally on this device).</div>
          </div>

          <div className={cardPad}>
            {(state.checks || []).length === 0 ? (
              <div className="text-sm text-neutral-600">No saved checks yet.</div>
            ) : (
              <div className="overflow-auto">
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
                              (c.summary?.issueCount ? "bg-red-100 text-red-800 border-red-200" : "bg-emerald-100 text-emerald-800 border-emerald-200")
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
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between gap-3 text-sm text-neutral-700">
          <a className="underline hover:text-neutral-900" href={HUB_URL} target="_blank" rel="noreferrer">
            Return to ToolStack hub
          </a>
          <div className="text-xs text-neutral-600">
            Storage key: <span className="font-mono">{KEY}</span>
          </div>
        </div>

        {toast ? (
          <div className="fixed bottom-6 right-6 rounded-2xl bg-neutral-800 text-white px-4 py-3 shadow-xl print:hidden">
            <div className="text-sm">{toast}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
