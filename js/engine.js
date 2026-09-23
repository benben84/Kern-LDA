/**
 * Kern County divorce preparation logic.
 * This module decides a paperwork path and maps answers onto official form fields.
 * It does not give legal advice and it does not produce a fileable court form.
 *
 * Summary-dissolution dollar limits are the amounts published on Judicial Council
 * forms FL-800 and FL-810 effective April 28, 2025. Update them when the Council
 * publishes new figures.
 */

export const LIMITS = {
  asOf: "April 28, 2025",
  communityProperty: 57000,
  separateProperty: 57000,
  communityDebt: 7000,
  forms: "FL-800 and FL-810",
};

export const LINKS = {
  packets: "https://www.kern.courts.ca.gov/self-help/self-help-court-form-packets",
  fees: "https://www.kern.courts.ca.gov/forms/Fees",
  efile: "https://www.kern.courts.ca.gov/online_services/efile",
  workshops: "https://www.kern.courts.ca.gov/online_services/family_law_workshops",
  portal: "https://odyprodportal.kern.courts.ca.gov/portalprod",
  localRules: "https://www.kern.courts.ca.gov/local_rules_of_court",
  courtHome: "https://www.kern.courts.ca.gov/",
  facilitatorEmail: "mailto:WMFacil@kern.courts.ca.gov",
  divorceGuide: "https://selfhelp.courts.ca.gov/divorce",
  forms: "https://selfhelp.courts.ca.gov/forms",
  summaryQualifications:
    "https://selfhelp.courts.ca.gov/divorce-california/summary-dissolution/qualifications",
  jointGuide: "https://selfhelp.courts.ca.gov/divorce/joint-petition",
  feeWaiver: "https://selfhelp.courts.ca.gov/fee-waiver",
  childSupport: "https://childsupport.ca.gov/calculate-child-support/",
  openDoor: "https://opendoorhelps.org/",
  familyJusticeCenter: "https://kcfjc.org/",
  lawLibrary: "https://www.kclawlib.org/",
};

export const COURTHOUSES = {
  METRO: {
    name: "Metro-Justice Building",
    address: "1215 Truxtun Avenue, Bakersfield, CA 93301",
    phone: "(661) 868-5393",
  },
  DELANO: {
    name: "North Kern Division – Delano Branch",
    address: "1122 Jefferson Street, Delano, CA 93215",
    phone: "(661) 720-5800",
  },
  SHAFTER: {
    name: "North Kern Division – Shafter/Wasco Branch",
    address: "325 Central Valley Highway, Shafter, CA 93263",
    phone: "(661) 746-7500",
  },
  MOJAVE: {
    name: "East Kern Division – Mojave Branch",
    address: "1773 Highway 58, Mojave, CA 93501",
    phone: "(661) 824-7100",
  },
  RIDGECREST: {
    name: "East Kern Division – Ridgecrest Branch",
    address: "132 East Coso Street, Ridgecrest, CA 93555",
    phone: "(760) 384-5900",
  },
};

const VENUE_SOURCE =
  "Kern Family Law Facilitator venue chart, rev. 02/2020, published with the court's divorce handout. Confirm Appendix A of the Kern County local rules before you file. Branches and phone numbers change.";

/** City / ZIP rows transcribed from that chart. A repeated ZIP with two courts is left ambiguous unless the city matches. */
const VENUE_ROWS = [
  ["93285", "Alta Sierra", "RIDGECREST"],
  ["93203", "Arvin", "METRO"],
  ["93301", "Bakersfield", "METRO"],
  ["93302", "Bakersfield", "METRO"],
  ["93303", "Bakersfield", "METRO"],
  ["93304", "Bakersfield", "METRO"],
  ["93305", "Bakersfield", "METRO"],
  ["93306", "Bakersfield", "METRO"],
  ["93307", "Bakersfield", "METRO"],
  ["93308", "Bakersfield", "METRO"],
  ["93309", "Bakersfield", "METRO"],
  ["93311", "Bakersfield", "METRO"],
  ["93312", "Bakersfield", "METRO"],
  ["93314", "Bakersfield", "METRO"],
  ["93561", "Bear Valley Springs", "MOJAVE"],
  ["93251", "Belridge", "SHAFTER"],
  ["93205", "Bodfish", "RIDGECREST"],
  ["93596", "Boron", "MOJAVE"],
  ["93527", "Brady", "RIDGECREST"],
  ["93206", "Buttonwillow", "SHAFTER"],
  ["93518", "Caliente", "MOJAVE"],
  ["93505", "California City", "MOJAVE"],
  ["93255", "Canebrake", "RIDGECREST"],
  ["93519", "Cantil", "MOJAVE"],
  ["93555", "China Lake", "RIDGECREST"],
  ["93215", "Delano", "DELANO"],
  ["93216", "Delano", "DELANO"],
  ["93268", "Derby Acres", "METRO"],
  ["93203", "DiGiorgio", "METRO"],
  ["93268", "Dustin Acres", "METRO"],
  ["93220", "Edison", "METRO"],
  ["93523", "Edwards", "MOJAVE"],
  ["93250", "Elmo", "DELANO"],
  ["93250", "Famoso", "DELANO"],
  ["93224", "Fellows", "METRO"],
  ["93268", "Ford City", "METRO"],
  ["93268", "Fort Tejon", "METRO"],
  ["93225", "Frazier Park", "METRO"],
  ["93519", "Fremont Valley", "MOJAVE"],
  ["93519", "Garlock", "MOJAVE"],
  ["93226", "Glennville", "METRO"],
  ["93561", "Golden Hills", "MOJAVE"],
  ["93287", "Granite Station", "METRO"],
  ["93301", "Grapevine", "METRO"],
  ["93307", "Greenfield", "METRO"],
  ["93518", "Havilah", "RIDGECREST"],
  ["93527", "Inyokern", "RIDGECREST"],
  ["93528", "Johannesburg", "RIDGECREST"],
  ["93531", "Keene", "MOJAVE"],
  ["93238", "Kern River Valley", "RIDGECREST"],
  ["93238", "Kernville", "RIDGECREST"],
  ["93240", "Lake Isabella", "RIDGECREST"],
  ["93225", "Lake of the Woods", "METRO"],
  ["93241", "Lamont", "METRO"],
  ["93243", "Lebec", "METRO"],
  ["93249", "Lost Hills", "SHAFTER"],
  ["93252", "Maricopa", "METRO"],
  ["93250", "McFarland", "DELANO"],
  ["93251", "McKittrick", "METRO"],
  ["93301", "Mettler", "METRO"],
  ["93501", "Mojave", "MOJAVE"],
  ["93240", "Mountain Mesa", "RIDGECREST"],
  ["93523", "North Edwards", "MOJAVE"],
  ["93308", "Oildale", "METRO"],
  ["93255", "Onyx", "RIDGECREST"],
  ["93225", "Pine Mountain", "METRO"],
  ["93280", "Pond", "DELANO"],
  ["93313", "Pumpkin Center", "METRO"],
  ["93383", "Pumpkin Center", "METRO"],
  ["93554", "Randsburg", "RIDGECREST"],
  ["93261", "Richgrove", "DELANO"],
  ["93555", "Ridgecrest", "RIDGECREST"],
  ["93560", "Rosamond", "MOJAVE"],
  ["93263", "Shafter", "SHAFTER"],
  ["93268", "South Taft", "METRO"],
  ["93240", "Southlake", "RIDGECREST"],
  ["93240", "Squirrel Mountain Valley", "RIDGECREST"],
  ["93561", "Stallion Springs", "MOJAVE"],
  ["93268", "Taft", "METRO"],
  ["93268", "Taft Heights", "METRO"],
  ["93561", "Tehachapi", "MOJAVE"],
  ["93276", "Tupman", "METRO"],
  ["93518", "Twin Oaks", "MOJAVE"],
  ["93268", "Valley Acres", "METRO"],
  ["93250", "Vineland", "DELANO"],
  ["93518", "Walker Basin", "RIDGECREST"],
  ["93280", "Wasco", "SHAFTER"],
  ["93307", "Weedpatch", "METRO"],
  ["93283", "Weldon", "RIDGECREST"],
  ["93302", "Wheeler Ridge", "METRO"],
  ["93560", "Willow Springs", "MOJAVE"],
  ["93285", "Wofford Heights", "RIDGECREST"],
  ["93287", "Woody", "METRO"],
].map(([zip, city, court]) => ({ zip, city, court }));

export const STEPS = [
  { id: "welcome", title: "Start" },
  { id: "safety", title: "Safety" },
  { id: "case", title: "Case" },
  { id: "residency", title: "Residency" },
  { id: "children", title: "Children" },
  { id: "dates", title: "Dates" },
  { id: "property", title: "Property" },
  { id: "requests", title: "Requests" },
  { id: "people", title: "People" },
  { id: "fees", title: "Fees" },
  { id: "packet", title: "Packet" },
];

