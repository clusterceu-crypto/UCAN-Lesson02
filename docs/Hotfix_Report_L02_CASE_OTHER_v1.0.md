# UCAN Lesson 02
## Local UX Hotfix — Case Selection «Інше»

**Hotfix ID:** `L02-CASE-OTHER`  
**Source of Truth:** `UCAN_Lesson_02_Gold_Release_v2.2.zip`  
**Scope:** one local UX addition to the existing multi-case micro-task.

## 1. What changed

In the block **«Оберіть один або кілька прикладів»**, the four approved cases remain unchanged:

- Львів;
- Роттердам;
- Амстердам;
- Левен.

A fifth checkbox was added:

- **Інше**.

When **«Інше»** is selected, the existing case-note area dynamically shows:

1. **Назва прикладу** — a text field.
2. After a name is entered, the same three-note structure used by the approved cases:
   - «Яку управлінську проблему вирішував цей приклад?»;
   - «Який принцип корисний для Вашої громади?»;
   - «Що варто перевірити у громаді «Назва громади»?».

When the checkbox is disabled, the custom case block is hidden, but its title and notes remain stored. Re-enabling the checkbox restores the entered data.

## 2. Integration

The custom case uses the existing Lesson 02 case storage container:

- localStorage key: `ucan_l02_case_notes_v2`;
- existing payload version: `2`;
- existing record fields: `id`, `title`, `problem`, `principle`, `localCheck`.

No new localStorage namespace or parallel case architecture was introduced.

The custom case enters the same existing data paths as the four approved cases:

- controlled transfer to the Practical Card;
- Portfolio Summary;
- Print / Save as PDF through `caseRecordText()` → `pdfData.caseInsights`;
- all three AI modes through the shared prompt builder.

The disabled state is stored as the reserved record ID `other-hidden`; this preserves the record without including it among currently selected case outputs. Re-selection restores the active ID `other`.

## 3. Files changed

Production files changed:

- `index.html`;
- `js/script.js`.

Not changed:

- `css/style.css`;
- Lesson structure and learner-facing theory;
- the four approved Story Cards and cases;
- Portfolio field architecture;
- AI mode logic;
- PDF architecture;
- navigation, gates and page routing;
- visual assets.

Service file updated for package integrity:

- `docs/PACKAGE_MANIFEST.sha256`.

Report added:

- `docs/Hotfix_Report_L02_CASE_OTHER_v1.0.md`.

## 4. Verification performed

- JavaScript syntax check: **PASS**.
- Static HTML check: the four approved case checkboxes remain present and unchanged; **«Інше»** is added after them.
- CSS comparison: `css/style.css` is byte-identical to Gold Release v2.2.
- Controlled inlined Chromium runtime check: **PASS** for:
  - selecting «Інше»;
  - dynamic title field;
  - hiding note fields until a title is entered;
  - community-name label substitution;
  - localStorage payload creation;
  - transfer to Practical Card;
  - Portfolio Summary inclusion;
  - inclusion in all three AI modes;
  - hiding without data deletion;
  - restoration after re-selection;
  - no JavaScript runtime exceptions.
- Print / Save as PDF integration: existing production call path statically verified (`caseRecordText()` → `pdfData.caseInsights` → PDF field list).

Direct localhost and `file://` execution is blocked by the managed Chromium policy in this environment. The runtime interaction check therefore used the exact HTML/CSS/JS in a controlled inlined Chromium document with a localStorage-compatible test double. This is a targeted sanity check, not a new full QA cycle.

## 5. How to verify manually

1. Open Lesson 02 and navigate to **«Маленьке завдання перед практичною карткою»**.
2. Confirm that Львів, Роттердам, Амстердам and Левен are unchanged.
3. Select **«Інше»**.
4. Enter a value in **«Назва прикладу»**.
5. Fill all three note fields.
6. Reload the page and confirm the data are restored.
7. Disable **«Інше»** and confirm the custom block is hidden.
8. Re-enable **«Інше»** and confirm all entered data return.
9. Use **«Перенести всі висновки до практичної картки»**.
10. Confirm the custom case appears in Portfolio Summary, Print / Save as PDF and each of the three AI prompts.

## Status

🟢 Local UX Hotfix Completed
