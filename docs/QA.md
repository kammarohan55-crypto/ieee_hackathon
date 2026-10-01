# Current verification — real-evidence workspace

2026-10-01, branch `improve/real-evidence-workspace`.

- `npm ci` initially failed: two optional @emnapi entries were absent from the lockfile. `npm install` repaired the lockfile; subsequent `npm ci --dry-run --include=dev --include=optional` passes.
- `npm test`: 86/86 domain assertions + 28/28 field-pack integrity/merge/source checks + 21/21 mocked API contracts = **135/135**.
- `npm run typecheck`, `npm run lint`, nine PostCSS stylesheet parses and `git diff --check`: pass.
- `npm run build`: passes. Production offline asset set: 23 assets, 4,432,233 bytes at this build. Existing >500 kB bundle warning remains; it is not a build failure.
- `npm run verify:release`: passes; required worker, MapLibre license, PWA assets and all three generated test reports present. No Gemini secret is configured in this fresh clone, so configured-secret matching was not exercised.
- No server started, browser visited, screenshot taken, live AI call made, or deployment performed. This follows the manual website-testing preference in the existing project instructions.

New source tests additionally decode all three bundled JPEGs, match their digests, preserve attribution on round-trip, reject missing/changed credits and invented visit context, keep source dates at day precision across time zones, and inspect graph provenance. Release checks verify the built photos and offline-cache entries.

Tests also exercise original-byte round trips, optional context preservation, corrupt bytes/digests/MIME, missing media, receipt compatibility, rejection of synthetic inputs, duplicate/conflict handling, capacity limits, source media ID collisions, search, required weather coordinates, model provenance, unit failures and cross-site cache isolation. They do not execute browser IndexedDB transactions or prove ecological accuracy.

Manual checks still required: actual downloads/import in a second profile, phone camera/video/voice/GPS, keyboard/mobile layout, a successful consented visual-AI call, map loading and production offline installation. See DEMO_GUIDE.md.

---

## Historical verification (before this branch)

# Verification ledger — 2026-09-30

## Current map/lab/observatory delivery

- Preserved the existing citizen-to-reviewer lifecycle. Added River stories, coordinate dossier/index, saved-record Evidence Lab, separate practice, source-specific graph, collapsible comparisons and collection export. Removed retired lab UI/state/styles.
- 86/86 authored domain assertions pass. New invariants cover site-filter collisions, illustration labels, distinct photos, immutable chronology, media/reading gaps, exact-coordinate grouping, valid polar vs invalid/missing GPS, date-line bounds, source spans, non-mutating replay, latest judgment summaries, graph ID/source integrity and timestamp-equivalent pH observations.
- Existing 19/19 mocked actual API-route contract results were produced earlier in this session; no route/provider code changed in the final map/lab pass. No new live request made.
- Full TypeScript passes; full ESLint has zero errors/warnings; six changed stylesheets parse.
- Production build passes. Workbox: 18 assets, 5,836,055 bytes. Existing >500kB chunk warning remains; no guarantee of fast first load on low-end devices.
- Release verification scans 162 source and 84 built files; zero matches for this installation's configured Gemini secret, required assets present, current test reports included. This checks that key, not every possible credential.
- Camera startup/late-unmount disposal, draft epoch guards, fresh form/GPS/voice state, missing-media identity guards and reviewer-note reset were corrected in source. Physical-device behavior still needs user walkthrough.
- **Latest user instruction: the user checks the website.** No server start/restart, website visit, screenshot, browser QA or live-provider call for the redesigned geographic map, Evidence Lab or graph. Responsive/accessibility reasoning is source-level, not a device certification.

## Historical observed browser behavior

These observations precede the latest manual-only instruction and describe the interface at that time.

- Original sample -> local clarification -> uncertainty -> explicit confirmation -> saved record -> human review/history.
- Retained illustrative image, digest/image checks and manual GPS. pH19 preserved/flagged with an adaptive question.
- Reference upload exposed ghost controls; physical overlay alignment unverified.
- Earlier attributed map rendered after the unmodified static MapLibre worker fix. Keep that adapter.
- Graph/transparency, rule sandbox, WebMCP counts/navigation and report persistence after refresh.
- Earlier 390/1440px widths had no document overflow.
- Basic River Observatory smoke: navigation, focus toggle, synthetic exclusion/empty state, Brookside selection/Evidence image; 390px width had no document overflow. Later map/lab/graph redesign is not browser-tested.
- Historical keyless modeled-weather response and real visual-provider failure UI. Visual failures contained no invented findings; text fallback preserved original evidence.
- Latest historical real Gemini text smoke completed3/3 on Sept29. Earlier0/3 and1/3 failures remain in evaluation-runs/. This is integration availability, not AI/scientific accuracy. Successful live visual analysis remains unverified after provider503s.

## Checks still assigned to the user

DEMO_GUIDE.md provides exact actions/expected states and a bug template.

- Redesigned map selection, fit, retry, coincident groups, missing-GPS dossier, narrow viewport and keyboard navigation.
- Saved Evidence Lab tabs, source highlighting, Stored/Local replay, record switching, practice clearing/restoration and history.
- New provenance graph node/list selection, readability, keyboard controls and no stale record detail.
- Physical camera/video, voice, ghost alignment, permission/error recovery and reset while async work is pending.
- Native download completion and actual two-retained-photo comparison. A historical receipt download-event wait timed out in the in-app browser; completion remains unverified despite tested serializers and attached download anchors.
- Production PWA install and offline navigation after a controlled online visit; dev mode is not proof of install/offline behavior.
- No automated accessibility scanner, assistive-technology study, independent benchmark, ecologist review or production security assessment.

Screenshots/build logs remain in ignored outputs/runtime folders. Failed provider runs are retained. The previously user-requested dev process was last started as PID13456; this pass did not start/restart or visit it. No current server-health claim is made.
