# UCAN Lesson 02 — Gold Changelog v2.0

## Added

- Image lightbox for all three approved learning visuals.
- Native accessible AI prompt preview dialog.
- Native Portfolio transfer-protection dialog.
- Persisted `completed` and `maxVisited` states.
- Compact per-page header labels.
- `aria-valuetext` for progress and completion.
- Mobile dialog and heading corrections.

## Changed

- Candidate B repackaged into a clean Candidate A-style single-root release structure.
- Numbered adjacent-lesson references replaced with semantic wording: “попереднє заняття” and “наступне заняття”.
- AI prompts separated into three independent contracts:
  - facts and assumptions;
  - clarification questions;
  - completeness and weak points.
- Case transfer now fills an empty principle field or requires merge/replace confirmation when all fields are occupied.
- PDF action standardized to `📥 Завантажити PDF`.
- AI actions standardized to preview, copy, ChatGPT and Gemini controls.
- Progress calculation changed from current page to furthest visited state, with explicit 100% completion.
- Interactive continuation changed from optional bypass to required completion.

## Preserved

- Candidate B learning text and editorial improvements, except semantic adjacent-lesson wording.
- Confirmed city cases, official URLs and Ukrainian context.
- Portfolio Summary, three principle fields and case transfer.
- Improved assessment questions, distractors and feedback.
- Browser history navigation.
- All three approved PNG assets, byte-identical.

## Removed

- Hidden legacy table of contents and its inactive scripting.
- `lesson03-ai-prompts.js`.
- unused dynamic prompt-dialog helper.
- nested Candidate A and Interface ZIP archives.
- duplicate CSS and JavaScript runtime layers.
- scenario bypass persistence and control.