export function blankAnswers() {
  return {
    acceptedDisclaimer: false,
    safety: { unsafeContact: "" },
    goal: "",
    relationship: "",
    filingStyle: "",
    residency: {
      filingCounty: "",
      caSixMonths: "",
      kernThreeMonths: "",
      livesInCalifornia: "",
      eitherLivesInKern: "",
      whoMeetsResidency: "",
      dpRegisteredInCA: "",
      sameSexException: "",
      marriedInKern: "",
    },
    children: {
      hasMinors: "",
      pregnant: "",
      otherCases: "",
      livedOutOfState: "",
      list: [],
    },
    dates: {
      marriage: "",
      separation: "",
      separationUnknown: false,
      place: "",
    },
    property: {
      realEstate: "",
      communityUnder: "",
      separateWithin: "",
      debtWithin: "",
      waiveSupport: "",
      agreement: "",
      bothWantToEnd: "",
    },
    requests: {
      ground: "irreconcilable",
      spousalSupport: "",
      propertyPlan: "",
      assets: [],
      debts: [],
      legalCustody: "",
      physicalCustody: "",
      parentingNote: "",
      childSupport: "",
      healthInsurance: "",
      restoreYourName: "",
      yourFormerName: "",
      restoreOtherName: "",
      otherFormerName: "",
      temporaryOrders: "",
      temporaryNote: "",
    },
    people: {
      you: {
        name: "",
        address: "",
        city: "",
        state: "CA",
        zip: "",
        phone: "",
        email: "",
      },
      other: {
        name: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        phone: "",
        email: "",
        addressUnknown: false,
      },
    },
    fees: { ability: "" },
  };
}

export function exampleSummary() {
  const answers = blankAnswers();
  answers.acceptedDisclaimer = true;
  answers.safety.unsafeContact = "no";
  answers.goal = "dissolution";
  answers.relationship = "marriage";
  answers.filingStyle = "joint";
  Object.assign(answers.residency, {
    filingCounty: "kern",
    caSixMonths: "yes",
    kernThreeMonths: "yes",
    livesInCalifornia: "yes",
    eitherLivesInKern: "yes",
    whoMeetsResidency: "both",
    dpRegisteredInCA: "",
    sameSexException: "no",
    marriedInKern: "",
  });
  answers.children.hasMinors = "no";
  answers.children.pregnant = "no";
  answers.dates.marriage = "2023-06-01";
  answers.dates.separation = "2025-11-15";
  answers.dates.place = "Bakersfield, California";
  Object.assign(answers.property, {
    realEstate: "none",
    communityUnder: "yes",
    separateWithin: "yes",
    debtWithin: "yes",
    waiveSupport: "yes",
    agreement: "nothing",
    bothWantToEnd: "yes",
  });
  answers.requests.ground = "irreconcilable";
  answers.requests.spousalSupport = "terminate";
  answers.requests.propertyPlan = "none";
  answers.requests.restoreYourName = "yes";
  answers.requests.yourFormerName = "Alex Morgan";
  answers.requests.restoreOtherName = "no";
  answers.requests.temporaryOrders = "no";
  answers.people.you = {
    name: "Alex Rivera",
    address: "100 Main Street",
    city: "Bakersfield",
    state: "CA",
    zip: "93301",
    phone: "661-555-0100",
    email: "alex@example.com",
  };
  answers.people.other = {
    name: "Jordan Rivera",
    address: "100 Main Street",
    city: "Bakersfield",
    state: "CA",
    zip: "93301",
    phone: "",
    email: "",
    addressUnknown: false,
  };
  answers.fees.ability = "yes";
  return answers;
}

export function exampleWithChild() {
  const answers = blankAnswers();
  answers.acceptedDisclaimer = true;
  answers.safety.unsafeContact = "no";
  answers.goal = "dissolution";
  answers.relationship = "marriage";
  answers.filingStyle = "solo";
  Object.assign(answers.residency, {
    filingCounty: "kern",
    caSixMonths: "yes",
    kernThreeMonths: "yes",
    livesInCalifornia: "yes",
    eitherLivesInKern: "yes",
    whoMeetsResidency: "you",
    sameSexException: "no",
  });
  answers.children.hasMinors = "yes";
  answers.children.pregnant = "no";
  answers.children.otherCases = "no";
  answers.children.livedOutOfState = "no";
  answers.children.list = [
    {
      name: "Sam Rivera",
      dob: "2018-03-12",
      birthPlace: "Bakersfield, California",
      sex: "Female",
      residence: "Bakersfield, California, with Alex Rivera",
    },
  ];
  answers.dates.marriage = "2014-04-02";
  answers.dates.separation = "2024-08-01";
  answers.dates.place = "Las Vegas, Nevada";
  Object.assign(answers.property, {
    realEstate: "owns",
    communityUnder: "no",
    separateWithin: "yes",
    debtWithin: "no",
    waiveSupport: "no",
    agreement: "not-yet",
    bothWantToEnd: "no",
  });
  Object.assign(answers.requests, {
    ground: "irreconcilable",
    spousalSupport: "reserve",
    propertyPlan: "divide",
    assets: [
      {
        description: "House on Olive Drive",
        kind: "community",
        award: "undecided",
      },
    ],
    debts: [{ description: "Mortgage on Olive Drive", whoPays: "undecided" }],
    legalCustody: "joint",
    physicalCustody: "undecided",
    parentingNote: "We have not agreed on a weekly schedule.",
    childSupport: "guideline",
    healthInsurance: "both",
    restoreYourName: "no",
    restoreOtherName: "no",
    temporaryOrders: "yes",
    temporaryNote: "A temporary parenting schedule while the case is open.",
  });
  answers.people.you = {
    name: "Alex Rivera",
    address: "2200 Eye Street",
    city: "Bakersfield",
    state: "CA",
    zip: "93301",
    phone: "661-555-0101",
    email: "alex@example.com",
  };
  answers.people.other = {
    name: "Jordan Rivera",
    address: "88 Oak Avenue",
    city: "Bakersfield",
    state: "CA",
    zip: "93304",
    phone: "",
    email: "",
    addressUnknown: false,
  };
  answers.fees.ability = "waiver";
  return answers;
}

export function todayISO(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > daysInMonth(y, m)) return null;
  return { y, m, d };
}

export function compareDates(a, b) {
  if (a.y !== b.y) return a.y - b.y;
  if (a.m !== b.m) return a.m - b.m;
  return a.d - b.d;
}

export function addYears(date, years) {
  const y = date.y + years;
  return { y, m: date.m, d: Math.min(date.d, daysInMonth(y, date.m)) };
}

export function isNotMoreThanFiveYears(marriageISO, separationISO) {
  const start = parseISODate(marriageISO);
  const end = parseISODate(separationISO);
  if (!start || !end) return null;
  if (compareDates(end, start) < 0) return false;
  return compareDates(end, addYears(start, 5)) <= 0;
}

export function elapsedYearsMonths(marriageISO, separationISO) {
  const start = parseISODate(marriageISO);
  const end = parseISODate(separationISO);
  if (!start || !end || compareDates(end, start) < 0) return null;
  let years = end.y - start.y;
  let months = end.m - start.m;
  if (end.d < start.d) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months };
}

export function formatElapsed(elapsed) {
  if (!elapsed) return "";
  const years = `${elapsed.years} ${elapsed.years === 1 ? "year" : "years"}`;
  const months = `${elapsed.months} ${elapsed.months === 1 ? "month" : "months"}`;
  return `${years}, ${months}`;
}

export function ageOn(dobISO, onISO) {
  const dob = parseISODate(dobISO);
  const on = parseISODate(onISO);
  if (!dob || !on) return null;
  let age = on.y - dob.y;
  if (on.m < dob.m || (on.m === dob.m && on.d < dob.d)) age -= 1;
  return age;
}

export function lookupVenue(zip, city = "") {
  const normalized = normalizeZip(zip);
  if (!normalized) return { status: "empty", source: VENUE_SOURCE };
  const rows = VENUE_ROWS.filter((row) => row.zip === normalized);
  if (!rows.length) return { status: "unknown", zip: normalized, source: VENUE_SOURCE };
  const courts = unique(rows.map((row) => row.court));
  if (courts.length === 1) {
    return {
      status: "match",
      zip: normalized,
      court: courts[0],
      courthouse: COURTHOUSES[courts[0]],
      sourceCities: rows.map((row) => row.city),
      source: VENUE_SOURCE,
    };
  }
  const wanted = normalizeCity(city);
  if (wanted) {
    const cityRows = rows.filter((row) => normalizeCity(row.city) === wanted);
    const cityCourts = unique(cityRows.map((row) => row.court));
    if (cityCourts.length === 1) {
      return {
        status: "match",
        zip: normalized,
        court: cityCourts[0],
        courthouse: COURTHOUSES[cityCourts[0]],
        matchedCity: cityRows[0].city,
        source: VENUE_SOURCE,
      };
    }
  }
  return {
    status: "ambiguous",
    zip: normalized,
    options: courts.map((court) => ({
      court,
      courthouse: COURTHOUSES[court],
      cities: rows.filter((row) => row.court === court).map((row) => row.city),
    })),
    source: VENUE_SOURCE,
  };
}

