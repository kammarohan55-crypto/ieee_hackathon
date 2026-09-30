# Verification ledger — updated 2026-09-30

## Sept30 visual pass

- Refined overview/nav/hero, camera, evidence quality, reviewer, transparency, receipt, graph, atlas and timeline styles. Hero shortcuts invoke existing workspace actions; displayed record/review counts remain browser-local values.
- TypeScript passes; full ESLint reports zero errors/warnings. Both changed stylesheets parse with PostCSS. Production Worker build and release check pass; configured-secret scan found zero matches outside ignored configuration.
- Current release has 148 source files and 84 build files. Workbox precaches 18 assets (5,723,002 bytes); the existing >500kB chunk warning remains.
- Responsive rules, 44px targets, focus and reduced-motion styles were checked in code. No new browser, viewport, screenshot, assistive-technology or physical-device test was run, respecting the user's no-preview instruction. Earlier browser results below describe the previous interface.
- No assessment/API behavior changed. Existing domain/API results below were not rerun for styling; no new live AI success is claimed.

## Verified

- Typecheck and production Worker build; Workbox generated offline assets.
- 60/60 domain assertions: original preservation, dates, decisions, history, mock provider failure/refusal/schema/injection cases, visual vocabulary/abstention, coordinates, measurement units/metadata/ranges, score, disagreement preservation, JSON roundtrip, CSV injection escaping, GeoJSON axes/omission, mandatory human visual judgments, review reopening, history capacity and source-linked synthetic follow-ups.
- 19/19 API contract tests execute actual route code with a mocked Worker environment/fetch: consent, origins, body limits, no-key behavior, vocabulary/diagnosis rejection, truncation/refusal, thought filtering, provider errors, throttles, weather units/cache/provenance. No live provider is called.
- ESLint passes. The production-local launcher now uses Wrangler's documented CLI `--env-file` option to point at root `.dev.vars`; no secret is copied into build assets. This launcher change was not preview-tested, per user request.
- Browser: sample -> rule question -> uncertainty -> explicit confirmation -> saved report -> reviewed with retained note/history.
- Browser: local illustrative image persistence/rendering, image checks and digest metadata; manual coordinate entry.
- Browser before preview testing was stopped: reference-image upload exposed the ghost opacity control; a synthetic media report was confirmed and saved with its image/digest. Physical overlay alignment remains unverified.
- Browser: pH 19 retained exactly and flagged; measurement-driven adaptive question appears.
- Browser: map rendered after fixing framework worker injection, point links to source; attribution visible. 390px and 1440px viewport checks: no document horizontal overflow.
- Browser: graph, transparency, receipt controls, rule sandbox abstention, WebMCP counts/navigation, confirmed record persistence after reload.
- Real keyless weather response and timestamped display; precipitation interval labeled.
- Real Gemini visual failure displays an error and no fabricated findings. Text failure returns labeled rules with original intact.

## Remaining limitations in verification

- Physical camera/video and successful voice transcription need an on-device walkthrough; permission/availability failures have been observed. No simulated camera result is claimed as a real capture.
- Live visual success blocked by provider high-demand 503s. Text latest smoke run3/3 live-mode completions; earlier0/3 and1/3 failures retained in evaluation-runs/. Availability is not classification accuracy.
- Native download completion, two-photo slider, successful visual disagreement UI and PWA install/offline navigation across browsers still need complete device checks. A Decision Receipt download-event wait timed out in the in-app browser; completion is unverified. Download anchors now attach to the document before dispatch. Serializers and disagreement persistence pass domain tests.
- User requested no further website previews on Sept29. Subsequent changes were checked with code-level tests, typecheck, lint and build only; no later browser test is claimed.
- Release check: 148 source and 84 built files scanned; zero matches for the locally configured Gemini key. Required Worker/Workbox/map-worker/license assets and current test reports present. This checks that key specifically, not every possible secret. Build has a large-chunk warning; precache is 18 assets, approximately 5.7 MB.
- No automated accessibility scanner, assistive-technology user test, ecologist review, independent benchmark, or production security assessment.

Screenshots are in ignored outputs/. Never erase failed runs to inflate reported results.

