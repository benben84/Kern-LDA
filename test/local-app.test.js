import assert from "node:assert/strict";
import test from "node:test";
import os from "node:os";
import path from "node:path";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "../vendor/pdf-lib.min.js";
import { buildPdf } from "../js/documents.js";
import { createMemoryStorage } from "../js/desktop-store.js";
import { exampleWithChild } from "../js/engine.js";
import { MATTERS_KEY } from "../js/matters.js";
import { planDocuments } from "../js/populate.js";
import {
  isAllowedReference,
  matterFolderName,
  resolveInside,
  safeFileName,
  TEMPLATES,
} from "../js/paths.js";

test("matter folders and saved files stay inside the Rightform directory", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "rightform-"));
  try {
    assert.equal(matterFolderName("../../etc"), "etc");
    assert.equal(matterFolderName("RF-2026-001"), "RF-2026-001");
    assert.equal(safeFileName("FL-100-alex-rivera.pdf"), "FL-100-alex-rivera.pdf");
    assert.throws(() => safeFileName("../secrets.pdf"));
    assert.equal(resolveInside(root, matterFolderName("RF-2026-001")), path.join(root, "RF-2026-001"));
    assert.throws(() => resolveInside(root, ".."));
    const folder = resolveInside(root, matterFolderName("RF-2026-001"));
    const dest = resolveInside(folder, safeFileName("FL-100-alex-rivera.pdf"));
    assert.equal(dest, path.join(root, "RF-2026-001", "FL-100-alex-rivera.pdf"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("only the bundled form templates and known court references are allowed", () => {
  assert.deepEqual([...TEMPLATES], ["forms/fl-100.pdf", "forms/fl-105.pdf", "forms/fl-110.pdf"]);
  assert.equal(isAllowedReference("https://www.kern.courts.ca.gov/forms/Fees"), true);
  assert.equal(isAllowedReference("https://selfhelp.courts.ca.gov/divorce"), true);
  assert.equal(isAllowedReference("http://www.kern.courts.ca.gov/forms/Fees"), false);
  assert.equal(isAllowedReference("https://example.com/forms"), false);
  assert.equal(isAllowedReference("not a url"), false);
});

test("the desktop matter file is a local JSON snapshot", () => {
  const storage = createMemoryStorage();
  storage.setItem(MATTERS_KEY, "[]");
  const root = mkdtempSync(path.join(os.tmpdir(), "rightform-"));
  try {
    const dest = path.join(root, "matters.json");
    writeFileSync(dest, JSON.stringify(storage.dump()));
    const loaded = createMemoryStorage(JSON.parse(readFileSync(dest, "utf8")));
    assert.equal(loaded.getItem(MATTERS_KEY), "[]");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("filled forms are built from the templates stored with the app", async () => {
  const plan = planDocuments(exampleWithChild(), { today: "2026-09-23" }).forms[0];
  assert.equal(TEMPLATES.has(plan.template), true);
  const bytes = await buildPdf(plan, await readFile(new URL(`../${plan.template}`, import.meta.url)));
  const saved = await PDFDocument.load(bytes);
  assert.equal(
    saved.getForm().getTextField("FL-100[0].Page1[0].CaptionP1_sf[0].TitlePartyName[0].Party1_ft[0]").getText(),
    "ALEX RIVERA",
  );
  await assert.rejects(() => buildPdf(plan), /this computer/);
});