export function visibleSteps(answers) {
  return STEPS.filter((step) => {
    if (answers.goal === "nullity" && (step.id === "property" || step.id === "requests")) {
      return false;
    }
    return true;
  }).map((step) => step.id);
}

export function validateStep(stepId, answers, options = {}) {
  const today = options.today || todayISO();
  const errors = [];
  const need = (condition, message) => {
    if (condition) errors.push(message);
  };

  if (stepId === "welcome") {
    need(!answers.acceptedDisclaimer, "Check the box to confirm you understand what this wizard is.");
  }

  if (stepId === "safety") {
    need(!answers.safety.unsafeContact, "Choose one safety answer so the later address step is handled correctly.");
  }

  if (stepId === "case") {
    need(!answers.goal, "Choose what you are asking the court to do.");
    need(!answers.relationship, "Choose marriage, domestic partnership, or both.");
    need(!answers.filingStyle, "Choose how you plan to file.");
  }

  if (stepId === "residency") {
    const residency = answers.residency;
    need(!residency.filingCounty, "Say whether you will file in Kern County.");
    if (residency.filingCounty === "kern") {
      need(!residency.caSixMonths, "Answer the 6-month California question.");
      need(!residency.kernThreeMonths, "Answer the 3-month Kern County question.");
      need(!residency.livesInCalifornia, "Answer whether either of you lives in California now.");
      need(!residency.eitherLivesInKern, "Answer whether either of you lives in Kern County now.");
      if (residency.caSixMonths === "yes" && residency.kernThreeMonths === "yes") {
        need(!residency.whoMeetsResidency, "Say which person meets the 6-month and 3-month residency rules.");
      }
      if (answers.relationship === "dp" || answers.relationship === "both") {
        need(!residency.dpRegisteredInCA, "Say whether the domestic partnership was registered in California.");
      }
      need(!residency.sameSexException, "Answer the same-sex marriage question.");
      if (residency.sameSexException === "yes") {
        need(!residency.marriedInKern, "Say whether you married in Kern County.");
      }
    }
  }

  if (stepId === "children") {
    need(!answers.children.hasMinors, "Say whether there are children under 18 from this relationship.");
    need(!answers.children.pregnant, "Answer the pregnancy question. Choose “Not sure” if you do not know.");
    if (answers.children.hasMinors === "yes") {
      need(answers.children.list.length === 0, "Add each child under 18.");
      need(!answers.children.otherCases, "Say whether another court case involves any of these children.");
      need(
        !answers.children.livedOutOfState,
        "Say whether any child has lived outside California in the last five years.",
      );
      answers.children.list.forEach((child, index) => {
        const label = child.name.trim() || `Child ${index + 1}`;
        need(!child.name.trim(), `Enter the legal name for child ${index + 1}.`);
        need(!parseISODate(child.dob), `Enter a complete date of birth for ${label}.`);
        const age = ageOn(child.dob, today);
        need(age !== null && age < 0, `${label}’s date of birth is in the future.`);
        need(
          age !== null && age >= 18,
          `${label} is 18 or older. The children’s attachment is for minors. Remove this child or correct the date.`,
        );
      });
    }
  }

  if (stepId === "dates") {
    need(!answers.dates.place.trim(), "Enter where you married or registered the partnership.");
    const marriage = parseISODate(answers.dates.marriage);
    need(!marriage, "Enter the date of marriage or domestic-partnership registration.");
    if (marriage && compareDates(marriage, parseISODate(today)) > 0) {
      errors.push("The marriage or registration date is in the future.");
    }
    if (!answers.dates.separationUnknown) {
      const separation = parseISODate(answers.dates.separation);
      need(!separation, "Enter the date of separation, or check that you do not know it yet.");
      if (marriage && separation && compareDates(separation, marriage) < 0) {
        errors.push("The date of separation is before the marriage or registration date.");
      }
      if (separation && compareDates(separation, parseISODate(today)) > 0) {
        errors.push("The date of separation is in the future.");
      }
    }
  }

  if (stepId === "property") {
    const property = answers.property;
    need(!property.realEstate, "Answer the real estate question.");
    need(!property.communityUnder, "Answer the community-property question.");
    need(!property.separateWithin, "Answer the separate-property question.");
    need(!property.debtWithin, "Answer the debt question.");
    need(!property.waiveSupport, "Answer the spousal-support question.");
    need(!property.agreement, "Answer the agreement question.");
    need(!property.bothWantToEnd, "Say whether both of you want the marriage or partnership to end.");
  }

  if (stepId === "requests") {
    const requests = answers.requests;
    need(!requests.ground, "Choose the legal ground you expect to use.");
    need(!requests.spousalSupport, "Choose what you want to do about spousal or partner support.");
    need(!requests.propertyPlan, "Choose how property and debts should be handled.");
    if (requests.restoreYourName === "yes") {
      need(!requests.yourFormerName.trim(), "Enter the former name you want restored.");
    }
    need(!requests.restoreYourName, "Say whether you want a former name restored.");
    if (answers.children.hasMinors === "yes") {
      need(!requests.legalCustody, "Choose a legal-custody request, even if it is still undecided.");
      need(!requests.physicalCustody, "Choose a physical-custody request, even if it is still undecided.");
      need(!requests.childSupport, "Choose a child-support request, even if it is still undecided.");
      need(!requests.healthInsurance, "Choose who should keep health insurance for the children.");
    }
    need(!requests.temporaryOrders, "Say whether you need orders while the case is still open.");
  }

  if (stepId === "people") {
    need(!answers.people.you.name.trim(), "Enter your legal name.");
    need(!answers.people.other.name.trim(), "Enter the other person’s legal name.");
  }

  if (stepId === "fees") {
    need(!answers.fees.ability, "Say whether you can pay the filing fee.");
  }

  return errors;
}

export function recommend(answers) {
  if (!answers.goal || !answers.relationship || !answers.filingStyle) {
    return baseResult({
      id: "incomplete",
      title: "Answer a few questions first",
      lede: "The packet is built from your answers. Nothing has been decided yet.",
      reasons: ["Go through each step. You can leave and come back; the answers stay on this computer."],
    });
  }

  if (answers.residency.filingCounty === "other") {
    return otherCountyResult(answers);
  }

  if (answers.goal === "nullity") {
    return nullityResult(answers);
  }

  const residency = dissolutionResidency(answers);
  if (answers.goal === "dissolution" && !residency.ok) {
    return residencyResult(answers, residency);
  }

  const venue = separationVenue(answers);
  if (answers.goal === "legal-separation" && !venue.ok) {
    return venueResult(answers, venue);
  }

  const facts = summaryFacts(answers);
  const jointOk = answers.filingStyle === "joint" && answers.property.bothWantToEnd !== "no";
  const warnings = sharedWarnings(answers);

  if (answers.goal === "dissolution" && facts.ok && jointOk) {
    return summaryResult(answers, warnings, residency);
  }

  if (jointOk && (answers.goal === "dissolution" || answers.goal === "legal-separation")) {
    return jointResult(answers, warnings, facts, residency);
  }

  if (answers.filingStyle === "joint" && answers.property.bothWantToEnd === "no") {
    warnings.unshift({
      level: "caution",
      text: "You chose a joint filing, and you also said the other person does not want to end the marriage or partnership. A joint petition needs both people. This packet uses the one-person petition instead.",
    });
  }

  if (answers.goal === "legal-separation") {
    return separationResult(answers, warnings, false);
  }

  return regularResult(answers, warnings, facts, residency);
}

function otherCountyResult(answers) {
  const forms = startingForms(answers, "regular");
  return baseResult({
    id: "other-county",
    title: "Use your own county’s self-help center",
    lede: "Statewide forms are the same, but filing offices, local packets, and fees are not. This wizard’s local steps are for Kern County only.",
    reasons: [
      "You said this case will not be filed in Kern County.",
      "Start at the California Courts self-help divorce guide, then open your own superior court’s website.",
    ],
    warnings: sharedWarnings(answers),
    formsNow: forms.now,
    formsLater: forms.later,
    filingSteps: [
      "Find the superior court for the county where one of you has lived for the last three months.",
      "Ask that court’s family law facilitator which local forms are required.",
      "Use the statewide forms below only as a starting list. Do not follow the Kern branch or e-filing steps.",
    ],
    links: commonLinks(),
  });
}

