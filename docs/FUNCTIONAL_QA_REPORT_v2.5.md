# UCAN Lesson 02 — Functional QA Report v2.5

## Scope

Functional verification covered the corrected learner journey, not a redesign or a new curriculum audit.

## Test environment

- Browser: Chromium 144 headless.
- Exact production `index.html`, `css/style.css`, `js/script.js` and three PNG assets were executed.
- Direct localhost and `file://` navigation were blocked by the environment with `ERR_BLOCKED_BY_ADMINISTRATOR`.
- A controlled in-browser harness embedded the exact files and supplied test-only in-memory equivalents of `localStorage` and clipboard fallback. Production files were not modified by the harness.

## Results

**67 / 67 checks passed.** Browser console errors: **0**. Runtime errors: **0**.

### Scenario 1 — Clean Start

- Page 1 opened correctly.
- AI radio selector and permanent preview were absent.
- Three independent AI cards and buttons were present.
- Navigation to case selection worked.

### Scenario 2 — Save and Reload

- All practical fields saved under `ucan_l02_portfolio_v1`.
- Exact values restored after controlled reload.
- Case state restored under `ucan_l02_case_notes_v2`.
- User received `Збережені дані відновлено.`

### Scenario 3 — «Інше»

- Selecting «Інше» displayed the labelled title field.
- Empty title blocked forward navigation with Ukrainian feedback.
- Title and three notes persisted.
- Deselecting hid the block without deleting data.
- Reselecting restored the title and notes.
- Data appeared in Portfolio Summary, AI prompts and PDF input.

### Scenario 4 — AI Prompt Copy

- `facts`, `questions` and `structure` produced three distinct prompts.
- Each prompt included current Portfolio data and selected case notes.
- Each button showed `Скопійовано` and `Промпт скопійовано.`
- Labels reset after approximately 1800 ms.
- Repeated copy worked.
- Clipboard fallback path was exercised.

### Scenario 5 — PDF

| Scenario | Pages | Blank pages | Bottom clipping signal | Result |
|---|---:|---:|---:|---|
| Complete short card + «Інше» | 2 | 0 | 0 | PASS |
| Long Ukrainian answers | 4 | 0 | 0 | PASS |
| Repeated generation after changed vision | 3 | 0 | 0 | PASS |

Filename contract passed:

`Картка_кліматичного_виклику_Тестова_громада_2026-07-26.pdf`

No print dialog or `window.print()` path was used.

### Scenario 6 — Mobile

- Viewport: 390 × 844.
- Horizontal document overflow: not detected.
- AI cards rendered as one column.
- Buttons and form controls remained usable.

### Scenario 7 — Keyboard

- Native buttons accepted keyboard focus.
- AI copy action activated with Enter.
- Image lightbox opened, closed with Escape and returned focus to the invoker.
- Required-field validation focused the first incomplete field.

## Regression confirmation

Preserved and verified:

- navigation and progress;
- scenario gate;
- Portfolio Summary;
- case selection and transfer;
- CASE_OTHER persistence;
- Lesson 01 import code path;
- three AI modes;
- PDF download;
- final test and completion state;
- localStorage key names;
- image lightbox;
- approved visual assets.
