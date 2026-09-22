import assert from "node:assert/strict";
import test from "node:test";
import {
  addYears,
  elapsedYearsMonths,
  exampleSummary,
  exampleWithChild,
  formatElapsed,
  isNotMoreThanFiveYears,
  lookupVenue,
  parseISODate,
  recommend,
  validateStep,
  visibleSteps,
} from "../js/engine.js";

test("five-year limit uses the anniversary and clamps February 29", () => {
  assert.equal(isNotMoreThanFiveYears("2020-01-15", "2025-01-15"), true);
  assert.equal(isNotMoreThanFiveYears("2020-01-15", "2025-01-16"), false);
  assert.equal(isNotMoreThanFiveYears("2020-02-29", "2025-02-28"), true);
  assert.equal(isNotMoreThanFiveYears("2020-02-29", "2025-03-01"), false);
  assert.deepEqual(addYears(parseISODate("2020-02-29"), 5), { y: 2025, m: 2, d: 28 });
  assert.equal(isNotMoreThanFiveYears("2024-05-01", "2024-04-30"), false);
  assert.equal(isNotMoreThanFiveYears("not-a-date", "2024-01-01"), null);
});

test("elapsed years and months match the statistical-facts count", () => {
  assert.deepEqual(elapsedYearsMonths("2014-04-02", "2024-08-01"), { years: 10, months: 3 });
  assert.deepEqual(elapsedYearsMonths("2014-04-02", "2024-04-02"), { years: 10, months: 0 });
  assert.deepEqual(elapsedYearsMonths("2014-04-02", "2024-04-01"), { years: 9, months: 11 });
  assert.equal(formatElapsed({ years: 10, months: 3 }), "10 years, 3 months");
  assert.equal(elapsedYearsMonths("2024-01-02", "2024-01-01"), null);
});

test("venue chart resolves branches and keeps ambiguous ZIPs ambiguous", () => {
  assert.equal(lookupVenue("93301", "Bakersfield").court, "METRO");
  assert.equal(lookupVenue("93301-1234").court, "METRO");
  assert.equal(lookupVenue("93263").court, "SHAFTER");
  assert.equal(lookupVenue("93555", "Ridgecrest").court, "RIDGECREST");
  assert.equal(lookupVenue("93215").court, "DELANO");
  assert.equal(lookupVenue("93216").court, "DELANO");
  assert.equal(lookupVenue("93280", "Wasco").court, "SHAFTER");
  assert.equal(lookupVenue("93280", "Pond").court, "DELANO");
  assert.equal(lookupVenue("93280").status, "ambiguous");
  assert.equal(lookupVenue("93518", "Havilah").court, "RIDGECREST");
  assert.equal(lookupVenue("93518", "Caliente").court, "MOJAVE");
  assert.equal(lookupVenue("90210").status, "unknown");
  assert.equal(lookupVenue("").status, "empty");
});

test("a short agreed marriage with no children becomes a summary dissolution", () => {
  const result = recommend(exampleSummary());
  assert.equal(result.id, "summary");
  assert.equal(result.localPacket.code, "DISSO-06");
  const codes = result.formsNow.map((form) => form.code);
  assert.ok(codes.includes("FL-800"));
  assert.ok(codes.includes("FL-810"));
  assert.ok(codes.includes("FL-150"));
  assert.equal(codes.includes("FL-100"), false);
  assert.equal(codes.includes("FL-110"), false);
  assert.equal(result.venue.court, "METRO");
  const length = result.worksheet
    .flatMap((section) => section.rows)
    .find((row) => row.label === "Length to separation");
  assert.equal(length.value, "2 years, 5 months");
  assert.match(result.timeline.map((item) => item.when).join(" "), /six months/i);
});