function nullityResult(answers) {
  const forms = startingForms(answers, "regular");
  return baseResult({
    id: "nullity",
    title: "Nullity needs a legal ground this wizard will not choose",
    lede: "A nullity asks the court to say the marriage or domestic partnership was never valid. That is different from a divorce. Only specific legal reasons qualify, and checking the wrong one can get the case dismissed.",
    reasons: [
      "California nullity grounds include a prior existing marriage, a close blood relationship, being under the age to marry, lack of capacity, fraud, force, and physical incapacity that was unknown to the other person.",
      "This wizard will not tell you whether any ground applies.",
      "If what you want is to end a valid marriage, the usual case is a divorce, not a nullity.",
    ],
    warnings: [
      {
        level: "stop",
        text: "Talk with the Kern Family Law Facilitator or a lawyer before you file a nullity. Bring this worksheet if you want help organizing names and dates. Do not file until someone qualified has helped you identify the ground.",
      },
      ...sharedWarnings(answers),
    ],
    formsNow: forms.now,
    formsLater: forms.later,
    localPacket: null,
    filingSteps: [
      "Read the California Courts pages on annulment before you fill out FL-100.",
      "On FL-100 the case type is nullity, not divorce. Leave the legal-ground section blank until you know which ground you are using.",
      "You can ask the Family Law Facilitator at 1215 Truxtun Avenue, First Floor, Bakersfield, to review the papers. The posted handout lists hours of Monday–Thursday 8 a.m.–4 p.m. and Friday 8 a.m.–noon, and says the office has no phone. Email WMFacil@kern.courts.ca.gov and confirm current hours on the court website.",
    ],
    timeline: [
      { when: "Before filing", what: "Confirm that nullity, rather than divorce or legal separation, is the case type you mean to file." },
      { when: "After filing", what: "Service, disclosures, and the judgment steps still apply. A facilitator should walk you through them for a nullity." },
    ],
    worksheet: worksheet(answers, "Nullity — ground not selected"),
    phases: phasesFor("nullity", answers),
    links: commonLinks(),
  });
}

function residencyResult(answers, residency) {
  const livesInKern = answers.residency.eitherLivesInKern === "yes" || answers.residency.kernThreeMonths === "yes";
  const warnings = [
    {
      level: "stop",
      text: "Do not file a divorce petition in Kern until the residency rule, or an exception that really applies to you, is met.",
    },
  ];
  const reasons = residencyReasons(residency.kind);
  const result = baseResult({
    id: "residency-wait",
    title: "A Kern divorce is not available on these answers yet",
    lede: "California divorce has a residency rule. Legal separation is the case type people use when they cannot file for divorce yet and one of them lives in the county.",
    reasons,
    warnings: [...warnings, ...sharedWarnings(answers)],
    filingSteps: [
      "Wait until at least one of you has lived in California for the last six months and in Kern County for the last three months, then run this wizard again.",
      "Or, if one of you lives in Kern now, consider a legal separation and ask the facilitator how a case can later be amended to a divorce. The California Courts self-help guide describes that option.",
    ],
    links: commonLinks(),
  });
  if (livesInKern && residency.kind !== "same-sex-wrong-county" && residency.kind !== "file-in-your-county") {
    const forms = startingForms(answers, "separation");
    result.alternate = {
      title: "Only if you choose legal separation instead of waiting",
      text: "Legal separation does not end the marriage or partnership. There is no six-month residency requirement, and there is no six-month wait before judgment. The court can still make orders about property, support, and children.",
      formsNow: forms.now,
    };
  }
  result.worksheet = worksheet(answers, "Residency not met for divorce");
  return result;
}

function venueResult(answers, venue) {
  return baseResult({
    id: "venue",
    title: "Kern may not be the right county for a legal separation",
    lede: "Legal separation does not require six months in California. It is still filed in a county where one of you lives.",
    reasons: venue.kind === "not-kern"
      ? ["You said neither of you lives in Kern County. File in the county where one of you lives, or come back if that changes."]
      : ["The residency answers are incomplete, so this wizard cannot pick a Kern filing plan."],
    warnings: sharedWarnings(answers),
    links: commonLinks(),
    worksheet: worksheet(answers, "Venue not confirmed"),
  });
}

function summaryResult(answers, warnings, residency) {
  const forms = startingForms(answers, "summary");
  if (residency.limited) {
    warnings.push({
      level: "caution",
      text: "You are ending a California-registered domestic partnership without the usual residency rule, and you said neither of you lives in California. The court may end the partnership and still be unable to decide property, support, or children. Read the domestic-partnership note on the California Courts site and ask the facilitator before you file.",
    });
  }
  return baseResult({
    id: "summary",
    title: "Joint summary dissolution",
    lede: "On these answers you line up with the short process in Family Code sections 2400–2406. Both of you sign one petition. There is no summons and no response. Every condition has to stay true through the day you file.",
    reasons: [
      "The marriage or partnership, measured from the ceremony or registration to the separation date, is not more than five years.",
      "There are no minor children of the relationship, and neither of you is pregnant.",
      `Community property is under $${LIMITS.communityProperty.toLocaleString("en-US")}, each person’s separate property is not over $${LIMITS.separateProperty.toLocaleString("en-US")}, and community debts are not over $${LIMITS.communityDebt.toLocaleString("en-US")}, using the car and real-estate exclusions on FL-800.`,
      "You both want to end the relationship, you both give up spousal or partner support forever, and you either have nothing to divide or a signed agreement.",
      `Those dollar caps are the figures printed on FL-800 and FL-810 as of ${LIMITS.asOf}. Read FL-810 before you sign.`,
    ],
    warnings,
    formsNow: forms.now,
    formsLater: forms.later,
    localPacket: { code: "DISSO-06", title: "Summary Dissolution Packet" },
    filingSteps: summaryFilingSteps(),
    timeline: [
      { when: "Before filing", what: "Both of you read FL-810, exchange financial information, and sign any papers needed to divide property." },
      { when: "Filing day", what: "File FL-800 in the correct Kern branch. Each of you pays a filing fee, or each of you who cannot pay files a separate fee waiver." },
      { when: "Next six months", what: "Either of you can stop the summary dissolution before it becomes final. If someone revokes it, you start over with a regular case." },
      { when: "After six months", what: "Submit the judgment forms named in the summary instructions, including FL-820, if neither of you has stopped the case." },
    ],
    worksheet: worksheet(answers, "Summary dissolution — FL-800"),
    phases: phasesFor("summary", answers),
    links: commonLinks(),
    venue: venueFor(answers),
  });
}

function jointResult(answers, warnings, facts, residency) {
  const separation = answers.goal === "legal-separation";
  const forms = startingForms(answers, "joint");
  if (!facts.ok && answers.goal === "dissolution") {
    warnings.push({
      level: "info",
      text: `This is a joint petition, not a summary dissolution. ${summaryExclusionSentence(facts)}`,
    });
  }
  if (residency.limited) {
    warnings.push({
      level: "caution",
      text: "Because neither of you lives in California, the court may be limited in orders about property, support, and children. Ask the facilitator before you file.",
    });
  }
  return baseResult({
    id: separation ? "legal-separation-joint" : "joint",
    title: separation ? "Joint petition for legal separation" : "Joint petition for divorce",
    lede: separation
      ? "Starting January 1, 2026, spouses and domestic partners who agree, or plan to agree, on every issue can file one joint petition. Legal separation does not end the marriage or partnership, and it has no six-month waiting period."
      : "Starting January 1, 2026, spouses and domestic partners who agree, or plan to agree, on every issue can file one joint petition. It starts the case. It does not finish the divorce.",
    reasons: [
      "You both plan to sign, and you did not tell this wizard that you disagree on an important issue.",
      separation
        ? "You asked for legal separation, so the six-month divorce residency rule is not what qualifies you. One of you still has to have a Kern connection the court accepts."
        : "At least one of you meets a residency path that allows a California dissolution to be filed from Kern, or you qualify through a domestic-partnership or same-sex filing exception you selected.",
      "If you later disagree, either of you can revoke the joint petition on FL-720. Petitioner 1 then files an amended FL-100, and Petitioner 2 files a response on FL-120.",
    ],
    warnings,
    formsNow: forms.now,
    formsLater: forms.later,
    localPacket: { code: "DISSO-12", title: "Joint Petition For Dissolution or Legal Separation" },
    filingSteps: jointFilingSteps(separation),
    timeline: jointTimeline(separation),
    worksheet: worksheet(answers, separation ? "Joint legal separation — FL-700" : "Joint divorce — FL-700"),
    phases: phasesFor(separation ? "legal-separation-joint" : "joint", answers),
    links: commonLinks(),
    venue: venueFor(answers),
    feeNote: jointFeeNote(answers),
  });
}

