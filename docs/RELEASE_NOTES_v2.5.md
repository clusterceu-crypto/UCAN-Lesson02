# UCAN Lesson 02 — Release Notes v2.5

## Release status

**Gold Release v2.5 completed after the consolidated corrective sprint.**

Вхідний v2.4 зафіксовано як **Superseded Candidate — Corrective Revision Required**. Версія v2.5 замінює його для подальшої передачі та архівного зберігання.

## Основні виправлення

- повністю локалізовано learner-facing інтерфейс у межах керованих елементів Lesson;
- замінено AI mode selector і постійний preview на три незалежні картки роботи з АІ-консультантом;
- кожна картка копіює лише свій промпт і має окремий український status region;
- промпти доповнено роллю, контекстом, обмеженнями, форматом відповіді та правилом не вигадувати дані;
- сценарій «Інше» отримав обов’язкову назву, українську валідацію і блокування переходу при незавершеному стані;
- усі поля практичної картки позначено як обов’язкові; додано зрозумілу валідацію та completion gate;
- виправлено learner-facing назви кнопок і неточні повідомлення;
- PDF export збережено як локальний `canvas → JPEG → Blob → download`, додано перевірку повноти даних і виключення порожнього case-блоку;
- збережено всі localStorage keys, CASE_OTHER, Portfolio Summary, імпорт із Lesson 01, тест, навігацію та assets;
- релізну документацію синхронізовано з фактичним продуктом v2.5.

## QA summary

- JavaScript syntax: PASS.
- Static HTML / dependency verification: PASS.
- Controlled Chromium runtime: 67/67 checks PASS.
- PDF scenarios: 2, 4 and 3 pages; fully blank pages not detected.
- Console / runtime errors in controlled Chromium: 0.
- Mobile 390 × 844: no horizontal overflow.

## Accepted limitations

- PDF is image-based by approved technical direction and is not claimed as searchable, tagged or PDF/UA-compliant.
- Localhost navigation was blocked by the execution environment; Chromium runtime used exact production files with a test-only in-memory storage and clipboard harness.
- Microsoft Edge, Firefox and live external URLs were not independently executed in this sprint.
