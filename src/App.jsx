import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * ToolStack — Vehicle Check-It — module-ready MVP
 * Master Pack v1.1 applied (Netto-It / Check-It UI lock)
 * - Offline-first autosave (localStorage)
 * - Vehicle check template (sections/items)
 * - Save checks history
 * - Print Preview (prints only preview sheet)
 * - Export/Import JSON
 * - Help Pack v1 (pinned ?)
 *
 * Module-ready keys:
 *   KEY         = toolstack.vehiclecheckit.v1
 *   PROFILE_KEY = toolstack.profile.v1
 */

import {
  APP_ID,
  APP_VERSION,
  TEMPLATE_REV,
  KEY,
  PROFILE_KEY,
  HUB_URL,
  FUEL_OPTIONS,
  blankVehicle,
} from "./app/constants";

import {
  safeParse,
  isoToday,
  uid,
  normalizeVehicleId,
  formatVehicleLabel,
} from "./lib/core";

import vehicleCheckItHeading from "./assets/vehiclecheckit-heading.png";

/* PHOTO STORAGE (IndexedDB) + COMPRESSION */
const PHOTO_DB = "toolstack.vehiclecheckit.photos";
const PHOTO_STORE = "photos";

function openPhotosDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(PHOTO_DB, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function savePhotoBlob(storageKey, blob, mimeType) {
  return openPhotosDb().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, "readwrite");
      tx.objectStore(PHOTO_STORE).put({ id: storageKey, blob, mimeType, createdAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

function getPhotoBlob(storageKey) {
  return openPhotosDb().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, "readonly");
      const req = tx.objectStore(PHOTO_STORE).get(storageKey);
      req.onsuccess = () => resolve(req.result?.blob || null);
      req.onerror = () => reject(req.error);
    });
  });
}

function deletePhotoBlob(storageKey) {
  return openPhotosDb().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, "readwrite");
      tx.objectStore(PHOTO_STORE).delete(storageKey);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const max = 1600;
      if (width > max) {
        height = Math.round(height * (max / width));
        width = max;
      }
      const cvs = document.createElement("canvas");
      cvs.width = width;
      cvs.height = height;
      cvs.getContext("2d").drawImage(img, 0, 0, width, height);
      cvs.toBlob((b) => (b ? resolve(b) : reject(new Error("Compression failed"))), "image/jpeg", 0.75);
    };
    img.onerror = () => reject(new Error("Image load error"));
    img.src = url;
  });
}

const T = {
  EN: {
    vehicleCheckReport: "Vehicle Check Report",
    date: "Date",
    vehicle: "Vehicle",
    odometer: "Odometer",
    items: "Items",
    issues: "Issues",
    serviceAlerts: "Service / Dashboard Alerts",
    generalNotes: "General notes",
    findings: "Findings",
    tipPDF: "Tip: Open this check in the app and use Preview → Print/Save PDF to attach a clean PDF.",
    manageVehicles: "Manage vehicles",
    storedIn: "Stored in",
    addVehicle: "Add vehicle",
    back: "Back",
    close: "Close",
    yourVehicles: "Your vehicles",
    noVehiclesAdd: "No vehicles yet. Click “Add vehicle”.",
    setActive: "Set active",
    active: "Active",
    edit: "Edit",
    delete: "Delete",
    howItWorks: "How it works",
    profilesInfo: "Vehicle profiles are saved in your browser on this device. You can edit them anytime, and pick the Active vehicle for the next checks.",
    tipLabels: "Tip: keep plate + make/model filled so the labels stay clean in your history and reports.",
    editVehicle: "Edit vehicle",
    plate: "Number plate",
    fuelType: "Fuel type",
    make: "Make",
    model: "Model",
    tuvUntil: "TÜV valid until",
    serviceDue: "Service due",
    year: "Year",
    vin: "VIN (optional)",
    notesOpt: "Notes (optional)",
    cancel: "Cancel",
    save: "Save",
    enterPlateOrModel: "Please enter at least a number plate or make/model.",
    generated: "Generated",
    preparedBy: "Prepared by",
    summary: "Summary",
    done: "Done",
    signature: "Signature",
    approvedBy: "Approved by",
    storageKey: "Storage key",
    dataSync: "DATA / SYNC",
    systemData: "System Data",
    exportBackup: "Export Backup",
    importData: "Import Data",
    upload: "UPLOAD",
    secureStorage: "Secure local storage. Export regularly to prevent data loss.",
    vehicleProfile: "Vehicle profile",
    activeVehicle: "Active vehicle",
    noVehiclesYet: "No vehicles yet",
    status: "Status",
    total: "total",
    module: "Module",
    newCheck: "New vehicle check",
    reset: "Reset",
    preview: "Preview",
    saveCheck: "Save check",
    savedChecks: "Saved checks",
    historyInfo: "Your history (stored locally on this device).",
    noSavedChecks: "No saved checks yet.",
    actions: "Actions",
    view: "View",
    returnHub: "Return to ToolStack hub",
    printPreview: "PRINT PREVIEW",
    printSavePdf: "Print / Save PDF",
    savedCheck: "Saved check",
    export: "Export",
    copy: "Copy",
    send: "Send",
    tuvExpiry: "TÜV Expiry",
    helpGuide: "Guide",
    quickStart: "Quick Start",
    dataPrivacy: "Data Privacy",
    backupRestore: "Backup & Restore",
    interfaceGlossary: "Interface Glossary",
    dataSafety: "Data Safety",
    systemInfo: "System Info",
    closeGuide: "Close Guide",
    ok: "OK",
    note: "Note",
    notes: "Notes",
    issue: "Issue",
    exportPack: "Export Pack",
    exportInfo: "Save, share, or back up your data.",
    pdfPrint: "PDF & Print",
    downloadPdf: "Download PDF",
    createEmailDraft: "Create Email Draft",
    jsonBackup: "JSON Backup",
    downloadJson: "Download JSON",
    importJson: "Import JSON",
    importWarning: "Import replaces current app data. Export first if unsure.",
    egPlate: "e.g., M-AB 1234",
    egMake: "e.g., BMW",
    egModel: "e.g., 530i",
    egYear: "e.g., 2023",
    vinPlaceholder: "Vehicle Identification Number",
    notesPlaceholder: "Anything useful (tyre size, quirks, etc.)",
    describeIssue: "Describe the issue",
    addNote: "Add a note",
    serviceAlertsPlaceholder: "e.g. Service due in 1500km, Oil change required...",
    generalNotesPlaceholder: "Anything important about the vehicle today",
    odometerPlaceholder: "e.g., 123456",
    aboutTitle: "1) About Vehicle CheckIt",
    aboutText: "Vehicle CheckIt is a local-first vehicle inspection and condition tracking tool designed to help you record vehicle details, inspection notes, and condition status, then generate clean print-ready reports. It operates fully in your browser with no accounts, no cloud storage, and no automatic data sharing.",
    howWorksTitle: "2) How Vehicle CheckIt Works",
    howWorksText: "Vehicle CheckIt follows a simple workflow:",
    step1: "1. Add Vehicle Details",
    step1Desc: "Enter key vehicle information (name, plate, identifier, etc.).",
    step2: "2. Record Inspection Items",
    step2Desc: "Log inspection checks, notes, and condition status.",
    step3: "3. Review Condition Overview",
    step3Desc: "Update and review the vehicle’s overall condition summary.",
    step4: "4. Preview & Print",
    step4Desc: "Generate a clean inspection report using Preview.",
    step5: "5. Export a Backup",
    step5Desc: "Export a JSON backup regularly, especially after major updates.",
    dataPrivacyTitle: "3) Your Data & Privacy",
    dataPrivacyText: "Your data is saved locally in this browser using secure local storage.",
    dataPrivacyList1: "Your data stays on this device",
    dataPrivacyList2: "Clearing browser data can remove inspection records",
    dataPrivacyList3: "Incognito/private mode will not retain data",
    dataPrivacyList4: "Data does not automatically sync across devices",
    backupRestoreTitle: "4) Backup & Restore",
    exportDesc: "Export downloads a JSON backup of your current Vehicle CheckIt data.",
    importDesc: "Import restores a previously exported JSON file and replaces current app data.",
    recommendedRoutine: "Recommended routine:",
    routine1: "Export weekly",
    routine2: "Export after major edits",
    routine3: "Store backups in two locations (e.g., Downloads + Drive/USB)",
    buttonsExplainedTitle: "5) Buttons Explained",
    previewDesc: "Opens the print-ready inspection report.",
    printSavePdfDesc: "Prints only the preview sheet. Choose “Save as PDF” to create a file.",
    exportBackupDesc: "Downloads a JSON backup file.",
    importBackupDesc: "Restores data from a JSON backup file.",
    storageKeysTitle: "6) Storage Keys (Advanced)",
    appDataKey: "App data key",
    sharedProfileKey: "Shared profile key",
    notesLimitationsTitle: "7) Notes / Limitations",
    notesLimitationsText1: "Vehicle CheckIt is an inspection logging tool. Reports depend on the accuracy of the information entered.",
    notesLimitationsText2: "Use Export regularly to avoid data loss.",
    supportFeedbackTitle: "8) Support / Feedback",
    supportFeedbackText: "If something breaks, include: device + browser + steps to reproduce + expected vs actual behaviour.",
    selfTests: "Self-tests",
    passing: "passing — open console for details",
    pass: "PASS",
    fail: "FAIL",
    txt: "TXT",
    addPhoto: "Add Photo",
    updateCheck: "Update check",
    zip: "Report Download",
    addItem: "Add Item",
    enterItemName: "Enter item name:"
  },
  DE: {
    vehicleCheckReport: "Fahrzeugprüfbericht",
    date: "Datum",
    vehicle: "Fahrzeug",
    odometer: "Kilometerstand",
    items: "Positionen",
    issues: "Mängel",
    serviceAlerts: "Service / Dashboard-Warnungen",
    generalNotes: "Allgemeine Hinweise",
    findings: "Feststellungen",
    tipPDF: "Tipp: Öffnen Sie diese Prüfung in der App und nutzen Sie Vorschau → Drucken/PDF speichern.",
    manageVehicles: "Fahrzeuge verwalten",
    storedIn: "Gespeichert in",
    addVehicle: "Fahrzeug hinzufügen",
    back: "Zurück",
    close: "Schließen",
    yourVehicles: "Ihre Fahrzeuge",
    noVehiclesAdd: "Noch keine Fahrzeuge. Klicken Sie auf „Fahrzeug hinzufügen“.",
    setActive: "Aktiv setzen",
    active: "Aktiv",
    edit: "Bearbeiten",
    delete: "Löschen",
    howItWorks: "Wie es funktioniert",
    profilesInfo: "Fahrzeugprofile werden in Ihrem Browser auf diesem Gerät gespeichert. Sie können sie jederzeit bearbeiten und das aktive Fahrzeug für die nächsten Prüfungen auswählen.",
    tipLabels: "Tipp: Kennzeichen + Marke/Modell ausfüllen, damit die Bezeichnungen in Verlauf und Berichten sauber bleiben.",
    editVehicle: "Fahrzeug bearbeiten",
    plate: "Kennzeichen",
    fuelType: "Kraftstoffart",
    make: "Marke",
    model: "Modell",
    tuvUntil: "TÜV gültig bis",
    serviceDue: "Service fällig",
    year: "Baujahr",
    vin: "FIN (optional)",
    notesOpt: "Notizen (optional)",
    cancel: "Abbrechen",
    save: "Speichern",
    enterPlateOrModel: "Bitte geben Sie mindestens ein Kennzeichen oder Marke/Modell ein.",
    generated: "Erstellt",
    preparedBy: "Erstellt von",
    summary: "Zusammenfassung",
    done: "Erledigt",
    signature: "Unterschrift",
    approvedBy: "Genehmigt von",
    storageKey: "Speicherschlüssel",
    dataSync: "DATEN / SYNC",
    systemData: "Systemdaten",
    exportBackup: "Backup exportieren",
    importData: "Daten importieren",
    upload: "HOCHLADEN",
    secureStorage: "Sicherer lokaler Speicher. Exportieren Sie regelmäßig, um Datenverlust zu vermeiden.",
    vehicleProfile: "Fahrzeugprofil",
    activeVehicle: "Aktives Fahrzeug",
    noVehiclesYet: "Noch keine Fahrzeuge",
    status: "Status",
    total: "gesamt",
    module: "Modul",
    newCheck: "Neue Fahrzeugprüfung",
    reset: "Zurücksetzen",
    preview: "Vorschau",
    saveCheck: "Prüfung speichern",
    savedChecks: "Gespeicherte Prüfungen",
    historyInfo: "Ihr Verlauf (lokal auf diesem Gerät gespeichert).",
    noSavedChecks: "Noch keine gespeicherten Prüfungen.",
    actions: "Aktionen",
    view: "Ansehen",
    returnHub: "Zurück zum ToolStack Hub",
    printPreview: "DRUCKVORSCHAU",
    printSavePdf: "Drucken / PDF speichern",
    savedCheck: "Gespeicherte Prüfung",
    export: "Exportieren",
    copy: "Kopieren",
    send: "Senden",
    tuvExpiry: "TÜV-Ablauf",
    helpGuide: "Anleitung",
    quickStart: "Schnellstart",
    dataPrivacy: "Datenschutz",
    backupRestore: "Backup & Wiederherstellung",
    interfaceGlossary: "Oberflächen-Glossar",
    dataSafety: "Datensicherheit",
    systemInfo: "Systeminfo",
    closeGuide: "Anleitung schließen",
    ok: "OK",
    note: "Hinweis",
    notes: "Hinweise",
    issue: "Mangel",
    exportPack: "Export-Paket",
    exportInfo: "Daten speichern, teilen oder sichern.",
    pdfPrint: "PDF & Drucken",
    downloadPdf: "PDF herunterladen",
    createEmailDraft: "E-Mail-Entwurf erstellen",
    jsonBackup: "JSON-Backup",
    downloadJson: "JSON herunterladen",
    importJson: "JSON importieren",
    importWarning: "Import ersetzt aktuelle App-Daten. Exportieren Sie zuerst, wenn Sie unsicher sind.",
    egPlate: "z.B. M-AB 1234",
    egMake: "z.B. BMW",
    egModel: "z.B. 530i",
    egYear: "z.B. 2023",
    vinPlaceholder: "Fahrzeug-Identifizierungsnummer",
    notesPlaceholder: "Alles Nützliche (Reifengröße, Besonderheiten usw.)",
    describeIssue: "Problem beschreiben",
    addNote: "Notiz hinzufügen",
    serviceAlertsPlaceholder: "z.B. Service fällig in 1500km, Ölwechsel erforderlich...",
    generalNotesPlaceholder: "Alles Wichtige zum Fahrzeug heute",
    odometerPlaceholder: "z.B. 123456",
    aboutTitle: "1) Über Vehicle CheckIt",
    aboutText: "Vehicle CheckIt ist ein lokales Tool zur Fahrzeuginspektion und Zustandsverfolgung, das Ihnen hilft, Fahrzeugdetails, Inspektionsnotizen und den Zustandsstatus aufzuzeichnen und dann saubere, druckfertige Berichte zu erstellen. Es funktioniert vollständig in Ihrem Browser ohne Konten, Cloud-Speicher und automatische Datenweitergabe.",
    howWorksTitle: "2) Wie Vehicle CheckIt funktioniert",
    howWorksText: "Vehicle CheckIt folgt einem einfachen Arbeitsablauf:",
    step1: "1. Fahrzeugdetails hinzufügen",
    step1Desc: "Geben Sie wichtige Fahrzeuginformationen ein (Name, Kennzeichen, Kennung usw.).",
    step2: "2. Inspektionspunkte aufzeichnen",
    step2Desc: "Protokollieren Sie Inspektionsprüfungen, Notizen und den Zustandsstatus.",
    step3: "3. Zustandsübersicht überprüfen",
    step3Desc: "Aktualisieren und überprüfen Sie die Gesamtzustandszusammenfassung des Fahrzeugs.",
    step4: "4. Vorschau & Drucken",
    step4Desc: "Erstellen Sie einen sauberen Inspektionsbericht mit der Vorschau.",
    step5: "5. Backup exportieren",
    step5Desc: "Exportieren Sie regelmäßig ein JSON-Backup, insbesondere nach größeren Aktualisierungen.",
    dataPrivacyTitle: "3) Ihre Daten & Datenschutz",
    dataPrivacyText: "Ihre Daten werden lokal in diesem Browser unter Verwendung von sicherem lokalem Speicher gespeichert.",
    dataPrivacyList1: "Ihre Daten bleiben auf diesem Gerät",
    dataPrivacyList2: "Das Löschen von Browserdaten kann Inspektionsdatensätze entfernen",
    dataPrivacyList3: "Inkognito-/Privatmodus speichert keine Daten",
    dataPrivacyList4: "Daten werden nicht automatisch über Geräte hinweg synchronisiert",
    backupRestoreTitle: "4) Backup & Wiederherstellung",
    exportDesc: "Export lädt ein JSON-Backup Ihrer aktuellen Vehicle CheckIt-Daten herunter.",
    importDesc: "Import stellt eine zuvor exportierte JSON-Datei wieder her und ersetzt aktuelle App-Daten.",
    recommendedRoutine: "Empfohlene Routine:",
    routine1: "Wöchentlich exportieren",
    routine2: "Nach größeren Bearbeitungen exportieren",
    routine3: "Backups an zwei Orten speichern (z.B. Downloads + Laufwerk/USB)",
    buttonsExplainedTitle: "5) Erklärte Schaltflächen",
    previewDesc: "Öffnet den druckfertigen Inspektionsbericht.",
    printSavePdfDesc: "Druckt nur das Vorschaublatt. Wählen Sie „Als PDF speichern“, um eine Datei zu erstellen.",
    exportBackupDesc: "Lädt eine JSON-Backup-Datei herunter.",
    importBackupDesc: "Stellt Daten aus einer JSON-Backup-Datei wieder her.",
    storageKeysTitle: "6) Speicherschlüssel (Erweitert)",
    appDataKey: "App-Datenschlüssel",
    sharedProfileKey: "Geteilter Profilschlüssel",
    notesLimitationsTitle: "7) Hinweise / Einschränkungen",
    notesLimitationsText1: "Vehicle CheckIt ist ein Inspektionsprotokollierungstool. Berichte hängen von der Genauigkeit der eingegebenen Informationen ab.",
    notesLimitationsText2: "Verwenden Sie Export regelmäßig, um Datenverlust zu vermeiden.",
    supportFeedbackTitle: "8) Support / Feedback",
    supportFeedbackText: "Wenn etwas kaputt geht, geben Sie an: Gerät + Browser + Schritte zum Reproduzieren + erwartetes vs. tatsächliches Verhalten.",
    selfTests: "Selbsttests",
    passing: "bestanden — Konsole für Details öffnen",
    pass: "BESTANDEN",
    fail: "FEHLGESCHLAGEN",
    txt: "TXT",
    addPhoto: "Foto hinzufügen",
    updateCheck: "Prüfung aktualisieren",
    zip: "Bericht herunterladen",
    addItem: "Position hinzufügen",
    enterItemName: "Positionsname eingeben:"
  }
};

