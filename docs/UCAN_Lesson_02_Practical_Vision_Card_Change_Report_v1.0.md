# UCAN Lesson 02
## Practical Vision Card Change Report v1.0

**Sprint:** Final Targeted Improvement Sprint — Step 2  
**Change type:** Targeted Practical Artifact Hotfix  
**Exclusive input:** `UCAN_Lesson_02_Gold_Release_Candidate_v2.0_Step1_Vision_Focus_Hotfix.zip`

## 1. Change summary

Step 2 adds one final learner-facing field to the existing practical card so the participant records the primary practical result of Lesson 02: a first climate-neutral vision statement for their community.

The lesson structure, page order, learning flow, cases, test, reflection, PDF generation, AI prompt, navigation, URLs and visual assets were not changed.

## 2. Exact placement

The new block was added on **page 8 — “Картка кліматично нейтральної візії громади”**, inside the existing `#portfolio-form`.

Placement:

- after the existing field **“Який перший управлінський сигнал можна дати команді?”**;
- before the existing form action buttons;
- therefore, it concludes the existing preparatory questions without moving or restructuring the practical task.

## 3. Learner-facing content added

### Heading / field label

**Кліматично нейтральна візія Вашої громади**

### Instruction

**Спираючись на визначений виклик, приклади інших міст та обрані принципи, сформулюйте одним або двома реченнями бажаний майбутній стан Вашої громади.**

### Placeholder

**Наша громада прагне стати…**

The field is a five-row multiline `textarea`, sufficient for one or two complete sentences on desktop and mobile.

## 4. Storage integration

The semantic field identifier is:

- HTML `id`: `climate-neutral-vision`;
- form data key: `climateNeutralVision`.

The field uses the existing Lesson 02 Portfolio persistence architecture:

- storage container: `ucan_l02_portfolio_v1`;
- format: the existing JSON object used by all Portfolio fields;
- save: existing input-event autosave;
- restore: existing Portfolio restore routine;
- clear: existing Portfolio clear action.

No parallel localStorage architecture or additional storage key was introduced. The new field does not overwrite other Portfolio answers and is not a target of the case-transfer mechanism.

## 5. Portfolio Summary integration

The current Portfolio Summary now includes a distinct, visually prominent block before the existing definition list:

**Кліматично нейтральна візія громади**

The block uses the existing `callout tip` component and displays the participant’s `climateNeutralVision` text. When the field is empty, it displays an em dash. The rest of the Portfolio Summary structure remains unchanged.

## 6. Files changed

| File | Change |
|---|---|
| `index.html` | Added the final vision field and the Portfolio Summary vision block. |
| `js/script.js` | Connected the vision value to the existing Portfolio Summary rendering. Existing generic save/restore logic automatically includes the new field. |
| `docs/PACKAGE_MANIFEST.sha256` | Regenerated after the controlled changes. |
| `docs/UCAN_Lesson_02_Practical_Vision_Card_Change_Report_v1.0.md` | Added this change report. |

`css/style.css` was not changed because existing form and callout components fully support the new block.

## 7. Sanity Check

| Check | Result |
|---|---|
| ZIP input unpacked correctly | PASS |
| `index.html` parsed and loaded in controlled Chromium runtime | PASS |
| New field appears inside the existing page 8 practical card | PASS |
| New field follows the existing preparatory questions | PASS |
| `climateNeutralVision` saved in `ucan_l02_portfolio_v1` | PASS |
| Value restored in a simulated browser reload with persisted storage | PASS |
| Value shown in Portfolio Summary | PASS |
| Page sequence contains exactly `page-1` through `page-10` | PASS |
| Navigation buttons traversed pages 1–10 with existing gates pre-completed | PASS |
| JavaScript syntax check | PASS |
| No new Chromium console or page errors | PASS |
| CSS unchanged | PASS |

Because the managed environment blocks direct Chromium navigation to local HTTP and `file://` origins, the browser sanity test used an exact inlined copy of the final `index.html`, `style.css` and `script.js`. This preserves the production DOM and JavaScript runtime while avoiding the restricted local-origin navigation path.

## 8. Step 1 preservation

Confirmed present in the updated build:

1. Page 1 Learning Outcome:
   **“Уміє сформулювати первинну кліматично нейтральну візію власної громади на основі визначеного виклику, прикладів інших міст та обраних принципів.”**

2. Page 2 practical focus:
   **“Практичний фокус: результатом цього заняття стане сформульована Вами первинна кліматично нейтральна візія громади — на основі визначеного виклику, прикладів інших міст та обраних принципів.”**

3. Page 8 final practical vision field added by Step 2.

## 9. Scope confirmation

No changes were made to:

- PDF generation or PDF field mapping;
- AI prompt content or AI modes;
- inter-lesson navigation;
- page URLs or `#page-*` routing;
- AI Preview;
- cases, cities or official URLs;
- test, reflection or interactive scenarios;
- visual assets;
- CSS;
- unrelated JavaScript architecture.

## 10. Completion status

🟢 Step 2 Completed — Practical Vision Card Integrated  
🟢 Step 1 Changes Preserved  
🟢 Ready for Step 3 — Technical Integration
