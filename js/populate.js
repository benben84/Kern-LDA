import {
  ageOn,
  elapsedYearsMonths,
  lookupVenue,
  recommend,
  todayISO,
} from "./engine.js";

const FL100 = {
  attyName: "FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].AttyName_ft[0]",
  attyFor: "FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].AttyFor_ft[0]",
  attyStreet: "FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].AttyStreet_ft[0]",
  attyCity: "FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].AttyCity_ft[0]",
  attyState: "FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].AttyState_ft[0]",
  attyZip: "FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].AttyZip_ft[0]",
  phone: "FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].Phone_ft[0]",
  email: "FL-100[0].Page1[0].CaptionP1_sf[0].AttyInfo[0].Email_ft[0]",
  county: "FL-100[0].Page1[0].CaptionP1_sf[0].CourtInfo[0].CrtCounty_ft[0]",
  branch: "FL-100[0].Page1[0].CaptionP1_sf[0].CourtInfo[0].Branch_ft[0]",
  cityZip: "FL-100[0].Page1[0].CaptionP1_sf[0].CourtInfo[0].CityZip_ft[0]",
  street: "FL-100[0].Page1[0].CaptionP1_sf[0].CourtInfo[0].Street_ft[0]",
  mailing: "FL-100[0].Page1[0].CaptionP1_sf[0].CourtInfo[0].MailingAdd_ft[0]",
  party1: "FL-100[0].Page1[0].CaptionP1_sf[0].TitlePartyName[0].Party1_ft[0]",
  party2: "FL-100[0].Page1[0].CaptionP1_sf[0].TitlePartyName[0].Party2_ft[0]",
  party1p2: "FL-100[0].Page2[0].Parties[0].Party1_ft[0]",
  party2p2: "FL-100[0].Page2[0].Parties[0].Party2_ft[0]",
  party1p3: "FL-100[0].Page3[0].Parties[0].Party1_ft[0]",
  party2p3: "FL-100[0].Page3[0].Parties[0].Party2_ft[0]",
  dissolution: "FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].DissolutionOf_cb[0]",
  separation: "FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].LegalSeparationOf_cb[0]",
  nullity: "FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].NullityOf_cb[0]",
  marriage0: "FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].Marriage_cb[0]",
  marriage1: "FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].Marriage_cb[1]",
  marriage2: "FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].Marriage_cb[2]",
  dp0: "FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].DomesticPartnership_cb[0]",
  dp1: "FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].DomesticPartnership_cb[1]",
  dp2: "FL-100[0].Page1[0].CaptionP1_sf[0].FormTitle[0].DomesticPartnership_cb[2]",
  married: "FL-100[0].Page1[0].WeAreMarried_cb[0]",
  dpCa: "FL-100[0].Page1[0].DPEstablishedInCalifornia[0]",
  dpNotCa: "FL-100[0].Page1[0].DPNOTEstablishedinCA_cb[0]",
  petitionerResidency: "FL-100[0].Page1[0].PetitionerMeetsResidencyReqs_cb[0]",
  respondentResidency: "FL-100[0].Page1[0].RespondentMeetsResidencyReqs_cb[0]",
  sameSex: "FL-100[0].Page1[0].SameSexMarriedInCA_cb[0]",
  petitionerLives: "FL-100[0].Page1[0].PetitionersResidence_tf[0]",
  respondentLives: "FL-100[0].Page1[0].RespondentsResidence_tf[0]",
  marriageDate: "FL-100[0].Page1[0].DateOfMarriage_dt[0]",
  separationDate: "FL-100[0].Page1[0].DateOfSeparation_dt[0]",
  dpDate: "FL-100[0].Page1[0].DateTimeField1[0]",
  dpSeparation: "FL-100[0].Page1[0].DatePartnersSeparated_dt[0]",
  years: "FL-100[0].Page1[0].MonthsSeparated_tf[0]",
  months: "FL-100[0].Page1[0].MonthsSeparated_tf[1]",
  dpMonths: "FL-100[0].Page1[0].MonthsSeparated_tf[2]",
  dpYears: "FL-100[0].Page1[0].MonthsSeparated_tf[3]",
  noChildren: "FL-100[0].Page1[0].ThereAreNoMinorChildren_cb[0]",
  childrenList: "FL-100[0].Page1[0].MinorChildren_sf[0].MinorChildrenList_cb[0]",
  unborn: "FL-100[0].Page1[0].MinorChildren_sf[0].UnbornChild_cb[0]",
  divorceGround: "FL-100[0].Page2[0].SepTypeDef_cb[1]",
  separationGround: "FL-100[0].Page2[0].SepTypeDef_cb[0]",
  irreconcilable: "FL-100[0].Page2[0].SepBasis_cb[0]",
  legalYou: "FL-100[0].Page2[0].ToPetitioner_cb[0]",
  legalOther: "FL-100[0].Page2[0].ToRespondent_cb[0]",
  legalJoint: "FL-100[0].Page2[0].ToBothJointly_cb[0]",
  physicalYou: "FL-100[0].Page2[0].ToPetitioner_cb[1]",
  physicalOther: "FL-100[0].Page2[0].ToRespondent_cb[1]",
  physicalJoint: "FL-100[0].Page2[0].ToBothJointly_cb[1]",
  endSupport: "FL-100[0].Page2[0].EndJurixReSupport[0]",
  endPetitioner: "FL-100[0].Page2[0].EndJurixRePetitioner_cb[0]",
  endRespondent: "FL-100[0].Page2[0].EndJurixReRespondent_cb[0]",
  reservePetitioner: "FL-100[0].Page2[0].ReserveJurixSupportPet_cb[0]",
  reserveRespondent: "FL-100[0].Page2[0].ReserveJurixSupportResp_cb[0]",
  paySupport: "FL-100[0].Page2[0].PaySupport_cb[0]",
  payToPetitioner: "FL-100[0].Page2[0].PaySupporttoPetitioner_cb[0]",
  noSeparate: "FL-100[0].Page2[0].NoSeparateProperty_cb[0]",
  confirmSeparate: "FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].ConfirmSeparateProperty_cb[0]",
  separateList: "FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].WhereSPListed_cb[2]",
  separate1: "FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].SeparatePropertyList1_tf[0]",
  separate2: "FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].SeparatePropertyList2_tf[0]",
  separateTo1: "FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].ConfirmPropertyList1To_tf[0]",
  separateTo2: "FL-100[0].Page2[0].ConfirmSeparateProperty_sf[0].ConfirmPropertyList2To_tf[0]",
  noCommunity: "FL-100[0].Page3[0].NoCommOrQuasiCommProperty_cb[0]",
  communityListed: "FL-100[0].Page3[0].CommQuasiProperty_sf[0].PropertyListed_cb[0]",
  communityWhere: "FL-100[0].Page3[0].CommQuasiProperty_sf[0].WhereCPListed_cb[2]",
  communityText: "FL-100[0].Page3[0].CommQuasiProperty_sf[0].ListProperty_ft[0]",
  restoreName: "FL-100[0].Page3[0].RestoreFormerName_cb[0]",
  formerName: "FL-100[0].Page3[0].SpecifyFormerName_tf[0]",
  printName: "FL-100[0].Page3[0].PrintPetitionerName_tf[0]",
};

