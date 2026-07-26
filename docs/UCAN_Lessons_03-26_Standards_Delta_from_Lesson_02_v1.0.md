# UCAN Lessons 03–26 — Standards Delta from Lesson 02 v1.0

Purpose: capture only reusable rules demonstrated by actual Lesson 02 corrective work. This document is a controlled delta, not a replacement for active UCAN standards.

## 1. Learner-facing Localization Rules

### Rule LOC-01
- **Mandatory requirement:** All interface actions, validation, statuses and fallback messages controlled by the lesson must be Ukrainian.
- **Rationale:** Mixed-language interface strings created uncertainty in Lesson 02.
- **Implementation requirement:** Keep official product names, URLs, abbreviations and technology names unchanged; localize the surrounding instruction.
- **QA test:** Search HTML, JavaScript templates, generated messages and ARIA labels for unjustified English learner-facing strings.
- **Affected role:** HTML/LMS Builder, UX Editor, Website QA.
- **Affected Lessons:** 03–26.

### Rule LOC-02
- **Mandatory requirement:** One concept must use one learner-facing term across headings, buttons and statuses.
- **Rationale:** Lesson 02 used inconsistent learner-facing terminology for the AI consultation function and for prompts.
- **Implementation requirement:** Use `АІ-консультант` as the learner-facing term; preserve technical identifiers, data attributes, CSS classes and JavaScript variable names. Verify all generated strings.
- **QA test:** Terminology inventory across HTML and JavaScript.
- **Affected role:** Editor, HTML/LMS Builder, QA.
- **Affected Lessons:** 03–26.

## 2. Button Naming Rules

### Rule BTN-01
- **Mandatory requirement:** A button label must state the concrete result of the click.
- **Rationale:** `Зберегти карту` and the previous clear/PDF labels did not precisely match behavior.
- **Implementation requirement:** Use action + object, for example `Зберегти картку`, `Завантажити картку у PDF`.
- **QA test:** Compare every button promise with its event handler and resulting state.
- **Affected role:** UX Editor, HTML/LMS Builder, Functional QA.
- **Affected Lessons:** 03–26.

### Rule BTN-02
- **Mandatory requirement:** Destructive actions must name their scope and require confirmation.
- **Rationale:** Users must know whether case notes, Portfolio data or progress will be retained.
- **Implementation requirement:** Confirmation text must enumerate preserved data when relevant.
- **QA test:** Cancel and confirm branches; verify actual storage after both.
- **Affected role:** HTML/LMS Builder, Functional QA.
- **Affected Lessons:** 03–26.

## 3. Copy Interaction Contract

### Rule COPY-01
- **Mandatory requirement:** Every distinct prompt has its own copy button and status region.
- **Rationale:** A shared selector/button increased ambiguity and state coupling.
- **Implementation requirement:** Use `data-ai-action="copy"`, stable scenario data and separate `aria-live` status.
- **QA test:** Copy every prompt; values must be distinct and buttons must not conflict.
- **Affected role:** HTML/LMS Builder, AI Learning Support Designer, QA.
- **Affected Lessons:** 03–26.

### Rule COPY-02
- **Mandatory requirement:** Success feedback is temporary and repeatable; failure has a clipboard fallback path.
- **Rationale:** Permanent button-state changes and preview-dependent error messages are misleading.
- **Implementation requirement:** Show a short Ukrainian confirmation, reset the label, support Clipboard API and safe fallback.
- **QA test:** Success, repeat copy and simulated Clipboard API failure.
- **Affected role:** HTML/LMS Builder, QA.
- **Affected Lessons:** 03–26.

## 4. AI Prompt Card Contract

### Rule AICARD-01
- **Mandatory requirement:** Each AI purpose is a separate compact card with heading, purpose, button and status.
- **Rationale:** Lesson 02 showed that scenario cards are clearer than a mode selector plus permanent preview.
- **Implementation requirement:** Equal cards on desktop; one card per row on narrow screens; button anchored to the card bottom.
- **QA test:** Desktop equality, mobile one-column layout, keyboard activation.
- **Affected role:** Designer, HTML/LMS Builder, Accessibility QA.
- **Affected Lessons:** 03–26.