function badgeFor(sev) {
  if (sev === "issue") return "bg-red-100 text-red-800 border-red-200";
  if (sev === "note") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-emerald-100 text-emerald-800 border-emerald-200";
}

function labelFor(sev, lang = "EN") {
  const dict = T[lang] || T.EN;
  if (sev === "issue") return dict.issue || "Issue";
  if (sev === "note") return dict.note || "Note";
  return dict.ok || "OK";
}

function isTestsMode() {
  try {
    return (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("tests") === "1"
    );
  } catch {
    return false;
  }
}

function isHubPlaceholder() {
  return !HUB_URL || HUB_URL.includes("YOUR-WIX-HUB-URL-HERE");
}

function buildCheckSummaryText(check, lang = "EN") {
  const c = check || {};
  const dict = T[lang] || T.EN;

  const lines = [];
  lines.push(dict.vehicleCheckReport);
  lines.push("-------------------");
  lines.push(`${dict.date}: ${c.date || "-"}`);
  lines.push(`${dict.vehicle}: ${c.vehicleLabel || c.vehicleId || "-"}`);
  lines.push(`${dict.odometer}: ${c.odometer || "-"}`);
  lines.push(
    `${dict.items}: ${(c.summary?.doneCount ?? 0)}/${(c.summary?.totalItems ?? 0)}`
  );
  lines.push(`${dict.issues}: ${(c.summary?.issueCount ?? 0)}`);

  if (c.serviceNotes) {
    lines.push("");
    lines.push(`${dict.serviceAlerts}:`);
    lines.push(String(c.serviceNotes));
  }

  if (c.generalNotes) {
    lines.push("");
    lines.push(`${dict.generalNotes}:`);
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
    lines.push(`${dict.findings}:`);
    for (const f of findings.slice(0, 80)) lines.push(f);
    if (findings.length > 80)
      lines.push(`…and ${findings.length - 80} more`);
  }

  lines.push("");
  lines.push(dict.tipPDF);

  return lines.join("\n");
}

function buildCheckEmail(check, lang = "EN") {
  const c = check || {};
  const subject = `${(T[lang] || T.EN).vehicleCheckReport} — ${c.date || isoToday()} — ${
    c.vehicleLabel || c.vehicleId || ""
  }`.trim();
  const body = buildCheckSummaryText(c, lang);
  return { subject, body };
}

