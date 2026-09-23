import { mountWizard, unmountWizard } from "./wizard.js";
import { planDocuments } from "./populate.js";
import { buildPdf } from "./documents.js";
import {
  createMatter,
  loadMatterFile,
  matterTitle,
  nextFileNumber,
  removeMatter,
  upsertMatter,
} from "./matters.js";
import { visibleSteps } from "./engine.js";
import { openDesktopStore } from "./desktop-store.js";

const toolbox = document.querySelector("#toolbox");
const wizardLayout = document.querySelector("#wizard-layout");
const brandTitle = document.querySelector("#brand-title");
const brandNote = document.querySelector("#brand-note");
const headerMatter = document.querySelector("#header-matter");

let activeMatterId = "";
let store = null;

openDesktopStore().then((opened) => {
  if (!opened) {
    renderDesktopRequired();
    return;
  }
  store = opened;
  window.addEventListener("hashchange", renderRoute);
  toolbox.addEventListener("click", onToolboxClick);
  toolbox.addEventListener("input", onToolboxInput);
  renderRoute();
}).catch((error) => {
  toolbox.hidden = false;
  wizardLayout.hidden = true;
  toolbox.innerHTML = `<section class="panel"><h1>The matter folder could not be opened</h1><p>${esc(error.message || "Kern LDA could not read the files on this computer.")}</p></section>`;
});

function renderDesktopRequired() {
  wizardLayout.hidden = true;
  toolbox.hidden = false;
  headerMatter.hidden = true;
  brandTitle.textContent = "LDA toolbox";
  brandNote.textContent = "On this computer";
  toolbox.innerHTML = `<section class="panel">
    <p class="eyebrow">Kern LDA</p>
    <h1>This toolbox runs on your computer</h1>
    <p class="lede">Start the Kern LDA app from the project folder. It does not run as a website, and it does not keep matters in a browser.</p>
    <div class="callout"><p>Run <code>npm install</code> once, then <code>npm start</code>. Each matter and its filled forms are written to the Kern-LDA folder in your documents.</p></div>
  </section>`;
}

function renderRoute() {
  const route = parseRoute(location.hash);
  unmountWizard();
  wizardLayout.hidden = route.name !== "wizard";
  toolbox.hidden = route.name === "wizard";
  headerMatter.hidden = route.name === "home";
  if (route.name === "home") {
    activeMatterId = "";
    brandTitle.textContent = "LDA toolbox";
    brandNote.textContent = "On this computer · matters and prepared forms";
    headerMatter.removeAttribute("href");
    renderHome();
    return;
  }
  const matter = loadMatterFile(store).find((item) => item.id === route.id);
  if (!matter) {
    location.hash = "#/";
    return;
  }
  activeMatterId = matter.id;
  headerMatter.href = `#/matter/${matter.id}`;
  headerMatter.textContent = matter.fileNumber || "Matter file";
  if (route.name === "wizard") {
    brandTitle.textContent = matterTitle(matter);
    brandNote.textContent = `${matter.fileNumber} · Divorce wizard`;
    toolbox.innerHTML = "";
    mountWizard({
      load: () => matter.wizard,
      save: (wizard) => saveWizard(matter.id, wizard),
      onMatter: () => { location.hash = `#/matter/${matter.id}`; },
      onDocuments: () => { location.hash = `#/matter/${matter.id}/documents`; },
      onExport: (payload) => store.saveFile(matter.fileNumber || matter.id, "worksheet.json", new TextEncoder().encode(JSON.stringify(payload, null, 2))),
    });
    return;
  }
  if (route.name === "documents") {
    brandTitle.textContent = "Prepare forms";
    brandNote.textContent = `${matter.fileNumber} · ${matterTitle(matter)}`;
    renderDocuments(matter);
    return;
  }
  brandTitle.textContent = matterTitle(matter);
  brandNote.textContent = `${matter.fileNumber} · Matter file`;
  renderMatter(matter);
}

function renderHome() {
  const matters = loadMatterFile(store);
  toolbox.innerHTML = `<section class="panel">
    <p class="eyebrow">Kern LDA</p>
    <h1>Matters</h1>
    <p class="lede">Open a divorce file, take the intake in the wizard, then prepare the starting Judicial Council forms from those answers.</p>
    <p><button class="button" type="button" data-action="new-matter">New divorce matter</button></p>
    ${matters.length ? `<div class="matter-list">${matters.map(matterCard).join("")}</div>` : `<div class="callout"><p>No matters yet. A new file keeps the client’s answers in the Kern-LDA folder on this computer and uses them to fill FL-100, FL-110, and FL-105.</p></div>`}
    <p class="help">Saved on this computer in ${esc(store.dataDir)}.</p>
    <p class="help">This toolbox prepares documents from what the client tells you. It is not a law practice and it does not give legal advice. Review every form before the client signs it.</p>
  </section>`;
}