function regularResult(answers, warnings, facts, residency) {
  const forms = startingForms(answers, "regular");
  if (facts.ok && answers.filingStyle === "solo") {
    warnings.unshift({
      level: "info",
      text: "If the other person will sign with you, these answers also fit a joint summary dissolution (FL-800). That path is shorter. Go back to the Case step and choose “We will file together” if both of you will sign. Until then, this packet is the regular one-person divorce.",
    });
  } else if (facts.ok && answers.filingStyle === "contested") {
    warnings.push({
      level: "info",
      text: "These property and family facts would fit a summary dissolution only if you both agree and both sign FL-800. While you disagree, the regular petition is the form to start with.",
    });
  } else if (answers.goal === "dissolution") {
    warnings.push({
      level: "info",
      text: summaryExclusionSentence(facts),
    });
  }
  if (residency.limited) {
    warnings.push({
      level: "caution",
      text: "You selected the California domestic-partnership filing exception and said neither of you lives in California. The court may be unable to decide property, support, or children. Ask the facilitator before you file.",
    });
  }
  const result = baseResult({
    id: "regular",
    title: "Divorce filed by one person",
    lede: "You start the case with a petition and a summons. The other person has 30 days after service to respond. The marriage or partnership is not over until a judgment is entered, and a divorce judgment has to wait at least six months from service.",
    reasons: [
      "A one-person petition is the right starting point when the other person is not signing with you, or when you do not agree on every issue.",
      residency.kind === "standard"
        ? `Residency on the petition: ${whoLabel(answers.residency.whoMeetsResidency)} meets the six months in California and three months in Kern County.`
        : "You selected a filing exception. Read that exception on the petition instructions before you check a box.",
      "Kern’s facilitator handout tells you to have the papers reviewed, make two copies, and have someone else serve a set that includes a blank Response (FL-120).",
    ],
    warnings,
    formsNow: forms.now,
    formsLater: forms.later,
    localPacket: answers.children.hasMinors === "yes"
      ? { code: "DISSO-05", title: "Dissolution of Marriage with Minors" }
      : { code: "DISSO-08", title: "Dissolution of Marriage without Minors" },
    filingSteps: regularFilingSteps(answers),
    timeline: regularTimeline(true),
    worksheet: worksheet(answers, "Divorce — FL-100 and FL-110"),
    phases: phasesFor("regular", answers),
    links: commonLinks(),
    venue: venueFor(answers),
    feeNote: soloFeeNote(answers),
  });
  return result;
}

function separationResult(answers, warnings, joint) {
  const forms = startingForms(answers, joint ? "joint" : "separation");
  return baseResult({
    id: "legal-separation",
    title: "Legal separation filed by one person",
    lede: "Legal separation does not end the marriage or domestic partnership. You stay married, and the court can still divide property and debts and make custody and support orders. There is no six-month wait before judgment.",
    reasons: [
      "You asked for legal separation rather than a divorce.",
      "One of you lives in Kern County, which is the venue connection this packet uses.",
      "If you later meet the divorce residency rule and you want the marriage ended, ask the facilitator about amending the case. Do not assume the switch is automatic.",
    ],
    warnings: [
      ...warnings,
      {
        level: "info",
        text: "A legal separation judgment does not leave you free to marry someone else. Divorce is the case that ends the marriage.",
      },
    ],
    formsNow: forms.now,
    formsLater: forms.later,
    localPacket: { code: "DISSO-08", title: "Dissolution / legal separation packet on the Kern self-help list" },
    filingSteps: regularFilingSteps(answers, { separation: true }),
    timeline: regularTimeline(false),
    worksheet: worksheet(answers, "Legal separation — FL-100 and FL-110"),
    phases: phasesFor("legal-separation", answers),
    links: commonLinks(),
    venue: venueFor(answers),
    feeNote: soloFeeNote(answers),
  });
}

function dissolutionResidency(answers) {
  const residency = answers.residency;
  if (residency.sameSexException === "yes") {
    if (residency.marriedInKern === "yes") return { ok: true, kind: "same-sex-exception" };
    if (residency.marriedInKern === "no") return { ok: false, kind: "same-sex-wrong-county" };
    return { ok: false, kind: "incomplete" };
  }
  if (answers.relationship === "dp" && residency.dpRegisteredInCA === "yes") {
    if (residency.eitherLivesInKern === "yes" || residency.kernThreeMonths === "yes") {
      return { ok: true, kind: "ca-dp" };
    }
    if (residency.livesInCalifornia === "no" && residency.eitherLivesInKern === "no") {
      return { ok: true, kind: "ca-dp-nonresident", limited: true };
    }
    if (residency.livesInCalifornia === "yes" && residency.eitherLivesInKern === "no") {
      return { ok: false, kind: "file-in-your-county" };
    }
    return { ok: false, kind: "incomplete" };
  }
  if (
    answers.relationship === "both" &&
    residency.dpRegisteredInCA === "yes" &&
    residency.caSixMonths !== "yes"
  ) {
    return { ok: false, kind: "marriage-needs-residency" };
  }
  if (residency.caSixMonths === "yes" && residency.kernThreeMonths === "yes") {
    return { ok: true, kind: "standard" };
  }
  if (
    !residency.caSixMonths ||
    !residency.kernThreeMonths ||
    residency.caSixMonths === "unsure" ||
    residency.kernThreeMonths === "unsure"
  ) {
    return { ok: false, kind: "incomplete" };
  }
  return { ok: false, kind: "not-met" };
}

function separationVenue(answers) {
  const residency = answers.residency;
  if (residency.eitherLivesInKern === "yes" || residency.kernThreeMonths === "yes") return { ok: true, kind: "kern" };
  if (residency.eitherLivesInKern === "no" && residency.kernThreeMonths === "no") return { ok: false, kind: "not-kern" };
  return { ok: false, kind: "incomplete" };
}

function summaryFacts(answers) {
  const problems = [];
  if (answers.goal !== "dissolution") problems.push("Summary dissolution is only a divorce. It is not a legal separation or a nullity.");
  if (answers.children.hasMinors === "yes") problems.push("There are minor children of the relationship.");
  if (answers.children.pregnant === "yes") problems.push("Someone is pregnant.");
  if (answers.children.pregnant === "unsure") problems.push("Pregnancy is unknown. Summary dissolution requires that neither spouse is pregnant.");
  if (answers.dates.separationUnknown || !answers.dates.separation) {
    problems.push("The separation date is missing, so the five-year limit cannot be checked.");
  } else if (isNotMoreThanFiveYears(answers.dates.marriage, answers.dates.separation) === false) {
    problems.push("The time from marriage or registration to separation is more than five years.");
  } else if (isNotMoreThanFiveYears(answers.dates.marriage, answers.dates.separation) === null) {
    problems.push("The marriage and separation dates are not both filled in.");
  }
  if (answers.property.realEstate === "owns") problems.push("Someone has an interest in real estate that the summary process does not allow.");
  if (answers.property.realEstate === "unsure") problems.push("Real estate is uncertain. Summary dissolution requires no disqualifying real-estate interest.");
  if (answers.property.communityUnder === "no") {
    problems.push(`Community property is not under $${LIMITS.communityProperty.toLocaleString("en-US")}, excluding cars and amounts still owed.`);
  }
  if (answers.property.communityUnder === "unsure") problems.push("The community-property total is not confirmed.");
  if (answers.property.separateWithin === "no") {
    problems.push(`At least one person’s separate property is over $${LIMITS.separateProperty.toLocaleString("en-US")}, excluding cars and amounts still owed.`);
  }
  if (answers.property.separateWithin === "unsure") problems.push("Separate-property totals are not confirmed.");
  if (answers.property.debtWithin === "no") {
    problems.push(`Community debts are over $${LIMITS.communityDebt.toLocaleString("en-US")}, excluding car loans.`);
  }
  if (answers.property.debtWithin === "unsure") problems.push("The debt total is not confirmed.");
  if (answers.property.waiveSupport !== "yes") problems.push("Summary dissolution requires both people to give up spousal or partner support forever.");
  if (answers.property.agreement !== "signed" && answers.property.agreement !== "nothing") {
    problems.push("Summary dissolution requires a signed agreement dividing community property and debts, or a statement that there are none.");
  }
  if (answers.property.bothWantToEnd !== "yes") problems.push("Both people have to want the divorce.");
  const listed = listedProperty(answers);
  if (answers.property.agreement === "nothing" && listed) {
    problems.push("Property or debts are listed, so the “nothing to divide” answer does not match the worksheet.");
  }
  const residency = dissolutionResidency(answers);
  if (!residency.ok) problems.push("The divorce residency rule is not met on these answers.");
  return { ok: problems.length === 0, problems };
}

function summaryExclusionSentence(facts) {
  if (facts.ok) return "Summary dissolution stays available only while every FL-810 condition remains true.";
  if (facts.problems.length > 4) {
    return "Summary dissolution is the short process for a marriage of five years or less, no children, little property and debt, and a permanent waiver of spousal support. It does not fit these answers. Read FL-810 if you think a fact was entered wrong.";
  }
  return `Summary dissolution does not fit, because ${facts.problems.join(" ")}`;
}

