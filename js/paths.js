import path from "node:path";

export const TEMPLATES = new Set([
  "forms/fl-100.pdf",
  "forms/fl-105.pdf",
  "forms/fl-110.pdf",
]);

const REFERENCE_HOSTS = new Set([
  "kern.courts.ca.gov",
  "www.kern.courts.ca.gov",
  "odyprodportal.kern.courts.ca.gov",
  "selfhelp.courts.ca.gov",
  "courts.ca.gov",
  "www.courts.ca.gov",
  "childsupport.ca.gov",
  "www.childsupport.ca.gov",
  "opendoorhelps.org",
  "www.opendoorhelps.org",
  "kcfjc.org",
  "www.kcfjc.org",
  "kclawlib.org",
  "www.kclawlib.org",
]);

export function matterFolderName(fileNumber) {
  const cleaned = String(fileNumber || "")
    .split(/[^A-Za-z0-9._-]+/)
    .flatMap((part) => part.split("."))
    .map((part) => part.replace(/^-+|-+$/g, ""))
    .filter((part) => part.length > 0)
    .join("-")
    .slice(0, 80);
  return cleaned || "matter";
}

export function safeFileName(name) {
  const raw = String(name || "");
  if (raw !== path.basename(raw) || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/.test(raw)) {
    throw new Error("That file name is not allowed.");
  }
  return raw;
}

export function resolveInside(root, ...parts) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, ...parts);
  if (resolved !== resolvedRoot && !resolved.startsWith(resolvedRoot + path.sep)) {
    throw new Error("That path is outside the Kern LDA folder on this computer.");
  }
  return resolved;
}

export function isAllowedReference(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return parsed.protocol === "https:" && REFERENCE_HOSTS.has(parsed.hostname.toLowerCase());
}
