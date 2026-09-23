import { blankAnswers } from "./engine.js";

export const MATTERS_KEY = "rightform-matters-v1";
export const PREVIOUS_MATTERS_KEY = "kern-lda-matters-v1";
export const LEGACY_WIZARD_KEY = "kern-lda-divorce-wizard-v1";

export function blankWizard() {
  return {
    step: "welcome",
    answers: blankAnswers(),
    checks: {},
    visited: { welcome: true },
    example: false,
  };
}

export function createMatter(overrides = {}, now = new Date()) {
  const openedOn = isoDate(now);
  return {
    id: overrides.id || createId(),
    openedOn,
    fileNumber: overrides.fileNumber || "",
    referral: "",
    feeNote: "",
    officeNotes: "",
    conflictNote: "",
    wizard: blankWizard(),
    ...stripWizardOverride(overrides),
    wizard: overrides.wizard ? structuredClone(overrides.wizard) : blankWizard(),
  };
}

export function loadMatterFile(storage) {
  const current = readJson(storage, MATTERS_KEY);
  const previous = readJson(storage, PREVIOUS_MATTERS_KEY);
  let matters = Array.isArray(current)
    ? current.map(normalizeMatter)
    : (Array.isArray(previous) ? previous.map(normalizeMatter) : []);
  let shouldWrite = !Array.isArray(current) && Array.isArray(previous);
  if (!Array.isArray(current) && !Array.isArray(previous)) {
    const legacy = readJson(storage, LEGACY_WIZARD_KEY);
    if (legacy && legacy.answers) {
      matters = [normalizeMatter(createMatter({
        fileNumber: "RF-LEGACY",
        wizard: {
          step: legacy.step || "welcome",
          answers: legacy.answers,
          checks: legacy.checks || {},
          visited: legacy.visited || { welcome: true },
          example: Boolean(legacy.example),
        },
      }))];
      shouldWrite = true;
    }
  }
  if (shouldWrite) writeMatters(storage, matters);
  return matters.sort((a, b) => String(b.openedOn).localeCompare(String(a.openedOn)) || String(b.fileNumber).localeCompare(String(a.fileNumber)));
}

export function writeMatters(storage, matters) {
  storage.setItem(MATTERS_KEY, JSON.stringify(matters));
}

export function upsertMatter(storage, matter) {
  const matters = loadMatterFile(storage).filter((item) => item.id !== matter.id);
  const next = normalizeMatter({ ...matter, updatedAt: new Date().toISOString() });
  matters.push(next);
  writeMatters(storage, matters);
  return next;
}

export function removeMatter(storage, id) {
  writeMatters(storage, loadMatterFile(storage).filter((matter) => matter.id !== id));
}

export function nextFileNumber(matters, now = new Date()) {
  const year = now.getFullYear();
  const prefix = `RF-${year}-`;
  const used = matters
    .map((matter) => matter.fileNumber || "")
    .filter((value) => value.startsWith(prefix))
    .map((value) => Number(value.slice(prefix.length)))
    .filter((value) => Number.isInteger(value));
  const sequence = (used.length ? Math.max(...used) : 0) + 1;
  return `${prefix}${String(sequence).padStart(3, "0")}`;
}

export function matterTitle(matter) {
  const client = matter.wizard?.answers?.people?.you?.name?.trim();
  const other = matter.wizard?.answers?.people?.other?.name?.trim();
  if (client && other) return `${client} and ${other}`;
  if (client) return client;
  return "New divorce matter";
}

function normalizeMatter(matter) {
  const wizard = matter.wizard || blankWizard();
  return {
    id: matter.id || createId(),
    openedOn: matter.openedOn || isoDate(new Date()),
    updatedAt: matter.updatedAt || "",
    fileNumber: matter.fileNumber || "",
    referral: matter.referral || "",
    feeNote: matter.feeNote || "",
    officeNotes: matter.officeNotes || "",
    conflictNote: matter.conflictNote || "",
    wizard: {
      step: wizard.step || "welcome",
      answers: wizard.answers || blankAnswers(),
      checks: wizard.checks || {},
      visited: wizard.visited || { welcome: true },
      example: Boolean(wizard.example),
    },
  };
}

function stripWizardOverride(overrides) {
  const copy = { ...overrides };
  delete copy.wizard;
  delete copy.id;
  delete copy.fileNumber;
  return copy;
}

function readJson(storage, key) {
  try {
    return JSON.parse(storage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function createId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `matter-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isoDate(now) {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
