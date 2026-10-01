# AquaLens · Evidence in focus

[Source repository](https://github.com/kammarohan55-crypto/ieee_hackathon) · OneAquaHealth Track 3

OneAquaHealth Track 3 hackathon prototype, evolved from StreamCheck without rebuilding its tested workflow. Citizen evidence -> explicit uncertainty -> human review -> portable Decision Receipt. It does not diagnose water safety, pollutants, species, or ecological health.

## Setup

Node 22.13+ (tested: Node 24). Run from this folder:

```sh
npm ci
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

The interface uses a marine field-instrument palette: deep navy, teal, warm ivory and sage, with editorial headings and readable system typography. A real, credited Mutha River photograph anchors the hero and links to capture, review and the field kit. Camera, evidence and reviewer panels share the same visual hierarchy, with responsive controls, visible focus states and reduced-motion support. A fresh workspace starts empty; counts come only from saved records and distinguish field observations from historical-photo reviews. Earlier synthetic records are excluded, with a local migration recovery copy preserved. Three sourced historical photos are available for explicit photo review, with visible dates and attribution. No scripted AI response is offered as evidence.

- Credited Wikimedia reference gallery: inspect a real historical frame, write your own note, confirm it, review it, and export the source-linked receipt. Source date stays date-only; no GPS or instrument values are invented. The atlas and weather use field observations only. [Photo credits and licences](public/images/references/CREDITS.md).
- Citizen note/time/appearance, transparent English checks, optional structured Gemini text suggestions, adaptive questions, uncertainty/dismissal, explicit confirmation.
- Camera photos, ten-second silent video capture, original photo and MP4/WebM uploads (up to 15 seconds), manual repeat-photo ghost guide. Original Blobs in IndexedDB; SHA-256 digests in records. Video quality checks sample the first frame; video AI is not implemented.
- Local luminance, edge-detail and resolution checks. These are uncalibrated heuristics, not scientific quality assessment.
- Visual Gemini endpoint returns only enumerated candidate appearances, frame regions and low/medium/high uncalibrated model confidence. Explicit consent sends a resized JPEG only. No inferred instrument measurements or diagnoses.
- Instrument readings with units, instrument/calibration metadata and broad input plausibility checks. Implausible values are retained and flagged, never silently corrected.
- Transparent 100-point evidence-completeness rubric, human visual judgments/disagreement with reasons, retained original suggestions, review trail and Decision Receipt. The interactive evidence graph distinguishes citizen, public photo source, rules, AI, human and pending sources, with a keyboard-readable list.
- River Observatory: an explicitly illustrative river scene, selectable exact site labels, record chronology, Story/Evidence/Method views and presentation focus controls. Unlocated observations remain useful; matching labels do not establish connected waterways.
- Geographic map: MapLibre/OpenFreeMap, exact-coordinate marker groups, location dossier, source/accuracy/time, accessible record index, fit controls and retry/fallback. Missing locations are never guessed; valid polar coordinates remain in records even outside the basemap projection.
- Evidence Lab: inspect saved originals, highlighted source quotes, rule/AI provenance, media/readings and human decisions. Replay current local rules using record creation time without modifying the saved report.
- Site filtering, retained-photo comparison and rule-based follow-up missions. Supporting timeline/comparisons are collapsible so the main evidence story stays clear.
- Follow-up missions retain a source-report link and synthetic status while requiring fresh readings. Later visual judgments reopen completed reviews and preserve the earlier history.
- pH comparison only with three non-synthetic reports at distinct times, one site and the same named instrument with calibration reported checked. No ecological trend or outlier claims.
- Field kit: three-view photo guide, personal preparation checklist, optional One Health context (riverbank, wildlife, nearby human activity), and original upload filenames.
- Review-desk search across site names, notes and record IDs, combined with workflow filters.
- Site weather: explicit user-triggered Open-Meteo requests for an observation's coordinates; validated units, source/grid/time retained, no default city and no historical-weather claim.
- Portable field packs: original reports plus optional local photo/video bytes, SHA-256 checks before import, preview, duplicate detection and conflict preservation. Supports prior JSON receipts/collections; synthetic imports are rejected. Up to 500 reports, 36 MB embedded media, 64 MB JSON file. Missing media is reported, never replaced.
- JSON/CSV/GeoJSON export. CSV neutralizes formula prefixes; GeoJSON omits unknown coordinates. FAIR-oriented metadata includes provenance/access/license limits. Individual receipts keep media references; field packs optionally include originals and verify their digests on import.
- Saved reports and draft recovery, cross-tab report refresh, responsive Radix controls, reduced-motion support.
- Workbox production asset precache and navigation caching after an online controlled visit. Reload online after first installation before expecting offline navigation. Local capture/rules/review remain available; AI, weather and tiles need network.
- Browser speech recognition with reviewed transcript adoption when supported. It may use the browser provider's remote service. It does not infer measurements/location from speech.

## Architecture

| File | Responsibility |
|---|---|
| components/streamcheck.tsx | Existing workspace, local report lifecycle, clarification and confirmation |
| components/field-studio.tsx | Camera/media, ghost overlay, dictation, measurements |
| components/evidence-workbench.tsx | Completeness, review additions, graph, atlas, timeline/comparison |
| components/river-observatory.tsx | Illustrative site stories and selected observation evidence |
| components/geographic-evidence-map.tsx + lib/geographic.ts | Supplied-coordinate map, location index and date-line-safe extents |
| components/evidence-lab.tsx + lib/evidence-lab.ts | Read-only report inspection, source spans and deterministic replay |
| lib/evidence-trail.ts + lib/atlas.ts | Provenance graph data, filters, distinct-photo pairs and comparable pH |
| lib/assessment.ts | Original schema, text engine, decisions, evidence preservation |
| lib/field.ts | Field schema, visual vocabulary, measurement checks and exports |
| lib/media-store.ts | IndexedDB, hashing, image heuristics, clip poster extraction, resized JPEG |
| lib/workspace.ts + components/collection-tools.tsx | Real-data migration, search, portable field packs, integrity and conflict checks |
| lib/references.ts + components/reference-gallery.tsx | Credited historical photo catalogue, source dates and review entry point |
| components/field-guide.tsx | Photo guide, visit checklist, optional One Health notes |
| components/site-conditions.tsx | User-triggered weather for actual supplied coordinates |
| app/api/assess + app/api/visual | Server-side Gemini and strict response validation |
| app/api/conditions | Cached Open-Meteo modeled weather, separately labeled |
| scripts/prepare-map-worker.mjs | Unmodified licensed MapLibre Worker assets, avoiding framework dev injection |
| scripts/build-offline.mjs | Workbox production service worker |

## Four-minute demo

1. Open Field kit → Review this photo. The three historical reference photos are bundled; write your own description of a visible detail. For a firsthand field demo, use your own photos with actual place/time instead.
2. Show the source credit and date. Leave appearance unsure if needed. Reference reviews contain no new GPS, measurements or visit context. A field observation can include actual optional context.
3. Run local checks, or opt in to configured Gemini. Explain every surfaced question and explicitly confirm the record. If no issue matches, show that honestly.
4. Open the Review desk: original note, photo, AI/rule provenance and human decisions. Review all visual candidates if present, then add a review note.
5. Inspect the map only if real coordinates were supplied. Show a linked follow-up and source-preserving rule replay.
6. Export a field pack with originals. In another browser, preview and import it to demonstrate a real handoff. There is no automatic cloud sync.

See [the demo guide](docs/DEMO_GUIDE.md) and [photo checklist](docs/MEDIA_CHECKLIST.md). The photo-review demo is ready with bundled images. A firsthand field demo still needs your actual photos and visit details. Team credits, judge-access hosting and the recorded 3–5 minute video remain submission tasks.

## Verification and boundaries

135/135 software checks pass: 86 domain assertions, 28 field-pack integrity checks and 21 mocked API contracts. Typecheck, lint and production build pass. The repaired lockfile also passes npm ci validation. See docs/QA.md, public/evaluation.json, public/workspace-evaluation.json and public/api-evaluation.json. This session used source/build checks only, respecting the repository’s manual browser-testing preference. Browser downloads, IndexedDB import transactions, camera, video and responsive interaction need a device walkthrough. These tests execute actual domain/route code but do not validate scientific accuracy. `node scripts/test-live-ai.mjs` makes three real synthetic requests; public/live-evaluation.json is an integration smoke report, not a benchmark. Preserve prior results in docs/evaluation-runs/.

Real Gemini text calls have succeeded in the development installation. The latest live text run passed 3/3 scenarios. Earlier high-demand failures (0/3 and1/3) are retained. Visual requests still received503 high-demand responses; failure behavior was verified in-browser, but successful visual response remains unverified. These historical results do not establish access or availability for a fresh clone's key. Quota/provider availability may change.

This is a browser-local prototype, not a production service: no authenticated community/reviewer identities, shared database, signed history, physical digital twin, FHIR integration, held-out ecological evaluation or FAIR certification. Storage can be evicted; export backups. Production needs authentication, durable storage, access control, durable rate limits and expert validation. Per-isolate AI throttles are best-effort, not a billing cap.

Free-tier Gemini inputs may improve Google products; explicit consent is required. AI adapters send no coordinates, instrument details or video. Exported coordinates/photos may be sensitive; you control exports. Confirmed records survive refresh; clarification-in-progress restarts from the saved draft. Judge access and the recorded submission video remain separate delivery tasks.

## Attribution and continuity

MapLibre BSD-3-Clause; React Flow MIT (attribution retained); idb ISC; Workbox/Recharts/React/Radix/shadcn MIT. Basemap credits OpenFreeMap, OpenMapTiles and OpenStreetMap. Open-Meteo modeled weather is CC BY 4.0, not stream sensor data. The generated hero photograph and in-app synthetic fixtures have been removed. The credited hero and reference photos retain their own Creative Commons licences; see public/images/references/CREDITS.md. The labeled schematic river is not observation data. See docs/DEPENDENCIES.md and docs/SOURCES.md.

A new AI should read AGENTS.md and PROJECT_CONTEXT.md, then inspect actual code/tests. These files preserve context; chat memory is not assumed.

See docs/SUBMISSION_KIT.md for a submission draft, rubric evidence and a four-minute recording script. Deployed judge access and the recorded video remain delivery tasks.

