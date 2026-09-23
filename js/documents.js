import { PDFDocument } from "../vendor/pdf-lib.min.js";

export async function buildPdf(plan) {
  const response = await fetch(plan.template);
  if (!response.ok) throw new Error(`The form template ${plan.id} did not load.`);
  const doc = await PDFDocument.load(await response.arrayBuffer());
  const form = doc.getForm();
  for (const entry of plan.text) {
    form.getTextField(entry.name).setText(entry.value);
  }
  for (const name of plan.checks) {
    form.getCheckBox(name).check();
  }
  try {
    form.updateFieldAppearances();
  } catch {
    // Some court fields already have an appearance. The values are still saved.
  }
  return doc.save();
}

export function downloadPdf(bytes, filename) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
