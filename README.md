# Kern LDA

A desktop toolbox for a Kern County legal document assistant. It runs on your computer. It is not a website, and it does not send matters anywhere.

Each matter keeps an office file, a divorce intake, and filled starting forms in a `Kern-LDA` folder inside your documents. The divorce wizard is the intake. When the matter is a one-person Kern case, Prepare forms writes those answers into the official fillable FL-100, FL-110, and, when there are minor children, FL-105. The PDFs in `forms/` are the Judicial Council originals (FL-100 rev. January 1, 2020, and the matching FL-110 and FL-105), kept with the app so it can fill them offline. Signature lines, the case number, and the FL-105 five-year residence history are left blank on purpose.

Joint petitions (FL-700) and summary dissolutions (FL-800) still get a worksheet. Those forms are not in the autofill set yet.

Court reference links open in your browser when you choose them. Client answers stay in the Kern-LDA folder.

This prepares documents from the client’s answers. It does not give legal advice. Review every PDF before the client signs it.

## Run it

Install [Node.js](https://nodejs.org/) once, then from this folder:

```bash
npm install
npm start
```

`npm start` opens the Kern LDA window. Matters are saved in `Documents/Kern-LDA/matters.json`. Filled PDFs are saved in a folder named with the file number, next to that file.

## Tests

```bash
npm test
```

The tests cover the path rules, the matter file, local file names, and writing a sample intake into the real FL-100, FL-110, and FL-105 fields.
