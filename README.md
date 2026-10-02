# AquaLens · Evidence in focus

Latest browser debug pass (2026-10-03): fixed local Worker AI request compatibility and mobile/theme defects; fresh production-browser Gemini text/photo requests, confirmation/review/disagreement, Evidence Lab, map/weather, comparison and presentation were exercised. 362 authored checks, TypeScript, lint and production build pass. Physical-device capture/offline behavior and native download completion remain unverified. See [QA.md](docs/QA.md) for exact evidence and limits.

[Source repository](https://github.com/kammarohan55-crypto/ieee_hackathon) · OneAquaHealth hackathon prototype

AquaLens evolved from StreamCheck without rebuilding its tested workflow: citizen evidence → explicit uncertainty → human review → portable Decision Receipt. **Primary submission decision: Track 3 — AI-Supported Assessment**, with supporting capabilities relevant to Tracks 1, 2 and 4. This follows the supplied project instructions and the implemented AI/checks/human-review evidence trail; it does not establish winning odds or organizer endorsement. The [official challenge](https://oneaquahealth-ieee-hackathon.devpost.com/) asks entrants to select one primary track. Appearance, satellite context and human review do not establish water safety, pollutants, species or ecological health.

## Presentation collection

Open **http://localhost:5173/showcase** for a populated walkthrough: nine licensed European river photographs, eight genuine recorded Gemini visual responses, ten unverified candidate findings, local browser image checks, original example descriptions and three example review states. The initial notes, confirmations, review decisions and pipe pin are AI-authored demonstrations, visibly labelled and retained in exports. They do not represent citizen field visits or expert review.

**Insights** has photographic city cards, source-photo chronology, city/status filters, coverage bars, a review donut and an evidence matrix. **Mission control** adds zoom, coarse AI regions, the evidence flow, photo comparison and sourced geographic context. **Review desk** and **Evidence Lab** expose originals, pending judgments, replay and receipts. Live AI remains separately consented; the provider disclosure is under **AI & data use**.

The versioned /european-context-v2.json asset and v2 preset keys avoid stale offline results while preserving older saved examples. Persistence is gated on the matching workspace/draft key having loaded. The route reuses the working citizen/reviewer components with separate localStorage record/draft keys and dedicated IndexedDB media IDs. First preparation verifies all image hashes/dimensions and runs the same canvas heuristics as user uploads. Failed preparation shows a retryable error and never overwrites personal data. There are no invented GPS points, instrument readings, current river observations or backdated saving activity. Examples cannot be imported into the personal collection; presentation exports are for inspection. Personal backup/restore behavior is preserved.

## Setup

Node 22.13+ (tested: Node 24). Run from this folder:

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run lint
npm run build
npm run verify:release
npm start
```

Development: http://localhost:5173. Production preview: use the URL printed by npm start. If the Windows npm launcher is broken, use `node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js"` in place of npm. Direct build: `node scripts/build.mjs`.

Optional live AI: copy `.dev.vars.example` to ignored `.dev.vars` only if no configured file exists. Default: `AI_PROVIDER="gemini"`, server-only `GEMINI_API_KEY` and `GEMINI_MODEL="gemini-3.5-flash-lite"`; the visual model defaults to the same model. This installation's supplied key is saved locally. Google documents a limited free tier and use of free-tier content to improve its products; availability/quota are account-dependent. Optional xAI/Groq adapters and their own keys remain supported. Restart after changing configuration. Never use client/public environment variables or commit keys. No key is needed for local checks, maps or modeled weather. `AI_FALLBACK_PROVIDER` optionally names a different, separately configured provider; it is disabled here. The consent UI names recipients; stale provider/model scopes are rejected before transmission. See [Google pricing/privacy labels](https://ai.google.dev/gemini-api/docs/pricing).

The production-local launcher passes the root `.dev.vars` path to Wrangler when it exists; it never copies secrets into `dist`. Hosted secrets must be configured separately. `verify:release` checks required build assets, passing authored test reports and accidental inclusion of all locally configured Gemini/xAI/Groq keys; it is not a comprehensive security audit.

## Presentation media and connection check

Nine licensed historical river photographs are ready in **Mission control → Photo desk → Review this photo**. This path preserves source dates and credits; it does not invent new field visits. The checked local kit is `outputs/presentation-media/`, with a ZIP at `outputs/aqualens-presentation-media.zip`. These ignored outputs are not included in source-only archives. Recreate the folder with `npm test` then `npm run prepare:media`. Read [the demo guide](docs/DEMO_GUIDE.md) before recording.

For an explicitly authorized terminal integration check without starting the app, run `node scripts/test-api.mjs` then `npm run verify:ai -- --consent`. This sends exactly one authored synthetic note and one credited historical photo through the actual route code with an isolated Worker environment binding. It saves a sanitized ignored result; it is excluded from npm test, and does not create approved records or benchmark scientific accuracy. This terminal check does not start an app or browser.

## European river explorer

The active gallery uses the **Mondego in Coimbra, Garonne in Toulouse and Hoffselva in Oslo**, all official OneAquaHealth research cities. These nine credited historical photos date from2010–2021; no team authorship or current river-monitoring claim. Retired Pune files/catalogue remain only to protect prior receipts and are removed from the active gallery/hero/new media kit.

**Mission control → Geographic map** opens a European city overview with separate purple city-context markers, source-photo dossiers and street/NASA/2021 landscape controls. Click a river card or city marker; **European overview** fits all three. Positions are sourced Wikidata city centers, never invented camera/GPS/station coordinates or citizen reports. Actual supplied observation coordinates/counts remain separate.

**Three clocks** distinguishes the historical photograph, real recorded Gemini run and independent weather-model timestamp. Eight genuine recorded analyses retain ten candidate findings across the nine-frame catalogue. The people-visible Parque Verde frame stays local-only. Earlier three-frame responses and their original timestamps are preserved. Results/confidence are labeled recorded, uncalibrated and human review pending. **Recorded regions** shows coarse matching-frame regions without editing bytes or creating a field record. A fresh assessment needs explicit consent in the review workflow.

**Weather context** has actual Open-Meteo snapshots, air temperature, interval precipitation and wind; charts switch recent24h/next24h modeled projections and expose a UTC data table/source/grid/retrieval metadata. **Refresh live context** requests new model data; optional15minute polling runs while visible. Old/missing snapshots and failures remain explicit. These are weather models, not stream sensors or water-health forecasts. **Context JSON** exports a separate public-source bundle, not a Decision Receipt or importable field pack.

To deliberately update recorded public context: `node scripts/test-api.mjs` then `npm run prepare:context -- --consent`. Processes the eligible licensed source photos and requests three city weather contexts, creating no personal notes or human approvals. Use --missing-only to reuse retained responses without repeat provider calls. Versioned recorded assets are immutable: bump EUROPEAN_CONTEXT_ASSET and the presentation preset revision before deliberately replacing recorded content. Recorded assets are precached; network maps/weather/AI still need connectivity.

## Implemented experience

The interface uses a dark navy control-room layout with cyan, violet, mint and amber accents. Mission control opens on nine credited European river photographs, with a searchable source rail, inspection canvas and evidence inspector. A fresh personal collection contains zero saved records: source photos become historical reviews only after the user writes and confirms a note. Recorded public-source AI is labelled separately. The separate /showcase route prepares nine labelled presentation examples without touching personal records.

- **Mission control:** source search, field/historical filters, focus view, collection coverage and a supplied-coordinate map. **Evidence Actions** uses actual nonsynthetic records to explain review priorities and optional fresh visits; filters, inspectable reasons and show-more controls keep the list manageable. Priorities concern evidence workflow, never ecological danger. Weather can be explicitly loaded for any saved field location, including records without photos.
- **Photo desk:** full-frame viewing, zoom, inspection grid and human note pins. Each pin retains its image position, note, category, timestamp and local role without editing image bytes. Notes reopen review and travel in receipts/field packs; restored notes are checked against the correct photo. Recorded visual AI candidates can show their coarse frame regions, visibly distinguished from human notes and detector boxes.
- **Comparison and replay:** choose two distinct images for wipe or side-by-side inspection; replay the selected record's actual retained events. Different photographs are not registered images or measurements of environmental change.
- **Evidence flow:** inspect original words, source media, supplied context, assessment, clarification, human review and portable receipts. Before a record exists, it is explicitly a workflow preview.
- **Insights:** workflow distribution, evidence coverage, 14-day UTC saving activity, retained source counts and an interactive evidence matrix. Every value comes from saved records. Historical reviews are separately filterable and excluded from the GPS denominator. Optional software diagnostics read four generated test reports; these are not model-performance or ecological scores.
- **Presentation mode:** **Present this evidence** opens a read-only four-chapter view of original evidence, checks/clarification, human judgment and Decision Receipt. Actual review reasons, gaps and uncertainty stay visible. Export JSON or a readable Markdown brief with unchanged original text; the brief contains metadata, not original media bytes. Opening it never analyzes or approves the record.

- Credited Wikimedia reference gallery: inspect a real historical frame, write your own note, confirm it, review it, and export the source-linked receipt. Source date stays date-only; no GPS or instrument values are invented. The atlas and weather use field observations only. [Photo credits and licences](public/images/references/CREDITS.md).
- Citizen note/time/appearance, transparent English checks, optional structured Gemini/xAI/Groq text suggestions, adaptive questions, uncertainty/dismissal, explicit confirmation.
- Camera photos, ten-second silent video capture, original photo and MP4/WebM uploads (up to 15 seconds), manual repeat-photo ghost guide. Original Blobs in IndexedDB; SHA-256 digests in records. Video quality checks sample the first frame; video AI is not implemented.
- Local luminance, edge-detail and resolution checks. These are uncalibrated heuristics, not scientific quality assessment.
- Visual Gemini/xAI/Groq endpoint returns only enumerated candidate appearances, frame regions and low/medium/high uncalibrated model confidence. Explicit consent sends a resized JPEG only. No inferred instrument measurements or diagnoses.
- Instrument readings with units, instrument/calibration metadata and broad input plausibility checks. Implausible values are retained and flagged, never silently corrected.
- Transparent 100-point evidence-completeness rubric, human visual judgments/disagreement with reasons, retained original suggestions, review trail and Decision Receipt. The interactive evidence graph distinguishes citizen, public photo source, rules, AI, human and pending sources, with a keyboard-readable list.
- River schematic: an explicitly illustrative scene, site labels, chronology and Story/Evidence/Method views. Available under **Field kit → Additional evidence views**; matching labels do not establish connected waterways or a physical twin.
- Geographic map: exact-coordinate groups, location dossier, source/accuracy/time, accessible record index, fit and retry/fallback. Switch street maps, dated NASA Terra/MODIS regional imagery, and **Landscape · 2021**: a historical annual Sentinel-2 RGB median with 10 m source bands, zoom 6–14 and latitude −60° to 83°. Broad zoom prompts a detail control; coverage gaps and source limits are explicit. It is not a current scene, numerical reflectance, NDWI or stream measurement. Missing locations are never guessed; valid polar coordinates remain in records outside imagery coverage.
- Evidence Lab: default **Decision brief** links four retained provenance stages, actual latest human reason, uncertainty and missing/inconsistent history. Inspect originals, highlighted quotes, rule/AI provenance, media/readings and decisions. Replay current local rules using record creation time without modifying the saved report. Software diagnostics load only on request, validate their schema and support retry/cancellation.
- Site filtering, retained-photo comparison and rule-based follow-up missions. Supporting timeline/comparisons are collapsible so the main evidence story stays clear.
- Explicit visit connections show a retained parent and direct follow-ups, or disclose an unavailable parent. Fresh visits carry only site label/parent ID and require new time/note/media plus any optional readings/GPS; historical reviews do not become fresh visits. Links do not prove matching viewpoints or environmental change. Later visual judgments reopen reviews and preserve earlier history.
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
| components/mission-control.tsx + lib/mission-control.ts | Source desk, scopes, real-record metrics, queue and retained-event replay |
| components/photo-inspector.tsx + components/evidence-visuals.tsx | Image note pins, comparison, source flow and event controls |
| components/evidence-insights.tsx + app/console.css | Real-record analytics and the dark responsive visual system |
| components/field-studio.tsx | Camera/media, ghost overlay, dictation, measurements |
| components/evidence-workbench.tsx | Completeness, review additions, graph, atlas, timeline/comparison |
| components/river-observatory.tsx | Illustrative site stories and selected observation evidence |
| components/geographic-evidence-map.tsx + lib/geographic.ts | Supplied-coordinate map, location index and date-line-safe extents |
| components/evidence-lab.tsx + lib/evidence-lab.ts | Read-only report inspection, source spans and deterministic replay |
| components/decision-presentation.tsx + lib/presentation-brief.ts | Four retained provenance chapters and readable Markdown export |
| components/sampling-plan.tsx + lib/sampling-plan.ts | Grounded evidence actions and optional linked visits |
| components/linked-visits.tsx + lib/visit-links.ts | Explicit parent/child record connections |
| lib/satellite-context.ts | Dated NASA and historical annual WorldCover tile contracts |
| lib/evidence-trail.ts + lib/atlas.ts | Provenance graph data, filters, distinct-photo pairs and comparable pH |
| lib/assessment.ts | Original schema, text engine, decisions, evidence preservation |
| lib/field.ts | Field schema, visual vocabulary, measurement checks and exports |
| lib/media-store.ts | IndexedDB, hashing, image heuristics, clip poster extraction, resized JPEG |
| lib/workspace.ts + components/collection-tools.tsx | Real-data migration, search, portable field packs, integrity and conflict checks |
| lib/references.ts + components/reference-gallery.tsx | Credited historical photo catalogue, source dates and review entry point |
| components/field-guide.tsx | Photo guide, visit checklist, optional One Health notes |
| components/site-conditions.tsx | User-triggered weather for actual supplied coordinates |
| app/api/assess + app/api/visual | Server-side Gemini/xAI/Groq, consent binding and strict response validation |
| app/api/conditions | Cached Open-Meteo modeled weather, separately labeled |
| scripts/prepare-map-worker.mjs | Unmodified licensed MapLibre Worker assets, avoiding framework dev injection |
| scripts/build-offline.mjs | Workbox production service worker |

## Four-minute demo

1. Open **Mission control**. Inspect a credited photo, compare two source frames and click through the evidence flow. Explain why saved-record counts are initially zero.
2. Choose **Review this photo**, write your own visible-detail note and keep uncertainty. Run local checks or explicitly consent to configured AI, then confirm.
3. Return to Mission control, choose the saved photo, add a human visual-note pin and show the retained-event replay. Original pixels and previous decisions remain intact.
4. Open the full receipt in **Review desk**, inspect provenance and judge any visual candidates. Add your own review note.
5. Open **Present this evidence**, walk through its four chapters and export a readable brief. Show Evidence Lab's Decision brief, Mission control's Evidence Actions and Insights' actual counts. Switch the geographic map between dated NASA, **Landscape · 2021** and street context; explain the requested-day versus historical-annual limits. Organizer links are context, not imported research measurements.
6. Export a field pack with originals. Preview and import it in another browser to demonstrate a file-based handoff.

See [satellite limits](docs/SATELLITE_CONTEXT.md), [official platform review](docs/OFFICIAL_PLATFORM_REVIEW.md), [copyable deep-research prompt](docs/DEEP_RESEARCH_PROMPT.md) and [the demo guide](docs/DEMO_GUIDE.md), [real-data readiness checklist](docs/REAL_DATA_READINESS.md) and [visit-notes template](docs/VISIT_NOTES_TEMPLATE.txt). Bundled credited images support the historical-photo workflow. A firsthand field demo still needs your actual photos and visit details; unknowns stay unknown. Team credits, judge-access delivery and the recorded 3–5 minute video remain submission tasks. Production-browser flows were exercised; physical-device and native-download limits are in QA.md.

## Verification and boundaries

Latest complete suite: **362/362** authored checks; TypeScript, full lint and production build pass. The build precaches 35 assets / 9,286,408 bytes; existing large-chunk and Vinext route-classification notices remain. Final release results are recorded in [QA](docs/QA.md). Four bundled reports cover 223 checks; another 139 regressions run through npm test. None measure ecological or model accuracy. Automated tests double hooks/recorders/MapLibre/timers. A separate production-browser pass exercised rendering, primary flows and320/390/1440px layouts; measured colors/overflow defects were fixed. Device performance and physical permissions remain unmeasured. Optional `node scripts/test-live-ai.mjs --consent` makes synthetic requests against a separately running app; it is excluded from npm test and is not a benchmark. The latest requested server is running at http://localhost:5173/.

October3 local-time integration checks: actual text and image route handlers received HTTP200 from Gemini 3.5 Flash-Lite and passed shared validation. The initial access check used one synthetic note and a now-retired historical Scenic Reflection photo. The earlier authorized three-photo run retained 0/1/1 candidate findings and weather context for all three cities. Five subsequent public-photo requests returned valid responses, giving eight recorded analyses and ten unverified candidates; one people-visible frame was deliberately not transmitted. Recorded outputs are labeled and human review remains pending; no citizen records or approvals were created. These establish bounded access, not model accuracy, a field study or browser verification. Earlier 3.8 requests returned503, and October2 xAI received403; sanitized local logs retain these failures. Availability and quota may change. Successful xAI/Groq image output remains unverified.

This is a browser-local prototype, not a production service: no authenticated community/reviewer identities, shared database, signed history, physical digital twin, FHIR integration, held-out ecological evaluation or FAIR certification. Storage can be evicted; export backups. Production needs authentication, durable storage, access control, durable rate limits and expert validation. Per-isolate AI throttles are best-effort, not a billing cap.

Live AI requires explicit consent to the named provider(s); their processing terms apply. AI adapters send no coordinates, instrument details or video. Exported coordinates/photos may be sensitive; you control exports. Confirmed records survive refresh; clarification-in-progress restarts from the saved draft. Judge access and the recorded submission video remain separate delivery tasks.

## Attribution and continuity

MapLibre BSD-3-Clause; React Flow MIT (attribution retained); Lucide/idb ISC; Workbox/Recharts/React/Radix/shadcn/Zod MIT. Street maps credit OpenFreeMap, OpenMapTiles and OpenStreetMap; OSM data uses ODbL. NASA imagery credits GIBS/ESDIS/Terra MODIS. Historical annual landscape credits ESA WorldCover and modified Copernicus Sentinel data under CC BY 4.0. Satellite context never supplies water-quality grades or replaces field evidence. Open-Meteo modeled weather is CC BY 4.0. The generated hero and synthetic fixtures have been removed. Reference photos retain their own Creative Commons credits in public/images/references/CREDITS.md. See docs/DEPENDENCIES.md and docs/SOURCES.md.

A new AI should read AGENTS.md and PROJECT_CONTEXT.md, then inspect actual code/tests. These files preserve context; chat memory is not assumed.

See docs/SUBMISSION_KIT.md for a submission draft, rubric evidence and a four-minute recording script. Deployed judge access and the recorded video remain delivery tasks.

For the exact remaining inputs and user-owned checks, use [the completion checklist](docs/COMPLETION_CHECKLIST.md). Gemini access is configured and terminal-verified here. You still supply actual review decisions, team/credit facts, intended code licence, device results and video/submission links. Firsthand evidence is optional for the historical-photo demo and required only when presenting a new field visit.

