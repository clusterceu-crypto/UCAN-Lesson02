# UCAN Lesson 02 — Completion Regression Checklist v2.2

**Build:** `UCAN_Lesson_02_Gold_Release_v2.2`  
**Scope:** targeted completion sanity.

| ID | Area | Check | Result |
|---|---|---|---|
| CREG-001 | Structure | One executable root; no nested ZIP | PASS |
| CREG-002 | HTML | Pages 1–10 and `#page-*` preserved | PASS |
| CREG-003 | Assets | A01–A03 byte hashes unchanged | PASS |
| CREG-004 | Cases | Multiple existing cases can be selected | PASS |
| CREG-005 | Cases | Separate notes save and restore per case | PASS |
| CREG-005A | Cases | Editing one note does not detach later fields from the stored case record | PASS |
| CREG-006 | Migration | Non-empty v1 notes migrate once and source remains | PASS |
| CREG-007 | Transfer | Empty principle fields fill in selected order | PASS |
| CREG-008 | Transfer | Occupied fields require merge/replace/skip | PASS |
| CREG-009 | Transfer | Local checks append with case labels | PASS |
| CREG-010 | Protection | `climateChallenge` is never replaced by case data | PASS |
| CREG-011 | Portfolio | Existing v1 Portfolio data restore | PASS |
| CREG-012 | Portfolio | Vision-field roles are distinct | PASS |
| CREG-013 | Summary | Selected-case provenance is visible | PASS |
| CREG-014 | AI | Three existing modes preserved | PASS |
| CREG-015 | AI | All non-empty selected case records appear | PASS |
| CREG-016 | AI | Six-step learner workflow is visible | PASS |
| CREG-017 | PDF | Label matches Print/Save-as-PDF behavior | PASS |
| CREG-018 | PDF | Selected-case provenance is included as text | PASS |
| CREG-019 | Navigation | Internal navigation and gates preserved | PASS |
| CREG-020 | Runtime | JavaScript syntax and Chromium console sanity | PASS |

This checklist does not claim independent Edge/Firefox deployment verification or PDF-UA conformance.
