# UCAN Lesson 02 — PDF Stress Test Report v1.0

## 1. Purpose

Targeted verification of the v2.1.1 semantic print-to-PDF template after remediation of L02-QA-001 and L02-QA-002.

The tests use the same `createPortfolioPrintHtml()` template and print CSS used by the production PDF control. Chromium generated the evidence PDFs through its paged-media PDF engine.

## 2. Accessibility level verified

Verified:

- section headings and Portfolio values are PDF text objects;
- `pdftotext` extracts meaningful Ukrainian text;
- text is searchable/selectable/copyable in the generated evidence PDFs;
- all required headings and values are present;
- Ukrainian characters render without replacement glyphs.

Not claimed:

- tagged PDF;
- PDF/UA conformance;
- guaranteed screen-reader structure across every browser print implementation.

`pdfinfo` reported `Tagged: no` for the controlled Chromium outputs. The exact compliance status is therefore **searchable/selectable text achieved; PDF/UA not achieved**.

## 3. Test scenarios

### Scenario A — short responses

- Input: one or two short sentences in each answer field.
- Page count: **1**.
- Blank pages: **0**.
- `climateNeutralVision`: present.
- All headings and expected answer samples: extracted successfully.
- Clipping or overlap: not observed in rendered page inspection.

### Scenario B — medium responses

- Input: multiple paragraphs in each multiline field.
- Page count: **2**.
- Blank pages: **0**.
- `climateNeutralVision`: present.
- All headings and expected answer samples: extracted successfully.
- Clipping or overlap: not observed in rendered page inspection.

### Scenario C — long valid responses

No HTML `maxlength` is defined in the current Portfolio. The stress input therefore used an intentionally extended but valid value: approximately 9,749 normalized characters in each large text field.

- Page count: **19**.
- Blank pages: **0**.
- `climateNeutralVision`: present.
- Long source text: found in the extracted PDF text without truncation.
- All section headings: present.
- Clipping or overlap: not observed in first, middle and final-page render inspection; all pages retained printable margins.

## 4. Pagination evidence

| Scenario | Page text character counts | Empty pages |
|---|---|---|
| A | 1,306 | None |
| B | 1,931; 845 | None |
| C | 3,459; 4,530; 4,280; 4,525; 4,461; 4,530; 4,148; 4,373; 4,530; 4,488; 4,441; 4,379; 4,530; 4,486; 4,441; 4,377; 4,530; 4,532; 402 | None |

Rendered page bounds retained visible margins. No content touched the page edge in the sampled and automated render-bound checks.

## 5. Result

- Image-only PDF defect: removed.
- Searchable/selectable Ukrainian text: PASS.
- Blank-page defect: PASS / resolved in all three scenarios.
- Text clipping: not observed.
- Text overlap: not observed.
- PDF/UA tagging: not implemented; requires a separate future accessibility decision if full PDF/UA is mandatory.