const childFields = [
  ["Child1Name_tf[0]", "Child1Birthdate_dt[0]", "Child1Age_tf[0]"],
  ["Child2Name_tf[0]", "Child2Birthdate_dt[0]", "Child2Age_tf[0]"],
  ["Child3Name_tf[0]", "Child3Date_dt[0]", "Child3Age_tf[0]"],
  ["Child4Name_tf[0]", "Child4Birthdate_dt[0]", "Child4Age_tf[0]"],
];

const FL110 = {
  respondent: "topmostSubform[0].Page1[0].TextField2[0]",
  respondentSpanish: "topmostSubform[0].Page1[0].#field[7]",
  petitioner: "topmostSubform[0].Page1[0].TextField2[1]",
  petitionerSpanish: "topmostSubform[0].Page1[0].#field[8]",
  court: "topmostSubform[0].Page1[0].OtherSpecify_tf[0]",
  contact: "topmostSubform[0].Page1[0].T89[0]",
};

const FL105 = {
  name: "FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].AttyName_ft[0]",
  street: "FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].AttyStreet_ft[0]",
  city: "FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].AttyCity_ft[0]",
  state: "FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].AttyState_ft[0]",
  zip: "FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].AttyZip_ft[0]",
  phone: "FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].Phone[0]",
  email: "FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].Email[0]",
  forParty: "FL-105[0].Page1[0].P1Caption[0].AttyInfo[0].Name[0]",
  county: "FL-105[0].Page1[0].P1Caption[0].CrtInfo[0].CrtCounty[0]",
  crtStreet: "FL-105[0].Page1[0].P1Caption[0].CrtInfo[0].CrtStreet[0]",
  crtMail: "FL-105[0].Page1[0].P1Caption[0].CrtInfo[0].CrtMailingAdd[0]",
  crtCity: "FL-105[0].Page1[0].P1Caption[0].CrtInfo[0].CrtCityZip[0]",
  branch: "FL-105[0].Page1[0].P1Caption[0].CrtInfo[0].CrtBranch[0]",
  party1: "FL-105[0].Page1[0].P1Caption[0].ProbateParty[0].Party1[0]",
  party2: "FL-105[0].Page1[0].P1Caption[0].ProbateParty[0].Party2[0]",
  isParty: "FL-105[0].Page1[0].List1[0].Li1[0].Party[0].PartyRepCB[0]",
  count: "FL-105[0].Page1[0].List2[0].Li1[0].NumChildren[0]",
};

