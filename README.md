# UCAN Lesson 02 — HTML Production Build v1.0

## Status

Production Release Candidate. Ready for Targeted HTML QA, Editorial Delta QA, Browser QA and Release Candidate Validation.

## Launch

Open `index.html` in a current Chromium-based browser. The package is self-contained and does not require a web server for basic operation.

## Structure

- `index.html` — learner-facing ten-section lesson;
- `css/style.css` — mobile-first UCAN presentation and accessibility layer;
- `js/script.js` — navigation, progress, persistence, interactions, final-test gate, AI prompt UX, reset and local PDF generation;
- `assets/images/` — only the three approved Lesson 02 PNG assets;
- `fonts/` — no bundled font binaries; system font stack is used;
- `docs/HTML_Production_Report_L02_v1.0.md` — production handoff and QA readiness report.

## Data and privacy

- Portfolio fields, navigation state and learning responses are stored in browser `localStorage` under the `ucan_l02_v1_0` namespace.
- `🔄 Почати спочатку` clears navigation, interactive and test progress but preserves the Portfolio card.
- `Очистити картку` is the separate confirmed action that clears Portfolio fields.
- PDF generation happens locally in the browser using canvas rendering and an embedded-image PDF container.
- AI prompts are previewed and copied only after a user action. No learner data is submitted automatically.

## Controlled release boundary

This package does not alter the canonical Final Lesson, Designer Package, AI Visual Generation Pack or approved visual assets. It implements the bounded HTML/LMS v1.2 deltas authorized by the Lesson 02 Pre-Production Alignment Report.
