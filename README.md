# Kern LDA

A local toolbox for a Kern County legal document assistant. Each matter keeps an office file, a divorce intake, and filled starting forms.

The divorce wizard is the intake. When the matter is a one-person Kern case, Prepare forms writes those answers into the official fillable FL-100, FL-110, and, when there are minor children, FL-105. The PDFs in `forms/` are the Judicial Council originals (FL-100 rev. January 1, 2020, and the matching FL-110 and FL-105), re-saved so a browser can fill the form fields. Signature lines, the case number, and the FL-105 five-year residence history are left blank on purpose.

Joint petitions (FL-700) and summary dissolutions (FL-800) still get a worksheet. Those forms are not in the autofill set yet.

This prepares documents from the client’s answers. It does not give legal advice. Review every PDF before the client signs it.

Answers stay in the browser. Nothing is uploaded.

## Run it

```bash
python3 -m http.server 8765
```

Open `http://localhost:8765`.

## Tests

```bash
npm test
```

The tests cover the path rules, the matter file, and writing a sample intake into the real FL-100, FL-110, and FL-105 fields.