## 5. AI Prompt Content Pattern

### Rule AIPROMPT-01
- **Mandatory requirement:** A learner prompt contains role, context, task, participant data, constraints and expected response format.
- **Rationale:** Decorative or underspecified prompts do not support self-directed learning.
- **Implementation requirement:** Use only current learner inputs; never add community facts not provided by the participant.
- **QA test:** Read each copied prompt independently from the lesson page.
- **Affected role:** AI Learning Support Designer, Editor, QA.
- **Affected Lessons:** 03–26.

### Rule AIPROMPT-02
- **Mandatory requirement:** Every prompt prohibits invented facts and specifies what to do when data are insufficient.
- **Rationale:** AI must support clarification, not manufacture evidence.
- **Implementation requirement:** Require explicit uncertainty and a clarification question.
- **QA test:** Run a prompt with incomplete controlled data and inspect instructions.
- **Affected role:** AI Learning Support Designer, QA.
- **Affected Lessons:** 03–26.

## 6. «Інше» Conditional Field Contract

### Rule OTHER-01
- **Mandatory requirement:** Selecting `Інше` displays a labelled required clarification field.
- **Rationale:** An empty custom option is not a completed answer.
- **Implementation requirement:** Add `required`, `aria-required`, Ukrainian custom validity and focus on failure.
- **QA test:** Select `Інше`, leave blank and attempt the next gated action.
- **Affected role:** HTML/LMS Builder, Functional QA, Accessibility QA.
- **Affected Lessons:** 03–26.

### Rule OTHER-02
- **Mandatory requirement:** Deselecting `Інше` deactivates the dependent block without silently deleting entered data unless the learner confirms deletion.
- **Rationale:** Lesson 02 users may temporarily hide and later restore a custom case.
- **Implementation requirement:** Persist hidden state or use a documented migration-safe model.
- **QA test:** Enter, deselect, reload, reselect and compare all values.
- **Affected role:** HTML/LMS Builder, Functional QA.
- **Affected Lessons:** 03–26.

## 7. Form Label and Placeholder Rules

### Rule FORM-01
- **Mandatory requirement:** Every form control has a visible programmatic label; placeholder text never replaces the label.
- **Rationale:** Labels remain understandable after input and are required for assistive technology.
- **Implementation requirement:** `label[for]` / `id` pairing or equivalent accessible naming.
- **QA test:** Static label mapping and screen-reader name inspection.
- **Affected role:** HTML/LMS Builder, Accessibility QA.
- **Affected Lessons:** 03–26.

### Rule FORM-02
- **Mandatory requirement:** Required fields are explicitly identified before the form and in markup.
- **Rationale:** Lesson completion cannot depend on invisible requirements.
- **Implementation requirement:** Visible required note, `required`, `aria-required` and non-color-only indication.
- **QA test:** Empty submit and forward-navigation attempt.
- **Affected role:** UX Editor, HTML/LMS Builder, QA.
- **Affected Lessons:** 03–26.

## 8. Validation Message Rules

### Rule VAL-01
- **Mandatory requirement:** Validation messages name the missing action or field in Ukrainian.
- **Rationale:** Generic errors do not help the learner recover.
- **Implementation requirement:** Focus the first invalid field and announce the message through a status region.
- **QA test:** Keyboard-only invalid submission.
- **Affected role:** HTML/LMS Builder, Accessibility QA.
- **Affected Lessons:** 03–26.

## 9. localStorage Persistence Contract

### Rule STORE-01
- **Mandatory requirement:** Existing production keys remain stable within compatible releases.
- **Rationale:** Key changes can destroy learner work.
- **Implementation requirement:** New schema requires explicit migration and preservation of recoverable source data.
- **QA test:** Load prior valid JSON, save, reload and compare fields.
- **Affected role:** Front-End Engineer, Release QA.
- **Affected Lessons:** 03–26.

### Rule STORE-02
- **Mandatory requirement:** Completion flags must be recalculated when required learner data are cleared or invalid.
- **Rationale:** A stale completion flag created a false completed state in Lesson 02.
- **Implementation requirement:** Remove or downgrade completion when prerequisite gates fail.
- **QA test:** Complete, clear required data, reload and inspect completion state.
- **Affected role:** Front-End Engineer, Functional QA.
- **Affected Lessons:** 03–26.

