# UCAN Lesson 02 — Full QA v2.1 Blockers Hotfix Report v1.0

## 1. Scope and source lock

Primary source: `UCAN_Lesson_02_Gold_Release_Candidate_v2.1_RC.zip`.

QA sources used:

- `UCAN_Lesson_02_Full_QA_Report_v2.1.md`;
- `UCAN_Lesson_02_Regression_Report_v2.1.md`;
- `UCAN_Lesson_02_Defect_Register_v2.1.xlsx`;
- `UCAN_Lesson_02_GitHub_Readiness_Report_v2.1.md`.

No previous release archive, legacy HTML or other Lesson 02 edition was used.

## 2. Hotfix boundary

Only the following release blockers were addressed:

1. L02-QA-001 — PDF Accessibility;
2. L02-QA-002 — PDF Pagination;
3. L02-QA-004 — GitHub Pages Routing.

L02-QA-003 — Browser QA Coverage was not closed by code. It remains open for real Microsoft Edge and Firefox execution.

No lesson content, Learning Outcomes, Portfolio fields, `climateNeutralVision`, AI modes, test, cases, Story Cards, approved visual assets, page order or `#page-*` routing was changed.

## 3. Defect remediation

### L02-QA-001 — PDF Accessibility

**Original cause:** the runtime rendered each PDF page to a canvas, converted the canvas to JPEG and embedded the JPEG as a full-page PDF image. The document had no meaningful text layer.

**Change:** the canvas/JPEG PDF builder was removed. The PDF control now creates a semantic, print-ready HTML document containing headings and Portfolio values as real DOM text, then invokes the browser print-to-PDF workflow locally.

The print document includes as text:

- community name;
- climate challenge;
- climate-neutral vision;
- all other Portfolio answers;
- all section headings;
- the participant note.

**Exact compliance level:**

- searchable/selectable text — **Resolved**;
- text copying and search — **Resolved in Chromium stress output**;
- correct Ukrainian glyph rendering — **Resolved in Chromium stress output**;
- tagged PDF / PDF-UA — **Not implemented or guaranteed by the lesson code**.

**Status:** **Partially Resolved.** The product defect that made the PDF image-only is removed. Full PDF/UA conformance is not claimed because semantic PDF tagging remains dependent on the browser print engine and its settings.

### L02-QA-002 — PDF Pagination

**Original cause:** the custom canvas pagination estimated vertical space line by line and could start new blank canvases or orphan the note on a new page.

**Change:** pagination is delegated to the browser paged-media engine. The print template uses A4 page rules, measured browser text layout, widows/orphans controls, break-safe headings and splittable long answer blocks. The participant note is placed with the document metadata so it cannot create a dedicated trailing page.

**Status:** **Resolved** in the three required Chromium stress scenarios. No blank pages, clipping or section overlap were found.

### L02-QA-004 — GitHub Pages Routing

**Original cause:** the final controls used unresolved relative sibling paths.

**Change:** only the two adjacent-lesson controls were updated:

- `← Попереднє заняття` → `https://clusterceu-crypto.github.io/UCAN-Lesson01/`;
- `Наступне заняття →` → `https://clusterceu-crypto.github.io/UCAN-Lesson03/`.

Both controls open in a new tab and use `noopener noreferrer`. Internal Lesson 02 navigation was not changed.

**Status:** **Resolved in package configuration.** Live availability remains part of the GitHub Pages smoke test.

### L02-QA-003 — Browser QA Coverage

No code-based closure was attempted. A dedicated Edge/Firefox checklist was prepared.

**Status:** **Open — Retest Required.**

## 4. Changed production files

- `index.html` — canonical production URLs and safe external-link attributes;
- `js/script.js` — semantic print-to-PDF document and browser pagination;
- `README.md` — v2.1.1 runtime and PDF workflow note;
- `docs/PACKAGE_MANIFEST.sha256` — regenerated package integrity manifest.

New controlled QA records added under `docs/`:

- `UCAN_Lesson_02_Full_QA_Blockers_Hotfix_Report_v1.0.md`;
- `UCAN_Lesson_02_PDF_Stress_Test_Report_v1.0.md`;
- `UCAN_Lesson_02_Edge_Firefox_Retest_Checklist_v1.0.md`.

CSS, visual assets and all learner-content fields remained unchanged.

## 5. Internal sanity check

| Check | Result |
|---|---|
| JavaScript syntax (`node --check`) | PASS |
| Release root and ZIP structure | PASS |
| Package manifest | PASS — 19/19 entries verified |
| Step 1 Learning Outcome retained | PASS |
| Step 1 practical vision focus retained | PASS |
| Step 2 `climateNeutralVision` field retained | PASS |
| Portfolio save and restore | PASS in controlled Chromium runtime |
| Three AI modes retained | PASS |
| `climateNeutralVision` present in all three AI prompts | PASS |
| Text-print workflow invoked without new console errors | PASS in controlled Chromium runtime |
| Canonical previous/next production URLs | PASS |
| `#page-*` routing modified | NO |
| Full Edge/Firefox browser matrix | NOT EXECUTED |

The managed browser environment blocks direct local file/HTTP navigation. Runtime sanity was therefore executed on an exact inlined copy of the modified package. PDF stress outputs were generated by Chromium from the same semantic print template and print CSS.

## 6. PDF stress test summary

| Scenario | Pages | Blank pages | Text extraction | Vision present | Clipping/overlap |
|---|---:|---:|---|---|---|
| A — short responses | 1 | 0 | PASS | PASS | Not observed |
| B — medium responses | 2 | 0 | PASS | PASS | Not observed |
| C — long valid responses | 19 | 0 | PASS | PASS | Not observed |

Detailed evidence is recorded in `UCAN_Lesson_02_PDF_Stress_Test_Report_v1.0.md`.

## 7. Defect status table

| Defect | Status |
|---|---|
| L02-QA-001 — PDF Accessibility | **Partially Resolved** — searchable/selectable text resolved; PDF/UA tagging not claimed |
| L02-QA-002 — PDF Pagination | **Resolved** |
| L02-QA-004 — GitHub Pages Routing | **Resolved** |
| L02-QA-003 — Browser QA Coverage | **Open — Retest Required** |
| L02-QA-005 — Partial Portfolio placeholders | Open, non-blocking, out of scope |

## 8. Hotfix decision

The package is ready for targeted repeat QA of the three remediated defects and real browser execution in Microsoft Edge and Firefox. No full release approval is claimed by this hotfix report.
