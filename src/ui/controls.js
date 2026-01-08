import React from "react";

export const btnSecondary =
  "px-3 py-2 rounded-xl bg-white border border-neutral-200 shadow-sm " +
  "hover:bg-[#D5FF00]/10 hover:border-[#D5FF00] active:translate-y-[1px] transition " +
  "disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#D5FF00]/30 focus:border-neutral-300";

export const btnDanger =
  "px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 shadow-sm " +
  "hover:bg-red-100 active:translate-y-[1px] transition disabled:opacity-50 disabled:cursor-not-allowed " +
  "focus:outline-none focus:ring-2 focus:ring-[#D5FF00]/30 focus:border-neutral-300";

export const btnMini =
  "px-2.5 py-1.5 rounded-xl bg-white border border-neutral-200 shadow-sm text-xs font-medium " +
  "hover:bg-[#D5FF00]/10 hover:border-[#D5FF00] active:translate-y-[1px] transition " +
  "disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#D5FF00]/30 focus:border-neutral-300";

export const btnMiniDanger =
  "px-2.5 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 shadow-sm text-xs font-medium " +
  "hover:bg-red-100 active:translate-y-[1px] transition disabled:opacity-50 disabled:cursor-not-allowed " +
  "focus:outline-none focus:ring-2 focus:ring-[#D5FF00]/30 focus:border-neutral-300";

export const inputBase =
  "w-full mt-1 px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#D5FF00]/30 focus:border-neutral-300";

export const card = "rounded-2xl bg-white border border-neutral-200 shadow-sm";
export const cardHead = "px-4 py-3 border-b border-neutral-100";
export const cardPad = "p-4";

export function Pill({ children, tone = "default" }) {
  const cls =
    tone === "accent"
      ? "border-[#D5FF00]/40 bg-[#D5FF00]/10 text-neutral-800"
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

const ACTION_BASE =
  "print:hidden h-10 w-full rounded-xl text-sm font-medium border transition shadow-sm active:translate-y-[1px] " +
  "disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center " +
  "focus:outline-none focus:ring-2 focus:ring-[#D5FF00]/30 focus:border-neutral-300";

export function ActionButton({ children, onClick, tone = "default", disabled, title }) {
  const cls =
    tone === "primary"
      ? "bg-neutral-700 hover:bg-[#D5FF00] hover:border-[#D5FF00] hover:text-neutral-900 text-white border-neutral-700"
      : tone === "danger"
      ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
      : "bg-white hover:bg-[#D5FF00]/10 hover:border-[#D5FF00] text-neutral-700 border-neutral-200";

  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} className={`${ACTION_BASE} ${cls}`}>
      {children}
    </button>
  );
}

export function ActionFileButton({ children, onFile, accept = "application/json", tone = "default", title }) {
  const cls =
    tone === "primary"
      ? "bg-neutral-700 hover:bg-[#D5FF00] hover:border-[#D5FF00] hover:text-neutral-900 text-white border-neutral-700"
      : "bg-white hover:bg-[#D5FF00]/10 hover:border-[#D5FF00] text-neutral-700 border-neutral-200";

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

export function HelpIconButton({ onClick, title = "Help" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={
        "print:hidden h-10 w-10 shrink-0 rounded-xl border border-neutral-200 bg-white shadow-sm " +
        "hover:bg-[#D5FF00]/10 hover:border-[#D5FF00] active:translate-y-[1px] transition flex items-center justify-center " +
        "focus:outline-none focus:ring-2 focus:ring-[#D5FF00]/30 focus:border-neutral-300"
      }
    >
      <span className="text-sm font-black text-neutral-700">?</span>
    </button>
  );
}
