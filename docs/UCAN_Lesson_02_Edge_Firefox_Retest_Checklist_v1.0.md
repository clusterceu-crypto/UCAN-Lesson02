# UCAN Lesson 02 — Edge / Firefox Retest Checklist v1.0

## Purpose

Close L02-QA-003 through real execution of `UCAN_Lesson_02_Gold_Release_Candidate_v2.1.1_Hotfix_RC.zip` in current desktop Microsoft Edge and Firefox.

Do not mark the browser blocker closed from Chromium evidence alone.

## Test environment record

| Field | Microsoft Edge | Firefox |
|---|---|---|
| Browser version |  |  |
| Operating system |  |  |
| Test date |  |  |
| Tester |  |  |
| Deployed URL |  |  |

## Required scenarios

| ID | Scenario | Microsoft Edge | Firefox | Evidence / defect ID |
|---|---|---|---|---|
| BR-01 | Open the published Lesson 02 URL; page 1 loads with CSS, JS and all three images | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL |  |
| BR-02 | Navigate pages 1–10 in order; gates and browser Back/Forward remain functional | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL |  |
| BR-03 | Save Portfolio, reload the page and verify all answers restore | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL |  |
| BR-04 | Enter and restore `climateNeutralVision`; verify Portfolio Summary | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL |  |
| BR-05 | Generate PDF, choose Save as PDF, then verify text search/copy and no blank pages | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL |  |
| BR-06 | Verify all three AI prompts contain `climateNeutralVision`; Preview and Copy work | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL |  |
| BR-07 | Open and close image lightbox by mouse, keyboard, ESC and backdrop | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL |  |
| BR-08 | Complete final test gate and reach final page | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL |  |
| BR-09 | Open `← Попереднє заняття`; verify canonical Lesson 01 production URL | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL |  |
| BR-10 | Open `Наступне заняття →`; verify canonical Lesson 03 production URL | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL |  |
| BR-11 | Inspect developer console during the flow; no uncaught errors | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL |  |
| BR-12 | Repeat PDF test with medium multiline answers; no clipping, overlap or empty pages | ☐ PASS ☐ FAIL | ☐ PASS ☐ FAIL |  |

## Exit criteria

The browser blocker may be closed only when:

- all twelve scenarios pass in both browsers;
- no Critical or Major browser-specific defect is open;
- evidence includes browser versions and the deployed HTTP/HTTPS URL;
- the PDF created by each browser contains searchable/selectable Ukrainian text;
- both adjacent production URLs open successfully.

## Current status

**Open — Retest Required.** No Edge or Firefox result has been pre-filled.