function renderMatter(matter) {
  const steps = visibleSteps(matter.wizard.answers);
  const done = steps.filter((step) => matter.wizard.visited[step]).length;
  toolbox.innerHTML = `<section class="panel">
    <p class="eyebrow">${esc(matter.fileNumber)} · opened ${esc(matter.openedOn)}</p>
    <h1>${esc(matterTitle(matter))}</h1>
    <p class="lede">The divorce wizard is the intake. Office notes stay on this file and are not copied onto the court forms.</p>
    <div class="action-row">
      <a class="button" href="#/matter/${esc(matter.id)}/wizard">Continue intake</a>
      <a class="button secondary" href="#/matter/${esc(matter.id)}/documents">Prepare forms</a>
    </div>
    <p class="help">Intake progress: ${done} of ${steps.length} wizard steps opened.</p>
    <div class="grid-2">
      ${officeField(matter, "fileNumber", "Your file number")}
      ${officeField(matter, "referral", "How they were referred")}
      ${officeField(matter, "feeNote", "Fee quote or amount received")}
      ${officeField(matter, "conflictNote", "Conflict-check note")}
    </div>
    <div class="field">
      <label for="office-notes">Office notes</label>
      <textarea id="office-notes" data-office="officeNotes">${esc(matter.officeNotes)}</textarea>
    </div>
    <div class="nav-row">
      <button class="button quiet" type="button" data-action="delete-matter" data-id="${esc(matter.id)}">Delete this matter</button>
      <a class="button secondary" href="#/">All matters</a>
    </div>
  </section>`;
}

function renderDocuments(matter) {
  const plan = planDocuments(matter.wizard.answers);
  const forms = plan.forms.map((form) => `<article class="phase">
      <h3>${esc(form.id)} · ${esc(form.title)}</h3>
      <p>${esc(form.filename)}</p>
      ${form.notes.length ? `<ul class="reasons">${form.notes.map((note) => `<li>${esc(note)}</li>`).join("")}</ul>` : "<p class=\"help\">No extra blanks were flagged.</p>"}
      <p><button class="button" type="button" data-action="download-form" data-form="${esc(form.id)}">Save filled ${esc(form.id)} on this computer</button></p>
    </article>`).join("");
  toolbox.innerHTML = `<section class="panel">
    <p class="eyebrow">${esc(matter.fileNumber)}</p>
    <h1>Forms from this intake</h1>
    <p class="lede">The answers in the wizard are written into the official fillable forms stored with this app. Signature dates and the case number are left blank. Read the PDF before the client signs it.</p>
    <p class="help">Filled forms are saved under ${esc(store.dataDir)}.</p>
    ${plan.unavailable ? `<div class="warning caution"><p>${esc(plan.unavailable)}</p></div>` : ""}
    <div class="phases">${forms}</div>
    ${plan.forms.length ? `<p class="help">Each form is saved as its own PDF in this matter’s folder.</p><p id="save-status" class="callout" role="status" hidden></p>` : `<p><a class="button" href="#/matter/${esc(matter.id)}/wizard">Finish the intake</a></p>`}
    <div class="nav-row"><a class="button secondary" href="#/matter/${esc(matter.id)}">Back to the matter file</a></div>
  </section>`;
}

function matterCard(matter) {
  return `<a class="matter-card" href="#/matter/${esc(matter.id)}">
    <strong>${esc(matter.fileNumber || "No file number")}</strong>
    <span>${esc(matterTitle(matter))}</span>
    <small>Opened ${esc(matter.openedOn)}</small>
  </a>`;
}

function officeField(matter, key, label) {
  return `<div class="field"><label for="office-${esc(key)}">${esc(label)}</label><input id="office-${esc(key)}" data-office="${esc(key)}" value="${esc(matter[key] || "")}"></div>`;
}

function onToolboxClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  if (button.dataset.action === "new-matter") {
    const matters = loadMatterFile(store);
    const matter = createMatter({ fileNumber: nextFileNumber(matters) });
    upsertMatter(store, matter);
    location.hash = `#/matter/${matter.id}/wizard`;
  }
  if (button.dataset.action === "delete-matter") {
    if (!window.confirm("Delete this matter from the toolbox on this computer? PDFs already saved in its folder stay where they are.")) return;
    removeMatter(store, button.dataset.id);
    location.hash = "#/";
  }
  if (button.dataset.action === "download-form") downloadForm(button.dataset.form, button);
}

function onToolboxInput(event) {
  const field = event.target.closest("[data-office]");
  if (!field || !activeMatterId) return;
  const matters = loadMatterFile(store);
  const matter = matters.find((item) => item.id === activeMatterId);
  if (!matter) return;
  matter[field.dataset.office] = field.value;
  upsertMatter(store, matter);
}

async function downloadForm(formId, button) {
  const matter = loadMatterFile(store).find((item) => item.id === activeMatterId);
  if (!matter) return;
  const plan = planDocuments(matter.wizard.answers).forms.find((form) => form.id === formId);
  if (!plan) return;
  button.disabled = true;
  const original = button.textContent;
  button.textContent = "Preparing…";
  try {
    const template = await store.readTemplate(plan.template);
    const bytes = await buildPdf(plan, template);
    const savedPath = await store.saveFile(matter.fileNumber || matter.id, plan.filename, bytes);
    const status = document.querySelector("#save-status");
    if (status) {
      status.hidden = false;
      status.textContent = `Saved on this computer: ${savedPath}`;
      status.scrollIntoView({ block: "center" });
    }
  } catch (error) {
    window.alert(error.message || "The form could not be prepared.");
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

function saveWizard(id, wizard) {
  const matter = loadMatterFile(store).find((item) => item.id === id);
  if (!matter) return;
  matter.wizard = wizard;
  upsertMatter(store, matter);
}

function parseRoute(hash) {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (parts[0] === "matter" && parts[1] && parts[2] === "wizard") return { name: "wizard", id: parts[1] };
  if (parts[0] === "matter" && parts[1] && parts[2] === "documents") return { name: "documents", id: parts[1] };
  if (parts[0] === "matter" && parts[1]) return { name: "matter", id: parts[1] };
  return { name: "home" };
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