const PETITION_PATHS = new Set(["regular", "legal-separation", "nullity"]);

export function planDocuments(answers, options = {}) {
  const today = options.today || todayISO();
  const result = recommend(answers);
  if (!PETITION_PATHS.has(result.id)) {
    return {
      pathId: result.id,
      forms: [],
      unavailable: unavailableReason(result),
    };
  }
  const forms = [planFl100(answers, today, result), planFl110(answers)];
  if (answers.children.hasMinors === "yes") forms.push(planFl105(answers, today));
  return { pathId: result.id, forms, unavailable: "" };
}

function planFl100(answers, today, result) {
  const text = [];
  const checks = [];
  const notes = [];
  const you = answers.people.you;
  const other = answers.people.other;
  const party1 = caps(you.name);
  const party2 = caps(other.name);
  const hideAddress = answers.safety.unsafeContact === "yes";
  const court = courtBlock(answers);

  put(text, FL100.attyName, you.name.trim());
  put(text, FL100.attyFor, you.name.trim() ? "Self-represented petitioner" : "");
  if (!hideAddress) {
    put(text, FL100.attyStreet, you.address);
    put(text, FL100.attyCity, you.city);
    put(text, FL100.attyState, you.state);
    put(text, FL100.attyZip, you.zip);
    put(text, FL100.phone, you.phone);
    put(text, FL100.email, you.email);
  } else {
    notes.push("The client’s street address was left off FL-100 because the matter is marked unsafe.");
  }
  put(text, FL100.county, "KERN");
  put(text, FL100.street, court.street);
  put(text, FL100.mailing, court.street);
  put(text, FL100.cityZip, court.cityZip);
  put(text, FL100.branch, court.branch);
  if (!court.street) notes.push("The Kern branch address is blank. Confirm Appendix A before this petition is filed.");
  for (const field of [FL100.party1, FL100.party1p2, FL100.party1p3]) put(text, field, party1);
  for (const field of [FL100.party2, FL100.party2p2, FL100.party2p3]) put(text, field, party2);
  put(text, FL100.printName, you.name.trim());

  const titleIndex = { dissolution: 0, nullity: 1, "legal-separation": 2 }[answers.goal];
  if (answers.goal === "dissolution") checks.push(FL100.dissolution);
  if (answers.goal === "legal-separation") checks.push(FL100.separation);
  if (answers.goal === "nullity") {
    checks.push(FL100.nullity);
    notes.push("No nullity ground was checked. Choose the ground with the client before anyone signs.");
  }
  if (answers.relationship === "marriage" || answers.relationship === "both") {
    checks.push([FL100.marriage0, FL100.marriage1, FL100.marriage2][titleIndex]);
    checks.push(FL100.married);
  }
  if (answers.relationship === "dp" || answers.relationship === "both") {
    checks.push([FL100.dp0, FL100.dp1, FL100.dp2][titleIndex]);
    if (answers.residency.dpRegisteredInCA === "yes") checks.push(FL100.dpCa);
    else if (answers.residency.dpRegisteredInCA === "no") checks.push(FL100.dpNotCa);
    else notes.push("The domestic-partnership registration box was left blank.");
  }

  if (answers.residency.whoMeetsResidency === "you" || answers.residency.whoMeetsResidency === "both") {
    checks.push(FL100.petitionerResidency);
  }
  if (answers.residency.whoMeetsResidency === "other" || answers.residency.whoMeetsResidency === "both") {
    checks.push(FL100.respondentResidency);
  }
  if (answers.residency.sameSexException === "yes") {
    checks.push(FL100.sameSex);
    put(text, FL100.petitionerLives, [you.city, you.state].filter(Boolean).join(", "));
    put(text, FL100.respondentLives, [other.city, other.state].filter(Boolean).join(", "));
  }

  const marriageOnly = answers.relationship !== "dp";
  const elapsed = elapsedYearsMonths(answers.dates.marriage, answers.dates.separation);
  if (marriageOnly) {
    put(text, FL100.marriageDate, usDate(answers.dates.marriage));
    if (!answers.dates.separationUnknown) put(text, FL100.separationDate, usDate(answers.dates.separation));
    if (elapsed) {
      put(text, FL100.years, String(elapsed.years));
      put(text, FL100.months, String(elapsed.months));
    }
  } else {
    put(text, FL100.dpDate, usDate(answers.dates.marriage));
    if (!answers.dates.separationUnknown) put(text, FL100.dpSeparation, usDate(answers.dates.separation));
    if (elapsed) {
      put(text, FL100.dpYears, String(elapsed.years));
      put(text, FL100.dpMonths, String(elapsed.months));
    }
  }
  if (answers.dates.separationUnknown) notes.push("The date of separation is missing, so that line was left blank.");

  const children = oldestFirst(answers.children.list);
  if (answers.children.hasMinors === "yes" && children.length) {
    checks.push(FL100.childrenList);
    children.slice(0, 4).forEach((child, index) => {
      const [nameField, birthField, ageField] = childFields[index];
      put(text, `FL-100[0].Page1[0].MinorChildren_sf[0].${nameField}`, child.name.trim());
      put(text, `FL-100[0].Page1[0].MinorChildren_sf[0].${birthField}`, usDate(child.dob));
      const age = ageOn(child.dob, today);
      if (age !== null && age >= 0) put(text, `FL-100[0].Page1[0].MinorChildren_sf[0].${ageField}`, String(age));
    });
    if (children.length > 4) notes.push("FL-100 has four child lines. List the remaining children on an attachment.");
  } else if (answers.children.hasMinors !== "yes" && answers.children.pregnant !== "yes") {
    checks.push(FL100.noChildren);
  }
  if (answers.children.pregnant === "yes") checks.push(FL100.unborn);

  if (answers.goal !== "nullity") {
    if (answers.goal === "dissolution") checks.push(FL100.divorceGround);
    if (answers.goal === "legal-separation") checks.push(FL100.separationGround);
    if (answers.requests.ground === "irreconcilable") checks.push(FL100.irreconcilable);
    else notes.push("Incurable insanity was not checked. That ground needs a lawyer’s review.");
  }

  markCustody(checks, answers.requests.legalCustody, FL100.legalYou, FL100.legalOther, FL100.legalJoint);
  markCustody(checks, answers.requests.physicalCustody, FL100.physicalYou, FL100.physicalOther, FL100.physicalJoint);
  if (answers.requests.childSupport === "guideline") {
    notes.push("The child-support payable-by boxes were left blank. Guideline support does not say who pays.");
  }

  fillSupport(checks, notes, answers, elapsed);
  fillProperty(text, checks, notes, answers);

  if (answers.requests.restoreYourName === "yes" && answers.requests.yourFormerName.trim()) {
    checks.push(FL100.restoreName);
    put(text, FL100.formerName, answers.requests.yourFormerName.trim());
  }

  if (!party1 || !party2) notes.push("A party name is missing. The caption was only partly filled.");
  if (result.id === "nullity") notes.push("Review the nullity section with the client before the form is signed.");

  return formPlan("FL-100", "Petition — Marriage/Domestic Partnership", "forms/fl-100.pdf", text, checks, notes, you.name);
}

