# Current verification — Gemini activation and presentation media

2026-10-03 Asia/Kolkata, Windows/main, based on c7f9ca9. Gemini/media implementation b0dd07f is pushed; remote SHA matches and the public commit page opens. Final handoff follows separately; inspect Git/PROJECT_CONTEXT for its exact revision. No app server/browser/device check was performed.

- Complete `npm test`: **331/331** —94 domain,42 workspace/recovery/weather,34 Mission control,47 mocked API,15 capture/photo,14 Lab,21 map,15 presentation/visit,20 Decision brief,29 evidence actions. Four bundled reports cover217 checks; another114 run separately through npm test. Authored software checks, not model/environment scores.
- TypeScript and full ESLint pass with zero warnings. All11 application CSS files parse with PostCSS; normal git diff --check passes. Seven added API regressions cover default Gemini metadata, header-only key, JSON schema, image inline data, actual modelVersion, thought exclusion, stale consent, fail-safe validation and bounded explicit alternate behavior.
- Production build passes:24 offline assets /4,626,706bytes. Existing >500kB chunk and Vinext route-classification notices remain; device performance/offline installation unmeasured. No new dependency/backend/custom model.
- Release scan passes:210 source/89 build files,2 configured keys checked, zero matches; sanitized result in .sites-runtime/release-check.json. It checks required assets, credits, photo digests, current non-live reports and accidental inclusion of configured Gemini/xAI/Groq values without displaying secrets. It is not comprehensive vulnerability/credential detection.
- **Real Gemini connection:** supplied key accepted by models.list (HTTP200). Actual source route code with an isolated Worker env binding, without an app/server/browser, sent one authored synthetic note and one credited2023 Scenic Reflection photo resized to768px JPEG. Gemini3.5 Flash-Lite returnedHTTP200 for both; route responses200, validated text modeAI with one issue and visual response with two candidate appearances, actual provider/model retained. Human review not performed, no citizen confirmation/records created. Sanitized log timestamp2026-10-02T18:43:51.572Z is Oct3 local time. This is a bounded access check, not scientific accuracy, a model benchmark, current browser behavior or deployment.
- Earlier3.8 text/image generation returned503; previous xAI synthetic check returned403 categorized billing/credits-related. These failures remain in ignored sanitized logs. No implicit fallback is configured here. Quota/availability may change; rule/error paths remain usable. Fresh successful xAI/Groq outputs remain unverified.
- Presentation media kit:3 unchanged credited historical photographs,1,138,086photo bytes;6-file ZIP1,139,987bytes. Digests/licences/source-day metadata/credits and zero matches for both configured keys checked; zero seeded observations/reviews. The kit is presentation media, not an importable field pack or new field visit.
- Server remains stopped; no5173 listener. Browser/device testing and the video belong to the user; no deployment/submission.

Preserved features/fixes: read-only four-chapter presentation, unchanged original-text brief, actual-record evidence actions, explicit parent/child visits, Decision brief with retained human reason/gaps, historical annual Sentinel2 context, optional diagnostics, manual photo pins/comparison/replay. A workflow flag alone never establishes usable review history. Calendar/time-zone/confirmation provenance and import guards remain intact.

Limits: hooks/recorders/MapLibre/timers/stores are doubled; tests do not measure rendered pixels or authentic scene/observer identity. User checks remain320/390/1440px layouts; camera/video/voice/GPS; touch/keyboard/focus; pins/comparison/replay/Lab/graph/presentation; WebGL/tile coverage/errors; downloads/second-profile import/storage quota/concurrent tabs; consented Gemini browser operation; installed production offline behavior. Network AI/maps/weather are not offline services. Same-person demo review must be disclosed. See DEMO_GUIDE and COMPLETION_CHECKLIST.

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

Screenshots/build logs remain in ignored outputs/runtime folders. Failed provider runs are retained. Runtime status for the current October2 session appears at the top of this ledger.
