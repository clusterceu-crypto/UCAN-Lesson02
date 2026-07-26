# UCAN L02 Reusable Component Assessment v0.1

## Classification matrix

| Decision / component | Classification | Evidence in pilot | Validation still required |
|---|---|---|---|
| Storage wrapper with unchanged lesson keys | Reusable Now | `js/ucan-core.js` exposes guarded get/set/remove/keys | Confirm key contracts per lesson |
| Notification component | Reusable Now | Unified success, warning, info, error and loading roles/classes | Screen-reader check on production origins |
| Native dialog controller | Reusable Now | Focus trap, Escape, overlay close and return focus | Test with dialogs containing complex controls |
| Image viewer behavior | Reusable Now | Shared modal controller and caption/alt preservation | Validate portrait and wide assets in another lesson |
| Clipboard fallback | Reusable Now | Secure Clipboard API plus controlled fallback | Browser permission behavior on published origin |
| Form serialize/restore helpers | Reusable Now | Used by Lesson 02 Portfolio without schema changes | Checkbox/multi-value forms need adaptation |
| Text-based Save as PDF preparation | Reusable with Adaptation | Configurable title, fields, values and note | Pagination and print UI in Edge/Firefox; PDF-UA not included |
| AI action states and panel pattern | Reusable with Adaptation | Three existing modes share prepare/copy/preview/open workflow | Different prompt contracts and optional input patterns |
| Portfolio component pattern | Reusable with Adaptation | Form, empty state, summary, persistence and PDF action | Field renderer and summary mapping remain lesson-specific |
| Case selector pattern | Reusable with Adaptation | Multi-select, per-case notes, Other, restore and transfer | Catalogue, schema and transfer mapping vary by lesson |
| Progress restoration helpers | Requires Cross-Lesson Validation | Existing Lesson 02 flow remains stable | Different page counts and gates |
| Additive `ucan-core.css` layer | Requires Cross-Lesson Validation | No visual regression in controlled Chromium smoke | Validate against Lesson 03 design package |
| Physical JS core/lesson split | Requires Cross-Lesson Validation | Core loads before unchanged lesson-specific rules | Validate deployment and caching in another repository |
| Lesson 02 prompt content, cases, fields and transfer rules | Lesson-Specific | Remain in `js/script.js` and `index.html` | Must not enter shared core |
| One monolithic script for all lessons | Not Recommended for Standardization | Conflicts with lesson-specific gates and data contracts | Keep configurable adapters |
| Automatic prompt transfer to external AI platforms | Not Recommended for Standardization | Current privacy boundary requires manual copy/paste | No change recommended |

## Production decision

Reusable primitives are suitable for controlled reuse. Composite components remain candidates until Lesson 03 validates
configuration boundaries, cross-browser behavior and the absence of design regressions.