function copyTextToClipboard(text) {
  const t = String(text ?? "");
  if (!t) return Promise.resolve(false);

  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    navigator.clipboard.writeText
  ) {
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

function parseImportPayload(text) {
  const parsed = JSON.parse(String(text || ""));
  if (parsed?.data?.checks && Array.isArray(parsed.data.checks)) {
    return {
      kind: "full",
      profile: parsed?.profile || null,
      data: parsed.data,
    };
  }
  if (parsed?.check && typeof parsed.check === "object") {
    return {
      kind: "check",
      profile: parsed?.profile || null,
      check: parsed.check,
    };
  }
  throw new Error("Invalid import file");
}

function runSelfTests() {
  const results = [];
  const assert = (name, cond) => {
    results.push({ name, pass: !!cond });
  };

  assert(
    "safeParse returns fallback on invalid JSON",
    safeParse("{bad}", 123) === 123
  );
  assert("safeParse parses valid JSON", safeParse('{"a":1}', null)?.a === 1);

  const id1 = normalizeVehicleId(" M-AB 1234 ");
  assert(
    "normalizeVehicleId produces non-empty",
    typeof id1 === "string" && id1.length > 0
  );
  assert(
    "normalizeVehicleId strips spaces/symbols",
    id1.includes(" ") === false
  );
  const id2 = normalizeVehicleId("");
  assert(
    "normalizeVehicleId falls back when empty",
    typeof id2 === "string" && id2.length > 0
  );

  assert(
    "formatVehicleLabel uses plate + make/model",
    formatVehicleLabel({ plate: "M-AB 1", make: "BMW", model: "530i" }).includes(
      "M-AB 1"
    )
  );
  assert(
    "formatVehicleLabel falls back to label",
    formatVehicleLabel({ label: "TestCar" }).includes("TestCar")
  );
  assert(
    "formatVehicleLabel handles plate only",
    formatVehicleLabel({ plate: "M-AB 9" }).includes("M-AB 9")
  );

  assert("labelFor(issue) is Issue", labelFor("issue") === "Issue");
  assert("badgeFor(note) contains amber", badgeFor("note").includes("amber"));

  const bv = blankVehicle();
  assert(
    "blankVehicle has fuelType",
    typeof bv.fuelType === "string" && bv.fuelType.length > 0
  );

  const dt = defaultTemplate();
  assert(
    "defaultTemplate has no Post-trip section",
    !dt.sections.some((s) => s.title === "Post-trip")
  );

  const vs = dt.sections.find((s) => s.title === "Vehicle status");
  assert(
    "defaultTemplate Vehicle status includes Oil level",
    vs?.items?.some((it) =>
      String(it.label || "")
        .toLowerCase()
        .includes("oil level")
    ) === true
  );
  assert(
    "defaultTemplate Vehicle status includes Coolant level",
    vs?.items?.some((it) =>
      String(it.label || "").toLowerCase().includes("coolant")
    ) === true
  );

  const interior = dt.sections.find((s) => s.title === "Interior");
  const interiorLabels = (interior?.items || []).map((it) =>
    String(it.label || "").toLowerCase()
  );
  assert(
    "defaultTemplate Interior includes cabin damage",
    interiorLabels.some((l) => l.includes("cabin damage")) === true
  );
  assert(
    "defaultTemplate Interior does not include fuel card",
    interiorLabels.some((l) => l.includes("fuel card")) === false
  );
  assert(
    "defaultTemplate Interior does not include toll card",
    interiorLabels.some((l) => l.includes("toll")) === false
  );

  const safety = dt.sections.find((s) => s.title === "Safety");
  const safetyLabels = (safety?.items || []).map((it) =>
    String(it.label || "").toLowerCase()
  );
  assert("defaultTemplate has Safety section", !!safety);
  assert(
    "defaultTemplate Safety includes Spare tyre / Puncture Kit",
    safetyLabels.some((l) => l.includes("puncture")) === true
  );
  assert(
    "defaultTemplate Safety includes Jack & tools",
    safetyLabels.some((l) => l.includes("jack") && l.includes("tools")) === true
  );
  assert(
    "defaultTemplate Safety does not include spare bulb kit",
    safetyLabels.some((l) => l.includes("bulb")) === false
  );

  const sample = {
    date: "2026-01-07",
    vehicleLabel: "M-AB 1 • BMW 530i",
    odometer: "123",
    summary: { doneCount: 1, totalItems: 2, issueCount: 1 },
    generalNotes: "Hello",
    sections: [
      {
        title: "Exterior",
        items: [{ label: "Tyres", severity: "issue", note: "Low pressure" }],
      },
      { title: "Interior", items: [{ label: "Cabin", severity: "ok", note: "" }] },
    ],
  };
  const txt = buildCheckSummaryText(sample);
  assert("summary text contains newlines", txt.includes("\n"));
  assert("summary text includes Findings header", txt.includes("Findings:"));
  const email = buildCheckEmail(sample);
  assert("email subject includes date", email.subject.includes("2026-01-07"));

  assert("copyTextToClipboard is a function", typeof copyTextToClipboard === "function");

  const fullPayload = JSON.stringify({ profile: { user: "x" }, data: { checks: [] } });
  const k1 = parseImportPayload(fullPayload);
  assert("parseImportPayload full kind", k1.kind === "full");

  const onePayload = JSON.stringify({ profile: { user: "x" }, check: { id: "c1" } });
  const k2 = parseImportPayload(onePayload);
  assert("parseImportPayload check kind", k2.kind === "check");

  return results;
}

function defaultTemplate() {
  const sid = () => uid("s");
  const iid = () => uid("i");

  return {
    rev: TEMPLATE_REV,
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
          { id: iid(), label: "Cabin damage", severity: "ok" },
          { id: iid(), label: "Documents present (registration/insurance)", severity: "ok" },
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
          { id: iid(), label: "Spare tyre / Puncture Kit", severity: "ok" },
          { id: iid(), label: "Jack & tools", severity: "ok" },
        ],
      },
      {
        id: sid(),
        title: "Vehicle status",
        items: [
          { id: iid(), label: "Oil level", severity: "ok" },
          { id: iid(), label: "Coolant level", severity: "ok" },
          { id: iid(), label: "No warning lights", severity: "ok" },
          { id: iid(), label: "Wipers / washer fluid", severity: "ok" },
          { id: iid(), label: "AdBlue level (if applicable)", severity: "ok" },
        ],
      },
    ],
  };
}

function loadProfile() {
  if (typeof window === "undefined") {
    return { org: "ToolStack", user: "", language: "EN", logo: "", vehicles: [] };
  }

  return (
    safeParse(localStorage.getItem(PROFILE_KEY), null) || {
      org: "ToolStack",
      user: "",
      language: "EN",
      logo: "",
      vehicles: [
        {
          id: "bmw-530i",
          plate: "",
          make: "BMW",
          model: "530i",
          fuelType: "95 Super",
          year: "",
          vin: "",
          tuvUntil: "",
          serviceDue: "",
          notes: "",
        },
        {
          id: "vito-119",
          plate: "",
          make: "Mercedes",
          model: "Vito 119",
          fuelType: "Diesel",
          year: "",
          vin: "",
          tuvUntil: "",
          serviceDue: "",
          notes: "",
        },
      ],
    }
  );
}

function loadState() {
  const base = {
    meta: { appId: APP_ID, version: APP_VERSION, updatedAt: new Date().toISOString() },
    template: defaultTemplate(),
    checks: [],
  };

  if (typeof window === "undefined") return base;

  const parsed = safeParse(localStorage.getItem(KEY), null);
  if (!parsed) return base;

  const incomingTemplateRev = parsed?.template?.rev;
  if (incomingTemplateRev !== TEMPLATE_REV) {
    return {
      ...base,
      meta: { ...(parsed.meta || base.meta), updatedAt: new Date().toISOString() },
      checks: Array.isArray(parsed.checks) ? parsed.checks : [],
      template: defaultTemplate(),
    };
  }

  return {
    ...base,
    ...parsed,
    meta: { ...(parsed.meta || base.meta), updatedAt: new Date().toISOString() },
    checks: Array.isArray(parsed.checks) ? parsed.checks : [],
  };
}

