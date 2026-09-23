import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "../vendor/pdf-lib.min.js";
import { exampleSummary, exampleWithChild } from "../js/engine.js";
import {
  createMatter,
  loadMatterFile,
  matterTitle,
  nextFileNumber,
  upsertMatter,
} from "../js/matters.js";
import { planDocuments } from "../js/populate.js";

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
  };
}

test("a legacy wizard save becomes the first matter", () => {
  const storage = memoryStorage({
    "kern-lda-divorce-wizard-v1": JSON.stringify({
      step: "dates",
      answers: exampleSummary(),
      checks: { "read-0": true },
      visited: { welcome: true, dates: true },
    }),
  });
  const matters = loadMatterFile(storage);
  assert.equal(matters.length, 1);
  assert.equal(matters[0].fileNumber, "KLD-LEGACY");
  assert.equal(matters[0].wizard.step, "dates");
  assert.equal(matters[0].wizard.answers.people.you.name, "Alex Rivera");
  assert.equal(loadMatterFile(storage).length, 1);
});

test("file numbers increase inside the year and the matter list uses both names", () => {
  const storage = memoryStorage();
  const first = createMatter({ fileNumber: nextFileNumber([]) });
  upsertMatter(storage, first);
  const second = createMatter({ fileNumber: nextFileNumber(loadMatterFile(storage)) });
  second.wizard.answers.people.you.name = "Alex Rivera";
  second.wizard.answers.people.other.name = "Jordan Rivera";
  upsertMatter(storage, second);
  assert.equal(first.fileNumber, "KLD-2026-001");
  assert.equal(second.fileNumber, "KLD-2026-002");
  assert.equal(matterTitle(second), "Alex Rivera and Jordan Rivera");
});

test("a one-person Kern divorce with a child fills FL-100, FL-110, and FL-105", () => {
  const plan = planDocuments(exampleWithChild(), { today: "2026-09-23" });
  assert.equal(plan.pathId, "regular");
  assert.deepEqual(plan.forms.map((form) => form.id), ["FL-100", "FL-110", "FL-105"]);
  const petition = plan.forms[0];
  const values = Object.fromEntries(petition.text.map((entry) => [entry.name, entry.value]));
  assert.equal(values["FL-100[0].Page1[0].CaptionP1_sf[0].TitlePartyName[0].Party1_ft[0]"], "ALEX RIVERA");
  assert.equal(values["FL-100[0].Page1[0].CaptionP1_sf[0].CourtInfo[0].CrtCounty_ft[0]"], "KERN");
  assert.equal(values["FL-100[0].Page1[0].CaptionP1_sf[0].CourtInfo[0].Street_ft[0]"], "1215 Truxtun Avenue");
  assert.equal(values["FL-100[0].Page1[0].DateOfMarriage_dt[0]"], "04/02/2014");
  assert.equal(values["FL-100[0].Page1[0].MonthsSeparated_tf[0]"], "10");
  assert.equal(values["FL-100[0].Page1[0].MonthsSeparated_tf[1]"], "3");
  assert.equal(values["FL-100[0].Page1[0].MinorChildren_sf[0].Child1Name_tf[0]"], "Sam Rivera");
  assert.equal(values["FL-100[0].Page1[0].MinorChildren_sf[0].Child1Age_tf[0]"], "8");
  assert.ok(petition.checks.includes("FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].DissolutionOf_cb[0]"));
  assert.ok(petition.checks.includes("FL-100[0].Page1[0].PetitionerMeetsResidencyReqs_cb[0]"));
  assert.equal(petition.checks.includes("FL-100[0].Page1[0].ThereAreNoMinorChildren_cb[0]"), false);
  assert.equal(petition.checks.includes("FL-100[0].Page2[0].EndJurixReSupport[0]"), false);
  assert.ok(petition.checks.includes("FL-100[0].Page2[0].ReserveJurixSupportPet_cb[0]"));
  assert.match(values["FL-100[0].Page3[0].CommQuasiProperty_sf[0].ListProperty_ft[0]"], /House on Olive Drive/);
  assert.match(plan.forms[1].text.find((entry) => entry.name.endsWith("TextField2[0]")).value, /JORDAN RIVERA/);
  assert.equal(plan.forms[2].text.find((entry) => entry.name.endsWith("NumChildren[0]")).value, "1");
});

test("support is not terminated on a marriage of ten years or more", () => {
  const answers = exampleWithChild();
  answers.requests.spousalSupport = "terminate";
  const petition = planDocuments(answers, { today: "2026-09-23" }).forms[0];
  assert.equal(petition.checks.includes("FL-100[0].Page2[0].EndJurixReSupport[0]"), false);
  assert.match(petition.notes.join(" "), /10 years/);
});

test("an unsafe address is left off the petition", () => {
  const answers = exampleWithChild();
  answers.safety.unsafeContact = "yes";
  const petition = planDocuments(answers, { today: "2026-09-23" }).forms[0];
  assert.equal(petition.text.some((entry) => entry.value.includes("Eye Street")), false);
  assert.match(petition.notes.join(" "), /unsafe/);
});

test("summary dissolution does not produce an FL-100", () => {
  const plan = planDocuments(exampleSummary(), { today: "2026-09-23" });
  assert.equal(plan.pathId, "summary");
  assert.equal(plan.forms.length, 0);
  assert.match(plan.unavailable, /FL-800/);
});

test("the planned fields exist on the official forms and accept the intake", async () => {
  const plan = planDocuments(exampleWithChild(), { today: "2026-09-23" });
  for (const formPlan of plan.forms) {
    const doc = await PDFDocument.load(await readFile(new URL(`../${formPlan.template}`, import.meta.url)));
    const form = doc.getForm();
    for (const entry of formPlan.text) form.getTextField(entry.name).setText(entry.value);
    for (const name of formPlan.checks) form.getCheckBox(name).check();
    if (formPlan.id === "FL-100") {
      assert.equal(form.getTextField("FL-100[0].Page1[0].CaptionP1_sf[0].TitlePartyName[0].Party1_ft[0]").getText(), "ALEX RIVERA");
      assert.equal(form.getCheckBox("FL-100[0].Page1[0].WeAreMarried_cb[0]").isChecked(), true);
    }
  }
});
