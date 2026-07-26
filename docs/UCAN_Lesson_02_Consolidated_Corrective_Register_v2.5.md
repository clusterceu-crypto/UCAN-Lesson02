# UCAN Lesson 02 — Consolidated Corrective Register v2.5

Input baseline: `UCAN_Lesson_02_Gold_Release_v2.4.zip`  
Baseline disposition: **Superseded Candidate — Corrective Revision Required**

| Defect ID | Category | File | Element | Previous state | Corrected state | Severity | Acceptance test | Verification result | Standard impact |
|---|---|---|---|---|---|---|---|---|---|
| L02-COR-001 | AI UX | `index.html` | AI support selector | One radio selector controlled three modes. | Three independent scenario cards. | Major | No `l02-ai-mode`; 3 cards present. | PASS | AI Prompt Card Contract |
| L02-COR-002 | AI UX | `index.html`, `js/script.js` | Copy action | One shared copy button copied the selected mode. | Each scenario owns one button and one status region. | Major | Three distinct prompts copied independently. | PASS | Copy Interaction Contract |
| L02-COR-003 | AI UX | `index.html`, `js/script.js` | Prompt preview | Permanent preview exposed full prompt and created an unnecessary step. | Permanent preview and related selectors removed. | Major | No preview element or old selector remains. | PASS | AI Prompt Card Contract |
| L02-COR-004 | AI feedback | `js/script.js` | Success state | Generic `Скопійовано` status and shared state. | Per-card `Промпт скопійовано.` plus temporary button state. | Major | Button resets after 1800 ms and supports repeat copy. | PASS | Copy Interaction Contract |
| L02-COR-005 | AI fallback | `js/script.js` | Clipboard error | Error depended on manually copying from the old preview. | Ukrainian error tells the user to allow clipboard access and retry. | Minor | Failure branch preserves button label. | PASS | Copy Interaction Contract |
| L02-COR-006 | AI prompt quality | `js/script.js` | Three prompt contracts | Prompts had tasks and output formats but no explicit role/context structure. | Added role, course context, participant data, constraints, response format and insufficient-data rule. | Major | Each copied prompt is self-contained and distinct. | PASS | AI Prompt Content Pattern |
| L02-COR-007 | Localization | `index.html`, `js/script.js` | AI / learner-facing terminology | Learner-facing text mixed English and inconsistent Ukrainian terminology with `запит` and `prompt`. | Learner-facing interface uses the controlled consultation term and `промпт`; product names remain official. | Minor | Inventory contains no unjustified learner-facing AI selector wording. | PASS | Localization Rules |
| L02-COR-008 | Practical UX | `index.html` | Save button | `Зберегти карту` was inaccurate. | `Зберегти картку`. | Minor | Button label matches saved object. | PASS | Button Naming Rules |
| L02-COR-009 | Practical UX | `index.html` | Step 4 instruction | Mentioned print and mixed `AI-помічник`, although export is direct PDF download. | Explains save, PDF download and optional AI consultation verification. | Minor | Text matches actual actions. | PASS | Learner-facing Localization Rules |
| L02-COR-010 | Form contract | `index.html`, `js/script.js` | Required fields | No field was identified as required; incomplete cards could be treated as complete. | All practical-card fields are marked required and validated in Ukrainian. | Major | Forward navigation and save are blocked on missing fields. | PASS | Form Label and Validation Rules |
| L02-COR-011 | Completion integrity | `js/script.js` | Page 8 → 9 gate | Learner could continue with an incomplete practical card. | Forward navigation requires a complete practical card. | Major | Missing first field keeps page 8 active and focuses it. | PASS | Final Product Acceptance Gate |
| L02-COR-012 | Completion integrity | `js/script.js` | Stale completed state | Stored completion could remain true after required data was cleared or incomplete. | Completion flag is removed when required conditions are not met. | Major | Reload with incomplete card returns to page 8. | PASS | localStorage Persistence Contract |
| L02-COR-013 | CASE_OTHER | `js/script.js` | Other title | Empty title could remain selected without a required-field contract. | Dynamic title is required, has `aria-required`, custom validity and Ukrainian feedback. | Major | Empty title blocks forward navigation. | PASS | «Інше» Conditional Field Contract |
| L02-COR-014 | CASE_OTHER | `js/script.js` | Hide / restore | Data was preserved, but completion rules were not explicit. | Deselect hides and deactivates without deleting; reselect restores title and notes. | Major | Hide/reselect round-trip preserves values. | PASS | «Інше» Conditional Field Contract |
| L02-COR-015 | Case outputs | `js/script.js` | Empty placeholders | AI case text used technical `[не заповнено]` placeholders. | Natural Ukrainian `Не надано` / no-case text. | Minor | Copied prompts contain no bracketed technical placeholders. | PASS | AI Prompt Content Pattern |
| L02-COR-016 | PDF UX | `index.html` | PDF button | `Завантажити мою картку PDF` was grammatically inconsistent. | `📄 Завантажити картку у PDF`. | Minor | Label accurately describes direct download. | PASS | Button Naming Rules |
| L02-COR-017 | PDF integrity | `js/script.js` | Incomplete export | PDF action could be enabled from a partial restored form. | PDF requires a complete practical card and valid «Інше» state. | Major | Incomplete card cannot export. | PASS | PDF Export Contract |
| L02-COR-018 | PDF structure | `js/script.js` | Empty case section | PDF always included a case field containing a no-data marker. | Case section is included only when output case records exist. | Minor | No empty technical case block. | PASS | PDF Export Contract |
| L02-COR-019 | Clear action | `index.html`, `js/script.js` | Clear button | Label implied the entire assignment would be erased, while case notes were retained. | `Очистити поля картки`; confirmation and feedback explicitly preserve case notes. | Minor | Confirmation and resulting data state match. | PASS | Button Naming Rules |
| L02-COR-020 | Localization | `index.html` | Transfer dialog | Heading contained learner-facing English `Portfolio`. | `Захист заповненої практичної картки`. | Minor | No English term in the dialog heading. | PASS | Localization Rules |
| L02-COR-021 | Restore UX | `js/script.js` | Reload feedback | Restored values appeared without explicit confirmation. | `Збережені дані відновлено.` | Minor | Reload displays confirmation. | PASS | localStorage Persistence Contract |
| L02-COR-022 | Interactive UX | `index.html` | Check button | `Перевірити відповіді` described multiple answers while only one scenario is checked. | `Перевірити відповідь`. | Minor | Label matches current action. | PASS | Button Naming Rules |

## Summary

| Severity | Corrected | Open |
|---|---:|---:|
| Blocker | 0 | 0 |
| Critical | 0 | 0 |
| Major | 12 | 0 |
| Minor | 10 | 0 |

All listed issues were derived from the actual v2.4 HTML, CSS and JavaScript. No unsupported defect was added.
