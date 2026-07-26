# UCAN UI Component Inventory v0.1

## 1. Button
- **Purpose:** semantic action or navigation control.
- **HTML pattern:** `.button` with a semantic `<button>` or `<a>`.
- **CSS:** existing Lesson 02 button classes plus core action-state modifiers.
- **JavaScript:** `UCANCore.setActionState()`.
- **Accessibility:** visible focus, disabled state, `aria-busy` while loading.
- **Configuration:** learner-facing label and callback.
- **Dependencies:** none.

## 2. Notification
- **Purpose:** non-blocking success, warning, information and error feedback.
- **HTML pattern:** `.ucan-notification` or `#ucan-notification-region`.
- **CSS:** `.is-success`, `.is-warning`, `.is-info`, `.is-error`, `.is-loading`.
- **JavaScript:** `notify()` and `announce()`.
- **Accessibility:** status for normal updates; alert for warning/error; atomic live text.
- **Configuration:** message, urgency, optional timeout.
- **Dependencies:** notification region for transient announcements.

## 3. Modal
- **Purpose:** focused preview or protected decision without page navigation.
- **HTML pattern:** native `<dialog data-ucan-modal>` with labelled heading and close action.
- **CSS:** existing `.ucan-dialog` / `.image-lightbox` and additive focus hooks.
- **JavaScript:** `registerDialog()`, `openDialog()`, `closeDialog()`.
- **Accessibility:** focus trap, Escape, overlay close when enabled, return focus.
- **Configuration:** initial focus, return target, overlay policy and before-close rule.
- **Dependencies:** native dialog support.

## 4. Image Viewer
- **Purpose:** enlarge instructional visuals while preserving meaning.
- **HTML pattern:** trigger with image source/caption data plus native dialog.
- **CSS:** approved Lesson 02 lightbox styles.
- **JavaScript:** `initImageViewer()`.
- **Accessibility:** trigger is a button; alt and caption preserved; focus returns.
- **Configuration:** trigger list, image, caption and close button.
- **Dependencies:** Modal.

## 5. Form Field
- **Purpose:** collect learner input with explicit labels and help text.
- **HTML pattern:** `.form-field` and labelled native control.
- **CSS:** approved form controls.
- **JavaScript:** `serializeForm()`, `restoreForm()`, `formHasContent()`.
- **Accessibility:** label, optional `aria-describedby`, visible focus.
- **Configuration:** field name, label, help and validation rule.
- **Dependencies:** none.

## 6. Case Selector
- **Purpose:** select one or more cases and maintain separate notes.
- **HTML pattern:** fieldset, checkbox options, notes region and transfer action.
- **CSS:** `.ucan-case-selector` plus existing case record styles.
- **JavaScript:** lesson adapter uses core storage and notifications.
- **Accessibility:** legend, labels, `aria-controls`, `aria-expanded` for Other, live result.
- **Configuration:** case catalogue, record fields, output filter and transfer mapping.
- **Dependencies:** Storage, Notification, Modal for conflicts.

## 7. Portfolio Section
- **Purpose:** collect, persist, summarize and export learner artefacts.
- **HTML pattern:** form, empty state and summary section.
- **CSS:** `.ucan-portfolio`, `.ucan-empty-state`, `.ucan-portfolio-summary`.
- **JavaScript:** form helpers, lesson renderer and PDF helper.
- **Accessibility:** predictable headings, labelled fields, live save result, readable summary.
- **Configuration:** fields, labels, summary order and storage key.
- **Dependencies:** Storage, Notification, Save as PDF.

## 8. AI Support Panel
- **Purpose:** prepare existing lesson prompts through a consistent learner workflow.
- **HTML pattern:** mode fieldset, context summary, preview, actions and safety note.
- **CSS:** `.ucan-ai-panel`, `.ai-mode-copy`, `.ucan-ai-context`.
- **JavaScript:** action states, prompt builder adapter, copy and modal preview.
- **Accessibility:** labelled modes, live states, keyboard preview and privacy boundary.
- **Configuration:** mode descriptions, prompt contracts and platform links.
- **Dependencies:** Button, Notification, Modal, Clipboard.

## 9. Save as PDF Action
- **Purpose:** prepare an accessible text-based print representation.
- **HTML pattern:** button plus live instruction/status.
- **CSS:** button and notification styles.
- **JavaScript:** `createPortfolioPrintHtml()` and `downloadPortfolioPdf()`.
- **Accessibility:** textual content remains selectable/searchable; browser action explained.
- **Configuration:** title, field list, values, note and filename.
- **Dependencies:** browser print subsystem. PDF-UA tagging is not provided.
