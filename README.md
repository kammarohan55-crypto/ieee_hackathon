# AquaLens · Evidence in focus

OneAquaHealth Track 3 hackathon prototype, evolved from StreamCheck without rebuilding its tested workflow. Citizen evidence -> explicit uncertainty -> human review -> portable Decision Receipt. It does not diagnose water safety, pollutants, species, or ecological health.

## Setup

Node 22.13+ (tested: Node 24). Run from this folder:

```sh
npm install
npm run dev
npm test
npm run typecheck
npm run build
npm run verify:release
npm start
```

Development: http://localhost:5173. Production preview: use the URL printed by npm start. If the Windows npm launcher is broken, use `node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js"` in place of npm. Direct build: `node scripts/build.mjs`.

Optional Gemini: copy `.dev.vars.example` to `.dev.vars` ONLY if no configured file already exists. Set your own GEMINI_API_KEY locally and GEMINI_MODEL=gemini-3.8-flash, then restart. Never commit secrets or use NEXT_PUBLIC_ variables. A fresh clone works without a key; live AI requires a server-side key. No map/weather key is required. Free-tier availability and account billing are controlled by Google; no unlimited-free promise is made.

The production-local launcher passes the root `.dev.vars` path to Wrangler when it exists; it never copies secrets into `dist`. Hosted secrets must be configured separately. `verify:release` checks required build assets, passing authored test reports and accidental inclusion of the locally configured Gemini key; it is not a comprehensive security audit.

## Implemented experience

The interface uses a marine field-instrument palette: deep navy, teal, warm ivory and sage, with editorial headings and readable system typography. The illustrative river hero links directly to capture, review and the atlas. Camera, evidence and reviewer panels share the same visual hierarchy, with responsive controls, visible focus states and reduced-motion support. Counts come from this browser's records; artwork is labeled separately from field evidence.

- Citizen note/time/appearance, transparent English checks, optional structured Gemini text suggestions, adaptive questions, uncertainty/dismissal, explicit confirmation.
- Camera photos, ten-second silent video clips, photo uploads, manual repeat-photo ghost guide. Original Blobs in IndexedDB; SHA-256 digests in records. Video quality checks sample the first frame; video AI is not implemented.
- Local luminance, edge-detail and resolution checks. These are uncalibrated heuristics, not scientific quality assessment.
- Visual Gemini endpoint returns only enumerated candidate appearances, frame regions and low/medium/high uncalibrated model confidence. Explicit consent sends a resized JPEG only. No inferred instrument measurements or diagnoses.
- Instrument readings with units, instrument/calibration metadata and broad input plausibility checks. Implausible values are retained and flagged, never silently corrected.
- Transparent 100-point evidence-completeness rubric, human visual judgments/disagreement with reasons, retained original suggestions, review trail, interactive React Flow evidence graph, Decision Receipt.
- MapLibre/OpenFreeMap atlas, explicit coordinates, timeline, site filtering, before/after photo slider and rule-based follow-up missions. No invented monitoring points or physical digital-twin simulation.
- Follow-up missions retain a source-report link and synthetic status while requiring fresh readings. Later visual judgments reopen completed reviews and preserve the earlier history.
- pH comparison only with three non-synthetic reports at distinct times, one site and the same named instrument with calibration reported checked. No ecological trend or outlier claims.
- JSON/CSV/GeoJSON export. CSV neutralizes formula prefixes; GeoJSON omits unknown coordinates. FAIR-oriented metadata includes provenance/access/license limits. Media is downloaded separately and matched by digest.
- Saved reports and draft recovery, cross-tab report refresh, responsive Radix controls, reduced-motion support.
- Workbox production asset precache and navigation caching after an online controlled visit. Reload online after first installation before expecting offline navigation. Local capture/rules/review remain available; AI, weather and tiles need network.
- Browser speech recognition with reviewed transcript adoption when supported. It may use the browser provider's remote service. It does not infer measurements/location from speech.

