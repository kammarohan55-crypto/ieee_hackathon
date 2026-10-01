# AquaLens — current project handoff

Updated 2026-10-01. Repository: https://github.com/kammarohan55-crypto/ieee_hackathon. Current branch: `main`. Tested release: `7003eaa8d66520e95c941931734eee0db9b9d5ec`; tested tree: `c3ebf3afa142a2d11eee075175dde2b29d9283d8`. Read Git for the exact final commit.

## User goal and instructions

Improve this existing project for OneAquaHealth, debug errors, remove fake data, make the site professional, and identify useful river photos. Primary track remains Track 3 (AI-Supported Assessment). Software/phone-based solution; no new hardware. Do not promise a competition result or fabricate field data, AI output, environmental measurements or validation.

The pre-existing project context explicitly assigned browser/device QA to the user and prohibited starting/restarting a server, visiting the app, screenshots or browser QA unless requested again. This pass respected that preference: source/tests/build only. A future explicit request for browser testing can change it. No broad permission questions were needed for implementation.

## October 1 reference-photo continuation

User explicitly asked the assistant to take the linked photos, finish the project and push GitHub; GitHub is now connected and reports write permission. Downloaded and visually inspected three Wikimedia 1280px thumbnails (Mutha River/Pune, Scenic Reflection, Sambhaji Bridge), 1.14 MB combined. Actual source dates are 2010-08-03, 2023-06-06 and 2023-06-12, retained at day precision. Credits/licences/source URLs are in `lib/references.ts` and `public/images/references/CREDITS.md`.

Real credited hero photo and a Field kit gallery now lead into an explicit historical-photo review. A user writes their own note; local checks, optional consented live AI, clarification, confirmation, review, graph and receipt reuse the existing workflow. No notes, AI outputs, readings or visits are pre-generated. Source date/site are fixed, media digest is verified on selection, credits travel with packs/exports, and cross-field checks reject stripped or mismatched attribution, changed source dates or invented coordinates/measurements/context. Historical photo reviews are labeled throughout, counted separately and excluded from the field atlas/current weather. Added day-precision validation to avoid inventing a time zone or blocking these reviews. The bundled images and credits are included in the production offline cache.

## Earlier real-evidence improvements

- Fresh workspace is empty. Removed fixture seeding, sample scenario loaders, synthetic-practice lab, illustrative-image upload and the generated hero PNG. Legacy synthetic records, synthetic coordinates and illustrative media are excluded from active reports. Before migration, an existing local workspace with samples is retained in `aqualens-legacy-samples-v1`. Genuine reports and review histories survive.
- Editorial contour hero, useful empty state, photo guide and a new Field kit. Review search combines site/note/ID words with workflow filters. Actual photo thumbnails appear in overview rows.
- Optional One Health citizen context: bank cover, wildlife seen/not seen, nearby human use, and an original note. Unknown remains the default. Confirmation/full receipt and JSON preserve these fields. This is context, not an ecological or health assessment.
- Portable field packs: reports plus optional original photo/video bytes. Zod validation, SHA-256 checks, import preview, duplicate detection, conflicting-ID preservation, shared-media agreement and atomic IndexedDB additions. Existing receipt/collection exports can be imported. Limits: 500 records, 36 MB embedded media, 64 MB JSON. Missing files are explicitly counted. Import does not prove authenticity or authenticate an observer.
- Original upload filenames retained. MP4/WebM clip uploads added (15-second/25 MB limits) alongside existing 10-second silent camera capture. First-frame heuristics only; no AI video analysis. Concurrent retain guard added.
- Fixed unrelated Coimbra weather: no default location or automatic request. Explicitly load current model weather for a saved report's supplied coordinates. Separate coordinate cache, validated units/time, grid/requested coordinate provenance and honest failure. Not historical weather, stream sensor data or water quality.
- Fixed fresh-install lockfile missing optional @emnapi entries. No dependencies added. Client AI response validated before display. Cross-tab removal now clears the view rather than resurrecting stale records. Reports at the 500-record limit fail before overflowing persistence.
- Updated README, demo/submission/QA/source docs and added `docs/MEDIA_CHECKLIST.md`. Live-visual smoke script now requires a supplied local file and explicit `--consent`; no synthetic default image, and result stays in ignored runtime storage.

