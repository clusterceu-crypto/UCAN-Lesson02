# UCAN Lesson 02 — Known Issues v2.5

## Blocker defects

None known.

## Critical defects

None known.

## Accepted limitations

1. **Image-based PDF.** PDF export follows the approved local architecture `canvas → JPEG → Blob → download`. The resulting PDF is not searchable, tagged or PDF/UA-compliant. This is documented and is not represented as an accessibility-compliant document format.
2. **Browser coverage.** Controlled runtime testing was completed in Chromium 144. Microsoft Edge and Mozilla Firefox were not available for independent execution in the current environment.
3. **External links.** URL structure, `target="_blank"` and `rel="noopener noreferrer"` were verified statically. Live availability of external websites was not tested because outbound navigation was outside the controlled product test.
4. **Storage scope.** `localStorage` is browser- and origin-specific. Data does not automatically synchronize between devices, browsers or different deployment origins.

No accepted limitation prevents local execution, static hosting, archive transfer or use of the core learner journey.