function planFl110(answers) {
  const text = [];
  const notes = [];
  const you = answers.people.you;
  const other = answers.people.other;
  const court = courtBlock(answers);
  put(text, FL110.respondent, caps(other.name));
  put(text, FL110.respondentSpanish, caps(other.name));
  put(text, FL110.petitioner, caps(you.name));
  put(text, FL110.petitionerSpanish, caps(you.name));
  const courtLines = ["Superior Court of California, County of Kern", court.branch, court.street, court.cityZip].filter(Boolean);
  put(text, FL110.court, courtLines.join("\n"));
  if (answers.safety.unsafeContact === "yes") {
    notes.push("The summons contact block has the client’s name only. Add a safe mailing address before service.");
    put(text, FL110.contact, `${you.name.trim()}, self-represented`);
  } else {
    put(text, FL110.contact, [
      `${you.name.trim()}, self-represented`,
      you.address,
      [you.city, you.state, you.zip].filter(Boolean).join(", ").replace(", CA,", ", CA"),
      you.phone,
      you.email,
    ].filter(Boolean).join("\n"));
  }
  notes.push("The case number, clerk signature, and issuance date stay blank. The court fills those when the summons is issued.");
  return formPlan("FL-110", "Summons (Family Law)", "forms/fl-110.pdf", text, [], notes, you.name);
}