## Architecture and storage

Vinext/React/TypeScript, Zod, Cloudflare Worker routes, optional Gemini. Core citizen → clarification → explicit confirmation → local reviewer/history → receipt remains intact. Original evidence and human disagreements are retained. Existing map, river stories, graph, local replay, measurements, follow-ups, ghost guide and production PWA remain.

Reports: localStorage `streamcheck-workspace-v1`. Draft: `aqualens-draft-v1`. Original media: IndexedDB `aqualens-evidence`. Field packs are file-based handoff, not multi-user synchronization. There is no authenticated reviewer, shared backend, signed provenance, forecast, species/contamination diagnosis, FHIR integration or validated ecological model.

Important additions: `lib/workspace.ts`, `components/collection-tools.tsx`, `components/field-guide.tsx`, `components/site-conditions.tsx`, `app/workspace.css`, `scripts/test-workspace.mjs`.

## Verified in this checkout

- 86/86 authored domain assertions, 28/28 field-pack/source integrity checks, 21/21 mocked route contracts: **135/135**.
- TypeScript, ESLint, nine stylesheet parses, production build and release asset checks pass.
- Repaired lockfile passes npm ci validation after the initial clean-install failure.
- Build contains 23 precached assets, 4,432,233 bytes (approximately 4.43 MB). Existing large-chunk warning remains.
- No live AI/weather/browser/device verification this session. Fresh clone has no configured Gemini key; historical provider success in another installation does not establish current availability.
- No server/deployment was started. Camera/video/voice, IndexedDB transaction behavior, actual download completion and responsive interactions still need the user's browser walkthrough.

## Repository delivery / hosting

**Delivered to GitHub main:** `7003eaa8d66520e95c941931734eee0db9b9d5ec`, through the authenticated GitHub app, using a non-forced update from `d1fbcff2a329360d489b3c3c0a2deb1d39b44bb9`. All 45 changed paths (earlier improvements plus the photo continuation) are included. A fresh CLI fetch confirmed the remote SHA and tree `c3ebf3afa142a2d11eee075175dde2b29d9283d8`; `git diff HEAD origin/main` was empty before moving this checkout to main. The former credential blocker is resolved. Local implementation checkpoints `6db1530` and `b1a1ced` remain on `improve/real-evidence-workspace`; they were consolidated into the remote release without changing tested file contents. This handoff update follows that verified release and changes documentation only. Source ZIP/patch under ignored `outputs/` are regenerated from the delivered source. Existing owner-private Sites project `appgprj_6ab966e17e388191a45bd547269c9f45` is untouched. Earlier context recorded an automatic approval rejection for Sites export/publishing, with no authorized Sites destination; do not retry or bypass it. No judge-access deployment is verified.

## Exact next steps

1. GitHub source delivery is complete and verified. Do not redo the improvements or request push approval again. Read Git for the later documentation-only commit SHA.
2. User can run the bundled historical-photo demo immediately: Field kit → Review this photo → original note → checks → confirmation → Review desk → receipt → field pack. No user photos or video are needed for this path. Perform the browser steps in `docs/DEMO_GUIDE.md`; this session did not run a server or browser.
3. For firsthand field evidence, optionally collect the three original views in `docs/MEDIA_CHECKLIST.md` with actual visit details. Do not relabel public photos as a new visit.
4. Configure an own server-side Gemini key in ignored `.dev.vars` if demonstrating live AI. Never print or commit it. No live visual success is verified in this checkout.
5. Verify a judge-access deployment, add real team credits/code licence choice, record the 3–5 minute demo and complete the submission. No hosted deployment or submission is claimed.

Commands: `npm ci`; `npm test`; `npm run typecheck`; `npm run lint`; `npm run build`; `npm run verify:release`. Start dev/preview only when requested. No success claim substitutes for a missing field/deployment/device check.
