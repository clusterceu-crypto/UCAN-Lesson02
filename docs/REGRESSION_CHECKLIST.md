# UCAN Lesson 02 — Regression Checklist v2.0

**Overall:** PASS (40/40)

| ID | Area | Scenario | Status | Evidence | Blocking |
|---|---|---|---|---|---|
| REG-001 | Release Structure | Single executable root | PASS | Static package inventory | No |
| REG-002 | Release Structure | Nested/legacy cleanup | PASS | Static archive scan | No |
| REG-003 | Content | Candidate B content preservation | PASS | Normalized main-content comparison | No |
| REG-004 | Content | Verified cases | PASS | DOM text inventory | No |
| REG-005 | Content | Official URLs | PASS | Href inventory | No |
| REG-006 | Assets | Approved PNG integrity | PASS | SHA-256 comparison | No |
| REG-007 | HTML | Page sequence | PASS | DOM/static check | No |
| REG-008 | HTML | Heading hierarchy | PASS | DOM/static check | No |
| REG-009 | HTML | Duplicate IDs | PASS | DOM/static check | No |
| REG-010 | Navigation | Sequential controls | PASS | Controlled Chromium | No |
| REG-011 | Navigation | Browser Back/Forward | PASS | Controlled Chromium | No |
| REG-012 | Navigation | Semantic adjacent lessons | PASS | DOM text scan | No |
| REG-013 | Progress | Percentage semantics | PASS | Controlled Chromium | No |
| REG-014 | Progress | Completion state | PASS | Controlled Chromium/localStorage | No |
| REG-015 | Progress | Furthest progress | PASS | Controlled Chromium | No |
| REG-016 | Reset | Controlled reset | PASS | Controlled Chromium | No |
| REG-017 | Interactive | Completion gate | PASS | Controlled Chromium | No |
| REG-018 | Interactive | Persistence | PASS | Controlled Chromium/localStorage | No |
| REG-019 | Assessment | Test gate | PASS | Controlled Chromium | No |
| REG-020 | Assessment | Feedback | PASS | Controlled Chromium | No |
| REG-021 | Portfolio | Autosave and restore | PASS | Controlled Chromium/localStorage | No |
| REG-022 | Portfolio | Summary | PASS | Controlled Chromium | No |
| REG-023 | Portfolio | Transfer protection | PASS | Controlled Chromium | No |
| REG-024 | Portfolio | PDF | PASS | Controlled Chromium/download evidence | No |
| REG-025 | AI Assistant | Facts mode | PASS | Prompt text check | No |
| REG-026 | AI Assistant | Questions mode | PASS | Prompt text check | No |
| REG-027 | AI Assistant | Structure mode | PASS | Prompt text check | No |
| REG-028 | AI Assistant | Preview dialog | PASS | Controlled Chromium | No |
| REG-029 | AI Assistant | Copy UX | PASS | Controlled Chromium | No |
| REG-030 | AI Assistant | Platform links | PASS | DOM link inventory | No |
| REG-031 | Images | Zoom coverage | PASS | Controlled Chromium | No |
| REG-032 | Images | Lightbox controls | PASS | Controlled Chromium | No |
| REG-033 | Accessibility | Accessible names | PASS | Live DOM audit | No |
| REG-034 | Accessibility | Dialog labels | PASS | Live DOM audit | No |
| REG-035 | Accessibility | Focus visibility | PASS | Controlled Chromium/visual review | No |
| REG-036 | Mobile | Viewport width | PASS | Controlled Chromium metrics | No |
| REG-037 | Mobile | Heading wrapping | PASS | Controlled Chromium metrics/visual review | No |
| REG-038 | Mobile | Page labels | PASS | Controlled Chromium metrics | No |
| REG-039 | Runtime | JavaScript syntax | PASS | node --check | No |
| REG-040 | Runtime | Console errors | PASS | Controlled Chromium console | No |
