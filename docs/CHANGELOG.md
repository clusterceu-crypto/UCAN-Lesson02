# UCAN Lesson 02 — Changelog v2.2

## Added

- multi-case selection for the four existing approved city examples;
- separate stored notes for each selected case: problem addressed, useful principle and local check;
- versioned `ucan_l02_case_notes_v2` storage with idempotent migration from v1;
- stable in-place multi-field case-note persistence without stale record references;
- selected-case provenance in Portfolio Summary, Print/Save-as-PDF and all three AI prompts;
- explicit six-step AI learner workflow;
- personalized community name in the case micro-task.

## Changed

- `communityVision` is labelled as the preparatory desired-state sketch;
- `climateNeutralVision` is labelled as the final integrated climate-neutral vision;
- multi-case transfer uses available principle fields and controlled merge/replace/skip decisions for collisions;
- the PDF control is labelled `🖨️ Друк / Зберегти як PDF` and has one secondary-button modifier;
- AI data-scope wording now includes selected case notes and states that no data are sent automatically;
- release documentation now names the v2.2 completion build and distinguishes sanity checks from independent release QA.

## Preserved

- pages 1–10 and `#page-*` routes;
- Learning Outcomes and Vision Focus additions;
- practical Portfolio fields and `ucan_l02_portfolio_v1` compatibility;
- final test, scenario gates, Story Cards, city evidence and official URLs;
- approved A01–A03 PNG assets without modification;
- canonical adjacent-lesson URLs;
- searchable browser Print-to-PDF mechanism and PDF-UA limitation statement.