function planFl105(answers, today) {
  const text = [];
  const checks = [];
  const notes = ["The five-year residence history and other-case section of FL-105 are not filled. Complete those boxes before filing."];
  const you = answers.people.you;
  const other = answers.people.other;
  const court = courtBlock(answers);
  const hideAddress = answers.safety.unsafeContact === "yes";
  put(text, FL105.name, you.name.trim());
  put(text, FL105.forParty, "Self-represented petitioner");
  if (!hideAddress) {
    put(text, FL105.street, you.address);
    put(text, FL105.city, you.city);
    put(text, FL105.state, you.state);
    put(text, FL105.zip, you.zip);
    put(text, FL105.phone, you.phone);
    put(text, FL105.email, you.email);
  }
  put(text, FL105.county, "KERN");
  put(text, FL105.crtStreet, court.street);
  put(text, FL105.crtMail, court.street);
  put(text, FL105.crtCity, court.cityZip);
  put(text, FL105.branch, court.branch);
  put(text, FL105.party1, caps(you.name));
  put(text, FL105.party2, caps(other.name));
  checks.push(FL105.isParty);
  const children = oldestFirst(answers.children.list);
  put(text, FL105.count, String(children.length));
  const nameFields = ["TextField7[0]", "TextField8[0]", "TextField8[0]", "TextField8[0]"];
  children.slice(0, 4).forEach((child, index) => {
    const row = index + 1;
    const base = `FL-105[0].Page1[0].List2[0].Li1[0].Table[0].Row${row}[0]`;
    put(text, `${base}.${nameFields[index]}`, child.name.trim());
    put(text, `${base}.TextField1[0]`, usDate(child.dob));
    put(text, `${base}.TextField2[0]`, child.birthPlace);
  });
  if (children.length > 4) notes.push("FL-105’s first page lists four children. Continue the rest on FL-105(A).");
  if (answers.children.otherCases === "yes") notes.push("Another court case was reported. Fill that part of FL-105 by hand.");
  void today;
  return formPlan("FL-105", "Declaration under the UCCJEA", "forms/fl-105.pdf", text, checks, notes, you.name);
}

function fillSupport(checks, notes, answers, elapsed) {
  const request = answers.requests.spousalSupport;
  const longMarriage = elapsed && elapsed.years >= 10;
  if (request === "terminate") {
    if (longMarriage) {
      notes.push("Spousal-support termination was not checked. This marriage is 10 years or longer, and Kern’s handout says jurisdiction is reserved unless a written agreement says otherwise.");
      return;
    }
    checks.push(FL100.endSupport, FL100.endPetitioner, FL100.endRespondent);
  } else if (request === "reserve") {
    checks.push(FL100.reservePetitioner, FL100.reserveRespondent);
  } else if (request === "requesting") {
    checks.push(FL100.paySupport, FL100.payToPetitioner);
  }
}

