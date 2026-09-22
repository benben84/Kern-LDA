import {
  LIMITS,
  STEPS,
  blankAnswers,
  exampleSummary,
  exampleWithChild,
  recommend,
  validateStep,
  visibleSteps,
} from "./engine.js";

const STORAGE_KEY = "kern-lda-divorce-wizard-v1";
const sidebar = document.querySelector("#sidebar");
const main = document.querySelector("#main");

let state = loadState();

document.body.addEventListener("click", onClick);
document.body.addEventListener("change", (event) => {
  const target = event.target;
  if (target.dataset && target.dataset.check) {
    state.checks[target.dataset.check] = target.checked;
    saveState();
    return;
  }
  onField(event);
});
document.body.addEventListener("input", (event) => {
  const target = event.target;
  if (!target.dataset || !target.dataset.bind) return;
  if (target.type === "radio" || target.type === "checkbox") return;
  onField(event);
});

window.addEventListener("resize", () => {
  const currentStep = document.querySelector(".step-link.is-current");
  if (currentStep && sidebar.scrollWidth > sidebar.clientWidth + 8) {
    currentStep.scrollIntoView({ inline: "center", block: "nearest" });
  }
});

render({ focusHeading: false });

function onClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "next") go(1);
  if (action === "back") go(-1);
  if (action === "jump") jump(button.dataset.step);
  if (action === "add-child") addRow("children");
  if (action === "add-asset") addRow("assets");
  if (action === "add-debt") addRow("debts");
  if (action === "remove-child") removeRow("children", button.dataset.index);
  if (action === "remove-asset") removeRow("assets", button.dataset.index);
  if (action === "remove-debt") removeRow("debts", button.dataset.index);
  if (action === "example-summary") loadExample(exampleSummary());
  if (action === "example-child") loadExample(exampleWithChild());
  if (action === "reset") reset();
  if (action === "print") window.print();
  if (action === "download") download();
}

function onField(event) {
  const target = event.target;
  if (!target.dataset || !target.dataset.bind) return;
  const value = target.type === "checkbox" ? target.checked : target.value;
  setPath(state.answers, target.dataset.bind, value);
  state.errors = [];
  state.example = false;
  saveState();
  if (target.dataset.rerender === "true") {
    render({ restoreFocusId: target.id });
  }
}

function go(direction) {
  const steps = visibleSteps(state.answers);
  const index = steps.indexOf(state.step);
  if (direction > 0) {
    const errors = validateStep(state.step, state.answers);
    if (errors.length) {
      state.errors = errors;
      render({ focusHeading: false });
      document.querySelector(".errors")?.focus();
      return;
    }
  }
  const next = steps[index + direction];
  if (!next) return;
  state.step = next;
  state.visited[next] = true;
  state.errors = [];
  saveState();
  render({ focusHeading: true });
}

function jump(stepId) {
  const steps = visibleSteps(state.answers);
  const current = steps.indexOf(state.step);
  const target = steps.indexOf(stepId);
  if (target < 0 || (target > current && !state.visited[stepId])) return;
  if (target > current) {
    for (let index = current; index < target; index += 1) {
      const errors = validateStep(steps[index], state.answers);
      if (errors.length) {
        state.step = steps[index];
        state.errors = errors;
        saveState();
        render({ focusHeading: false });
        document.querySelector(".errors")?.focus();
        return;
      }
    }
  }
  state.step = stepId;
  state.errors = [];
  saveState();
  render({ focusHeading: true });
}

function addRow(kind) {
  if (kind === "children") {
    state.answers.children.list.push({ name: "", dob: "", birthPlace: "", sex: "", residence: "" });
  }
  if (kind === "assets") {
    state.answers.requests.assets.push({ description: "", kind: "community", award: "undecided" });
  }
  if (kind === "debts") {
    state.answers.requests.debts.push({ description: "", whoPays: "undecided" });
  }
  state.example = false;
  saveState();
  render({ focusHeading: false });
}

function removeRow(kind, index) {
  const list = kind === "children"
    ? state.answers.children.list
    : state.answers.requests[kind];
  list.splice(Number(index), 1);
  state.example = false;
  saveState();
  render({ focusHeading: false });
}

function loadExample(answers) {
  state.answers = answers;
  state.example = true;
  state.errors = [];
  state.checks = {};
  state.step = "packet";
  visibleSteps(answers).forEach((step) => {
    state.visited[step] = true;
  });
  saveState();
  render({ focusHeading: true });
}

function reset() {
  if (!window.confirm("Erase the answers saved in this browser?")) return;
  state = freshState();
  localStorage.removeItem(STORAGE_KEY);
  render({ focusHeading: true });
}