## 10. PDF Export Contract

### Rule PDF-01
- **Mandatory requirement:** The learner-facing label must describe a direct PDF download when the implementation downloads a file.
- **Rationale:** Print terminology is incorrect for automatic download.
- **Implementation requirement:** Use a filename-safe community label, local date and neutral fallback.
- **QA test:** Verify download event, filename and repeat generation.
- **Affected role:** HTML/LMS Builder, Release QA.
- **Affected Lessons:** 03–26.

### Rule PDF-02
- **Mandatory requirement:** PDF contains only actual learner data and omits empty technical sections.
- **Rationale:** Placeholder blocks reduce clarity and can be mistaken for missing production data.
- **Implementation requirement:** Validate prerequisites; include optional sections only when content exists.
- **QA test:** Short, long, optional-section and repeat-generation scenarios.
- **Affected role:** HTML/LMS Builder, Functional QA.
- **Affected Lessons:** 03–26.

## 11. Mobile Acceptance Criteria

### Rule MOB-01
- **Mandatory requirement:** Interactive cards and actions must fit a 390 px viewport without document-level horizontal overflow.
- **Rationale:** Lesson 02 AI cards and case forms are core mobile interactions.
- **Implementation requirement:** One-column card layout, wrapping text, full-width actions where needed and touch targets of at least 44 px.
- **QA test:** 390 × 844 viewport; compare scroll width and client width.
- **Affected role:** Designer, HTML/LMS Builder, Mobile QA.
- **Affected Lessons:** 03–26.

## 12. Accessibility Minimum

### Rule A11Y-01
- **Mandatory requirement:** Buttons are semantic, focus is visible, statuses use `aria-live`, and dialogs return focus.
- **Rationale:** The corrected Lesson 02 workflow depends on keyboard and assistive feedback.
- **Implementation requirement:** No clickable divs for actions; native controls; focus management for modal/image viewer.
- **QA test:** Tab/Enter/Escape sequence and accessible-name inspection.
- **Affected role:** HTML/LMS Builder, Accessibility QA.
- **Affected Lessons:** 03–26.

## 13. Browser Functional QA Scenarios

### Rule BQA-01
- **Mandatory requirement:** Every release test covers clean start, save/reload, conditional `Інше`, copy, PDF, mobile and keyboard scenarios.
- **Rationale:** Static review alone did not reveal all Lesson 02 state defects.
- **Implementation requirement:** Record browser, environment, actual runtime method and limitations.
- **QA test:** Execute the seven scenarios and retain a concise result report.
- **Affected role:** Functional QA, Release QA.
- **Affected Lessons:** 03–26.

## 14. Final Product Acceptance Gate

### Rule ACCEPT-01
- **Mandatory requirement:** Lesson completion cannot be announced until all mandatory learning gates and required practical data are complete.
- **Rationale:** Progress state must represent the learner journey, not only page navigation.
- **Implementation requirement:** Gate completion on lesson-specific interaction, practical task and test rules.
- **QA test:** Attempt direct hash and forward navigation with missing prerequisites.
- **Affected role:** Product Owner, HTML/LMS Builder, Release QA.
- **Affected Lessons:** 03–26.

## 15. Release Freeze Preconditions

### Rule FREEZE-01
- **Mandatory requirement:** Freeze requires zero open Blocker/Critical defects, synchronized release documents, valid manifest and a self-contained ZIP root.
- **Rationale:** Lesson 02 v2.4 contained working code but inconsistent product and documentation states.
- **Implementation requirement:** Verify the ZIP as a new independent input after packaging.
- **QA test:** Integrity, file tree, local dependencies, manifest and SHA-256 verification.
- **Affected role:** Release Packaging Engineer, Final QA Auditor.
- **Affected Lessons:** 03–26.


## 16. Navigation Contract

