# UCAN L02 Regression QA Report v0.1

## Scope

Targeted regression of the non-local platform pilot against the stable Lesson 02 baseline. This is not a new full QA.

## Static checks

- JavaScript syntax: PASS for `ucan-core.js` and `script.js`.
- HTML page count: 10 preserved.
- Existing localStorage keys: unchanged.
- Approved A01–A03 hashes: byte-preserved.
- External libraries and dependencies: none added.
- GitHub Pages relative asset model: preserved.

## Controlled runtime

Managed Chromium blocks all URL and file navigation by enterprise policy. The exact HTML/CSS/JavaScript runtime was therefore
executed as an inlined document; instructional image bytes were replaced only in the QA copy with one-pixel placeholders.
Production assets were not modified. The localStorage interface was represented by a standards-shaped in-memory test double
because `about:blank` has an opaque origin.

**Chromium checks: 42/42 PASS.**

| # | Check | Result | Detail |
|---:|---|---|---|
| 1 | Lesson opens | PASS | — |
| 2 | Reusable core loaded | PASS | — |
| 3 | Ten pages preserved | PASS | — |
| 4 | Notification region exists | PASS | — |
| 5 | Core and lesson scripts separated | PASS | — |
| 6 | Story card opens | PASS | — |
| 7 | Other case aria-expanded | PASS | — |
| 8 | Three case note records | PASS | — |
| 9 | Unified case notification | PASS | — |
| 10 | All principles transferred | PASS | — |
| 11 | Practice page opens | PASS | — |
| 12 | Portfolio summary visible | PASS | — |
| 13 | Portfolio empty state hidden | PASS | — |
| 14 | Portfolio includes custom case | PASS | — |
| 15 | Portfolio includes climate-neutral vision | PASS | — |
| 16 | Save notification exact | PASS | — |
| 17 | AI success state | PASS | — |
| 18 | AI includes custom case | PASS | — |
| 19 | AI includes vision | PASS | — |
| 20 | AI mode facts | PASS | — |
| 21 | AI mode questions | PASS | — |
| 22 | AI mode structure | PASS | — |
| 23 | AI context summary populated | PASS | — |
| 24 | AI modal opens | PASS | — |
| 25 | AI modal closes on Escape | PASS | — |
| 26 | AI modal returns focus | PASS | — |
| 27 | Image viewer opens | PASS | — |
| 28 | Image caption retained | PASS | — |
| 29 | Image viewer closes on Escape | PASS | — |
| 30 | Portfolio restored after reload | PASS | — |
| 31 | Other case restored after reload | PASS | — |
| 32 | Other case title restored | PASS | — |
| 33 | Restore announcement emitted | PASS | — |
| 34 | PDF HTML contains selectable text objects | PASS | — |
| 35 | PDF action label standardized | PASS | — |
| 36 | PDF instruction shown | PASS | — |
| 37 | Final test page preserved | PASS | — |
| 38 | Passed gate opens final page | PASS | — |
| 39 | No horizontal overflow — mobile | PASS | 390/390 |
| 40 | No horizontal overflow — tablet | PASS | 768/768 |
| 41 | No horizontal overflow — desktop | PASS | 1440/1440 |
| 42 | No new JavaScript console errors | PASS | — |

## Accessibility smoke

Keyboard operation, visible focus foundation, AI modal Escape/return focus, image viewer Escape, labelled case controls,
ARIA-expanded for Other and live notifications passed in the controlled runtime. This does not constitute a WCAG conformance claim.

## Browser matrix

| Browser | Result | Evidence |
|---|---|---|
| Chromium | PASS — controlled exact-inline runtime | 42/42 checks, no console errors |
| Microsoft Edge | Not executed | Edge binary unavailable in the managed environment |
| Mozilla Firefox | Not executed | Firefox binary unavailable; browser download blocked by network policy |

## Responsive smoke

No horizontal overflow at 390×844, 768×1024 and 1440×900 in the controlled Chromium runtime.

## Regression decision

No Lesson 02 regression was detected in the executed scope. Browser matrix completion and cross-lesson validation remain required
before platform standardization.