function sharedWarnings(answers) {
  const warnings = [];
  if (answers.safety.unsafeContact === "yes") {
    warnings.push({
      level: "stop",
      text: "You said contact or a public address may be unsafe. If you are in danger, call 911. For a confidential hotline, call the Open Door Network at (661) 327-1091 or (800) 273-7713, or the National Domestic Violence Hotline at (800) 799-7233. The Kern County Family Justice Center is at 1300 18th Street, Bakersfield, (661) 868-5950. Do not put a home address on court papers until the facilitator tells you how to use a safe mailing address. This wizard does not prepare restraining orders.",
    });
  }
  if (answers.children.hasMinors === "yes" && answers.children.otherCases === "yes") {
    warnings.push({
      level: "caution",
      text: "Another court case about a child can change which court is allowed to make custody orders. Fill out FL-105 completely and ask the facilitator before you file.",
    });
  }
  if (answers.children.hasMinors === "yes" && answers.children.livedOutOfState === "yes") {
    warnings.push({
      level: "caution",
      text: "A child who lived outside California in the last five years needs a full residence history on FL-105. Custody jurisdiction may be in another state. Ask the facilitator.",
    });
  }
  if (answers.requests.ground === "insanity") {
    warnings.push({
      level: "stop",
      text: "Incurable insanity is a rare divorce ground and requires specific proof. Most divorces use irreconcilable differences. Talk to a lawyer before you check insanity.",
    });
  }
  const elapsed = elapsedYearsMonths(answers.dates.marriage, answers.dates.separation);
  if (elapsed && elapsed.years >= 10 && (answers.requests.spousalSupport === "terminate" || answers.property.waiveSupport === "yes")) {
    warnings.push({
      level: "caution",
      text: "This marriage or partnership lasted 10 years or more before separation. Kern’s facilitator handout says spousal support may not be terminated in that situation and the court must reserve jurisdiction, unless a written agreement provides otherwise. Confirm before you check a termination box.",
    });
  }
  if (answers.requests.temporaryOrders === "yes") {
    warnings.push({
      level: "info",
      text: "Temporary orders, such as a parenting schedule or support while the case is open, use a Request for Order. That is a separate set of forms. This wizard does not prepare them. Ask the facilitator or use the court’s Request for Order workshop.",
    });
  }
  const marriage = parseISODate(answers.dates.marriage);
  if (marriage && marriage.m === 2 && marriage.d === 29 && answers.goal === "dissolution") {
    warnings.push({
      level: "info",
      text: "The marriage date is February 29. For the five-year summary limit, this wizard treats the anniversary in a non-leap year as February 28. Confirm that date against FL-810 if you are close to five years.",
    });
  }
  if (answers.requests.childSupport === "guideline") {
    warnings.push({
      level: "info",
      text: "This wizard does not calculate child support. Use the California guideline calculator and, if you can, have the facilitator check the numbers.",
    });
  }
  return warnings;
}

function startingForms(answers, mode) {
  const now = [];
  const later = [];
  const add = (bucket, code, name, note) => {
    const list = bucket === "now" ? now : later;
    if (list.some((item) => item.code === code)) return;
    list.push({
      code,
      name,
      note,
      href: formHref(code),
    });
  };

  if (mode === "summary") {
    add("now", "FL-810", "Summary Dissolution Information", "Both of you read this booklet before signing anything.");
    add("now", "FL-800", "Joint Petition for Summary Dissolution", "The paper you file to start the short process.");
    add("now", "FL-150", "Income and Expense Declaration", "Each of you fills out your own and gives it to the other.");
    add("later", "FL-820", "Request for Judgment, Judgment of Dissolution, and Notice of Entry of Judgment", "Used after the six-month waiting period if nobody has revoked the summary dissolution. Confirm the current form on the courts site.");
  } else if (mode === "joint") {
    add("now", "FL-700", "Joint Petition — Marriage or Domestic Partnership", "Both of you sign this instead of FL-100.");
    add("now", "FL-710", "Summons — Joint Petition", "Read it. A summons can include temporary orders that start with the case.");
    add("later", "FL-720", "Notice of Revocation of Joint Petition", "Only if one of you later wants to leave the joint process.");
  } else {
    add("now", "FL-100", "Petition — Marriage / Domestic Partnership", "Starts a divorce, legal separation, or nullity. Check only the case type you are filing.");
    add("now", "FL-110", "Summons (Family Law)", "Read every page, including the automatic temporary restraining orders, before you file.");
    add("now", "FL-120", "Response — Marriage / Domestic Partnership", "Serve a blank copy. Do not fill it out unless you are the responding person in a different case.");
    add("later", "FL-115", "Proof of Service of Summons", "The server completes this after personal service. You then file it.");
  }

  if (answers.children.hasMinors === "yes") {
    add("now", "FL-105", "Declaration Under UCCJEA", "Required when there are children under 18. Complete the five-year residence history.");
    if (answers.children.list.length > 2) {
      add("now", "FL-105(A)", "Attachment to FL-105", "Use this when there are more than two children. Open it from the FL-105 page.");
    }
    if (mode !== "summary" && (answers.requests.legalCustody || answers.requests.physicalCustody)) {
      add("now", "FL-311", "Child Custody and Visitation Application Attachment", "Optional attachment for a specific custody and parenting schedule. Kern lists it with the petition when you are asking for custody orders.");
    }
  }

  const wantsProperty = mode !== "summary" && (
    answers.property.realEstate === "owns" ||
    answers.requests.propertyPlan === "divide" ||
    listedProperty(answers)
  );
  if (wantsProperty) {
    add("now", "FL-160", "Property Declaration", "Kern’s handout tells petitioners who have property or debts to complete FL-160 with the petition, including dates acquired and proposed values.");
  }

  if (answers.fees.ability === "waiver" || answers.fees.ability === "unsure") {
    add("now", "FW-001", "Request to Waive Court Fees", mode === "joint" || mode === "summary"
      ? "Each person who needs a waiver files their own request."
      : "File this with the petition if you cannot pay.");
    add("now", "FW-003", "Order on Court Fee Waiver", "File it as its own document. The clerk decides whether to grant it.");
  }

  if (mode !== "summary") {
    add("later", "FL-140", "Declaration of Disclosure", "Preliminary disclosures are mandatory. Kern says you may serve them with the petition or within 60 days after filing.");
    add("later", "FL-142", "Schedule of Assets and Debts", "One way to list what you own and owe. FL-160 is the other property form Kern already asks for when you have property.");
    add("later", "FL-150", "Income and Expense Declaration", "Exchange income information. Do not file FL-150 with the court at the disclosure stage unless a form tells you to.");
    add("later", "FL-141", "Declaration Regarding Service of Declaration of Disclosure", "This is the disclosure form that is filed with the court.");
    add("later", "FL-144", "Stipulation and Waiver of Final Declaration of Disclosure", "Only if both of you later waive the final disclosure in writing. Otherwise you exchange a final disclosure before judgment.");
  }

  return { now, later };
}

function formHref(code) {
  if (code === "FL-105(A)") return "https://selfhelp.courts.ca.gov/jcc-form/FL-105";
  return `https://selfhelp.courts.ca.gov/jcc-form/${code}`;
}

function worksheet(answers, caption) {
  const elapsed = answers.dates.separationUnknown
    ? null
    : elapsedYearsMonths(answers.dates.marriage, answers.dates.separation);
  const you = answers.people.you;
  const other = answers.people.other;
  const sections = [
    {
      heading: "How to use this worksheet",
      rows: [
        ["What this is", "A preparation sheet for official Judicial Council forms. Do not file this printout."],
        ["Caption", caption],
        ["Court", "Superior Court of California, County of Kern"],
        ["Your name on e-filing", efileName(you.name)],
        ["Other person’s name on e-filing", efileName(other.name)],
      ],
    },
    {
      heading: "Case description",
      rows: [
        ["Asked-for outcome", goalLabel(answers.goal)],
        ["Relationship", relationshipLabel(answers.relationship)],
        ["How you will file", styleLabel(answers.filingStyle)],
        ["Place of marriage or registration", answers.dates.place || "—"],
        ["Date of marriage or registration", answers.dates.marriage || "—"],
        ["Date of separation", answers.dates.separationUnknown ? "Not known yet — FL-100 still needs a date before you file" : (answers.dates.separation || "—")],
        ["Length to separation", elapsed ? formatElapsed(elapsed) : "—"],
      ],
    },
    {
      heading: "Residency answers to copy carefully",
      rows: residencyRows(answers),
    },
    {
      heading: "Children",
      rows: childrenRows(answers),
    },
  ];

  if (answers.goal !== "nullity") {
    sections.push({
      heading: "Property, debts, and support",
      rows: [
        ["Real estate", realEstateLabel(answers.property.realEstate)],
        ["Community property under the summary cap", yesNo(answers.property.communityUnder)],
        ["Separate property within the summary cap", yesNo(answers.property.separateWithin)],
        ["Community debt within the summary cap", yesNo(answers.property.debtWithin)],
        ["Both permanently waive spousal support", yesNo(answers.property.waiveSupport)],
        ["Written agreement", agreementLabel(answers.property.agreement)],
        ["Support request on a regular petition", supportLabel(answers.requests.spousalSupport)],
        ["Property plan", propertyPlanLabel(answers.requests.propertyPlan)],
        ["Legal ground", answers.requests.ground === "insanity" ? "Incurable insanity — get legal help before checking this" : "Irreconcilable differences"],
      ],
    });
  }

  const assetRows = answers.requests.assets
    .filter((asset) => asset.description.trim())
    .map((asset) => [asset.description.trim(), `${kindLabel(asset.kind)}; proposed recipient: ${awardLabel(asset.award)}`]);
  if (assetRows.length) sections.push({ heading: "Assets you listed", rows: assetRows });

  const debtRows = answers.requests.debts
    .filter((debt) => debt.description.trim())
    .map((debt) => [debt.description.trim(), `Who pays: ${awardLabel(debt.whoPays)}`]);
  if (debtRows.length) sections.push({ heading: "Debts you listed", rows: debtRows });

  if (answers.children.hasMinors === "yes" && answers.goal !== "nullity") {
    sections.push({
      heading: "Parenting and child support requests",
      rows: [
        ["Legal custody", custodyLabel(answers.requests.legalCustody)],
        ["Physical custody", custodyLabel(answers.requests.physicalCustody)],
        ["Parenting note", answers.requests.parentingNote.trim() || "—"],
        ["Child support", childSupportLabel(answers.requests.childSupport)],
        ["Health insurance", insuranceLabel(answers.requests.healthInsurance)],
      ],
    });
  }

  sections.push({
    heading: "Names and addresses",
    rows: [
      ["Your mailing address", formatAddress(you, answers.safety.unsafeContact === "yes")],
      ["Your phone and email", [you.phone, you.email].filter(Boolean).join(" · ") || "—"],
      ["Other person’s address for service", other.addressUnknown ? "Unknown — ask the facilitator about service before you file" : formatAddress(other, false)],
      ["Restore your former name", answers.requests.restoreYourName === "yes" ? answers.requests.yourFormerName : yesNo(answers.requests.restoreYourName)],
      ["Restore the other person’s former name", answers.requests.restoreOtherName === "yes" ? (answers.requests.otherFormerName || "Yes — name not entered") : yesNo(answers.requests.restoreOtherName)],
    ],
  });

  sections.push({
    heading: "Fees",
    rows: [["Filing fee", feeLabel(answers)]],
  });

  return sections.map((section) => ({
    heading: section.heading,
    rows: section.rows.map(([label, value]) => ({ label, value: value || "—" })),
  }));
}

