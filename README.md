# Kern LDA

A self-help wizard for people preparing a divorce, legal separation, or nullity in Kern County, California.

It asks the questions that decide which case type fits, then builds a filing plan and a worksheet mapped to current Judicial Council forms (FL-100, FL-110, FL-700, FL-800, and the related attachments). It does not give legal advice, calculate support, or create a PDF the court clerk will accept. Copy the worksheet onto the official forms from [California Courts](https://selfhelp.courts.ca.gov/divorce) and confirm fees, hours, and the correct branch on [kern.courts.ca.gov](https://www.kern.courts.ca.gov/).

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

The tests cover the path rules: summary dissolution limits, residency, Kern venue by ZIP, joint petition versus a one-person petition, and the form list for a case with children.