test("a divorce with a child stays on the regular petition and adds Kern attachments", () => {
  const result = recommend(exampleWithChild());
  assert.equal(result.id, "regular");
  assert.equal(result.localPacket.code, "DISSO-05");
  const now = result.formsNow.map((form) => form.code);
  for (const code of ["FL-100", "FL-110", "FL-120", "FL-105", "FL-311", "FL-160", "FW-001", "FW-003"]) {
    assert.ok(now.includes(code), `missing ${code}`);
  }
  assert.equal(now.includes("FL-105(A)"), false);
  assert.equal(now.includes("FL-800"), false);
  const later = result.formsLater.map((form) => form.code);
  assert.ok(later.includes("FL-115"));
  assert.ok(later.includes("FL-141"));
  assert.match(result.feeNote, /fee waiver/i);
  assert.ok(result.warnings.some((warning) => /Request for Order/i.test(warning.text)));
  assert.ok(result.warnings.some((warning) => /does not calculate child support/i.test(warning.text)));
  assert.equal(result.venue.courthouse.name, "Metro-Justice Building");
});

test("more than two children adds the UCCJEA attachment", () => {
  const answers = exampleWithChild();
  answers.children.list.push(
    { name: "Robin Rivera", dob: "2016-01-02", birthPlace: "Bakersfield", sex: "", residence: "Bakersfield" },
    { name: "Casey Rivera", dob: "2019-05-05", birthPlace: "Bakersfield", sex: "", residence: "Bakersfield" },
  );
  const result = recommend(answers);
  assert.ok(result.formsNow.some((form) => form.code === "FL-105(A)"));
});

test("summary facts filed by one person stay on FL-100 and mention the shorter path", () => {
  const answers = exampleSummary();
  answers.filingStyle = "solo";
  const result = recommend(answers);
  assert.equal(result.id, "regular");
  assert.match(result.warnings[0].text, /FL-800/);
  assert.ok(result.formsNow.some((form) => form.code === "FL-100"));
});

test("disagreement blocks summary dissolution even when the property limits fit", () => {
  const answers = exampleSummary();
  answers.filingStyle = "contested";
  const result = recommend(answers);
  assert.equal(result.id, "regular");
  assert.match(result.warnings.map((warning) => warning.text).join(" "), /disagree/i);
});

test("an agreed case with a child uses the joint petition rather than summary dissolution", () => {
  const answers = exampleWithChild();
  answers.filingStyle = "joint";
  answers.property.bothWantToEnd = "yes";
  const result = recommend(answers);
  assert.equal(result.id, "joint");
  assert.equal(result.localPacket.code, "DISSO-12");
  const codes = result.formsNow.map((form) => form.code);
  assert.ok(codes.includes("FL-700"));
  assert.ok(codes.includes("FL-710"));
  assert.ok(codes.includes("FL-105"));
  assert.equal(codes.includes("FL-100"), false);
  assert.match(result.feeNote, /870/);
});

test("residency failure stops a divorce and offers legal separation only as an alternate", () => {
  const answers = exampleSummary();
  answers.residency.caSixMonths = "no";
  answers.residency.kernThreeMonths = "no";
  answers.residency.eitherLivesInKern = "yes";
  const result = recommend(answers);
  assert.equal(result.id, "residency-wait");
  assert.equal(result.formsNow.length, 0);
  assert.ok(result.alternate.formsNow.some((form) => form.code === "FL-100"));
  assert.match(result.warnings[0].text, /Do not file a divorce/);
});

test("a same-sex exception filed outside the county of marriage is not a Kern case", () => {
  const answers = exampleSummary();
  answers.residency.sameSexException = "yes";
  answers.residency.marriedInKern = "no";
  answers.residency.caSixMonths = "no";
  const result = recommend(answers);
  assert.equal(result.id, "residency-wait");
  assert.equal(result.alternate, null);
  assert.match(result.reasons.join(" "), /county where you married/);
});

test("a California domestic partnership can proceed without the six-month rule", () => {
  const answers = exampleSummary();
  answers.relationship = "dp";
  answers.residency.caSixMonths = "no";
  answers.residency.kernThreeMonths = "no";
  answers.residency.dpRegisteredInCA = "yes";
  answers.residency.eitherLivesInKern = "yes";
  answers.residency.livesInCalifornia = "yes";
  const result = recommend(answers);
  assert.equal(result.id, "summary");
});

