# UCAN Lesson 02 — Changelog v2.5

## Changed

### `index.html`

- Added explicit required-field guidance and required markers to the practical card.
- Corrected `Зберегти карту` to `Зберегти картку`.
- Renamed PDF action to `📄 Завантажити картку у PDF`.
- Renamed clear action to `🗑️ Очистити поля картки`.
- Corrected interactive action to `Перевірити відповідь`.
- Localized the transfer protection heading.
- Replaced the AI selector, preview and shared copy action with three accessible scenario cards.
- Added separate ChatGPT / Gemini service block and explicit next-step instruction.

### `css/style.css`

- Removed obsolete selector/preview-specific AI rules.
- Added responsive three-card / one-column AI layout.
- Added per-card success, warning and error states.
- Added required-field note and invalid-field styling.
- Preserved global brand, typography and navigation styles.

### `js/script.js`

- Added conditional validation for the «Інше» title.
- Added required practical-card validation and forward-navigation gate.
- Added stale completion-state correction after cleared or incomplete required data.
- Rebuilt the three prompt contracts as self-contained Ukrainian learning prompts.
- Added independent copy handling, 1800 ms feedback reset and Clipboard API fallback path.
- Removed dependencies on the old AI selector and permanent prompt preview.
- Kept all existing localStorage keys.
- Kept the PDF generator architecture; added completion validation and omission of an empty case section.
- Added explicit restore feedback and accurate clear-form feedback.

## Preserved

- Lesson pages 1–10 and learning content.
- Four approved city cases and their official URLs.
- CASE_OTHER data model and hidden-data restoration behavior.
- Portfolio content model and case transfer logic.
- Lesson 01 import logic.
- Three AI learning purposes.
- Final test answers and explanations.
- Progress, scenario and test storage keys.
- Three approved visual assets without byte changes.