function fillProperty(text, checks, notes, answers) {
  const separate = answers.requests.assets.filter((asset) => asset.description.trim() && (asset.kind === "your-separate" || asset.kind === "other-separate"));
  const community = [
    ...answers.requests.assets.filter((asset) => asset.description.trim() && asset.kind !== "your-separate" && asset.kind !== "other-separate"),
    ...answers.requests.debts.filter((debt) => debt.description.trim()).map((debt) => ({ description: `Debt: ${debt.description.trim()}`, award: debt.whoPays })),
  ];
  if (answers.requests.propertyPlan === "none" && !separate.length && !community.length) {
    checks.push(FL100.noSeparate, FL100.noCommunity);
    return;
  }
  if (separate.length) {
    checks.push(FL100.confirmSeparate, FL100.separateList);
    separate.slice(0, 2).forEach((asset, index) => {
      put(text, index === 0 ? FL100.separate1 : FL100.separate2, asset.description.trim());
      put(text, index === 0 ? FL100.separateTo1 : FL100.separateTo2, awardName(asset.award, answers));
    });
    if (separate.length > 2) notes.push("Only two separate-property lines were filled on FL-100. Put the rest on FL-160.");
  } else if (!community.length) {
    checks.push(FL100.noSeparate);
  }
  if (community.length) {
    checks.push(FL100.communityListed, FL100.communityWhere);
    put(text, FL100.communityText, community.map((item) => item.description.trim()).join("; ").slice(0, 180));
    notes.push("Community property on FL-100 is a short list. Complete FL-160 with dates and values before filing.");
  } else if (answers.requests.propertyPlan === "none") {
    checks.push(FL100.noCommunity);
  }
}

function markCustody(checks, value, you, other, joint) {
  if (value === "you") checks.push(you);
  if (value === "other") checks.push(other);
  if (value === "joint") checks.push(joint);
}

function courtBlock(answers) {
  const venue = lookupVenue(answers.people.you.zip, answers.people.you.city);
  if (venue.status !== "match") return { street: "", cityZip: "", branch: "" };
  const [street, ...rest] = venue.courthouse.address.split(", ");
  return { street, cityZip: rest.join(", "), branch: venue.courthouse.name };
}

function formPlan(id, title, template, text, checks, notes, clientName) {
  const slug = (clientName || "matter").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "matter";
  return {
    id,
    title,
    template,
    filename: `${id}-${slug}.pdf`,
    text: text.filter((entry) => entry.value),
    checks,
    notes,
    ready: text.some((entry) => entry.name.endsWith("Party1_ft[0]") && entry.value) || text.some((entry) => entry.value),
  };
}

function unavailableReason(result) {
  if (result.id === "summary") return "This is a joint summary dissolution. FL-800 is not in the autofill set yet. Use the worksheet and the official FL-800.";
  if (result.id === "joint" || result.id === "legal-separation-joint") return "This is a joint petition. FL-700 and FL-710 are not in the autofill set yet. Use the worksheet and the official joint forms.";
  if (result.id === "residency-wait") return "A Kern petition was not filled because the divorce residency answers do not support filing yet.";
  if (result.id === "other-county" || result.id === "venue") return "No Kern petition was filled because these answers do not place the case in Kern.";
  return "Finish the divorce wizard before preparing forms. The petition is filled only for a one-person Kern case.";
}

function oldestFirst(list) {
  return [...(list || [])]
    .filter((child) => child.name && child.name.trim())
    .sort((a, b) => String(a.dob || "9999").localeCompare(String(b.dob || "9999")));
}

function awardName(award, answers) {
  if (award === "you") return answers.people.you.name.trim();
  if (award === "other") return answers.people.other.name.trim();
  if (award === "sell") return "Sell and divide";
  return "";
}

function put(list, name, value) {
  const clean = String(value ?? "").trim();
  if (!clean) return;
  list.push({ name, value: clean });
}

function caps(value) {
  return String(value ?? "").trim().toUpperCase();
}

function usDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!match) return "";
  return `${match[2]}/${match[3]}/${match[1]}`;
}
