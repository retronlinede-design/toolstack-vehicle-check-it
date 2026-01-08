import React from "react";
import { PROFILE_KEY } from "../app/constants";

export default function HelpModal({ open, onClose, appName = "ToolStack App", storageKey = "(unknown)", actions = [] }) {
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
              <div className="mt-3 h-[2px] w-56 rounded-full bg-gradient-to-r from-[#D5FF00]/0 via-[#D5FF00] to-[#D5FF00]/0" />
            </div>

            <button
              type="button"
              className="print:hidden px-3 py-2 rounded-xl text-sm font-medium border border-neutral-200 bg-white hover:bg-[#D5FF00]/10 hover:border-[#D5FF00] text-neutral-900 transition focus:outline-none focus:ring-2 focus:ring-[#D5FF00]/30 focus:border-neutral-300"
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
              className="print:hidden px-3 py-2 rounded-xl text-sm font-medium border border-neutral-700 bg-neutral-700 text-white hover:bg-[#D5FF00] hover:border-[#D5FF00] hover:text-neutral-900 transition focus:outline-none focus:ring-2 focus:ring-[#D5FF00]/30 focus:border-neutral-300"
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