function residencyRows(answers) {
  const residency = answers.residency;
  const rows = [
    ["Filing in Kern", yesNo(residency.filingCounty === "kern" ? "yes" : residency.filingCounty === "other" ? "no" : "")],
    ["Six months in California", yesNo(residency.caSixMonths)],
    ["Three months in Kern", yesNo(residency.kernThreeMonths)],
    ["Lives in California now", yesNo(residency.livesInCalifornia)],
    ["Lives in Kern now", yesNo(residency.eitherLivesInKern)],
  ];
  if (residency.caSixMonths === "yes" && residency.kernThreeMonths === "yes") {
    rows.push(["Who meets that residency test", whoLabel(residency.whoMeetsResidency)]);
  }
  if (answers.relationship === "dp" || answers.relationship === "both") {
    rows.push(["Domestic partnership registered in California", yesNo(residency.dpRegisteredInCA)]);
  }
  rows.push(["Same-sex marriage now unrecognized where you live", yesNo(residency.sameSexException)]);
  if (residency.sameSexException === "yes") {
    rows.push(["Married in Kern County", yesNo(residency.marriedInKern)]);
  }
  return rows;
}

function childrenRows(answers) {
  if (answers.children.hasMinors !== "yes") {
    return [
      ["Minor children of the relationship", "No"],
      ["Pregnancy", yesNo(answers.children.pregnant)],
    ];
  }
  const rows = [
    ["Minor children of the relationship", `${answers.children.list.length} listed`],
    ["Pregnancy", yesNo(answers.children.pregnant)],
    ["Another court case about a child", yesNo(answers.children.otherCases)],
    ["A child lived outside California in the last five years", yesNo(answers.children.livedOutOfState)],
  ];
  answers.children.list.forEach((child, index) => {
    rows.push([
      `Child ${index + 1}`,
      [
        child.name,
        child.dob ? `born ${child.dob}` : "",
        child.sex ? `sex ${child.sex}` : "",
        child.birthPlace ? `birthplace ${child.birthPlace}` : "",
        child.residence ? `now ${child.residence}` : "",
      ].filter(Boolean).join("; "),
    ]);
  });
  rows.push(["Still required on FL-105", "Five-year address history, and every other court case, even if you answered no above."]);
  return rows;
}

function phasesFor(id, answers) {
  const hasKids = answers.children.hasMinors === "yes";
  if (id === "summary") {
    return [
      phase("read", "Read and exchange", [
        "Both people read FL-810",
        "Exchange income information on FL-150",
        "Exchange property worksheets or a disclosure packet",
        "Sign the property agreement, if there is anything to divide",
      ]),
      phase("file", "File", [
        "File FL-800 in the correct Kern branch",
        "Pay both filing fees or file fee waivers",
      ]),
      phase("wait", "Wait", [
        "Mark six months from the filing date",
        "Either person may revoke before judgment",
      ]),
      phase("judgment", "Judgment", [
        "Submit the summary judgment forms, including FL-820",
      ]),
    ];
  }
  const items = [
    phase("prepare", "Prepare", [
      "Search the Kern portal for an existing case",
      "Complete the starting forms in this packet",
      "Ask the facilitator to review them before you copy",
    ]),
    phase("file", "File", [
      "File at the branch for your ZIP, or e-file",
      "Pay the fee or file a fee waiver",
    ]),
  ];
  if (id === "joint" || id === "legal-separation-joint") {
    items.push(phase("disclosures", "Disclosures and judgment", [
      "Exchange preliminary disclosures",
      "Follow FL-700-INFO through the judgment",
      id === "joint" ? "Wait six months from the start of the case before a divorce judgment" : "No six-month wait for legal separation",
    ]));
    return items;
  }
  items.push(phase("serve", "Serve", [
    "Someone 18 or older, who is not you, personally serves the other person",
    hasKids ? "The served set includes the summons, petition, FL-105, and a blank FL-120" : "The served set includes the summons, petition, and a blank FL-120",
    "File FL-115",
  ]));
  items.push(phase("disclose", "Disclose", [
    "Serve preliminary disclosures with the petition or within 60 days",
    "File FL-141",
  ]));
  items.push(phase("finish", "Finish", [
    "If no response after 30 days, ask about the default workshop",
    "If a response is filed, both sides disclose and the court sets conferences",
    id === "nullity"
      ? "Nullity does not use the six-month divorce waiting period. Confirm the judgment steps with the facilitator."
      : id === "legal-separation"
        ? "Prepare the judgment. Legal separation has no six-month divorce wait."
        : "A divorce judgment cannot be entered until six months after service or the response",
  ]));
  return items;
}

function regularFilingSteps(answers, { separation = false } = {}) {
  return [
    "Look up existing cases on the Kern portal before you file, so you do not open a duplicate.",
    "Use Appendix A of the Kern local rules, and the venue note in this packet, to pick the family-law branch.",
    "Fill out the official PDFs. Transfer answers from this worksheet. Sign the petition in blue or black ink.",
    "Take the unsigned copies to the Family Law Facilitator if you want a completeness review. The handout lists 1215 Truxtun Avenue, First Floor, Bakersfield, Monday–Thursday 8 a.m. to 4 p.m. and Friday 8 a.m. to noon, email WMFacil@kern.courts.ca.gov. Confirm the hours; that handout also says the office has no phone.",
    "Make 2 copies, 3 sets total, of the summons, petition, and attachments.",
    "Put a blank FL-120, and a blank FL-105 or FL-160 when those apply, in the set that will be served.",
    "File the originals with the Family Law Division or through a certified e-filing provider. Kern’s e-file page is kern.courts.ca.gov/online_services/efile. E-filing providers charge their own fees. The court’s older instructions say to enter party names in capitals and to upload each form as its own lead document.",
    "Have a person 18 or older who is not a party serve the other person in person. You cannot serve the papers yourself.",
    "File the Proof of Service of Summons (FL-115).",
    separation
      ? "Exchange preliminary financial disclosures. They are mandatory even when you believe there is nothing to divide."
      : "Exchange preliminary financial disclosures. They are mandatory. A divorce judgment also has to wait six months from service of the summons and petition, or from the response.",
  ];
}

function summaryFilingSteps() {
  return [
    "Both of you read FL-810, including the property worksheets.",
    "Give each other completed income and expense information. FL-800 requires an FL-150 from each of you.",
    "If you have community property or debts, sign an agreement that divides them and sign any deeds or title papers the agreement needs.",
    "Confirm the dollar limits on the current FL-800. This wizard uses the April 28, 2025 figures.",
    "File FL-800 at the correct Kern branch, or by the court’s current e-filing process. Summary dissolution is a joint filing: the statewide guide’s joint-fee figure is $870, and Kern’s own fee schedule controls. Each person who cannot pay files a separate fee waiver.",
    "Either of you may revoke the summary dissolution before judgment. If that happens, the short process stops.",
    "After six months, if nobody has revoked, submit the judgment papers described in the summary-dissolution instructions.",
  ];
}

