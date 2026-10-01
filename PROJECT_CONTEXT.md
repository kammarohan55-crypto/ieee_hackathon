# AquaLens — current project handoff

Updated 2026-10-01. Repository: https://github.com/kammarohan55-crypto/ieee_hackathon. This visual upgrade was developed on `improve/visual-mission-control`, based on GitHub main `abd7190ecb9234cea374ced2e226e4c589c1dc77`. Read Git for the current branch and final delivered commit.

## User goal and authorization

Improve the existing OneAquaHealth Track 3 project, remove fake observations, fix errors and create a professional, visually rich hackathon demonstration. The user supplied six screenshots of a dark weather dashboard and asked for comparable visual quality and useful features. The screenshots were inspected; their weather/fusion/validation data were not imported or copied into this river app. Do not promise a competition result or invent river measurements, AI output, visits or scientific validation.

The user explicitly authorized updating/pushing this repository. GitHub is connected with write access. Do not ask for push permission again. The pre-existing project context assigns browser/device QA to the user and prohibits starting/restarting a server, visiting the app, app screenshots or browser QA unless requested again. This pass used source/domain/build verification and did not start a server. Viewing the user's reference screenshots is separate from app QA.

## Current visual upgrade

- Dark navy Mission control with cyan/violet/mint/amber accents, real-count cards, searchable source rail, source/field scope filters, photo canvas, evidence inspector, focus view, human-review queue and geographic map. Ctrl/⌘ K focuses source search; Escape leaves focus view. Explicit weather lookup remains available for any located field record, including records without photographs.
- Three real credited photographs are visible before creating a record. A source photo becomes a historical review only after the user writes their own note and confirms it. All count charts remain empty until real records exist.
- Photo desk: zoom/grid, immutable human note pins, keyboard center placement and readable notes list. Notes retain normalized image position, category, text, timestamp and unauthenticated local role. Adding a note reopens review and preserves original media, earlier judgments and history. Missing local photo bytes disable note creation. Optional stored visual AI regions are explicitly coarse frame regions, not detector boxes.
- Manual wipe/side-by-side comparison of distinct photos, interactive source → assessment → human-decision flow and chronological retained-event replay. Source dates preserve day precision. No simulated river timeline, registered-image analysis or trained fusion model is claimed.
- Insights: real workflow distribution, record-metadata coverage, 14 UTC days of record creation, retained source counts and a clickable/filterable evidence matrix. Historical reviews are separate from field records and excluded from the coordinates denominator. Software-validation cards load four actual test-report files; they are not ecological/model accuracy scores.
- Photo notes survive receipt/field-pack transfer, show in the full receipt and provenance graph, and undergo cross-media/unique-ID/schema checks during restore/import/export. Older records without notes remain compatible. No dependencies were added.

Important new files: `components/mission-control.tsx`, `components/photo-inspector.tsx`, `components/evidence-visuals.tsx`, `components/evidence-insights.tsx`, `lib/mission-control.ts`, `app/console.css`, `scripts/test-mission.mjs`. Existing lifecycle stays in `components/streamcheck.tsx`; field-note schema lives in `lib/field.ts`.

## Earlier improvements retained

Fresh collection has no sample seeding, fake environmental data or illustrative evidence uploads. Legacy synthetic records are filtered with a recovery copy in `aqualens-legacy-samples-v1`. Original observations, unknowns and reviewer decisions remain intact.

Three Wikimedia thumbnails are bundled: Mutha River/Pune (Ak2431989, 2010-08-03, CC BY 3.0), Scenic Reflection (Sharvarism, 2023-06-06, CC BY-SA 4.0) and Sambhaji Bridge (DesiBoy101, 2023-06-12, CC BY-SA 4.0). Source metadata/digests are in `lib/references.ts`; notices in `public/images/references/CREDITS.md`. Historical reviews retain fixed source site/date/credit and cannot contain invented GPS, readings or visit context. Source photos are in the production offline cache.

Retained features include original photo/clip uploads, camera/voice, optional consented Gemini, explicit citizen confirmation, human visual judgments, completeness rubric, source graph, Evidence Lab, River observatory, coordinate-only map, explicit current modeled weather, field guide/One Health notes, linked follow-ups and validated portable field packs. Limits: 500 reports, 36 MB embedded media, 64 MB transfer JSON. SHA-256 checks detect changed bytes; they do not authenticate a scene or observer.

## Architecture and storage

Vinext/React/TypeScript, Zod, Cloudflare Worker API routes, optional Gemini. Reports use localStorage `streamcheck-workspace-v1`; draft uses `aqualens-draft-v1`; original media use IndexedDB `aqualens-evidence`. File-based packs are not automatic multi-user sync. No authenticated reviewer, shared database, signed history, forecast, ecological diagnosis, FHIR integration or validated scientific model is implemented.

## Verification

- **164/164**: 86 authored domain assertions, 28 workspace/source-integrity checks, 29 visual-workspace checks and 21 mocked API contracts.
- TypeScript, ESLint, ten CSS parses, production build and release asset checks pass. All four generated test reports ship in the offline cache. Existing large-chunk warning remains; about 4.53 MB across 24 precached assets.
- Tests cover immutable note/byte preservation, review reopening, transfer compatibility, invalid/foreign/duplicate notes, real metrics and UTC dates, source separation, candidate acknowledgment, graph links and retained-event chronology. They do not establish browser rendering, pointer placement or environmental accuracy.
- No live AI/weather/browser/device test or deployment occurred in this pass. Fresh checkout has no Gemini key. Historical live text smoke success elsewhere does not establish availability here; successful live visual analysis remains unverified.

## Delivery and next steps

This change is prepared for the already-authorized GitHub main update. Before claiming delivery, compare the generated remote tree with the tested local tree, update main without force, fetch it and confirm no source diff. Update this delivery paragraph with the verified commit after pushing. Do not deliver stale ZIP/patch outputs from the preceding release.

The new demo path is Mission control → inspect/compare source → Review this photo → own note/checks/confirmation → saved-photo human pin/replay → Review desk → Insights → export/import field pack. Exact steps and outstanding manual checks are in `docs/DEMO_GUIDE.md` and `docs/QA.md`. No new user photo/video is needed for the historical-photo demo. Firsthand evidence still requires actual original photos and visit details; see `docs/MEDIA_CHECKLIST.md`.

No judge-access deployment or submission is verified. Team credits, code licence choice, manual device walkthrough and recorded 3–5 minute demo remain. The old private Sites project is untouched; earlier context records an automatic approval rejection for Sites export/publishing without an authorized destination. Do not retry or bypass it. Do not introduce Sites hosting into this repository task.

Commands: `npm ci`; `npm test`; `npm run typecheck`; `npm run lint`; `npm run build`; `npm run verify:release`. Start dev/preview only when explicitly requested.
