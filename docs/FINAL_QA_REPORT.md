# UCAN Lesson 02 — Final QA Report v2.0

**Release:** `UCAN_Lesson_02_Gold_Release_Candidate_v2.0`  
**QA date:** 2026-07-26  
**Decision:** 🟢 Gold Release Candidate QA Passed

## 1. QA scope

The final build was checked through:

- HTML and release-structure QA;
- functional Chromium QA;
- mobile rendering QA at 375 × 812 px;
- accessibility and keyboard/dialog QA;
- regression QA for all Candidate B improvements;
- release integrity and asset-hash QA.

## 2. HTML QA

**Status: PASS**

- 10 continuous lesson pages, ordered 1–10;
- one H1 per page;
- no duplicate IDs;
- no orphan runtime files or missing local references;
- no numbered adjacent-lesson references to Lesson 01 or Lesson 03;
- three learning images have meaningful alt text and keyboard-accessible zoom buttons;
- three native dialogs have explicit accessible labels;
- JavaScript syntax validation passed;
- no runtime console errors were recorded.

## 3. Content and asset preservation

**Status: PASS**

- 148 substantial Candidate B learning-content segments were checked after the approved semantic wording substitutions;
- no substantial learning-content segment was lost;
- all 10 Candidate B external URLs were preserved;
- Lviv, Rotterdam, Amsterdam and Leuven examples remain present;
- all approved PNG assets are byte-identical to Candidate B:
  - `UCAN_L02_A01_v1.1.png` — `d341db92375c40081c3980482e33520683316d506fb1dee1abfa4bbedb1e400f`;
  - `UCAN_L02_A02_v1.2.png` — `44c325dd6b8843d645f83041d96235ec9c4247fb03bfe009c2dabe6caf0f9707`;
  - `UCAN_L02_A03_v1.2.png` — `819dbeaac818ad5260c0c28d79f90cb32e98429ca8c71ae707c57fc83bdbb130`.

## 4. Functional QA

**Status: PASS**

Verified in controlled Chromium:

- sequential navigation and correct routing;
- strict scenario completion gate;
- scenario state persistence;
- final-test gate and five correct-answer completion;
- browser Back/Forward navigation;
- progress persistence and explicit completed state;
- Portfolio autosave, restore, summary and edit flow;
- protected case transfer with merge confirmation;
- local PDF generation;
- three independent AI prompts;
- inline and dialog copy actions;
- reset scope preserving Portfolio and case notes;
- reload persistence.

Generated PDF evidence:

- `UCAN_Картка_кліматично_нейтральної_візії_Тестова_громада.pdf`;
- size: 221,258 bytes;
- header: `%PDF-1.4`.

## 5. Accessibility QA

**Status: PASS**

- progressbar uses 0–100 percentage semantics and descriptive `aria-valuetext`;
- all form controls had an accessible name in the live DOM check;
- image enlargement is reachable by keyboard;
- native dialogs support ESC close;
- backdrop click closes image, AI and Portfolio dialogs;
- focus returns to the invoking control;
- focused page headings use scroll margin and are not hidden under the fixed interface;
- no duplicate IDs or unlabeled interactive elements were found;
- reduced-motion behavior remains supported.

## 6. Mobile QA

**Status: PASS**

At 375 px width:

- document scroll width remained equal to viewport width;
- H1 text did not overflow its container;
- compact page labels fit without clipping;
- Portfolio form remained within the viewport;
- fixed navigation remained usable;
- dialogs and lightbox fit mobile dimensions.

## 7. Release QA

**Status: PASS**

The package contains one runtime only:

```text
UCAN_Lesson_02_Gold_Release_Candidate_v2.0/
├── index.html
├── README.md
├── css/style.css
├── js/script.js
├── assets/images/ (3 approved PNG files)
└── docs/
```

No nested ZIP, legacy JavaScript, duplicate runtime, unused font placeholder or superseded production artifact is included.

## 8. Environment limitation

The local HTTP server returned the release `index.html` successfully with HTTP 200. Managed Chromium did not complete a direct localhost navigation in this environment. Functional and visual QA therefore used an exact inlined copy of the final HTML, CSS, JavaScript and image bytes. This is not an identified application defect, but the unchanged ZIP must receive a final smoke test on the intended HTTP/HTTPS publication origin before public release.

## 9. Final QA decision

**🟢 Final QA Passed — no known functional regression remains open.**
