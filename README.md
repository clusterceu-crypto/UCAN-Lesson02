# UCAN Lesson 02 — Gold Release v2.3

## Run

Extract the archive and serve the folder through an HTTP/HTTPS server. Open `index.html`. The lesson has no server-side dependency and stores learner data locally in the browser.

## Runtime files

- `index.html`
- `css/style.css`
- `js/script.js`
- `assets/images/` — three approved visual assets

## UX harmonization v2.3

- the Portfolio action is labelled `📄 Завантажити мою картку PDF`;
- PDF is created locally through the canonical Lesson 01 canvas → JPEG → PDF Blob → browser download workflow;
- the browser print dialog is not used;
- the downloaded filename follows `Картка_кліматичного_виклику_<Назва_громади>_<YYYY-MM-DD>.pdf`;
- AI prompt copy happens immediately and provides concise learner feedback;
- the AI prompt preview dialog and its obsolete handlers were removed;
- all Lesson 02 Portfolio, CASE_OTHER, AI-mode, navigation, progress, quiz and localStorage behavior remains compatible with v2.2.

## Privacy

Portfolio, case notes and progress remain in browser localStorage. External AI platforms receive nothing automatically. PDF creation is local and makes no server request.

## Verification boundary

The v2.3 UX hotfix passed JavaScript syntax, package integrity and controlled Chromium regression checks. It is not a new full QA cycle.
