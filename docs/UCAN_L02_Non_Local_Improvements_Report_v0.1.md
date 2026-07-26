# UCAN L02 Non-Local Improvements Report v0.1

## Baseline

UCAN Lesson 02 Gold Release v2.2 with CASE_OTHER Hotfix. No legacy build was used.

## Changes implemented

### Reusable core

A new additive `js/ucan-core.js` contains guarded storage access, notification states, button action states,
clipboard fallback, form serialization/restoration, native dialog focus management, image viewer behavior and text-based PDF preparation.
Lesson-specific content, prompts, cases, transfer rules, gates and assessment remain in `js/script.js`.

### Reusable CSS foundation

A new additive `css/ucan-core.css` defines notification variants, component hooks, empty states, AI panel structure,
Portfolio hooks, case selector hooks, action states and responsive behavior. The approved Lesson 02 stylesheet remains intact.

### Learner UX

- AI support now presents three modes through one panel pattern with descriptions, context summary, prepare/re-run action,
  loading, success, warning and error states.
- Portfolio has a predictable empty state and reuses core form helpers without changing fields or storage keys.
- The PDF action is labelled `⬇️ Завантажити мою картку PDF`; before printing it explains that the browser option
  `Зберегти як PDF` must be selected.
- Case selection retains all four approved cases and Other, adds consistent state notifications and exposes `aria-expanded`.
- Existing data is restored without clearing or renaming keys; restoration is announced once.
- Modal and image viewer behavior share focus trap, Escape, overlay and return-focus logic.

## Files changed or added

- `index.html`
- `README.md`
- `js/ucan-core.js` — added
- `js/script.js` — platform calls and component states
- `css/ucan-core.css` — added
- `css/style.css` — unchanged
- documentation under `docs/`

## Boundaries preserved

Instructional text, page order, navigation model, approved cases, Portfolio content model, AI prompt content model,
localStorage keys, images, official URLs, learning outcomes and brand design were not changed. No framework, dependency,
backend, API, analytics, authentication or cloud storage was introduced.

## Validation

Static checks and a controlled Chromium runtime regression passed. Edge and Firefox were unavailable in the managed environment.
The pilot has not been validated against Lesson 03 or another structurally different lesson.

## Production decision

Reusable primitives are ready for controlled adoption. Composite Case Selector, Portfolio, AI panel, progress restoration and
CSS/JS separation require adaptation and Lesson 03 validation. Lesson 02-specific prompts, fields, cases, transfer rules,
gates and assessment must remain outside the shared core.

**Status: Pilot completed; cross-lesson and remaining browser validation are required before standardization.**
