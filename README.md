# UCAN Lesson 02 — Non-Local Platform Improvements Pilot v0.1

This build uses **UCAN Lesson 02 Gold Release v2.2 + CASE_OTHER Hotfix** as the executable baseline.

## Purpose

Lesson 02 validates reusable internal UCAN HTML components before any cross-lesson standardization.
The pilot does not change the instructional content, page order, approved cases, Portfolio data model,
AI prompt content model, storage keys, visual assets, official URLs, or GitHub Pages deployment model.

## Runtime structure

- `index.html` — Lesson 02 content and component markup.
- `css/ucan-core.css` — additive reusable component foundation.
- `css/style.css` — approved Lesson 02 visual layer, retained to reduce regression risk.
- `js/ucan-core.js` — reusable storage, notification, dialog, image viewer, form, clipboard and PDF helpers.
- `js/script.js` — Lesson 02-specific data, learning flow, prompts, gates and case/Portfolio rules.
- `assets/images/` — approved A01–A03 assets, byte-preserved.
- `docs/` — pilot reports, component assessment and manifest.

## Data preservation

Existing localStorage keys remain unchanged. The build does not clear or migrate learner data.

## Validation status

This is a **validation pilot**, not a UCAN Master Template or platform standard. Reuse decisions require
cross-lesson validation, beginning with Lesson 03.
