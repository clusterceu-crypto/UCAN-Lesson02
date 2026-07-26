# UCAN Lesson 02 — Gold Release Notes v2.2

**Build:** `UCAN_Lesson_02_Gold_Release_v2.2`  
**Release role:** Gold Release completion build  
**Date:** 2026-07-26

## Completion result

The build closes the confirmed local Lesson 02 completion gaps without changing the lesson page architecture, approved cases, URLs, test, gates or visual assets.

The learner can now compare several existing city examples, keep separate notes, transfer several conclusions without silent overwriting and retain the complete case trail in the final Portfolio outputs.

## Learner-facing completion

- the case task displays the learner’s community name when available;
- one or several cases may be selected;
- each case has an independent three-part note record;
- the preparatory desired-state sketch and final climate-neutral vision have distinct roles;
- Portfolio Summary, Print/Save-as-PDF and AI use the same selected-case provenance;
- AI instructions explicitly explain the manual preview/copy/open/paste/verify workflow;
- no Portfolio or prompt data are sent automatically.

## Technical completion

- storage key: `ucan_l02_case_notes_v2`;
- legacy migration source retained: `ucan_l02_case_notes_v1`;
- Portfolio storage remains `ucan_l02_portfolio_v1`;
- PDF continues to use local semantic HTML and the browser print engine;
- PDF output is intended to be searchable/selectable; PDF-UA is not claimed;
- adjacent lesson URLs remain canonical production URLs.

## Verification statement

This package passed targeted completion sanity checks in Chromium, static HTML checks, JavaScript syntax validation, manifest validation and archive integrity checks. This document does not replace an independent final deployment/browser release decision.
