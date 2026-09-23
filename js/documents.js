import { PDFDocument } from "../vendor/pdf-lib.min.js";

export async function buildPdf(plan, templateBytes) {
  if (!templateBytes) throw new Error(`The ${plan.id} template was not read from this computer.`);
  const doc = await PDFDocument.load(templateBytes);
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
