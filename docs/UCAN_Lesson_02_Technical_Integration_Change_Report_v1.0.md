> **Historical record.** The relative adjacent-lesson URLs recorded in section 6 were superseded by the v2.1.1 routing hotfix. The current executable uses the canonical production URLs for Lesson 01 and Lesson 03.

# UCAN Lesson 02
## Technical Integration Change Report v1.0

**Sprint:** Final Targeted Improvement Sprint — Step 3  
**Change type:** Targeted Technical Integration  
**Exclusive input:** `UCAN_Lesson_02_Gold_Release_Candidate_v2.0_Step2_Practical_Vision_Card.zip`  
**Output release:** `UCAN_Lesson_02_Gold_Release_Candidate_v2.1_RC.zip`

## 1. Summary

Step 3 integrates the existing `climateNeutralVision` field into the technical outputs and controlled cross-lesson workflow of Lesson 02. The change does not alter the lesson content, learning outcomes, practical-card structure, Portfolio Summary, cases, test, reflection, visual design or `#page-*` architecture.

The resulting build is frozen as Release Candidate v2.1 and is ready for Full QA.

## 2. PDF integration

The local Portfolio PDF now includes a separate section:

**Кліматично нейтральна візія громади**

The section reads the value from `climateNeutralVision` and appears immediately after:

**Головний кліматичний виклик із попереднього заняття**

All pre-existing PDF sections retain their order and content.

## 3. AI Prompt integration

The shared prompt builder used by all three existing AI modes now includes:

```text
Кліматично нейтральна візія громади:
{{climateNeutralVision}}
```

Placement: after the climate challenge and before the existing desired-state field.

Confirmed modes:

1. Перевірити факти й припущення.
2. Поставити уточнювальні питання.
3. Перевірити повноту та слабкі місця рішення.

No new AI mode or prompt architecture was created.

## 4. Optional Lesson 01 community-context import

Lesson 02 now attempts a safe optional import from Lesson 01 localStorage records.

Imported targets:

- `communityName` — назва громади;
- `climateChallenge` — головний кліматичний виклик.

Safety rules:

- only localStorage keys identifiable as Lesson 01 records are inspected;
- JSON objects and direct scalar Lesson 01 keys are supported;
- nested objects are inspected to a bounded depth;
- only empty Lesson 02 fields are populated;
- existing Lesson 02 values are never overwritten;
- imported data is saved into the current `ucan_l02_portfolio_v1` object;
- absence, malformed data or restricted storage does not interrupt Lesson 02.

No external transfer service or additional storage architecture was introduced.

## 5. Transfer UX correction

The case-transfer action still copies the selected principle and local decision into the practical card, including the existing overwrite-protection dialog.

The previous automatic call that opened page 8 after transfer was removed. The learner remains on the current page and controls subsequent navigation.

## 6. Final-page adjacent-lesson navigation

Page 10 now contains two semantic links:

- `← Попереднє заняття` → `../lesson-01/index.html`;
- `Наступне заняття →` → `../lesson-03/index.html`.

They use the existing button system and mobile-responsive `button-row` component. The internal Lesson 02 page navigation and all `#page-*` routes are unchanged.

The relative route contract was checked in the controlled runtime. Availability of the adjacent lesson packages remains part of the deployment-level GitHub Pages smoke test.

## 7. Files changed

| File | Change |
|---|---|
| `index.html` | Added the two adjacent-lesson links on page 10. |
| `js/script.js` | Added PDF and AI integration, optional Lesson 01 import, and removed automatic navigation after case transfer. |
| `README.md` | Updated release identification to v2.1 RC and recorded the Step 3 integration scope. |
| `docs/UCAN_Lesson_02_Technical_Integration_Change_Report_v1.0.md` | Added this report. |
| `docs/PACKAGE_MANIFEST.sha256` | Regenerated for the frozen package. |

`css/style.css` was not changed. Existing components provide the required final-page layout.

## 8. Sanity Check

A controlled Chromium sanity run completed **39/39 checks — PASS**.

| Check group | Result |
|---|---|
| Input package and `index.html` load | PASS |
| Step 1 Learning Outcome preserved | PASS |
| Step 1 practical focus preserved | PASS |
| Step 2 vision field preserved | PASS |
| `climateNeutralVision` save and simulated reload restore | PASS |
| Portfolio Summary vision retained | PASS |
| PDF file generation and `%PDF-1.4` validity | PASS |
| PDF vision heading and learner value | PASS |
| PDF field order: challenge → vision → desired state | PASS |
| AI facts mode includes vision | PASS |
| AI questions mode includes vision | PASS |
| AI structure mode includes vision | PASS |
| Lesson 01 import with available data | PASS |
| Safe operation without Lesson 01 data | PASS |
| Case transfer remains on page 5 | PASS |
| Adjacent-lesson labels, href contracts and click interaction | PASS |
| JavaScript syntax | PASS |
| New console errors | None |
| New page errors | None |

The managed environment blocks direct Chromium navigation to localhost and `file://` origins. The browser sanity run therefore used an exact inlined copy of the final production HTML, CSS, JavaScript and approved images, with a controlled localStorage and History API test harness. This does not replace the requested deployment-level Full QA or GitHub Pages smoke test.

## 9. Step 1 and Step 2 preservation

Confirmed in the frozen RC:

- the Step 1 Learning Outcome remains on page 1;
- the Step 1 practical-focus statement remains on page 2;
- the Step 2 `climateNeutralVision` textarea remains in the page 8 practical card;
- the Step 2 Portfolio Summary vision block remains active;
- the field still uses the existing `ucan_l02_portfolio_v1` persistence model.

## 10. Scope confirmation

No changes were made to:

- learner-facing lesson content beyond the requested adjacent-lesson button labels;
- Learning Outcomes;
- practical-card questions or Portfolio Summary structure;
- cases, cities, examples or official URLs;
- interactive scenarios or assessment;
- reflection;
- AI mode logic;
- visual assets;
- CSS;
- page count, page order or `#page-*` routing.

## 11. Release status

🟢 Step 3 Completed — Technical Integration  
🟢 Release Candidate v2.1 Frozen  
🟢 Ready for Full QA