test("ending a marriage and a domestic partnership still needs marriage residency", () => {
  const answers = exampleSummary();
  answers.relationship = "both";
  answers.residency.caSixMonths = "no";
  answers.residency.kernThreeMonths = "no";
  answers.residency.dpRegisteredInCA = "yes";
  answers.residency.eitherLivesInKern = "yes";
  const result = recommend(answers);
  assert.equal(result.id, "residency-wait");
  assert.match(result.reasons.join(" "), /residency rule for the marriage/);
});

test("legal separation does not require six months when someone lives in Kern", () => {
  const answers = exampleWithChild();
  answers.goal = "legal-separation";
  answers.residency.caSixMonths = "no";
  answers.residency.kernThreeMonths = "no";
  answers.residency.eitherLivesInKern = "yes";
  const result = recommend(answers);
  assert.equal(result.id, "legal-separation");
  assert.match(result.lede, /does not end the marriage/);
  assert.ok(result.timeline.some((item) => /no six-month waiting period/i.test(item.what)));
});

test("legal separation is rejected when nobody lives in Kern", () => {
  const answers = exampleWithChild();
  answers.goal = "legal-separation";
  answers.residency.caSixMonths = "no";
  answers.residency.kernThreeMonths = "no";
  answers.residency.eitherLivesInKern = "no";
  answers.residency.livesInCalifornia = "yes";
  const result = recommend(answers);
  assert.equal(result.id, "venue");
});

test("nullity does not pick a ground or offer summary forms", () => {
  const answers = exampleWithChild();
  answers.goal = "nullity";
  const result = recommend(answers);
  assert.equal(result.id, "nullity");
  assert.ok(result.warnings.some((warning) => warning.level === "stop"));
  assert.equal(result.formsNow.some((form) => form.code === "FL-800"), false);
  assert.ok(result.formsNow.some((form) => form.code === "FL-100"));
  assert.deepEqual(visibleSteps(answers).includes("property"), false);
  assert.deepEqual(visibleSteps(answers).includes("requests"), false);
});

test("another county gets statewide forms without Kern filing steps", () => {
  const answers = exampleSummary();
  answers.residency.filingCounty = "other";
  const result = recommend(answers);
  assert.equal(result.id, "other-county");
  assert.match(result.filingSteps.join(" "), /Do not follow the Kern/);
});

test("a marriage of ten years warns before support is terminated", () => {
  const answers = exampleWithChild();
  answers.requests.spousalSupport = "terminate";
  const result = recommend(answers);
  assert.match(result.warnings.map((warning) => warning.text).join(" "), /10 years/);
});

test("unsafe contact produces a safety warning and hides the home address", () => {
  const answers = exampleWithChild();
  answers.safety.unsafeContact = "yes";
  const result = recommend(answers);
  assert.match(result.warnings[0].text, /911/);
  assert.match(result.warnings[0].text, /327-1091/);
  const address = result.worksheet.flatMap((section) => section.rows).find((row) => row.label === "Your mailing address");
  assert.match(address.value, /Left off this worksheet/);
  assert.doesNotMatch(address.value, /Eye Street/);
});

test("validation catches an inverted separation date and an adult child", () => {
  const answers = exampleSummary();
  answers.dates.separation = "2020-01-01";
  assert.ok(validateStep("dates", answers, { today: "2026-09-22" }).some((error) => /before the marriage/.test(error)));

  const withChild = exampleWithChild();
  withChild.children.list[0].dob = "2000-01-01";
  assert.ok(validateStep("children", withChild, { today: "2026-09-22" }).some((error) => /18 or older/.test(error)));
});

test("incomplete answers do not invent a path", () => {
  const result = recommend({ goal: "", relationship: "", filingStyle: "" });
  assert.equal(result.id, "incomplete");
});
