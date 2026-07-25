# UCAN Lesson 02 — Known Issues v2.0

## Application defects

**None known.**

All identified comparison-review regressions were corrected and passed targeted regression checks.

## Non-defect deployment requirement

A final smoke test must be run on the intended HTTP/HTTPS publication origin. The managed QA environment served the package through a local HTTP server but restricted Chromium direct localhost navigation; therefore browser execution was validated using an exact inlined runtime copy.

This requirement does not require redesign or code changes unless the deployment-origin test reveals a new critical defect.