## Architecture

| File | Responsibility |
|---|---|
| components/streamcheck.tsx | Existing workspace, local report lifecycle, clarification and confirmation |
| components/field-studio.tsx | Camera/media, ghost overlay, dictation, measurements |
| components/evidence-workbench.tsx | Completeness, review additions, graph, atlas, timeline/comparison |
| lib/assessment.ts | Original schema, text engine, decisions, evidence preservation |
| lib/field.ts | Field schema, visual vocabulary, measurement checks and exports |
| lib/media-store.ts | IndexedDB, hashing, image heuristics, resized JPEG |
| app/api/assess + app/api/visual | Server-side Gemini and strict response validation |
| app/api/conditions | Cached Open-Meteo modeled weather, separately labeled |
| scripts/prepare-map-worker.mjs | Unmodified licensed MapLibre Worker assets, avoiding framework dev injection |
| scripts/build-offline.mjs | Workbox production service worker |

## Four-minute demo

1. Explain how a visual description can become an unsupported causal claim.
2. Explore the brown-water sample; inspect the original note. Add a photo or the explicitly synthetic illustration.
3. Opt in to visual AI if available. Inspect candidates and uncertainty. If unavailable, show the honest error and local fallback; never call rules AI.
4. Demonstrate an explicitly synthetic pH 19 input: value retained, warning and follow-up. Preserve unknown cause, inspect score components, confirm.
5. Reviewer inspects sources, media digest, graph and transparency. Record a reasoned judgment on every visual AI candidate before completing review. Download the receipt.
6. Show located reports in the atlas, compare two retained images with lighting/viewpoint caveats, export GeoJSON.

## Verification and boundaries

60/60 authored domain assertions and 19/19 mocked API contract tests passed; typecheck, lint and production build passed. See docs/QA.md, public/evaluation.json and public/api-evaluation.json. These tests execute actual domain/route code but do not validate scientific accuracy. `node scripts/test-live-ai.mjs` makes three real synthetic requests; public/live-evaluation.json is an integration smoke report, not a benchmark. Preserve prior results in docs/evaluation-runs/.

Real Gemini text calls have succeeded in the development installation. The latest live text run passed 3/3 scenarios. Earlier high-demand failures (0/3 and1/3) are retained. Visual requests still received503 high-demand responses; failure behavior was verified in-browser, but successful visual response remains unverified. These historical results do not establish access or availability for a fresh clone's key. Quota/provider availability may change.

This is a browser-local prototype, not a production service: no authenticated community/reviewer identities, shared database, signed history, physical digital twin, FHIR integration, held-out ecological evaluation or FAIR certification. Storage can be evicted; export backups. Production needs authentication, durable storage, access control, durable rate limits and expert validation. Per-isolate AI throttles are best-effort, not a billing cap.

Free-tier Gemini inputs may improve Google products; explicit consent is required. AI adapters send no coordinates, instrument details or video. Exported coordinates/photos may be sensitive; you control exports. Confirmed records survive refresh; clarification-in-progress restarts from the saved draft. Judge access and the recorded submission video remain separate delivery tasks.

## Attribution and continuity

MapLibre BSD-3-Clause; React Flow MIT (attribution retained); idb ISC; Workbox/Recharts/React/Radix/shadcn MIT. Basemap credits OpenFreeMap, OpenMapTiles and OpenStreetMap. Open-Meteo modeled weather is CC BY 4.0, not stream sensor data. Hero artwork is generated illustration. See docs/DEPENDENCIES.md and docs/SOURCES.md.

A new AI should read AGENTS.md and PROJECT_CONTEXT.md, then inspect actual code/tests. These files preserve context; chat memory is not assumed.

See docs/SUBMISSION_KIT.md for a submission draft, rubric evidence and a four-minute recording script. Deployed judge access and the recorded video remain delivery tasks.

