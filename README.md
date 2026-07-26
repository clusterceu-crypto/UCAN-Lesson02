# UCAN Lesson 02 — Gold Release v2.2

## Run

Extract the archive and serve the folder through an HTTP/HTTPS server. Open `index.html`. The lesson has no server-side dependency and stores learner data locally in the browser.

## Runtime files

- `index.html`
- `css/style.css`
- `js/script.js`
- `assets/images/` — three approved visual assets

## Gold completion changes

- one or several city cases can be selected;
- each selected case keeps separate problem, principle and local-check notes;
- legacy `ucan_l02_case_notes_v1` data migrate idempotently to `ucan_l02_case_notes_v2` while the source record is retained;
- multi-case transfer fills available principle fields and requires merge, replace or skip for occupied targets;
- case provenance is included consistently in Portfolio Summary, Print/Save-as-PDF and all three AI modes;
- `communityVision` is identified as a preparatory desired-state sketch; `climateNeutralVision` remains the final integrated vision;
- the AI learner workflow explicitly covers choose, preview, copy, open, paste and verify;
- the PDF action is labelled `🖨️ Друк / Зберегти як PDF` and continues to use searchable browser Print-to-PDF;
- current release documentation replaces superseded v2.0 claims.

## Privacy

Portfolio, case notes and progress remain in browser localStorage. External AI platforms receive nothing automatically. The learner chooses what to copy and paste. PDF preparation remains local.

## Verification boundary

The completion build passed package integrity, JavaScript syntax and controlled Chromium sanity checks. PDF-UA is not implemented or claimed. Independent deployment verification in the target browser matrix remains a release-governance action, not a hidden application claim.
