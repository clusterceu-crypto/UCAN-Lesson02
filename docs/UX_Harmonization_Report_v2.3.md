# UCAN Lesson 02 — UX Harmonization Report v2.3

## Scope

**Baseline:** `UCAN_Lesson_02_Gold_Release_v2.2_CASE_OTHER_Hotfix.zip`  
**Canonical UX reference:** current Lesson 01 Gold Release interface model.  
**Change type:** controlled UX harmonization only.

No learner-facing lesson content, page order, Portfolio model, CASE_OTHER logic, AI prompt content, localStorage keys, gates, navigation, quiz, practical assignment, URLs or visual assets were changed.

## Implemented changes

### 1. PDF export

- Button label changed to `📄 Завантажити мою картку PDF`.
- Removed the HTML iframe and browser print-dialog workflow.
- Implemented the Lesson 01 local pipeline:
  `canvas → JPEG → PDF Blob → automatic download`.
- No external libraries, server requests or cloud services are used.
- Filename format:
  `Картка_кліматичного_виклику_<Назва_громади>_<YYYY-MM-DD>.pdf`.
- Empty community name falls back to `Громада`.
- Learner status messages:
  - `Створюємо PDF локально…`
  - `PDF створено та завантажено.`
  - `Не вдалося створити PDF. Спробуйте ще раз у сучасному браузері.`

The existing PDF data composition remains unchanged: community name, climate challenge, climate-neutral vision, preparatory community vision, selected case notes including CASE_OTHER, resilience, NBS, resource loss, principles and management signal.

### 2. AI prompt copy UX

- All three AI modes and their prompt text remain unchanged.
- `📋 Скопіювати запит` now performs immediate copy and displays a short confirmation.
- Removed the separate Preview button, Preview Dialog and duplicate dialog-copy handler.
- The existing inline prompt preview remains available.
- Clipboard fallback remains available for browsers where the Clipboard API cannot be used.

### 3. Code cleanup

Removed only obsolete code connected to the replaced UX:

- printable HTML generator;
- hidden print iframe;
- `window.print()` and `afterprint` handling;
- unused print variables and handlers;
- AI preview-dialog variables, listeners and copy handler.

The current Lesson 02 architecture was preserved. A separate `ucan-interface.js` was not introduced because the source build embeds `UCANInterface` in `js/script.js`; extracting it would have been an unrelated architecture change.

## Files changed

- `index.html`
- `js/script.js`
- `README.md` — synchronized with the actual v2.3 runtime behavior
- `docs/PACKAGE_MANIFEST.sha256` — regenerated for package integrity
- `docs/UX_Harmonization_Report_v2.3.md` — this required report

`css/style.css` and all visual assets are byte-identical to the source baseline.

## Controlled regression verification

### Static checks

- JavaScript syntax: PASS
- 10 lesson pages retained: PASS
- localStorage keys unchanged: PASS
- AI Preview Dialog removed: PASS
- browser print workflow removed from HTML/JavaScript: PASS
- CSS unchanged: PASS
- A01–A03 asset hashes unchanged: PASS

### Chromium runtime checks

**21/21 checks passed**, including:

- direct PDF download and valid PDF structure;
- requested filename pattern with community name and date;
- PDF completion status;
- Portfolio Summary;
- CASE_OTHER and selected case notes;
- all three AI modes and immediate prompt copy;
- community name and climate-neutral vision;
- localStorage save and restore;
- scenario gate;
- navigation and progress restoration;
- final quiz and completion gate;
- no new JavaScript console or runtime errors.

The controlled test PDF contained two pages and was downloaded without opening a print dialog.

## Result

🟢 **Lesson 02 UX Harmonized with Canonical Lesson 01.**