function download() {
  const payload = {
    note: "Personal divorce worksheet. This is not a court form.",
    exportedAt: new Date().toISOString(),
    answers: state.answers,
    checks: state.checks,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "kern-divorce-worksheet.json";
  link.click();
  URL.revokeObjectURL(url);
}

function render({ focusHeading = false, restoreFocusId = "" } = {}) {
  const steps = visibleSteps(state.answers);
  if (!steps.includes(state.step)) state.step = steps[0];
  sidebar.innerHTML = steps.map((stepId, index) => {
    const meta = STEPS.find((step) => step.id === stepId);
    const currentIndex = steps.indexOf(state.step);
    const enabled = index <= currentIndex || state.visited[stepId];
    return `<button class="step-link ${stepId === state.step ? "is-current" : ""} ${state.visited[stepId] ? "is-done" : ""}" type="button" data-action="jump" data-step="${stepId}" ${enabled ? "" : "disabled"} ${stepId === state.step ? 'aria-current="step"' : ""}>
      <span class="step-index">${index + 1}</span><span>${esc(meta.title)}</span>
    </button>`;
  }).join("");

  const renderer = {
    welcome: renderWelcome,
    safety: renderSafety,
    case: renderCase,
    residency: renderResidency,
    children: renderChildren,
    dates: renderDates,
    property: renderProperty,
    requests: renderRequests,
    people: renderPeople,
    fees: renderFees,
    packet: renderPacket,
  }[state.step];

  main.innerHTML = `<article class="panel">${errorBox()}${renderer()}${navRow()}</article>`;
  const currentStep = document.querySelector(".step-link.is-current");
  if (currentStep && sidebar.scrollWidth > sidebar.clientWidth + 8) {
    currentStep.scrollIntoView({ inline: "center", block: "nearest" });
  }
  if (restoreFocusId) document.getElementById(restoreFocusId)?.focus();
  else if (focusHeading) main.querySelector("h1")?.focus();
}

function errorBox() {
  if (!state.errors.length) return "";
  return `<div class="errors" tabindex="-1" role="alert"><strong>Fix this before continuing.</strong><ul>${state.errors.map((error) => `<li>${esc(error)}</li>`).join("")}</ul></div>`;
}

function navRow() {
  const steps = visibleSteps(state.answers);
  const index = steps.indexOf(state.step);
  const back = index > 0 ? `<button class="button secondary" type="button" data-action="back">Back</button>` : `<span></span>`;
  if (state.step === "packet") {
    return `<div class="nav-row no-print">${back}<button class="button quiet" type="button" data-action="reset">Erase saved answers</button>
      <span>
        <button class="button secondary" type="button" data-action="download">Download answers</button>
        <button class="button" type="button" data-action="print">Print packet</button>
      </span>
    </div>`;
  }
  const label = state.step === "welcome" ? "Begin" : "Continue";
  return `<div class="nav-row"><span>${back}<button class="button quiet" type="button" data-action="reset">Erase saved answers</button></span><button class="button" type="button" data-action="next">${label}</button></div>`;
}

function eyebrow() {
  const steps = visibleSteps(state.answers);
  const meta = STEPS.find((step) => step.id === state.step);
  return `Step ${steps.indexOf(state.step) + 1} of ${steps.length} · ${meta.title}`;
}

function renderWelcome() {
  return `<p class="eyebrow">${eyebrow()}</p>
    <h1 tabindex="-1">Prepare the paperwork. The court still decides the case.</h1>
    <p class="lede">This wizard sorts a Kern County divorce, legal separation, or nullity into a paperwork plan and a worksheet you can copy onto current Judicial Council forms.</p>
    <div class="callout">
      <p>It is not a lawyer, not a Legal Document Assistant, and not the court. It does not give legal advice, calculate support, or create a form the clerk will accept. File the official PDFs from the California Courts website.</p>
    </div>
    <ul>
      <li>Your answers stay in this browser. Nothing is uploaded.</li>
      <li>Do not use a shared or public computer. Download a copy only if you can keep that file private.</li>
      <li>Many official forms are also published in Spanish. Use the language links on each form page.</li>
    </ul>
    <label class="checkline">
      <input type="checkbox" data-bind="acceptedDisclaimer" data-rerender="true" ${state.answers.acceptedDisclaimer ? "checked" : ""}>
      <span>I understand this is a preparation worksheet. I will read the official form instructions and I can ask the Kern Family Law Facilitator or a lawyer before I file.</span>
    </label>
    <details class="no-print">
      <summary>Preview with fictional answers</summary>
      <p class="help">These samples are made up. Erase them before you enter your own information.</p>
      <p>
        <button class="button secondary" type="button" data-action="example-summary">Short marriage, no children</button>
        <button class="button secondary" type="button" data-action="example-child">Divorce with a child</button>
      </p>
    </details>`;
}

function renderSafety() {
  const unsafe = state.answers.safety.unsafeContact === "yes";
  return `<p class="eyebrow">${eyebrow()}</p>
    <h1 tabindex="-1">A court file is public.</h1>
    <p class="lede">The petition asks for an address. If sharing that address or contacting the other person is unsafe, say so before you type it.</p>
    ${choices("unsafe", "safety.unsafeContact", [
      ["no", "It is safe to exchange addresses", "The worksheet can include a mailing address."],
      ["yes", "Contact or my address is unsafe", "Leave the home address off the papers until you have a safe mailing address."],
    ], state.answers.safety.unsafeContact)}
    ${unsafe ? `<div class="warning stop"><p>If you are in danger, call 911.</p><p>Open Door Network 24-hour hotline: (661) 327-1091 or (800) 273-7713. National Domestic Violence Hotline: (800) 799-7233. Kern County Family Justice Center, 1300 18th Street, Bakersfield, (661) 868-5950.</p><p>This wizard does not prepare restraining orders. The facilitator and the Family Justice Center can help with that process.</p></div>` : `<p class="help">Help is available even if you answer no. Open Door Network, (661) 327-1091, answers day and night.</p>`}`;
}

function renderCase() {
  return `<p class="eyebrow">${eyebrow()}</p>
    <h1 tabindex="-1">What are you asking the court to do?</h1>
    <h2>Outcome</h2>
    ${choices("goal", "goal", [
      ["dissolution", "Divorce", "End a marriage or registered domestic partnership."],
      ["legal-separation", "Legal separation", "Stay married, and still ask for orders about property, support, and children."],
      ["nullity", "Nullity", "Ask the court to say the marriage or partnership was never valid. This has strict legal grounds."],
    ], state.answers.goal)}
    <h2>Relationship</h2>
    ${choices("relationship", "relationship", [
      ["marriage", "Marriage", ""],
      ["dp", "Registered domestic partnership", ""],
      ["both", "Both a marriage and a domestic partnership", ""],
    ], state.answers.relationship)}
    <h2>Who will sign the starting papers?</h2>
    ${choices("style", "filingStyle", [
      ["solo", "I am filing on my own", "The other person can respond later. You do not have to agree yet."],
      ["joint", "We will file together", "You both sign, and you agree or expect to agree on every issue."],
      ["contested", "We disagree on something important", "Use the regular petition. Joint and summary cases are for people who agree."],
    ], state.answers.filingStyle)}`;
}

function renderResidency() {
  const residency = state.answers.residency;
  const showWho = residency.filingCounty === "kern" && residency.caSixMonths === "yes" && residency.kernThreeMonths === "yes";
  const showDp = state.answers.relationship === "dp" || state.answers.relationship === "both";
  return `<p class="eyebrow">${eyebrow()}</p>
    <h1 tabindex="-1">Where you live decides where a divorce can be filed.</h1>
    <p class="lede">For a divorce, at least one of you must have lived in California for the last six months and in the filing county for the last three months, unless a specific exception applies.</p>
    ${choices("county", "residency.filingCounty", [
      ["kern", "I want to file in Kern County", ""],
      ["other", "This case belongs in another county", "You will get statewide form names, not Kern filing steps."],
    ], residency.filingCounty)}
    ${residency.filingCounty !== "kern" ? "" : `
      ${yesNoQuestion("Six months in California", "Has at least one of you lived in California for the last six months?", "residency.caSixMonths", residency.caSixMonths, true)}
      ${yesNoQuestion("Three months in Kern", "Has at least one of you lived in Kern County for the last three months?", "residency.kernThreeMonths", residency.kernThreeMonths, true)}
      ${yesNoQuestion("Lives in California", "Does at least one of you live in California now?", "residency.livesInCalifornia", residency.livesInCalifornia, false)}
      ${yesNoQuestion("Lives in Kern", "Does at least one of you live in Kern County now?", "residency.eitherLivesInKern", residency.eitherLivesInKern, false)}
      ${showWho ? `<h2>Who meets both the six-month and three-month tests?</h2>${choices("who", "residency.whoMeetsResidency", [
        ["you", "I do", ""],
        ["other", "The other person does", ""],
        ["both", "We both do", ""],
        ["unsure", "I am not sure which of us", "Do not check a residency box on the petition until you know."],
      ], residency.whoMeetsResidency)}` : ""}
      ${showDp ? `<h2>Domestic partnership</h2>${choices("dpca", "residency.dpRegisteredInCA", [
        ["yes", "It was registered in California", "A California registration can change the residency rule for the partnership."],
        ["no", "It was registered somewhere else", ""],
        ["unsure", "I am not sure", ""],
      ], residency.dpRegisteredInCA)}` : ""}
      <h2>Same-sex marriage exception</h2>
      <p class="help">This is only for couples who married in California and now live somewhere that will not dissolve that marriage.</p>
      ${choices("samesex", "residency.sameSexException", [
        ["no", "This does not describe us", ""],
        ["yes", "This describes us", "You file in the California county where you married."],
      ], residency.sameSexException)}
      ${residency.sameSexException === "yes" ? choices("marriedkern", "residency.marriedInKern", [
        ["yes", "We married in Kern County", ""],
        ["no", "We married in another California county", ""],
      ], residency.marriedInKern) : ""}
    `}`;
}

function renderChildren() {
  const children = state.answers.children;
  return `<p class="eyebrow">${eyebrow()}</p>
    <h1 tabindex="-1">Children change the forms.</h1>
    <p class="lede">Count children under 18 born to the two of you or adopted by you during the marriage or partnership.</p>
    ${choices("minors", "children.hasMinors", [
      ["no", "No minor children", ""],
      ["yes", "Yes, there are children under 18", "You will need the UCCJEA declaration, form FL-105."],
    ], children.hasMinors)}
    <h2>Pregnancy</h2>
    ${choices("pregnant", "children.pregnant", [
      ["no", "Neither of us is pregnant", ""],
      ["yes", "One of us is pregnant", ""],
      ["unsure", "Not sure", ""],
    ], children.pregnant)}
    ${children.hasMinors !== "yes" ? "" : `
      <h2>Each child under 18</h2>
      <p class="help">FL-105 also asks where each child lived for the last five years and about other court cases. This list is the start of that form, not the whole form.</p>
      ${children.list.map((child, index) => `<fieldset class="repeat"><legend class="repeat-head"><strong>Child ${index + 1}</strong> <button class="button quiet" type="button" data-action="remove-child" data-index="${index}">Remove</button></legend>
        ${textField(`child-${index}-name`, `Legal name`, `children.list.${index}.name`, child.name)}
        <div class="grid-2">
          ${textField(`child-${index}-dob`, `Date of birth`, `children.list.${index}.dob`, child.dob, "date")}
          ${textField(`child-${index}-sex`, `Sex, if the current FL-105 asks for it`, `children.list.${index}.sex`, child.sex)}
        </div>
        ${textField(`child-${index}-birth`, `Place of birth`, `children.list.${index}.birthPlace`, child.birthPlace)}
        ${textField(`child-${index}-home`, `Where this child lives now, and with whom`, `children.list.${index}.residence`, child.residence)}
      </fieldset>`).join("")}
      <button class="button secondary" type="button" data-action="add-child">Add a child</button>
      <h2>Other states and other cases</h2>
      ${choices("cases", "children.otherCases", [
        ["no", "No other court cases about these children", ""],
        ["yes", "There is another custody, juvenile, guardianship, or protection case", "Tell the facilitator. It can change which court makes custody orders."],
      ], children.otherCases)}
      ${choices("states", "children.livedOutOfState", [
        ["no", "They have lived in California for the last five years", ""],
        ["yes", "A child lived outside California in the last five years", "Write the full history on FL-105."],
      ], children.livedOutOfState)}
    `}`;
}

function renderDates() {
  const dates = state.answers.dates;
  return `<p class="eyebrow">${eyebrow()}</p>
    <h1 tabindex="-1">Marriage and separation dates.</h1>
    <p class="lede">The petition asks for both dates and for the length of time between them. Separation is a complete break in the marital relationship, not necessarily the day someone moved out.</p>
    ${textField("place", "City and state, or country, of the marriage or registration", "dates.place", dates.place)}
    ${textField("marriage", "Date of marriage or domestic-partnership registration", "dates.marriage", dates.marriage, "date")}
    <label class="checkline">
      <input id="sep-unknown" type="checkbox" data-bind="dates.separationUnknown" data-rerender="true" ${dates.separationUnknown ? "checked" : ""}>
      <span>I do not know the date of separation yet. You will need one before you file.</span>
    </label>
    ${dates.separationUnknown ? "" : textField("separation", "Date of separation", "dates.separation", dates.separation, "date")}`;
}

function renderProperty() {
  const property = state.answers.property;
  const money = (amount) => amount.toLocaleString("en-US");
  return `<p class="eyebrow">${eyebrow()}</p>
    <h1 tabindex="-1">Property limits decide whether the short divorce exists.</h1>
    <p class="lede">Summary dissolution is a joint divorce for short marriages with little property. These questions use the dollar caps printed on forms FL-800 and FL-810 as of ${esc(LIMITS.asOf)}. Count retirement accounts. Do not count cars. Do not count what you still owe on an item.</p>
    <h2>Real estate</h2>
    ${choices("real", "property.realEstate", [
      ["none", "Neither of us has any interest in real estate, anywhere", ""],
      ["lease", "The only interest is a home lease", "It must end within a year of filing and have no option to buy."],
      ["owns", "Someone owns land or a building, or has another real-estate interest", ""],
      ["unsure", "I am not sure", ""],
    ], property.realEstate)}
    ${yesNoQuestion("Community property", `Is community property worth less than $${money(LIMITS.communityProperty)}, excluding cars and amounts still owed? Community property is generally what either of you earned or bought during the marriage, before separation.`, "property.communityUnder", property.communityUnder, true)}
    ${yesNoQuestion("Separate property", `Is each person’s separate property $${money(LIMITS.separateProperty)} or less, excluding cars and amounts still owed? Separate property includes what one person owned before marriage and gifts or inheritances to that person alone.`, "property.separateWithin", property.separateWithin, true)}
    ${yesNoQuestion("Debts", `Are the debts from during the marriage, excluding car loans, $${money(LIMITS.communityDebt)} or less?`, "property.debtWithin", property.debtWithin, true)}
    <h2>Support and agreement</h2>
    ${choices("waive", "property.waiveSupport", [
      ["yes", "We both give up spousal or partner support forever", "Summary dissolution requires this."],
      ["no", "No. Someone may want support, or we want to leave the issue open", ""],
      ["unsure", "We have not decided", ""],
    ], property.waiveSupport)}
    ${choices("agreement", "property.agreement", [
      ["nothing", "There is no community property and there are no community debts", ""],
      ["signed", "We already signed an agreement dividing everything", ""],
      ["not-yet", "We still need an agreement", ""],
      ["unsure", "I am not sure", ""],
    ], property.agreement)}
    ${choices("bothend", "property.bothWantToEnd", [
      ["yes", "We both want the marriage or partnership to end", ""],
      ["no", "The other person does not, or I do not know", "You can still file a regular divorce on your own."],
    ], property.bothWantToEnd)}`;
}

function renderRequests() {
  const requests = state.answers.requests;
  const kids = state.answers.children.hasMinors === "yes";
  return `<p class="eyebrow">${eyebrow()}</p>
    <h1 tabindex="-1">What you want the papers to ask for.</h1>
    <p class="lede">These are requests, not orders. The court decides what to grant. Listing an item here does not transfer title.</p>
    <h2>Legal ground</h2>
    ${choices("ground", "requests.ground", [
      ["irreconcilable", "Irreconcilable differences", "This is the ground used in almost every California divorce and legal separation."],
      ["insanity", "Incurable insanity", "Rare, and it requires proof. Talk to a lawyer before you select it on the form."],
    ], requests.ground)}
    <h2>Spousal or partner support</h2>
    ${choices("support", "requests.spousalSupport", [
      ["terminate", "End the court’s ability to order support later", "A marriage of 10 years or more usually cannot be closed this way without a written agreement."],
      ["reserve", "Leave support open so it can be decided later", ""],
      ["requesting", "I am asking for support", "You have to request it in the petition if you want it."],
      ["undecided", "Not decided", ""],
    ], requests.spousalSupport)}
    <h2>Property and debts</h2>
    ${choices("plan", "requests.propertyPlan", [
      ["none", "Nothing to divide", ""],
      ["agreement", "We have a written agreement", ""],
      ["divide", "Ask the court to confirm separate property and divide the rest", ""],
      ["later", "We will decide later", ""],
    ], requests.propertyPlan)}
    <h3>Assets</h3>
    <p class="help">Optional. Kern’s handout says a property declaration needs a date acquired and a value. Add those on the official FL-160, not only here.</p>
    ${requests.assets.map((asset, index) => `<fieldset class="repeat"><legend class="repeat-head"><strong>Asset ${index + 1}</strong> <button class="button quiet" type="button" data-action="remove-asset" data-index="${index}">Remove</button></legend>
      ${textField(`asset-${index}`, "Description", `requests.assets.${index}.description`, asset.description)}
      <div class="grid-2">
        ${selectField(`asset-kind-${index}`, "How you classify it", `requests.assets.${index}.kind`, asset.kind, [["community", "Community"], ["your-separate", "Your separate property"], ["other-separate", "The other person’s separate property"], ["unsure", "Not sure"]])}
        ${selectField(`asset-award-${index}`, "Who should receive it", `requests.assets.${index}.award`, asset.award, [["you", "You"], ["other", "The other person"], ["sell", "Sell and divide"], ["undecided", "Not decided"]])}
      </div>
    </fieldset>`).join("")}
    <button class="button secondary" type="button" data-action="add-asset">Add an asset</button>
    <h3>Debts</h3>
    ${requests.debts.map((debt, index) => `<fieldset class="repeat"><legend class="repeat-head"><strong>Debt ${index + 1}</strong> <button class="button quiet" type="button" data-action="remove-debt" data-index="${index}">Remove</button></legend>
      ${textField(`debt-${index}`, "Description", `requests.debts.${index}.description`, debt.description)}
      ${selectField(`debt-who-${index}`, "Who should pay", `requests.debts.${index}.whoPays`, debt.whoPays, [["you", "You"], ["other", "The other person"], ["undecided", "Not decided"]])}
    </fieldset>`).join("")}
    <button class="button secondary" type="button" data-action="add-debt">Add a debt</button>
    ${kids ? `<h2>Children</h2>
      ${choices("legal", "requests.legalCustody", [["joint", "Joint legal custody", ""], ["you", "Legal custody to me", ""], ["other", "Legal custody to the other person", ""], ["undecided", "Not decided", ""]], requests.legalCustody)}
      ${choices("physical", "requests.physicalCustody", [["joint", "Joint physical custody", ""], ["you", "Physical custody to me", ""], ["other", "Physical custody to the other person", ""], ["undecided", "Not decided", ""]], requests.physicalCustody)}
      ${textArea("parenting", "Parenting schedule, if you already know what you want to ask for", "requests.parentingNote", requests.parentingNote)}
      ${choices("cs", "requests.childSupport", [["guideline", "California guideline child support", "This wizard will not calculate the amount."], ["reserved", "Reserve child support", ""], ["undecided", "Not decided", ""]], requests.childSupport)}
      ${choices("ins", "requests.healthInsurance", [["you", "I will keep the children’s health insurance", ""], ["other", "The other person will", ""], ["both", "Both of us", ""], ["undecided", "Not decided", ""]], requests.healthInsurance)}` : ""}
    <h2>Former name</h2>
    ${choices("restore", "requests.restoreYourName", [["no", "I do not want a former name restored", ""], ["yes", "Restore my former name", ""]], requests.restoreYourName)}
    ${requests.restoreYourName === "yes" ? textField("former", "Former name", "requests.yourFormerName", requests.yourFormerName) : ""}
    <h2>Orders while the case is open</h2>
    ${choices("temp", "requests.temporaryOrders", [["no", "I can wait for the judgment", ""], ["yes", "I need temporary orders", "Custody, support, or use of a home while the case is pending uses a Request for Order."]], requests.temporaryOrders)}
    ${requests.temporaryOrders === "yes" ? textArea("tempnote", "What you need temporarily", "requests.temporaryNote", requests.temporaryNote) : ""}`;
}

function renderPeople() {
  const you = state.answers.people.you;
  const other = state.answers.people.other;
  const unsafe = state.answers.safety.unsafeContact === "yes";
  return `<p class="eyebrow">${eyebrow()}</p>
    <h1 tabindex="-1">Names for the caption.</h1>
    <p class="lede">Use legal names. Kern’s e-filing instructions say to type party names in capital letters. This packet shows that version for you.</p>
    ${unsafe ? `<div class="warning caution"><p>You said a public address may be unsafe. Leave the street address blank and ask the facilitator how to use a safe mailing address before you file.</p></div>` : ""}
    <h2>You</h2>
    ${textField("you-name", "Your legal name", "people.you.name", you.name)}
    <div class="grid-2">
      ${textField("you-address", "Mailing address", "people.you.address", you.address)}
      ${textField("you-city", "City", "people.you.city", you.city)}
      ${textField("you-state", "State", "people.you.state", you.state)}
      ${textField("you-zip", "ZIP code", "people.you.zip", you.zip)}
      ${textField("you-phone", "Phone", "people.you.phone", you.phone, "tel")}
      ${textField("you-email", "Email", "people.you.email", you.email, "email")}
    </div>
    <p class="help">The ZIP is compared with Kern’s February 2020 family-law venue chart so the packet can suggest a branch. Confirm Appendix A of the local rules before you file.</p>
    <h2>The other person</h2>
    ${textField("other-name", "Legal name", "people.other.name", other.name)}
    <label class="checkline">
      <input id="addr-unknown" type="checkbox" data-bind="people.other.addressUnknown" data-rerender="true" ${other.addressUnknown ? "checked" : ""}>
      <span>I do not have an address for service. You still have to serve the papers. Ask the facilitator before you file.</span>
    </label>
    ${other.addressUnknown ? "" : `<div class="grid-2">
      ${textField("other-address", "Street address", "people.other.address", other.address)}
      ${textField("other-city", "City", "people.other.city", other.city)}
      ${textField("other-state", "State", "people.other.state", other.state)}
      ${textField("other-zip", "ZIP code", "people.other.zip", other.zip)}
    </div>`}`;
}

function renderFees() {
  const joint = state.answers.filingStyle === "joint";
  return `<p class="eyebrow">${eyebrow()}</p>
    <h1 tabindex="-1">Filing fees.</h1>
    <p class="lede">${joint
      ? "A joint petition has a fee for each of you. The California Courts guide lists $870 combined. Kern’s fee schedule is the number that controls."
      : "Kern’s dissolution handout has listed a $435 filing fee and points you to the current schedule. The statewide guide lists $435–$450."}</p>
    ${choices("fee", "fees.ability", [
      ["yes", "I can pay the filing fee", ""],
      ["waiver", "I need to ask for a fee waiver", "Each person who needs one files FW-001 and FW-003."],
      ["unsure", "I am not sure", "Fill out a fee waiver and let the clerk tell you whether the fee is due."],
    ], state.answers.fees.ability)}
    <p class="help"><a href="https://www.kern.courts.ca.gov/forms/Fees">Open the Kern fee schedule</a> and <a href="https://selfhelp.courts.ca.gov/fee-waiver">the statewide fee-waiver guide</a>.</p>`;
}

function renderPacket() {
  const result = recommend(state.answers);
  const generated = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return `<p class="eyebrow">Your packet · ${esc(generated)}</p>
    ${state.example ? `<div class="example-banner no-print"><p>This packet uses fictional sample answers. Erase them before you enter your own.</p></div>` : ""}
    <div class="packet-banner">
      <div class="stamp">Worksheet · not a court form</div>
      <h1 tabindex="-1">${esc(result.title)}</h1>
      <p class="lede">${esc(result.lede)}</p>
    </div>
    ${result.warnings.map((warning) => `<div class="warning ${esc(warning.level)}"><p>${esc(warning.text)}</p></div>`).join("")}
    ${result.reasons.length ? `<h2>Why this path</h2><ul class="reasons">${result.reasons.map((reason) => `<li>${esc(reason)}</li>`).join("")}</ul>` : ""}
    ${result.alternate ? `<div class="callout"><h3>${esc(result.alternate.title)}</h3><p>${esc(result.alternate.text)}</p>${formTable(result.alternate.formsNow)}</div>` : ""}
    ${venueBlock(result.venue)}
    ${result.feeNote ? `<div class="callout"><p>${esc(result.feeNote)}</p></div>` : ""}
    ${result.localPacket ? `<p>Kern self-help packet to pick up or compare: <strong>${esc(result.localPacket.code)}</strong>, ${esc(result.localPacket.title)}. Packets are listed at <a href="https://www.kern.courts.ca.gov/self-help/self-help-court-form-packets">kern.courts.ca.gov</a>.</p>` : ""}
    ${result.formsNow.length ? `<h2>Forms to complete now</h2>${formTable(result.formsNow)}` : ""}
    ${result.formsLater.length ? `<h2>Forms for later steps</h2>${formTable(result.formsLater)}` : ""}
    ${result.filingSteps.length ? `<h2>Filing steps</h2><ol class="reasons">${result.filingSteps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>` : ""}
    ${result.timeline.length ? `<h2>Timeline</h2><ol class="timeline">${result.timeline.map((item) => `<li><strong>${esc(item.when)}</strong><span>${esc(item.what)}</span></li>`).join("")}</ol>` : ""}
    ${result.phases.length ? `<h2>Checklist</h2><div class="phases">${result.phases.map((phase) => `<section class="phase"><h3>${esc(phase.title)}</h3>${phase.items.map((item) => `<label><input id="check-${esc(item.id)}" type="checkbox" data-check="${esc(item.id)}" ${state.checks[item.id] ? "checked" : ""}><span>${esc(item.label)}</span></label>`).join("")}</section>`).join("")}</div>` : ""}
    ${result.worksheet.length ? `<h2>Worksheet</h2><div class="worksheet">${result.worksheet.map((section) => `<section><h3>${esc(section.heading)}</h3><dl>${section.rows.map((row) => `<dt>${esc(row.label)}</dt><dd>${esc(row.value)}</dd>`).join("")}</dl></section>`).join("")}</div>` : ""}
    ${result.links.length ? `<h2>Where to confirm this</h2><ul class="link-list">${result.links.map((link) => `<li><a href="${esc(link.href)}">${esc(link.label)}</a></li>`).join("")}</ul>` : ""}
    <p class="help">Prepared ${esc(generated)} from answers stored in this browser. Dollar caps and fees change. Read the current form and the Kern fee schedule before you sign.</p>`;
}

function venueBlock(venue) {
  if (!venue || venue.status === "empty") return "";
  if (venue.status === "unknown") {
    return `<div class="venue callout"><h3>Courthouse</h3><p>ZIP ${esc(venue.zip)} is not on the February 2020 Kern family-law venue chart. Use Appendix A of the local rules.</p><p class="help">${esc(venue.source)}</p></div>`;
  }
  if (venue.status === "ambiguous") {
    const options = venue.options.map((option) => `${option.cities.join(" or ")}: ${option.courthouse.name}, ${option.courthouse.address}`).join(". ");
    return `<div class="venue callout"><h3>Courthouse</h3><p>ZIP ${esc(venue.zip)} appears under more than one branch. ${esc(options)}.</p><p class="help">${esc(venue.source)}</p></div>`;
  }
  if (venue.status === "match") {
    return `<div class="venue callout"><h3>Suggested Kern branch</h3><p><strong>${esc(venue.courthouse.name)}</strong><br>${esc(venue.courthouse.address)}<br>${esc(venue.courthouse.phone)}</p><p class="help">${esc(venue.source)}</p></div>`;
  }
  return "";
}

function formTable(forms) {
  if (!forms || !forms.length) return "";
  return `<table><thead><tr><th>Form</th><th>What it is</th><th></th></tr></thead><tbody>${forms.map((form) => `<tr><td class="code">${esc(form.code)}</td><td><strong>${esc(form.name)}</strong><br><span class="muted">${esc(form.note)}</span></td><td><a href="${esc(form.href)}">Open</a></td></tr>`).join("")}</tbody></table>`;
}

function yesNoQuestion(title, help, path, current, includeUnsure) {
  const options = [["yes", "Yes", ""], ["no", "No", ""]];
  if (includeUnsure) options.push(["unsure", "Not sure", ""]);
  return `<h2>${esc(title)}</h2><p class="help">${esc(help)}</p>${choices(path, path, options, current)}`;
}

function choices(name, path, options, current) {
  return `<div class="choices">${options.map(([value, label, help]) => `<label class="choice">
      <input type="radio" name="${esc(name)}" id="${esc(slug(name))}-${esc(value)}" data-bind="${esc(path)}" data-rerender="true" value="${esc(value)}" ${current === value ? "checked" : ""}>
      <span><strong>${esc(label)}</strong>${help ? `<small>${esc(help)}</small>` : ""}</span>
    </label>`).join("")}</div>`;
}

function textField(id, label, path, value, type = "text") {
  return `<div class="field"><label for="${esc(id)}">${esc(label)}</label><input id="${esc(id)}" type="${esc(type)}" data-bind="${esc(path)}" value="${esc(value || "")}"></div>`;
}

function textArea(id, label, path, value) {
  return `<div class="field"><label for="${esc(id)}">${esc(label)}</label><textarea id="${esc(id)}" data-bind="${esc(path)}">${esc(value || "")}</textarea></div>`;
}

function selectField(id, label, path, value, options) {
  return `<div class="field"><label for="${esc(id)}">${esc(label)}</label><select id="${esc(id)}" data-bind="${esc(path)}">${options.map(([option, text]) => `<option value="${esc(option)}" ${option === value ? "selected" : ""}>${esc(text)}</option>`).join("")}</select></div>`;
}

function freshState() {
  return { step: "welcome", answers: blankAnswers(), checks: {}, visited: { welcome: true }, errors: [], example: false };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || !saved.answers) return freshState();
    return {
      step: saved.step || "welcome",
      answers: mergeAnswers(blankAnswers(), saved.answers),
      checks: saved.checks || {},
      visited: saved.visited || { welcome: true },
      errors: [],
      example: Boolean(saved.example),
    };
  } catch {
    return freshState();
  }
}

function mergeAnswers(base, saved) {
  if (Array.isArray(base)) return Array.isArray(saved) ? saved : base;
  if (!saved || typeof saved !== "object" || typeof base !== "object") return saved ?? base;
  const merged = { ...base };
  Object.keys(base).forEach((key) => {
    merged[key] = mergeAnswers(base[key], saved[key]);
  });
  return merged;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    step: state.step,
    answers: state.answers,
    checks: state.checks,
    visited: state.visited,
    example: state.example,
  }));
}

function setPath(root, path, value) {
  const parts = path.split(".");
  let cursor = root;
  for (let index = 0; index < parts.length - 1; index += 1) {
    cursor = cursor[parts[index]];
  }
  cursor[parts[parts.length - 1]] = value;
}

function slug(value) {
  return String(value).replace(/[^a-z0-9]+/gi, "-");
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[character]));
}