### Rule NAV-01 — Global Previous Lesson Navigation
- **Mandatory requirement:** The top UCAN header must contain a persistent `← Попереднє заняття` action immediately after the UCAN brand on every lesson page.
- **Rationale:** Inter-lesson navigation must remain visible independently of the current lesson section.
- **Implementation requirement:** Use a semantic link to the canonical previous-lesson URL, keyboard-accessible and visually aligned with the header utility actions.
- **QA test:** Verify visibility and keyboard activation on every page at desktop, tablet and mobile widths.
- **Affected role:** UX Architect, HTML/LMS Builder, Functional QA.
- **Affected Lessons:** 03–26.

### Rule NAV-02 — Progress Summary
- **Mandatory requirement:** Directly below the global header, display `Сторінка X із Y`, the completion percentage and a horizontal progress bar.
- **Rationale:** The learner needs both current position and overall progress without opening another control.
- **Implementation requirement:** Keep visible text and progressbar ARIA values synchronized after navigation and reload.
- **QA test:** Navigate forward/backward, reload and compare page number, percentage, width and `aria-valuetext`.
- **Affected role:** HTML/LMS Builder, Accessibility QA, Functional QA.
- **Affected Lessons:** 03–26.

### Rule NAV-03 — Lesson Section Strip
- **Mandatory requirement:** Show all lesson sections in one horizontal navigation strip, highlight the active section and permit navigation only to sections already unlocked by the lesson flow.
- **Rationale:** A section strip supports orientation and rapid return without bypassing learning gates.
- **Implementation requirement:** Use semantic buttons or links with stable page identifiers, `aria-current="page"`, disabled/locked states and automatic horizontal scrolling that keeps the active item visible.
- **QA test:** Verify active state, locked state, jump to every unlocked section, automatic centering and mobile horizontal scrolling.
- **Affected role:** UX Architect, HTML/LMS Builder, Functional QA.
- **Affected Lessons:** 03–26.

### Rule NAV-04 — Sticky Internal Navigation
- **Mandatory requirement:** A persistent lower navigation control must provide `← Попередній розділ` and `Наступний розділ →` throughout the lesson.
- **Rationale:** Sequential movement must be predictable and available without returning to the top of the page.
- **Implementation requirement:** Keep the previous action disabled on the first page; preserve lesson-specific gates on the next action; do not replace the action label with a completion message.
- **QA test:** Traverse every section, test gate states, keyboard activation and narrow-screen readability.
- **Affected role:** HTML/LMS Builder, Functional QA, Mobile QA.
- **Affected Lessons:** 03–26.

### Rule NAV-05 — Final Page and Inter-Lesson Transition
- **Mandatory requirement:** On the final page, the lower left action remains `← Попередній розділ` and the lower right action becomes the functional `Наступне заняття →` link/action to the canonical next-lesson URL.
- **Rationale:** Internal progression and inter-lesson progression must have distinct, non-duplicated placements.
- **Implementation requirement:** Remove duplicate previous/next lesson buttons from final-page content. Inter-lesson navigation exists only in the top previous-lesson action and final sticky next-lesson action.
- **QA test:** Verify no duplicate final-page controls and confirm the exact production URLs.
- **Affected role:** UX Architect, HTML/LMS Builder, Release QA.
- **Affected Lessons:** 03–26.

### Rule NAV-06 — Responsive Navigation Behaviour
- **Mandatory requirement:** Navigation must remain usable at desktop, laptop, tablet and mobile widths without horizontal document overflow.
- **Rationale:** The global header, section strip and sticky navigation are persistent controls and must not obscure lesson content.
- **Implementation requirement:** On mobile, the section strip scrolls horizontally, the active item is brought into view, the previous-lesson action does not overlap the lesson title, and sticky actions remain readable touch targets.
- **QA test:** Test at least 1440 px, 1024 px, 768 px and 390 px widths; verify scroll width, focus visibility and control overlap.
- **Affected role:** Designer, HTML/LMS Builder, Mobile QA, Accessibility QA.
- **Affected Lessons:** 03–26.

## Delta status

**Ready for controlled application to Lessons 03–26.** These rules are reusable production requirements derived from confirmed Lesson 02 defects and corrections. They do not alter curriculum architecture or create new learning content.