function jointFilingSteps(separation) {
  return [
    "Both of you read the Information Sheet for Joint Petition (FL-700-INFO) and the California Courts joint-petition guide.",
    "Complete FL-700 and FL-710. Add FL-105 if you have minor children.",
    "File together, in person, by mail, or through Kern e-filing. The statewide self-help guide lists a joint filing fee of $870 because each of you has a fee. Confirm Kern’s current schedule. If one or both of you cannot pay, each person who needs a waiver files their own FW-001 and FW-003.",
    "A joint petition does not finish the case. Follow the judgment steps in FL-700-INFO.",
    separation
      ? "There is no six-month waiting period for legal separation."
      : "A divorce judgment still waits at least six months.",
    "If either of you changes your mind, file FL-720. The case leaves the joint track.",
  ];
}

function regularTimeline(dissolution) {
  return [
    { when: "Day you file", what: "The clerk issues a case number. Read the summons the same day. Automatic temporary orders can restrict insurance changes, property transfers, and moving children out of California." },
    { when: "Service", what: "Personal service starts the other person’s 30-day response time. You do not serve the papers yourself." },
    { when: "Within 60 days of filing", what: "Serve preliminary disclosures if you did not serve them with the petition, then file FL-141." },
    { when: "Day 31 after service", what: "If no response was filed, ask the facilitator about a default. If a response was filed, both sides complete disclosures and the court sets settlement conferences." },
    dissolution
      ? { when: "Six months after service", what: "The earliest a divorce judgment can be entered. Earlier paperwork does not make it faster." }
      : { when: "Judgment", what: "Legal separation has no six-month waiting period. It still requires a judgment." },
  ];
}

function jointTimeline(separation) {
  return [
    { when: "Filing", what: "Both of you are petitioners. Read FL-710 the day you file." },
    { when: "After filing", what: "Exchange financial disclosures and finish the written agreements the judgment needs." },
    separation
      ? { when: "Judgment", what: "Submit the judgment papers from FL-700-INFO. No six-month divorce wait applies to legal separation." }
      : { when: "Six months", what: "A divorce is not final until the waiting period ends and the court enters judgment." },
  ];
}

function venueFor(answers) {
  return lookupVenue(answers.people.you.zip, answers.people.you.city);
}

function soloFeeNote(answers) {
  if (answers.fees.ability === "waiver") {
    return "Kern’s posted dissolution handout describes a filing fee and points to the current fee schedule. You asked for a fee waiver. File FW-001 and FW-003 with the petition and confirm the current amounts at kern.courts.ca.gov/forms/Fees. The statewide self-help guide has recently listed divorce filing fees of $435–$450.";
  }
  return "Kern’s dissolution instructions have listed a $435 filing fee and tell you to check the current schedule. The statewide self-help guide lists $435–$450. Use the Kern fee schedule before you go.";
}

function jointFeeNote() {
  return "The California Courts joint-petition guide lists $870 in filing fees because each person pays. Kern’s fee schedule is the number that controls. Fee waivers are filed separately by each person who needs one.";
}

function commonLinks() {
  return [
    { label: "California Courts divorce guide", href: LINKS.divorceGuide },
    { label: "Kern self-help form packets", href: LINKS.packets },
    { label: "Kern fee schedule", href: LINKS.fees },
    { label: "Kern e-filing", href: LINKS.efile },
    { label: "Kern family law workshops", href: LINKS.workshops },
    { label: "Search existing Kern cases", href: LINKS.portal },
    { label: "Summary dissolution qualifications", href: LINKS.summaryQualifications },
    { label: "Joint petition guide", href: LINKS.jointGuide },
    { label: "Fee waiver guide", href: LINKS.feeWaiver },
    { label: "Child support calculator", href: LINKS.childSupport },
    { label: "Kern County Law Library", href: LINKS.lawLibrary },
  ];
}

function residencyReasons(kind) {
  switch (kind) {
    case "not-met":
      return ["At least one person must have lived in California for the last six months and in Kern County for the last three months. These answers do not show that."];
    case "incomplete":
      return ["A residency answer is missing or marked not sure, so a divorce packet would be a guess."];
    case "same-sex-wrong-county":
      return ["The same-sex exception lets you file in the California county where you married, when you now live somewhere that will not dissolve the marriage. You said that county is not Kern."];
    case "file-in-your-county":
      return ["A California-registered domestic partnership can be dissolved here without the six-month rule, but you live in California outside Kern. File in the county where one of you lives."];
    case "marriage-needs-residency":
      return ["You asked to end both a marriage and a domestic partnership. Ending a California domestic partnership does not erase the residency rule for the marriage."];
    default:
      return ["The divorce residency rule is not met on these answers."];
  }
}

function listedProperty(answers) {
  return answers.requests.assets.some((asset) => asset.description.trim()) ||
    answers.requests.debts.some((debt) => debt.description.trim());
}

function formatAddress(person, hide) {
  if (hide) return "Left off this worksheet. Ask the facilitator for a safe mailing address before you file.";
  const cityLine = [person.city, person.state, person.zip].filter(Boolean).join(", ").replace(", CA,", ", CA");
  const line = [person.address, cityLine].filter(Boolean).join(", ");
  return line || "—";
}

function efileName(name) {
  const clean = name.trim();
  return clean ? clean.toUpperCase() : "—";
}

function phase(id, title, items) {
  return { id, title, items: items.map((label, index) => ({ id: `${id}-${index}`, label })) };
}

function baseResult(partial) {
  return {
    id: "incomplete",
    title: "",
    lede: "",
    reasons: [],
    warnings: [],
    formsNow: [],
    formsLater: [],
    localPacket: null,
    filingSteps: [],
    timeline: [],
    worksheet: [],
    phases: [],
    links: [],
    venue: { status: "empty", source: VENUE_SOURCE },
    feeNote: "",
    alternate: null,
    ...partial,
  };
}

function goalLabel(goal) {
  return { dissolution: "Divorce (dissolution)", "legal-separation": "Legal separation", nullity: "Nullity" }[goal] || "—";
}
function relationshipLabel(value) {
  return { marriage: "Marriage", dp: "Registered domestic partnership", both: "Marriage and domestic partnership" }[value] || "—";
}
function styleLabel(value) {
  return {
    solo: "One person files",
    joint: "File together",
    contested: "We disagree on something important",
  }[value] || "—";
}
function whoLabel(value) {
  return {
    you: "You",
    other: "The other person",
    both: "Both of you",
    unsure: "Not sure which person — do not check a residency box until you know",
  }[value] || "—";
}
function yesNo(value) {
  return { yes: "Yes", no: "No", unsure: "Not sure", kern: "Yes" }[value] || "—";
}
function realEstateLabel(value) {
  return {
    none: "No real-estate interest",
    lease: "Only a residence lease that ends within a year of filing and has no option to buy",
    owns: "Someone owns or has another real-estate interest",
    unsure: "Not sure",
  }[value] || "—";
}
function agreementLabel(value) {
  return {
    signed: "Signed agreement",
    nothing: "Nothing to divide",
    "not-yet": "No signed agreement yet",
    unsure: "Not sure",
  }[value] || "—";
}
function supportLabel(value) {
  return {
    terminate: "End the court’s ability to order support",
    reserve: "Reserve the issue so it can be decided later",
    requesting: "Asking for support",
    undecided: "Not decided",
  }[value] || "—";
}
function propertyPlanLabel(value) {
  return {
    none: "No property or debt to divide",
    agreement: "We already have a written agreement",
    divide: "Ask the court to confirm separate property and divide community property",
    later: "Decide later",
  }[value] || "—";
}
function kindLabel(value) {
  return {
    community: "Community or quasi-community",
    "your-separate": "Your separate property",
    "other-separate": "The other person’s separate property",
    unsure: "Not sure how to classify",
  }[value] || "Not classified";
}
function awardLabel(value) {
  return { you: "You", other: "The other person", sell: "Sell and divide", undecided: "Not decided" }[value] || "Not decided";
}
function custodyLabel(value) {
  return { joint: "Joint", you: "You", other: "The other person", undecided: "Not decided" }[value] || "—";
}
function childSupportLabel(value) {
  return {
    guideline: "California guideline support — amount not calculated here",
    reserved: "Reserve",
    undecided: "Not decided",
  }[value] || "—";
}
function insuranceLabel(value) {
  return { you: "You", other: "The other person", both: "Both", undecided: "Not decided" }[value] || "—";
}
function feeLabel(answers) {
  return {
    yes: "You expect to pay the filing fee. Confirm the amount on Kern’s fee schedule.",
    waiver: "You want to ask for a fee waiver (FW-001 and FW-003).",
    unsure: "Not sure. Bring a filled-out fee waiver in case the clerk says the fee is due.",
  }[answers.fees.ability] || "—";
}

function normalizeZip(zip) {
  const digits = String(zip || "").replace(/\D/g, "");
  if (digits.length < 5) return "";
  return digits.slice(0, 5);
}

function normalizeCity(city) {
  return String(city || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function unique(values) {
  return [...new Set(values)];
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
