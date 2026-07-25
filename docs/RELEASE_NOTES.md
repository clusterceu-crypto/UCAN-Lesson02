# UCAN Lesson 02 — Gold Release Notes v2.0

**Release type:** Final Gold Release Candidate  
**Production role:** Production Reference v2 for Lessons 03–26  
**Release date:** 2026-07-26  
**Base:** Candidate B  
**Architecture / UX merge donor:** Candidate A

## Release decision

The Gold Release Candidate is approved for final deployment-origin validation. Candidate B remains the content and UX baseline. Candidate A contributed only controlled architecture, accessibility, persistence, dialog, progress and release-structure patterns.

No verified Candidate B improvement was removed. The release preserves:

- all confirmed city examples: Lviv, Rotterdam, Amsterdam and Leuven;
- all official URLs included in Candidate B;
- Ukrainian context and editorial refinements;
- the case micro-task and case-to-Portfolio transfer;
- Portfolio Summary and three separate principle fields;
- the improved five-question assessment and feedback;
- all three AI-support modes;
- approved PNG assets without byte changes.

## Gold improvements

### Architecture Improvements

- one clear executable release root;
- one CSS file and one JavaScript file;
- no nested ZIP archives, duplicate builds, legacy artifacts or unused Lesson 03 JavaScript;
- explicit persisted completion state and furthest-progress state;
- preserved browser Back/Forward support.

### UX Improvements

- strict completion gate for all three interactive situations;
- protected case-to-Portfolio transfer with merge, explicit replace or cancel;
- accessible prompt preview dialog while retaining inline preview;
- standard image enlargement for Hero and both infographics;
- corrected mobile heading wrapping, compact page labels and dialog layout;
- canonical PDF and AI button labels.

### Functional Improvements

- progressbar ARIA value now uses percentage rather than page index;
- independent, non-contradictory prompts for facts, questions and structure modes;
- local Portfolio PDF generation verified;
- reset clears progress, test and scenarios while preserving Portfolio and case notes;
- dialog ESC, backdrop close and focus return verified.

## QA outcome

All static and controlled Chromium regression scenarios passed. No known application defect remains open. The unchanged ZIP still requires the normal final smoke test on the intended HTTP/HTTPS publication origin because managed Chromium in the production environment restricts direct localhost navigation.
