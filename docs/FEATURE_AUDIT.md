# AquaLens feature audit — 2026-10-01

Status comes from source, command results and historical QA. **Working** means implemented behavior has relevant domain/contract or earlier workflow evidence. **Partial** means implemented code has a material provider/device/new-UI check remaining. **Missing** means deliberately unimplemented. No current broken feature is established by code checks; the user may still find browser problems. These are not scientific or production certifications.

| Feature | Status | Evidence / remaining boundary |
|---|---|---|
| Dark mission control | Partial | Real source gallery, queue, focus and photo/map views implemented; source/build verified, browser walkthrough pending |
| Photo zoom/grid and human note pins | Partial | Immutable note schema, review reopening, media linkage and pack round trips tested; pointer placement and rendering unverified |
| Wipe comparison / event replay / flow | Partial | Distinct sources and stored events only; interaction and narrow-screen walkthrough pending |
| Insights and evidence matrix | Partial | Counts/scopes/UTC dates/denominators tested; software validation loads authored reports, no invented environmental series |
| Historical reference photo review | Partial | Three licensed images, source dates/credits retained in receipts/graph/packs; digest and attribution tests pass; browser walkthrough pending |
| Empty real-data workspace | Working | No seeding/sample loaders; legacy synthetic records filtered with a recovery copy; synthetic imports rejected |
| Field kit and One Health notes | Partial | Three-photo guide, optional context, unknown-preserving schema/export; browser check pending |
| Portable field packs | Partial | 28 integrity/merge checks; original bytes, digest validation, duplicates/conflicts and missing media; IndexedDB/device walkthrough pending |
| Search and location-specific weather | Partial | Site/note/ID search; 21 API contracts include required coordinates and per-site cache; browser/live weather check pending |
| Citizen form, originals, confirmation | Working | Existing lifecycle preserved; historical browser flow and domain checks |
| Contradiction / unsupported-conclusion checks | Working, limited | English rules plus optional strict text AI; no guaranteed detection |
| Adaptive clarification and uncertainty | Working | Explicit decisions preserve original; unknowns stay unknown |
| Gemini text | Partial | Historical real 3/3 smoke completion; provider errors remain possible |
| Camera / photo / 10s silent video | Partial | Native capture; duplicate startup/unmount cleanup improved; physical checks pending |
| Local media, digest, quality heuristics | Working, limited | IndexedDB originals; brightness/detail heuristics; missing-media fallback cannot substitute an earlier image |
| Visual AI | Partial | Consent/server adapter/candidate schema/failure handling; live success remains unverified |
| Instrument validation / field follow-ups | Working | Values retained; unit/metadata/plausibility checks; no readings inferred from images |
| Evidence completeness | Working | Every rubric point exposed; not accuracy, ecological health or confidence |
| Reviewer and disagreements | Working, local | Mandatory candidate judgment, immutable history, reopened review; unauthenticated demo roles |
| Decision Receipt | Partial | Tested serialization/provenance; browser download completion pending |
| River stories / observatory | Partial | Exact site labels, Story/Evidence/Method and chronology; earlier basic smoke, latest presentation changes await user QA |
| Geographic evidence map | Partial | Exact coordinates/groups, date-line bounds, dossier and accessible fallback; redesigned UI awaits user QA |
| Evidence Lab | Partial | Saved-record inspector, source spans, non-mutating replay, no synthetic practice; helper tests pass, UI awaits user QA |
| Evidence graph | Partial | Citizen/rules/AI/human/pending nodes and readable list; helper tests pass, new interactions await user QA |
| Timeline / photo comparison | Partial | Chronology/distinct-photo selection tested; actual two-photo slider pending |
| Repeat-photo ghost guide | Partial | Reference/opacity controls; physical alignment manual and unverified |
| Voice adoption | Partial | Transcript with explicit adoption; device/provider dependent |
| Provenance / AI Transparency Mode | Working | Rules/AI/citizen/reviewer and synthetic sources distinguished |
| Community consensus | Missing | Requires independent authenticated observers; no fake votes |
| pH temporal comparison | Working, conditional | One site/instrument, checked metadata, three distinct instants; invalid/synthetic data excluded; no ecological trend claim |
| Statistical outliers / forecasting | Missing | No validated dataset/model; outside scope |
| Sampling missions | Working | Missing-evidence follow-up; source link retained, old readings/media/GPS not reused |
| Offline / PWA | Partial | Workbox assets and local drafts; installation/offline device checks pending |
| JSON / CSV / GeoJSON | Working serialization | Schemas, CSV formula escaping, omission of unknown coordinates; downloads await user QA |
| FAIR-oriented metadata | Working, limited | Provenance/access/license fields; no certification or registered persistent identifiers |
| Responsive / accessible controls | Partial | Radix, visible focus, touch-target and reduced-motion styles; current console/mobile/assistive checks pending |
| Public source / documentation | Working | Authorized GitHub repo, README, sources, QA, demo guide and handoff |
| Physical twin / official OAH or FHIR integration | Missing | No verified hydrology/calibration/integration contract; not claimed |

## Reuse decisions

Existing Vinext/React app, Zod schemas, local stores and lifecycle retained. Installed MapLibre (BSD-3-Clause), React Flow/Radix/Recharts (MIT), Lucide/idb (ISC) and Workbox (MIT) cover maps, graphs, controls, storage and caching. No packages or models added in this pass. River artwork is original SVG/CSS, visibly schematic. Licenses/credits remain in DEPENDENCIES.md and SOURCES.md.

## Latest verification boundary

86/86 authored domain assertions, 28/28 workspace integrity checks, 29/29 visual-workspace checks and 21/21 mocked API-route contracts, TypeScript, full ESLint, ten stylesheet parses and production build pass. These establish software behavior, not ecological accuracy. Latest user instruction assigns website checks to the user: no new browser/server/provider check for the new console or redesigned map/lab. See QA.md and DEMO_GUIDE.md.

## September 30 real-data pass

Removed generated hero PNG, fixture seeding, sample-form loaders, illustrative evidence upload, synthetic-practice lab and sample-inclusion switch. Preserved authored software tests separately. Fixed clean-install lockfile omissions; npm ci validation passes. No new dependencies. Weather now requires explicitly supplied coordinates and an explicit user action. Fresh clone has no API credential. Original media and review history remain browser-local; imports do not authenticate a contributor.