function saveState(state) {
  const next = { ...state, meta: { ...(state.meta || {}), updatedAt: new Date().toISOString() } };
  try {
    if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

const btnSecondary =
  "px-4 py-2 rounded-xl text-sm font-bold tracking-wide border transition shadow-sm active:translate-y-[1px] flex items-center justify-center " +
  "bg-neutral-900 text-[#D5FF00] border-neutral-800 hover:bg-neutral-800 hover:border-[#D5FF00]/50 " +
  "disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#D5FF00]/50 z-10 relative";

const btnDanger =
  "px-4 py-2 rounded-xl text-sm font-bold tracking-wide border transition shadow-sm active:translate-y-[1px] flex items-center justify-center " +
  "bg-neutral-900 text-red-500 border-neutral-800 hover:bg-neutral-800 hover:border-red-500/50 " +
  "disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500/50 z-10 relative";

const btnMini =
  "px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide border transition shadow-sm active:translate-y-[1px] flex items-center justify-center " +
  "bg-neutral-900 text-[#D5FF00] border-neutral-800 hover:bg-neutral-800 hover:border-[#D5FF00]/50 " +
  "disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#D5FF00]/50 z-10 relative";

const btnMiniDanger =
  "px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide border transition shadow-sm active:translate-y-[1px] flex items-center justify-center " +
  "bg-neutral-900 text-red-500 border-neutral-800 hover:bg-neutral-800 hover:border-red-500/50 " +
  "disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500/50 z-10 relative";

const inputBase =
  "w-full mt-1 px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#D5FF00]/30 focus:border-neutral-300";

const card = "rounded-2xl bg-white border border-neutral-200 shadow-sm";
const cardHead = "px-4 py-3 border-b border-neutral-100";
const cardPad = "p-4";

function Pill({ children, tone = "default" }) {
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
  "print:hidden h-10 w-32 rounded-xl text-sm font-bold tracking-wide border transition shadow-sm active:translate-y-[1px] " +
  "disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center " +
  "focus:outline-none focus:ring-2 focus:ring-[#D5FF00]/50 z-10 relative";

function ActionButton({ children, onClick, tone = "default", disabled, title }) {
  const cls =
    tone === "danger"
      ? "bg-neutral-900 text-red-500 border-neutral-800 hover:bg-neutral-800 hover:border-red-500/50"
      : "bg-neutral-900 text-[#D5FF00] border-neutral-800 hover:bg-neutral-800 hover:border-[#D5FF00]/50";

  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} className={`${ACTION_BASE} ${cls}`}>
      {children}
    </button>
  );
}

function ActionFileButton({ children, onFile, accept = "application/json", tone = "default", title }) {
  const cls =
    tone === "danger"
      ? "bg-neutral-900 text-red-500 border-neutral-800 hover:bg-neutral-800 hover:border-red-500/50"
      : "bg-neutral-900 text-[#D5FF00] border-neutral-800 hover:bg-neutral-800 hover:border-[#D5FF00]/50";

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

function HelpIconButton({ onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={
        "print:hidden h-10 w-10 shrink-0 rounded-xl border transition shadow-sm active:translate-y-[1px] flex items-center justify-center " +
        "bg-neutral-900 text-[#D5FF00] border-neutral-800 hover:bg-neutral-800 hover:border-[#D5FF00]/50 " +
        "focus:outline-none focus:ring-2 focus:ring-[#D5FF00]/50 z-10 relative"
      }
    >
      <span className="text-lg font-bold">?</span>
    </button>
  );
}

function HelpModal({ open, onClose, appName = "ToolStack App", storageKey = "(unknown)", actions = [], t }) {
  if (!open) return null;

  const Section = ({ title, children }) => (
    <section className="space-y-3">
      <h3 className="text-xs font-black text-[#D5FF00] uppercase tracking-widest">{title}</h3>
      <div className="text-sm text-neutral-400 leading-relaxed space-y-2">{children}</div>
    </section>
  );

  const Bullet = ({ children }) => <li className="ml-4 list-disc marker:text-[#D5FF00] pl-1">{children}</li>;

  const ActionRow = ({ name, desc }) => (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-neutral-800 last:border-b-0">
      <div className="text-sm font-bold text-neutral-200">{name}</div>
      <div className="text-sm text-neutral-500 text-right">{desc}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 pointer-events-none">
        <div className="w-full max-w-2xl flex flex-col max-h-full rounded-2xl border border-neutral-800 bg-neutral-900 shadow-[0_0_50px_-10px_rgba(213,255,0,0.15)] overflow-hidden pointer-events-auto">
          <div className="p-5 border-b border-neutral-800 flex items-start justify-between gap-4 shrink-0 bg-neutral-900/50">
            <div>
              <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">ToolStack • Help Pack v1</div>
              <h2 className="text-xl font-black text-white tracking-tight">{appName} <span className="text-neutral-600 font-normal">— {t("helpGuide")}</span></h2>
            </div>

            <button
              type="button"
              className="print:hidden h-8 w-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-white hover:bg-neutral-800 transition"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <div className="p-6 space-y-8 overflow-y-auto min-h-0 custom-scrollbar">
            <Section title={t("aboutTitle")}>
              <p>{t("aboutText")}</p>
            </Section>
            <Section title={t("howWorksTitle")}>
              <p>{t("howWorksText")}</p>
              <ul className="space-y-2 mt-2">
                <Bullet><b>{t("step1")}</b><br />{t("step1Desc")}</Bullet>
                <Bullet><b>{t("step2")}</b><br />{t("step2Desc")}</Bullet>
                <Bullet><b>{t("step3")}</b><br />{t("step3Desc")}</Bullet>
                <Bullet><b>{t("step4")}</b><br />{t("step4Desc")}</Bullet>
                <Bullet><b>{t("step5")}</b><br />{t("step5Desc")}</Bullet>
              </ul>
            </Section>

            <Section title={t("dataPrivacyTitle")}>
              <p>{t("dataPrivacyText")}</p>
              <p className="mt-2">This means:</p>
              <ul className="space-y-1 mt-1">
                <Bullet>{t("dataPrivacyList1")}</Bullet>
                <Bullet>{t("dataPrivacyList2")}</Bullet>
                <Bullet>{t("dataPrivacyList3")}</Bullet>
                <Bullet>{t("dataPrivacyList4")}</Bullet>
              </ul>
            </Section>

            <Section title={t("backupRestoreTitle")}>
              <p>{t("exportDesc")}</p>
              <p>{t("importDesc")}</p>
              <p className="mt-2 text-xs text-neutral-500 uppercase tracking-widest font-bold">{t("recommendedRoutine")}</p>
              <ul className="space-y-1 mt-1">
                <Bullet>{t("routine1")}</Bullet>
                <Bullet>{t("routine2")}</Bullet>
                <Bullet>{t("routine3")}</Bullet>
              </ul>
            </Section>

            <Section title={t("buttonsExplainedTitle")}>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-4">
                <ActionRow name={t("preview")} desc={t("previewDesc")} />
                <ActionRow name={t("printSavePdf")} desc={t("printSavePdfDesc")} />
                <ActionRow name={t("export")} desc={t("exportBackupDesc")} />
                <ActionRow name={t("importData")} desc={t("importBackupDesc")} />
              </div>
            </Section>

            <Section title={t("storageKeysTitle")}>
              <div className="text-xs text-neutral-600 font-mono bg-neutral-950 p-2 rounded border border-neutral-800">
                {t("appDataKey")}: {storageKey}<br />
                {t("sharedProfileKey")}: {PROFILE_KEY}<br />
                (If additional keys exist, list them below without removing anything.)
              </div>
            </Section>

            <Section title={t("notesLimitationsTitle")}>
              <p>{t("notesLimitationsText1")}</p>
              <p className="mt-1">{t("notesLimitationsText2")}</p>
            </Section>
            <Section title={t("supportFeedbackTitle")}>
              <p>{t("supportFeedbackText")}</p>
            </Section>
          </div>

          <div className="p-4 border-t border-neutral-800 bg-neutral-900/50 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              className="print:hidden px-4 py-2 rounded-xl text-sm font-bold tracking-wide border border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white transition focus:outline-none focus:ring-2 focus:ring-[#D5FF00]/30"
              onClick={onClose}
            >
              {t("closeGuide")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const Field = ({ label, children }) => (
  <label className="block text-sm">
    <div className="text-neutral-700 font-medium">{label}</div>
    {children}
  </label>
);

function VehicleProfilesModal({
  open,
  onClose,
  vehicles,
  activeVehicleId,
  onSelectActive,
  onStartAdd,
  onStartEdit,
  onDelete,
  mode,
  draft,
  setDraft,
  onSave,
  onCancelEdit,
  t,
}) {
  // Keep a local copy of the draft inside the modal so parent re-renders
  // don't reset the controlled inputs while typing.
  const [localDraft, setLocalDraft] = useState(draft);
  React.useEffect(() => {
    if (open) setLocalDraft(draft);
    // reset local draft when modal opens or when draft prop changes
  }, [open, mode, draft]);

  const isEditing = mode === "add" || mode === "edit";
  const requiredOk =
    String(localDraft?.plate || "").trim() ||
    String(localDraft?.make || "").trim() ||
    String(localDraft?.model || "").trim();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 pointer-events-none">
        <div className="w-full max-w-5xl flex flex-col max-h-full rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden pointer-events-auto">
          <div className="p-4 border-b border-neutral-100 flex flex-wrap items-start justify-between gap-4 shrink-0">
            <div>
              <div className="text-sm text-neutral-500">{t("vehicleProfile")} • stored locally</div>
              <h2 className="text-lg font-semibold text-neutral-900">{t("manageVehicles")}</h2>
              <div className="mt-3 h-[2px] w-56 rounded-full bg-gradient-to-r from-[#D5FF00]/0 via-[#D5FF00] to-[#D5FF00]/0" />
              <div className="mt-2 text-xs text-neutral-500">
                {t("storedIn")} <span className="font-mono">{PROFILE_KEY}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button className={btnSecondary} onClick={onStartAdd}>
                  {t("addVehicle")}
                </button>
              ) : (
                <button className={btnSecondary} onClick={onCancelEdit}>
                  {t("back")}
                </button>
              )}
              <button className={btnSecondary} onClick={onClose}>
                {t("close")}
              </button>
            </div>
          </div>

          <div className="p-4 overflow-y-auto min-h-0">
            {!isEditing ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <div className="text-sm font-semibold text-neutral-800">{t("yourVehicles")}</div>
                  {vehicles.length === 0 ? (
                    <div className="mt-2 text-sm text-neutral-600">{t("noVehiclesAdd")}</div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {vehicles.map((v) => (
                        <div key={v.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-neutral-800 truncate">{formatVehicleLabel(v)}</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {v.fuelType ? <Pill tone="accent">{v.fuelType}</Pill> : null}
                                {v.tuvUntil ? <Pill>TÜV: {v.tuvUntil}</Pill> : null}
                                {v.serviceDue ? <Pill>Service: {v.serviceDue}</Pill> : null}
                                {v.id === activeVehicleId ? <Pill tone="accent">{t("active")}</Pill> : null}
                              </div>
                              {v.notes ? <div className="mt-2 text-xs text-neutral-600 whitespace-pre-wrap">{v.notes}</div> : null}
                              <div className="mt-2 text-[11px] text-neutral-500 font-mono truncate">{v.id}</div>
                            </div>

                            <div className="shrink-0 flex flex-col gap-2">
                              {v.id !== activeVehicleId ? (
                                <button className={btnSecondary} onClick={() => onSelectActive(v.id)}>
                                  {t("setActive")}
                                </button>
                              ) : null}
                              <button className={btnSecondary} onClick={() => onStartEdit(v)}>
                                {t("edit")}
                              </button>
                              <button className={btnDanger} onClick={() => onDelete(v.id)}>
                                {t("delete")}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-sm font-semibold text-neutral-800">{t("howItWorks")}</div>
                  <div className="mt-2 text-sm text-neutral-700 space-y-2">
                    <p>
                      {t("profilesInfo")}
                    </p>
                    <p>{t("tipLabels")}</p>
                  </div>
                </div>
              </div>
            ) : open && localDraft ? (
                <div className="max-w-3xl">
                  <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                    <div className="text-sm font-semibold text-neutral-800">{mode === "add" ? t("addVehicle") : t("editVehicle")}</div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label={t("plate")}>
                      <input
                        className={inputBase}
                        placeholder={t("egPlate")}
                        value={localDraft.plate}
                        onChange={(e) => setLocalDraft((d) => ({ ...d, plate: e.target.value }))}
                      />
                    </Field>

                    <Field label={t("fuelType")}>
                      <select
                        className={inputBase}
                        value={localDraft.fuelType}
                        onChange={(e) => setLocalDraft((d) => ({ ...d, fuelType: e.target.value }))}
                      >
                        {FUEL_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label={t("make")}>
                      <input
                        className={inputBase}
                        placeholder={t("egMake")}
                        value={localDraft.make}
                        onChange={(e) => setLocalDraft((d) => ({ ...d, make: e.target.value }))}
                      />
                    </Field>

                    <Field label={t("model")}>
                      <input
                        className={inputBase}
                        placeholder={t("egModel")}
                        value={localDraft.model}
                        onChange={(e) => setLocalDraft((d) => ({ ...d, model: e.target.value }))}
                      />
                    </Field>

                    <Field label={t("tuvUntil")}>
                      <input type="date" className={inputBase} value={localDraft.tuvUntil} onChange={(e) => setLocalDraft((d) => ({ ...d, tuvUntil: e.target.value }))} />
                    </Field>

                    <Field label={t("serviceDue")}>
                      <input type="date" className={inputBase} value={localDraft.serviceDue} onChange={(e) => setLocalDraft((d) => ({ ...d, serviceDue: e.target.value }))} />
                    </Field>

                    <Field label={t("year")}>
                      <input className={inputBase} placeholder={t("egYear")} value={localDraft.year} onChange={(e) => setLocalDraft((d) => ({ ...d, year: e.target.value }))} />
                    </Field>

                    <Field label={t("vin")}>
                      <input
                        className={inputBase}
                        placeholder={t("vinPlaceholder")}
                        value={localDraft.vin}
                        onChange={(e) => setLocalDraft((d) => ({ ...d, vin: e.target.value }))}
                      />
                    </Field>
                  </div>

                  <Field label={t("notesOpt")}>
                    <textarea
                      className={inputBase + " min-h-[100px]"}
                      placeholder={t("notesPlaceholder")}
                      value={localDraft.notes}
                      onChange={(e) => setLocalDraft((d) => ({ ...d, notes: e.target.value }))}
                    />
                  </Field>

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button className={btnSecondary} onClick={onCancelEdit}>
                      {t("cancel")}
                    </button>
                    <button className={btnSecondary} disabled={!requiredOk} onClick={() => onSave(localDraft)}>
                      {t("save")}
                    </button>
                  </div>

                  {!requiredOk ? <div className="mt-3 text-xs text-neutral-600">{t("enterPlateOrModel")}</div> : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotoThumbnail({ photo, className, onClick }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let active = true;
    let url = null;
    if (photo.storageKey) {
      getPhotoBlob(photo.storageKey)
        .then((blob) => {
          if (active && blob) {
            url = URL.createObjectURL(blob);
            setSrc(url);
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [photo.storageKey]);

  if (!src) return null;
  return (
    <img
      src={src}
      alt="Check"
      className={className + (onClick ? " cursor-pointer hover:opacity-90 transition" : "")}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(photo); } : undefined}
    />
  );
}

function PhotoViewModal({ photo, onClose, t }) {
  if (!photo) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:hidden" onClick={onClose}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
      <div className="relative z-10 max-w-full max-h-full flex flex-col items-center">
        <PhotoThumbnail photo={photo} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
        <button
          className="mt-4 px-6 py-2 bg-neutral-800 text-white rounded-full font-bold hover:bg-neutral-700 transition border border-neutral-700"
          onClick={onClose}
        >{t("close")}</button>
      </div>
    </div>
  );
}

function ReportSheet({ profile, date, vehicleLabel, odometer, generalNotes, serviceNotes, draft, totals, storageKey, t, onViewPhoto }) {
  const sections = draft?.sections || [];
  return (
    <div className="mx-auto max-w-4xl print:max-w-none print:w-full">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6 print:flex-row">
        <img
          src={vehicleCheckItHeading}
          alt="Vehicle CheckIt"
          className="h-auto max-h-20 sm:max-h-28 max-w-full object-contain print:h-28 print:max-h-none"
        />
        <div className="text-sm text-neutral-600 mt-2 sm:mt-0 print:mt-2 text-left sm:text-right print:text-right">
          {t("generated")}: {new Date().toLocaleString()}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 print:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 p-4">
          <div className="text-sm text-neutral-600">{t("preparedBy")}</div>
          <div className="text-lg font-semibold text-neutral-900 mt-1">{profile.user || "—"}</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 p-4">
          <div className="text-sm text-neutral-600">{t("vehicle")}</div>
          <div className="text-sm text-neutral-900 mt-1">{vehicleLabel || "—"}</div>
          <div className="text-xs text-neutral-600 mt-1">{t("date")}: {date || "—"}</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 p-4">
          <div className="text-sm text-neutral-600">{t("summary")}</div>
          <div className="text-sm text-neutral-900 mt-1">
            {t("done")}: <span className="font-semibold">{totals.doneCount}</span>/{totals.totalItems} • {t("issues")}:{" "}
            <span className="font-semibold">{totals.issueCount}</span>
          </div>
          <div className="text-xs text-neutral-600 mt-1">{t("odometer")}: {odometer || "—"}</div>
        </div>
      </div>

      {serviceNotes ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
          <div className="font-semibold text-amber-900">{t("serviceAlerts")}</div>
          <div className="mt-1 text-amber-800 whitespace-pre-wrap">{serviceNotes}</div>
        </div>
      ) : null}

      {generalNotes ? (
        <div className="mt-4 rounded-2xl border border-neutral-200 p-4 text-sm">
          <div className="font-semibold text-neutral-900">{t("generalNotes")}</div>
          <div className="mt-1 text-neutral-700 whitespace-pre-wrap">{generalNotes}</div>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 print:grid-cols-2">
        {sections.map((s) => (
          <div key={s.id} className="rounded-2xl border border-neutral-200 p-3 print:break-inside-avoid">
            <div className="font-semibold">{s.title}</div>
            <div className="mt-2 space-y-2">
              {(s.items || []).map((it) => (
                <div key={it.id} className="text-sm border-t pt-2 first:border-t-0 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className={it.done ? "line-through text-neutral-500" : ""}>{it.label}</div>
                      {it.note ? <div className="text-neutral-600 whitespace-pre-wrap break-words">{it.note}</div> : null}
                    </div>
                    <span className={"shrink-0 text-xs px-2 py-1 rounded-full border " + badgeFor(it.severity)}>
                      {labelFor(it.severity, profile.language)}
                    </span>
                  </div>
                  {it.photos && it.photos.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {it.photos.map((p) => (
                        <PhotoThumbnail
                          key={p.id}
                          photo={p}
                          className="h-20 w-auto object-contain rounded border border-neutral-200"
                          onClick={onViewPhoto}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <div className="text-neutral-600">{t("preparedBy")}</div>
          <div className="mt-8 border-t pt-2">{t("signature")}</div>
        </div>
        <div>
          <div className="text-neutral-600">{t("approvedBy")}</div>
          <div className="mt-8 border-t pt-2">{t("signature")}</div>
        </div>
      </div>

      <div className="mt-6 text-xs text-neutral-500">
        {t("storageKey")}: <span className="font-mono">{storageKey}</span>
      </div>
    </div>
  );
}

function TestsPanel({ t }) {
  if (!isTestsMode()) return null;
  const results = runSelfTests();
  const passCount = results.filter((r) => r.pass).length;

  try {
    console.table(results);
  } catch {
    // ignore
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-neutral-800">{t("selfTests")}</div>
          <div className="text-xs text-neutral-600">
            {passCount}/{results.length} {t("passing")}
          </div>
        </div>
        <Pill tone={passCount === results.length ? "accent" : "danger"}>{passCount === results.length ? t("pass") : t("fail")}</Pill>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        {results.map((r) => (
          <div key={r.name} className="rounded-xl border border-neutral-200 px-3 py-2 bg-neutral-50">
            <span className={r.pass ? "text-neutral-800" : "text-red-700"}>{r.pass ? "✓" : "✗"} </span>
            <span className={r.pass ? "text-neutral-800" : "text-red-700"}>{r.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const ItemCard = React.memo(function ItemCard({ sectionId, item, updateItem, deleteItem, t, lang, onAddPhoto, totalPhotos, isLocked, onViewPhoto }) {
  const [localNote, setLocalNote] = useState(item.note || "");

  const itemPhotoCount = item.photos?.length || 0;
  const canAddPhoto = !isLocked && itemPhotoCount < 3 && (totalPhotos || 0) < 20;

  useEffect(() => {
    setLocalNote(item.note || "");
  }, [item.note, item.severity, item.id]);

  const onSeverityChange = (sev) => {
    if (sev === "ok") {
      setLocalNote("");
      updateItem(sectionId, item.id, { severity: "ok", note: "" });
      return;
    }
    updateItem(sectionId, item.id, { severity: sev });
  };

  return (
    <div className="rounded-2xl bg-white border border-neutral-200 p-3">
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-neutral-300 accent-[#D5FF00]"
            checked={!!item.done}
            onChange={(e) => updateItem(sectionId, item.id, { done: e.target.checked })}
          />
          <span className={item.done ? "line-through text-neutral-500" : "text-neutral-800"}>{item.label}</span>
        </label>

        <div className="flex items-center gap-2">
          <span className={"text-xs px-2 py-1 rounded-full border " + badgeFor(item.severity)}>{labelFor(item.severity, lang)}</span>
          <select
            className="text-sm px-2 py-1 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#D5FF00]/30 focus:border-neutral-300"
            value={item.severity}
            onChange={(e) => onSeverityChange(e.target.value)}
          >
            <option value="ok">{t("ok")}</option>
            <option value="note">{t("note")}</option>
            <option value="issue">{t("issue")}</option>
          </select>
          {deleteItem && !isLocked ? (
            <button
              type="button"
              className="ml-1 text-neutral-400 hover:text-red-500 transition px-1 font-bold"
              onClick={() => deleteItem(sectionId, item.id)}
              title={t("delete")}
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      {item.severity !== "ok" ? (
        <textarea
          className="mt-2 w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D5FF00]/30 focus:border-neutral-300 min-h-[70px]"
          placeholder={item.severity === "issue" ? t("describeIssue") : t("addNote")}
          value={localNote}
          onChange={(e) => setLocalNote(e.target.value)}
          onBlur={() => updateItem(sectionId, item.id, { note: localNote })}
        />
      ) : null}

      {item.done && (item.severity === "note" || item.severity === "issue") && onAddPhoto ? (
        <div className="mt-2">
          <label
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
              canAddPhoto
                ? "bg-neutral-50 border-neutral-200 text-neutral-700 cursor-pointer hover:bg-neutral-100"
                : "bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed"
            }`}
          >
            <span>
              📷 {t("addPhoto") || "Add Photo"} ({itemPhotoCount}/3)
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={!canAddPhoto}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onAddPhoto(item.id, file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      ) : null}

      {item.photos && item.photos.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.photos.map((p) => (
            <PhotoThumbnail
              key={p.id}
              photo={p}
              className="h-16 w-16 object-cover rounded-lg border border-neutral-200"
              onClick={onViewPhoto}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
});

function DataMenu({ onExport, onImport, onPrint, t }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEmailDraft = () => {
    const subject = encodeURIComponent(`Vehicle CheckIt Export Pack – ${new Date().toISOString().split("T")[0]}`);
    const body = encodeURIComponent(
      "Attached: PDF export from Vehicle CheckIt (please attach the downloaded PDF file).\n\n" +
      "Exports are generated locally on your device. No data is uploaded automatically."
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-10 w-32 rounded-xl text-sm font-bold tracking-wide border transition shadow-sm active:translate-y-[1px] flex items-center justify-center bg-neutral-900 text-[#D5FF00] border-neutral-800 hover:bg-neutral-800 hover:border-[#D5FF00]/50 focus:outline-none focus:ring-2 focus:ring-[#D5FF00]/50 z-10 relative"
      >
        {t("export")}
      </button>

      {open && (
        <>
          {/* Mobile overlay */}
          <div className="sm:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />
          <div
            className={
              "fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 p-2 rounded-2xl border border-neutral-800 bg-neutral-900/95 backdrop-blur-xl shadow-[0_0_30px_-10px_rgba(213,255,0,0.3)] animate-in fade-in zoom-in-95 duration-100 " +
              "sm:absolute sm:w-72 sm:right-0 sm:top-12 sm:inset-x-auto sm:translate-y-0 sm:origin-top-right"
            }
          >
            <div className="px-3 py-2 border-b border-neutral-800 mb-1 flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{t("exportPack")}</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">{t("exportInfo")}</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-6 w-6 rounded-lg flex items-center justify-center text-neutral-500 hover:text-white hover:bg-neutral-800 transition -mr-2 -mt-1"
              >
                ✕
              </button>
            </div>
            <div className="px-3 py-1 text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1">{t("pdfPrint")}</div>
            <button
              onClick={() => {
                if (onPrint) onPrint();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:text-[#D5FF00] hover:bg-neutral-800 transition group flex items-center justify-between"
            >
              <span>{t("downloadPdf")}</span>
              <span className="text-xs bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded group-hover:text-[#D5FF00] transition">PDF</span>
            </button>
            <button
              onClick={() => {
                if (onPrint) onPrint();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:text-[#D5FF00] hover:bg-neutral-800 transition group flex items-center justify-between"
            >
              <span>{t("printSavePdf")}</span>
            </button>
            <button
              onClick={() => {
                handleEmailDraft();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:text-[#D5FF00] hover:bg-neutral-800 transition group flex items-center justify-between"
            >
              <span>{t("createEmailDraft")}</span>
            </button>
            <div className="px-3 py-1 text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-2 border-t border-neutral-800 pt-2">
              {t("jsonBackup")}
            </div>
            <button
              onClick={() => {
                onExport();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:text-[#D5FF00] hover:bg-neutral-800 transition group flex items-center justify-between"
            >
              <span>{t("downloadJson")}</span>
              <span className="text-xs bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded group-hover:text-[#D5FF00] transition">JSON</span>
            </button>
            <label className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:text-[#D5FF00] hover:bg-neutral-800 transition group flex items-center justify-between cursor-pointer">
              <span>{t("importJson")}</span>
              <span className="text-xs bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded group-hover:text-[#D5FF00] transition">{t("upload")}</span>
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file) onImport(file);
                  e.target.value = "";
                  setOpen(false);
                }}
              />
            </label>
            <div className="px-3 pb-2 text-[10px] text-neutral-500 italic">{t("importWarning")}</div>
            <div className="mt-1 px-3 py-2 text-[10px] text-neutral-600 leading-relaxed border-t border-neutral-800">{t("secureStorage")}</div>
          </div>
        </>
      )}
    </div>
  );
}

function LanguageSelector({ current, onChange }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const langs = [
    { code: "EN", label: "English" },
    { code: "DE", label: "Deutsch" },
  ];

  const active = langs.find((l) => l.code === current) || langs[0];

  return (
    <div className="relative z-20" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-8 px-3 rounded-xl text-xs font-bold tracking-wide border transition shadow-sm active:translate-y-[1px] flex items-center justify-center gap-2 bg-neutral-900 text-[#D5FF00] border-neutral-800 hover:bg-neutral-800 hover:border-[#D5FF00]/50 focus:outline-none focus:ring-2 focus:ring-[#D5FF00]/50"
      >
        <span>{active.code}</span>
        <span className="text-[10px] opacity-50">▼</span>
      </button>

      {open && (
        <>
          <div className="sm:hidden fixed inset-0 bg-black/50 z-40" />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 p-1 rounded-xl border border-neutral-800 bg-neutral-900/95 backdrop-blur-xl shadow-[0_0_30px_-10px_rgba(213,255,0,0.3)] animate-in fade-in zoom-in-95 duration-100 sm:absolute sm:w-32 sm:right-0 sm:top-10 sm:inset-x-auto sm:translate-y-0 sm:origin-top-right">
            {langs.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  onChange(l.code);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                  current === l.code ? "bg-neutral-800 text-[#D5FF00]" : "text-neutral-300 hover:text-[#D5FF00] hover:bg-neutral-800"
                }`}
              >
                {l.label}
                {current === l.code && <span>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  const [profile, setProfile] = useState(loadProfile());
  const [appState, setAppState] = useState(loadState());

  const lang = profile.language || "EN";
  const t = (key) => T[lang]?.[key] || T.EN[key] || key;

  const [date, setDate] = useState(isoToday());
  const [vehicleId, setVehicleId] = useState(profile.vehicles?.[0]?.id || "");

  const [odometerText, setOdometerText] = useState("");
  const [serviceNotesText, setServiceNotesText] = useState("");
  const [generalNotesText, setGeneralNotesText] = useState("");

  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [vehicleModalMode, setVehicleModalMode] = useState("list");
  const [vehicleEditId, setVehicleEditId] = useState(null);
  const [vehicleDraft, setVehicleDraft] = useState(null);
  const [editingCheckId, setEditingCheckId] = useState(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState(null);

  const [toast, setToast] = useState(null);
  const vehicles = useMemo(() => profile.vehicles || [], [profile.vehicles]);

  const toastTimer = useRef(null);
  const notify = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(appState));
    } catch {
      // ignore
    }
  }, [appState]);

  useEffect(() => {
    if (!vehicles.length) return;
    const exists = vehicles.some((v) => v.id === vehicleId);
    if (!exists) setVehicleId(vehicles[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles]);

  const vehicleLabel = useMemo(
    () => formatVehicleLabel(vehicles.find((v) => v.id === vehicleId) || null),
    [vehicles, vehicleId]
  );

  const [draft, setDraft] = useState(() => {
    const t = appState.template;
    return {
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
    };
  });

  const totalPhotos = useMemo(() => {
    let count = 0;
    if (draft?.sections) {
      for (const s of draft.sections) {
        for (const it of s.items) {
          if (it.photos) count += it.photos.length;
        }
      }
    }
    return count;
  }, [draft]);

  const handleAddPhoto = useCallback((itemId, file) => {
    if (!file) return;
    if (totalPhotos >= 20) {
      alert("Total photo limit reached (20).");
      return;
    }

    compressImage(file)
      .then((blob) => {
        const storageKey = uid("blob");
        return savePhotoBlob(storageKey, blob, "image/jpeg").then(() => storageKey);
      })
      .then((storageKey) => {
        setDraft((prev) => ({
          ...prev,
          sections: prev.sections.map((s) => ({
            ...s,
            items: s.items.map((it) => {
              if (it.id !== itemId) return it;
              return {
                ...it,
                photos: [
                  ...(it.photos || []),
                  {
                    id: uid("ph"),
                    storageKey,
                    name: file.name,
                    date: new Date().toISOString(),
                  },
                ],
              };
            }),
          })),
        }));
      })
      .catch((err) => {
        console.error("Photo upload error:", err);
        alert("Could not add photo. Please try again.");
      });
  }, [totalPhotos]);

  useEffect(() => {
    setDraft((d) => ({ ...d, date, vehicleId }));
  }, [date, vehicleId]);

  const issueCount = useMemo(() => {
    let n = 0;
    for (const s of draft.sections) for (const it of s.items) if (it.severity === "issue") n++;
    return n;
  }, [draft.sections]);

  const noteCount = useMemo(() => {
    let n = 0;
    for (const s of draft.sections) for (const it of s.items) if (it.severity === "note") n++;
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

  const updateItem = useCallback((sectionId, itemId, patch) => {
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
  }, []);

  const addItem = useCallback((sectionId) => {
    const label = window.prompt(t("enterItemName") || "Enter item name:");
    if (!label) return;

    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          items: [
            ...s.items,
            {
              id: uid("i"),
              label,
              severity: "ok",
              note: "",
              done: false,
            },
          ],
        };
      }),
    }));
  }, [t]);

  const deleteItem = useCallback((sectionId, itemId) => {
    if (!window.confirm(t("delete") + "?")) return;
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          items: s.items.filter((it) => it.id !== itemId),
        };
      }),
    }));
  }, [t]);

  function loadCheckForEditing(check) {
    if (!check) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    setDate(check.date || isoToday());
    setVehicleId(check.vehicleId || (vehicles.length > 0 ? vehicles[0].id : ""));
    setOdometerText(check.odometer || "");
    setServiceNotesText(check.serviceNotes || "");
    setGeneralNotesText(check.generalNotes || "");
    setDraft({
      date: check.date,
      vehicleId: check.vehicleId,
      sections: JSON.parse(JSON.stringify(check.sections || [])),
    });
    setEditingCheckId(check.id);
    notify("Loaded for editing");
  }

  function resetDraft() {
    setEditingCheckId(null);
    const t = appState.template;
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

    setOdometerText("");
    setServiceNotesText("");
    setGeneralNotesText("");
    notify("Reset");
  }

  function saveCheck() {
    if (editingCheckId) {
      setAppState((prev) =>
        saveState({
          ...prev,
          checks: (prev.checks || []).map((c) => {
            if (c.id !== editingCheckId) return c;
            return {
              ...c,
              date,
              vehicleId,
              vehicleLabel,
              odometer: String(odometerText || "").trim(),
              serviceNotes: String(serviceNotesText || "").trim(),
              generalNotes: String(generalNotesText || "").trim(),
              sections: draft.sections,
              summary: { totalItems, doneCount, issueCount },
              updatedAt: new Date().toISOString(),
            };
          }),
        })
      );
      notify("Updated check");
      resetDraft();
      return;
    }

    const check = {
      id: uid("vc"),
      createdAt: new Date().toISOString(),
      date,
      vehicleId,
      vehicleLabel,
      odometer: String(odometerText || "").trim(),
      serviceNotes: String(serviceNotesText || "").trim(),
      generalNotes: String(generalNotesText || "").trim(),
      sections: draft.sections,
      summary: { totalItems, doneCount, issueCount },
    };

    setAppState((prev) =>
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
    setAppState((prev) => saveState({ ...prev, checks: (prev.checks || []).filter((c) => c.id !== id) }));
    notify("Deleted");
  }

  async function downloadZip(check) {
    if (!check) return;
    try {
      notify("Preparing Zip...");
      
      // Dynamically load libraries to avoid build errors if not present
      const [JSZip, { saveAs }, { jsPDF }] = await Promise.all([
        import("jszip").then((m) => m.default || m),
        import("file-saver"),
        import("jspdf"),
      ]);

      const zip = new JSZip();
      
      // 1. Generate PDF Report
      const doc = new jsPDF();
      doc.setFontSize(10);
      // Use the existing summary text builder
      const text = buildCheckSummaryText(check, lang);
      // Split text to fit page width (A4 width ~210mm, margin 10mm -> 190mm)
      const splitText = doc.splitTextToSize(text, 180);
      doc.text(splitText, 10, 10);
      const pdfBlob = doc.output("blob");
      zip.file(`Report_${check.date || "check"}.pdf`, pdfBlob);

      // 2. Add Photos
      const photoFolder = zip.folder("photos");
      const photoTasks = [];

      if (check.sections) {
        for (const s of check.sections) {
          for (const item of s.items || []) {
            if (item.photos && item.photos.length > 0) {
              item.photos.forEach((p, idx) => {
                if (p.storageKey) {
                  const safeLabel = (item.label || "item").replace(/[^a-z0-9]/gi, "_");
                  const fileName = `${safeLabel}_${idx + 1}.jpg`;
                  photoTasks.push(
                    getPhotoBlob(p.storageKey).then((blob) => {
                      if (blob) photoFolder.file(fileName, blob);
                    })
                  );
                }
              });
            }
          }
        }
      }

      await Promise.all(photoTasks);

      // 3. Save Zip
      const content = await zip.generateAsync({ type: "blob" });
      const safeDate = String(check.date || isoToday()).replace(/[^0-9-]/g, "");
      const zipName = `Check_${safeDate}_${(check.vehicleLabel || "vehicle").replace(/[^a-z0-9]/gi, "_")}.zip`;
      
      saveAs(content, zipName);
      notify("Zip downloaded");
    } catch (e) {
      console.error(e);
      alert("Zip generation failed. Ensure jszip, file-saver, and jspdf are installed.\nError: " + e.message);
    }
  }

  function exportJSON() {
    const payload = { exportedAt: new Date().toISOString(), profile, data: appState };
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
        const parsed = parseImportPayload(String(reader.result || ""));

        if (parsed.kind === "full") {
          const incoming = parsed.data;
          if (!incoming?.checks || !Array.isArray(incoming.checks)) throw new Error("Invalid import file");
          setProfile(parsed.profile || profile);
          setAppState(saveState(incoming));
          resetDraft();
          notify("Imported");
          return;
        }

        const incomingCheck = parsed.check;
        if (!incomingCheck?.id) throw new Error("Invalid import file");
        if (parsed.profile) setProfile(parsed.profile);

        setAppState((prev) => {
          const existing = prev.checks || [];
          const without = existing.filter((c) => c.id !== incomingCheck.id);
          return saveState({ ...prev, checks: [incomingCheck, ...without] });
        });

        notify("Imported check");
      } catch (e) {
        alert("Import failed: " + (e?.message || "unknown error"));
      }
    };
    reader.readAsText(file);
  }

  const selectedSavedCheck = useMemo(() => (appState.checks || []).find((c) => c.id === savedId) || null, [appState.checks, savedId]);

  const openSaved = (id) => {
    setSavedId(id);
    setSavedOpen(true);
  };

  const exportSingleCheck = (c) => {
    if (!c) return;
    const payload = { exportedAt: new Date().toISOString(), profile, check: c };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeDate = String(c.date || isoToday()).replace(/[^0-9-]/g, "");
    a.download = `vehicle-check-${safeDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Exported check");
  };

  const downloadSingleCheckTxt = (c) => {
    if (!c) return;
    const text = buildCheckSummaryText(c, lang);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeDate = String(c.date || isoToday()).replace(/[^0-9-]/g, "");
    a.download = `vehicle-check-${safeDate}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Downloaded TXT");
  };

  const copySingleCheck = async (c) => {
    if (!c) return;
    const ok = await copyTextToClipboard(buildCheckSummaryText(c, lang));
    if (ok) notify("Copied");
    else alert("Copy failed. Try Export or Download TXT.");
  };

  const sendSingleCheck = async (c) => {
    if (!c) return;
    const { subject, body } = buildCheckEmail(c, lang);

    const safeDate = String(c.date || isoToday()).replace(/[^0-9-]/g, "");
    const txtFile = new File([body], `vehicle-check-${safeDate}.txt`, { type: "text/plain" });
    const jsonPayload = JSON.stringify({ exportedAt: new Date().toISOString(), profile, check: c }, null, 2);
    const jsonFile = new File([jsonPayload], `vehicle-check-${safeDate}.json`, { type: "application/json" });

    try {
      if (navigator?.share) {
        if (navigator.canShare && navigator.canShare({ files: [txtFile, jsonFile] })) {
          await navigator.share({ title: subject, text: body, files: [txtFile, jsonFile] });
        } else {
          await navigator.share({ title: subject, text: body });
        }
        notify("Shared");
        return;
      }
    } catch {
      // ignore
    }

    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    try {
      window.location.href = mailto;
      notify("Opened email");
    } catch {
      const ok = await copyTextToClipboard(body);
      if (ok) notify("Copied (mailto blocked)");
      else alert("Send failed. Use Copy / Export / Download TXT.");
    }
  };

  const openPreview = () => setPreviewOpen(true);

  const handleAutoPrint = useCallback(() => {
    setPreviewOpen(true);
    setTimeout(() => window.print(), 500);
  }, []);

  const openHub = () => {
    if (isHubPlaceholder()) {
      alert("Set HUB_URL in the code first.");
      return;
    }
    window.open(HUB_URL, "_blank", "noopener,noreferrer");
  };

  const openVehicleManager = () => {
    setVehicleModalOpen(true);
    setVehicleModalMode("list");
    setVehicleEditId(null);
    setVehicleDraft(null);
  };

  const startAddVehicle = () => {
    setVehicleModalOpen(true);
    setVehicleModalMode("add");
    setVehicleEditId(null);
    setVehicleDraft(blankVehicle());
  };

  const startEditVehicle = (v) => {
    setVehicleModalOpen(true);
    setVehicleModalMode("edit");
    setVehicleEditId(v?.id || null);
    setVehicleDraft({
      id: v?.id || "",
      label: v?.label || "",
      plate: v?.plate || "",
      make: v?.make || "",
      model: v?.model || "",
      fuelType: v?.fuelType || FUEL_OPTIONS[0],
      year: v?.year || "",
      vin: v?.vin || "",
      tuvUntil: v?.tuvUntil || "",
      serviceDue: v?.serviceDue || "",
      notes: v?.notes || "",
    });
  };

  const cancelVehicleEdit = () => {
    setVehicleModalMode("list");
    setVehicleEditId(null);
    setVehicleDraft(null);
  };

  const selectActiveVehicle = (vid) => {
    setVehicleId(vid);
    notify("Active vehicle set");
  };

  const deleteVehicle = (vid) => {
    const v = (profile.vehicles || []).find((x) => x.id === vid);
    const ok = window.confirm(`Delete vehicle: ${formatVehicleLabel(v) || vid}?`);
    if (!ok) return;

    const nextVehicles = (profile.vehicles || []).filter((x) => x.id !== vid);
    setProfile((p) => ({ ...p, vehicles: nextVehicles }));

    if (vehicleId === vid) setVehicleId(nextVehicles[0]?.id || "");
    notify("Vehicle deleted");
  };

  const saveVehicle = (incomingDraft) => {
    const d = incomingDraft || vehicleDraft;
    const plate = String(d.plate || "").trim().toUpperCase();
    const make = String(d.make || "").trim();
    const model = String(d.model || "").trim();

    if (!plate && !make && !model) {
      alert("Please enter at least a number plate or make/model.");
      return;
    }

    const label = [make, model].filter(Boolean).join(" ").trim() || plate || "Vehicle";

    if (vehicleModalMode === "add") {
      const idBase = normalizeVehicleId(plate || label);
      const existingIds = (profile.vehicles || []).map((v) => v.id);
      let id = idBase;
      if (existingIds.includes(id)) id = `${idBase}-${Math.random().toString(16).slice(2, 6)}`;

      const nextVehicle = {
        id,
        label,
        plate,
        make,
        model,
        fuelType: String(d.fuelType || "").trim(),
        year: String(d.year || "").trim(),
        vin: String(d.vin || "").trim(),
        tuvUntil: String(d.tuvUntil || "").trim(),
        serviceDue: String(d.serviceDue || "").trim(),
        notes: String(d.notes || "").trim(),
      };

      const nextVehicles = [...(profile.vehicles || []), nextVehicle];
      setProfile((p) => ({ ...p, vehicles: nextVehicles }));
      setVehicleId(id);
      notify("Vehicle added");
      cancelVehicleEdit();
      return;
    }

    const editId = vehicleEditId;
    if (!editId) {
      alert("Edit failed: missing vehicle id");
      cancelVehicleEdit();
      return;
    }

    const nextVehicles = (profile.vehicles || []).map((v) => {
      if (v.id !== editId) return v;
      return {
        ...v,
        label,
        plate,
        make,
        model,
        fuelType: String(d.fuelType || "").trim(),
        year: String(d.year || "").trim(),
        vin: String(d.vin || "").trim(),
        tuvUntil: String(d.tuvUntil || "").trim(),
        serviceDue: String(d.serviceDue || "").trim(),
        notes: String(d.notes || "").trim(),
      };
    });

    setProfile((p) => ({ ...p, vehicles: nextVehicles }));
    notify("Vehicle updated");
    cancelVehicleEdit();
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

  const activeVehicle = useMemo(() => vehicles.find((v) => v.id === vehicleId) || null, [vehicles, vehicleId]);

  useEffect(() => {
    if (savedOpen && savedId && !(appState.checks || []).some((c) => c.id === savedId)) {
      setSavedOpen(false);
      setSavedId(null);
    }
  }, [savedOpen, savedId, appState.checks]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800">
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
        }

        /* Modern date input styling */
        input[type="date"] {
          appearance: none;
          -webkit-appearance: none;
          min-height: 42px;
          color-scheme: light;
          accent-color: #D5FF00;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          opacity: 0.5;
          opacity: 0.6;
          cursor: pointer;
          transition: all 0.2s;
          padding: 5px;
          border-radius: 6px;
          padding: 8px;
          margin-right: -4px;
          border-radius: 8px;
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23525252" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>');
          background-position: center;
          background-size: 18px;
          background-repeat: no-repeat;
          color: transparent;
        }
        input[type="date"]::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
          background: rgba(0,0,0,0.05);
        }
      `}</style>

      {previewOpen || savedOpen ? (
        <style>{`
          @media print {
            /* Hide everything by default via visibility */
            body * {
              visibility: hidden !important;
            }

            /* Reset positioning and overflow to prevent clipping/repeating */
            html, body, .min-h-screen, .fixed, .absolute, .relative, .overflow-auto, .overflow-hidden {
              position: static !important;
              overflow: visible !important;
              height: auto !important;
              min-height: 0 !important;
            }

            /* Show the print target */
            #vc-print-preview, #vc-print-preview *,
            #vc-print-saved, #vc-print-saved * {
              visibility: visible !important;
            }

            #vc-print-preview, #vc-print-saved {
              position: relative !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
              background: white !important;
              color: black !important;
            }
          }
        `}</style>
      ) : null}

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} appName="Vehicle Check-It" storageKey={KEY} t={t} />

      <PhotoViewModal photo={viewingPhoto} onClose={() => setViewingPhoto(null)} t={t} />

      <VehicleProfilesModal
        open={vehicleModalOpen}
        onClose={() => setVehicleModalOpen(false)}
        vehicles={vehicles}
        activeVehicleId={vehicleId}
        onSelectActive={selectActiveVehicle}
        onStartAdd={startAddVehicle}
        onStartEdit={startEditVehicle}
        onDelete={deleteVehicle}
        mode={vehicleModalMode}
        draft={vehicleDraft}
        setDraft={setVehicleDraft}
        onSave={saveVehicle}
        onCancelEdit={cancelVehicleEdit}
        t={t}
      />

      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 pointer-events-none">
          <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md" onClick={() => setPreviewOpen(false)} />

          <div className="relative w-full max-w-5xl flex flex-col max-h-full pointer-events-auto">
            <div className="mb-3 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-[0_0_15px_-3px_rgba(213,255,0,0.15)] p-3 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
              <div className="text-lg font-bold tracking-wide text-[#D5FF00] pl-2">{t("printPreview")}</div>
              <div className="flex flex-wrap items-center gap-2">
                <button className={btnSecondary} onClick={() => window.print()}>
                  {t("printSavePdf")}
                </button>
                <button className={btnSecondary} onClick={() => setPreviewOpen(false)}>
                  {t("close")}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 shadow-2xl overflow-hidden min-h-0 flex flex-col">
              <div className="overflow-auto p-4 sm:p-8 custom-scrollbar">
                <div id="vc-print-preview" className="mx-auto max-w-4xl bg-white p-4 sm:p-8 rounded-xl shadow-lg text-neutral-900">
                  <ReportSheet
                    profile={profile}
                    date={date}
                    vehicleLabel={vehicleLabel}
                    odometer={String(odometerText || "").trim()}
                    serviceNotes={String(serviceNotesText || "").trim()}
                    generalNotes={String(generalNotesText || "").trim()}
                    draft={draft}
                    totals={totalsForPreview}
                    storageKey={KEY}
                    t={t}
                    onViewPhoto={setViewingPhoto}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {savedOpen && selectedSavedCheck ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 pointer-events-none">
          <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setSavedOpen(false)} />

          <div className="relative w-full max-w-5xl flex flex-col max-h-[90vh] pointer-events-auto">
            <div className="mb-3 rounded-2xl bg-white border border-neutral-200 shadow-sm p-3 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
              <div>
                <div className="text-lg font-semibold text-neutral-800">{t("savedCheck")}</div>
                <div className="text-sm text-neutral-600">
                  {selectedSavedCheck.date || "-"} • {selectedSavedCheck.vehicleLabel || selectedSavedCheck.vehicleId || "-"}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button className={btnSecondary} onClick={() => exportSingleCheck(selectedSavedCheck)}>
                  {t("export")}
                </button>
                <button className={btnSecondary} onClick={() => downloadSingleCheckTxt(selectedSavedCheck)}>
                  {t("txt")}
                </button>
                <button className={btnSecondary} onClick={() => copySingleCheck(selectedSavedCheck)}>
                  {t("copy")}
                </button>
                <button className={btnSecondary} onClick={() => sendSingleCheck(selectedSavedCheck)}>
                  {t("send")}
                </button>
                <button className={btnSecondary} onClick={() => window.print()}>
                  {t("printSavePdf")}
                </button>
                <button className={btnDanger} onClick={() => deleteCheck(selectedSavedCheck.id)}>
                  {t("delete")}
                </button>
                <button className={btnSecondary} onClick={() => setSavedOpen(false)}>
                  {t("close")}
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-neutral-200 shadow-2xl overflow-auto min-h-0">
              <div id="vc-print-saved" className="p-4 sm:p-6">
                <ReportSheet
                  profile={profile}
                  date={selectedSavedCheck.date}
                  vehicleLabel={selectedSavedCheck.vehicleLabel || selectedSavedCheck.vehicleId}
                  odometer={String(selectedSavedCheck.odometer || "").trim()}
                  serviceNotes={String(selectedSavedCheck.serviceNotes || "").trim()}
                  generalNotes={String(selectedSavedCheck.generalNotes || "").trim()}
                  draft={{ sections: selectedSavedCheck.sections || [] }}
                  totals={
                    selectedSavedCheck.summary || {
                      issueCount: 0,
                      doneCount: 0,
                      totalItems: 0,
                    }
                  }
                  storageKey={KEY}
                  t={t}
                  onViewPhoto={setViewingPhoto}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="max-w-6xl mx-auto p-4 sm:p-6 print:hidden">
        <TestsPanel t={t} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          <div className="w-full flex justify-center sm:justify-start">
              <img
                src={vehicleCheckItHeading}
                alt="Vehicle CheckIt"
                className="h-[10.125rem] w-auto object-contain"
              />
          </div>

          <div className="lg:col-span-3">
            <div className="relative flex items-center justify-end">
              <div className="flex flex-wrap gap-2 pr-12">
                <ActionButton onClick={openHub} title="Return to ToolStack hub">
                 Hub
                </ActionButton>
                <button
                  type="button"
                  onClick={openPreview}
                  disabled={totalItems === 0}
                  className="h-10 w-32 rounded-xl text-sm font-bold tracking-wide border transition shadow-sm active:translate-y-[1px] flex items-center justify-center bg-neutral-900 text-[#D5FF00] border-neutral-800 hover:bg-neutral-800 hover:border-[#D5FF00]/50 focus:outline-none focus:ring-2 focus:ring-[#D5FF00]/50 disabled:opacity-50 disabled:cursor-not-allowed z-10 relative"
                >
                  {t("preview")}
                </button>
                <DataMenu onExport={exportJSON} onImport={importJSON} onPrint={handleAutoPrint} t={t} />

                <div className="absolute right-0 top-0">
                  <HelpIconButton onClick={() => setHelpOpen(true)} />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <LanguageSelector current={profile.language} onChange={(l) => setProfile((p) => ({ ...p, language: l }))} />
            </div>
          </div>
        </div>

        <div className="mt-4 mb-6 rounded-2xl bg-white border border-neutral-200 p-4 shadow-sm">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">{t("status")}</div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 sm:gap-8">
              <div>
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{t("vehicle")}</div>
                <div className="text-lg font-bold text-neutral-900 truncate max-w-[160px] sm:max-w-xs" title={vehicleLabel}>
                  {vehicleLabel || "—"}
                </div>
              </div>

              <div className="hidden sm:block h-8 w-px bg-neutral-200" />

              <div>
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{t("items")}</div>
                <div className="text-2xl font-black text-neutral-900 tracking-tight">
                  <span>{doneCount}</span>
                  <span className="text-neutral-400">/</span>
                  <span>{totalItems}</span>
                </div>
              </div>

              <div className="h-8 w-px bg-neutral-200" />

              <div>
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{t("issues")}</div>
                <div className={`text-2xl font-black tracking-tight ${issueCount > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {issueCount}
                </div>
              </div>

              <div className="h-8 w-px bg-neutral-200" />

              <div>
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{t("notes")}</div>
                <div className={`text-2xl font-black tracking-tight ${noteCount > 0 ? "text-amber-600" : "text-neutral-400"}`}>
                  {noteCount}
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono text-neutral-500 bg-neutral-50 px-2 py-1 rounded border border-neutral-200">
              {t("module")}: {moduleManifest.id}.{moduleManifest.version}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className={`${card} h-fit`}>
            <div className={cardHead}>
              <div className="font-semibold text-neutral-800">{t("vehicleProfile")}</div>
              <div className="text-xs text-neutral-600 mt-1">
                {t("storedIn")} <span className="font-mono">{PROFILE_KEY}</span>
              </div>
            </div>

            <div className={`${cardPad} space-y-3`}>
              <label className="text-sm block">
                <div className="text-neutral-700 font-medium">{t("activeVehicle")}</div>
                <select className={inputBase} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                  {vehicles.length === 0 ? (
                    <option value="">{t("noVehiclesYet")}</option>
                  ) : (
                    vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {formatVehicleLabel(v)}
                      </option>
                    ))
                  )}
                </select>
              </label>

              {activeVehicle ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                  <div className="text-sm font-semibold text-neutral-800 truncate">{formatVehicleLabel(activeVehicle)}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activeVehicle.fuelType ? <Pill tone="accent">{activeVehicle.fuelType}</Pill> : null}
                    {activeVehicle.tuvUntil ? <Pill>TÜV: {activeVehicle.tuvUntil}</Pill> : null}
                    {activeVehicle.serviceDue ? <Pill>Service: {activeVehicle.serviceDue}</Pill> : null}
                  </div>
                  {activeVehicle.notes ? <div className="mt-2 text-xs text-neutral-600 whitespace-pre-wrap">{activeVehicle.notes}</div> : null}
                </div>
              ) : (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600">{t("noVehiclesAdd")}</div>
              )}

              <div className="flex flex-col gap-2">
                <button className={btnSecondary} onClick={openVehicleManager}>
                  {t("manageVehicles")}
                </button>
                <button className={btnSecondary} onClick={startAddVehicle}>
                  {t("addVehicle")}
                </button>
              </div>

              <div className="text-xs text-neutral-600">{t("profilesInfo")}</div>
            </div>
          </div>

          <div className={`${card} lg:col-span-3`}>
            <div className={`${cardHead} flex flex-wrap items-end justify-between gap-3`}>
              <div>
                <div className="font-semibold text-neutral-800">{t("newCheck")}</div>
                <div className="text-sm text-neutral-700">
                  {t("items")}: {doneCount}/{totalItems} • {t("issues")}: {issueCount}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <label className="text-sm">
                  <div className="text-neutral-700 font-medium">{t("date")}</div>
                  <input type="date" className={inputBase} value={date} onChange={(e) => setDate(e.target.value)} />
                </label>

                <label className="text-sm">
                  <div className="text-neutral-700 font-medium">{t("vehicle")}</div>
                  <select className={inputBase} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {formatVehicleLabel(v)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm">
                  <div className="text-neutral-700 font-medium">{t("odometer")}</div>
                  <input
                    className={inputBase}
                    placeholder={t("odometerPlaceholder")}
                    inputMode="numeric"
                    value={odometerText}
                    onChange={(e) => setOdometerText(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className={cardPad}>
              {activeVehicle?.tuvUntil ? (
                <div className="mb-4">
                  <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#D5FF00]/40 bg-[#D5FF00]/10 text-xs text-neutral-800">
                    <span className="font-bold">ℹ {t("tuvExpiry")}:</span>
                    <span>{activeVehicle.tuvUntil}</span>
                  </span>
                </div>
              ) : null}

              <label className="block text-sm mb-3">
                <div className="text-neutral-700 font-medium">{t("serviceAlerts")}</div>
                <textarea
                  className={inputBase + " min-h-[60px]"}
                  placeholder={t("serviceAlertsPlaceholder")}
                  value={serviceNotesText}
                  onChange={(e) => setServiceNotesText(e.target.value)}
                />
              </label>

              <label className="block text-sm">
                <div className="text-neutral-700 font-medium">{t("generalNotes")}</div>
                <textarea
                  className={inputBase + " min-h-[96px]"}
                  placeholder={t("generalNotesPlaceholder")}
                  value={generalNotesText}
                  onChange={(e) => setGeneralNotesText(e.target.value)}
                />
              </label>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {draft.sections.map((s) => (
                  <div key={s.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                    <div className="font-semibold text-neutral-800">{s.title}</div>
                    <div className="mt-2 space-y-2">
                      {s.items.map((it) => (
                        <ItemCard
                          key={it.id}
                          sectionId={s.id}
                          item={it}
                          updateItem={updateItem}
                          deleteItem={deleteItem}
                          t={t}
                          lang={lang}
                          onAddPhoto={typeof handleAddPhoto !== "undefined" ? handleAddPhoto : undefined}
                          totalPhotos={typeof totalPhotos !== "undefined" ? totalPhotos : 0}
                          isLocked={typeof isLocked !== "undefined" ? isLocked : false}
                          onViewPhoto={setViewingPhoto}
                        />
                      ))}
                    </div>
                    <button
                      className="mt-3 w-full py-2 rounded-xl border border-dashed border-neutral-300 text-xs font-bold text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition"
                      onClick={() => addItem(s.id)}
                    >
                      + {t("addItem")}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <button className={btnSecondary} onClick={resetDraft}>
                  {t("reset")}
                </button>

                <div className="flex items-center gap-2">
                  <button className={btnSecondary} onClick={openPreview}>
                    {t("preview")}
                  </button>
                  <button className={btnSecondary} onClick={saveCheck}>
                    {editingCheckId ? t("updateCheck") : t("saveCheck")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`mt-4 ${card}`}>
          <div className={cardHead}>
            <div className="font-semibold text-neutral-800">{t("savedChecks")}</div>
            <div className="text-sm text-neutral-700">{t("historyInfo")}</div>
          </div>

          <div className={cardPad}>
            {(appState.checks || []).length === 0 ? (
              <div className="text-sm text-neutral-600">{t("noSavedChecks")}</div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-neutral-600">
                    <tr className="border-b">
                      <th className="py-2 pr-2">{t("date")}</th>
                      <th className="py-2 pr-2">{t("vehicle")}</th>
                      <th className="py-2 pr-2">{t("odometer")}</th>
                      <th className="py-2 pr-2">{t("issues")}</th>
                      <th className="py-2 pr-2">{t("items")}</th>
                      <th className="py-2 pr-2 text-right">{t("actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(appState.checks || []).map((c) => (
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
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button className={btnMini} onClick={() => loadCheckForEditing(c)}>
                              {t("edit")}
                            </button>
                            <button className={btnMini} onClick={() => downloadZip(c)}>
                              {t("zip")}
                            </button>
                            <button className={btnMini} onClick={() => openSaved(c.id)}>
                              {t("view")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 text-sm text-neutral-700">
          <a
            className="underline hover:text-neutral-900"
            href={isHubPlaceholder() ? "#" : HUB_URL}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => {
              if (isHubPlaceholder()) {
                e.preventDefault();
                alert("Set HUB_URL in the code first.");
              }
            }}
          >
            {t("returnHub")}
          </a>
          <div className="text-xs text-neutral-600">
            {t("storageKey")}: <span className="font-mono">{KEY}</span>
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
