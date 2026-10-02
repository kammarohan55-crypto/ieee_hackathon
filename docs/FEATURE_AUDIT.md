# AquaLens feature audit — 2026-10-02

Source and command results establish the status below. Working means implemented and supported by relevant authored software tests or earlier documented workflow checks. Partial means provider/device/rendering evidence is still missing. Missing means deliberately unimplemented. Broken describes a currently observed failed access path. None establishes ecological accuracy, production certification or a competition outcome.

Primary submission decision: **Track 1 — Citizen Science UX**, with supporting capabilities for Tracks 3/2/4. This reflects demonstrable guided workflows, not known winning odds; the challenge asks for one primary track. Existing Track 3 assessment remains intact.

| Planned feature | Status | Verified implementation / remaining boundary |
|---|---|---|
| Mission control and professional photo/map views | Partial | Source gallery, real queues, filters, focus/compare/flow present; current rendering/mobile QA assigned to user |
| Live camera, photo/video capture and uploads | Partial | Original media retained; recorder lifecycle/frame race mocked regressions pass; physical device permissions/codecs untested |
| Local image-quality checks | Working | Canvas exposure/detail heuristics with method labels; not calibrated scientific image quality |
| xAI/Groq text and visual adapters | Partial | Strict output schema/quotes, deadlines, consent binding, explicit fallback and provenance tested; successful new-provider output unverified |
| Supplied xAI live account access | Broken | October2 synthetic text and model-list returned HTTP403 with billing/credits-related rejection; local rule fallback works |
| Measurement validation | Working | Units/plausibility/instrument/calibration metadata checked; original values retained, no readings inferred |
| Contradiction detection and adaptive questions | Working | English rules plus enumerated fixed visual/text follow-ups; optional AI remains provider-dependent |
| Observation Quality rubric | Working | Transparent evidence completeness; never an ecological/water-safety grade |
| Citizen confirmation and local reviewer | Working | Explicit decisions/history/schema; demo roles have no authenticated identity |
| AI/human disagreement handling | Working | Preserved candidate and reasoned human disposition required; confirmation is approval, not scientific truth |
| Decision Receipt and evidence graph | Partial | Serialization/history/source/provider/model preserved; current graph interaction/rendering user QA |
| Photo zoom/grid/pins | Partial | Native dimensions/padding guards and immutable human notes tested; actual touch/keyboard/rendering QA remains |
| Timeline/event replay | Partial | Retained events only with method/provider provenance; visual walkthrough remains |
| Before/after comparison | Partial | Explicit A/B actions and real retained/source frames; user rendering QA, no automatic change diagnosis |
| Geographic map | Partial | Supplied coordinates only, zero seeded markers, recenter/refit and selected-marker lifecycle tests; WebGL/network user QA |
| Dated NASA regional imagery | Partial | Anonymous capability/sample tile access verified; date/style/marker/fallback contracts tested; 250–500 m source limits, no per-scene guarantee; rendering untested |
| Historical Sentinel-2 landscape | Partial | Anonymous 2021 annual RGB median tiles verified; 10 m source bands, zoom 6–14, latitude −60° to 83°, explicit attribution/limits; browser coverage unverified |
| Official research area context | Working source links | Five sourced city/country links; no copied registry coordinates/photos/monitoring results |
| River schematic / physical twin | Partial / Missing | Existing schematic moved to Field kit's Additional evidence views; no physical/calibrated hydrology twin |
| Repeat-photo ghost overlay | Partial | Manual opacity/framing guide implemented; no automatic image registration/change measurement |
| Voice-to-structured note | Partial | Browser transcription and explicit adoption; support/privacy/phone behavior user QA |
| Provenance labels / AI Transparency Mode | Working | Original words/bytes, rules, provider/model, human decisions and unknown legacy provider distinguishable |
| Community consensus | Missing | No shared accounts or multi-user votes; local counts are real records, not consensus |
| Trend/outlier detection | Conditional / Missing | pH comparison needs compatible same-site instrument/metadata/distinct instants; no statistical outlier model or forecasting |
| Evidence Actions | Working limited | Actual nonsynthetic records, inspectable review/gap priorities and optional fresh visits; no risk ranking or mandatory GPS/instruments |
| Explicit linked-visit trail | Working limited | Actual parent/child IDs, missing-parent disclosure and fresh drafts; no same-location inference |
| Four-stage presentation / Markdown brief | Partial | Read-only original/checks/human judgment/receipt, actual reasons and gaps; text/JSON contracts tested, modal/download QA remains |
| Offline/PWA | Partial | Production manifest/Workbox caching implemented; final build tracked in QA; installed/offline device checks remain; remote/uncached context needs network |
| JSON/CSV/GeoJSON export | Working serializers | Verified formats/formula escaping/unknown coordinates; real browser downloads user QA |
| Portable original-media field packs | Partial | Hashes, attribution, limits/merge/recovery/native lock regressions pass; IndexedDB quota/multi-tab/device QA remains |
| FAIR metadata | Working limited | FAIR-oriented documented provenance and own schema; no FAIR certification or verified official API/FHIR adapter |
| Evidence Lab Decision brief | Partial | Four actual provenance stages, latest reason, missing/inconsistent history and uncertainty checks; current rendering QA remains |
| Lab replay / optional diagnostics | Working logic | Nonmutating rules; explicit schema-validated non-live software report with retry/close cancellation, never model/environment scores |
| Single-scene Sentinel analysis, NDWI, ERA5 | Missing | Research ideas only; annual RGB context does not implement them |
| Responsive/accessibility polish | Partial | Scoped styles, semantic labels/focus, Radix controls; device/assistive-technology checks unperformed |
| Public repository / judge delivery | Partial | Existing authorized repository; final publication tracked in PROJECT_CONTEXT; final accessible demo/video/submission unverified |

Reused installed MapLibre (BSD-3-Clause), React Flow/Radix/Recharts/Workbox (MIT), Lucide/idb (ISC), Zod and existing stores/components. No package, model training, copied Google imagery or unauthorized official dataset added. See DEPENDENCIES.md and SOURCES.md. Primary navigation is Mission control, Field notebook, Review desk, Evidence Lab, Insights and Field kit; advanced schematic and diagnostics remain behind explicit controls.

Latest complete suite: **324/324** authored checks (94 domain, 42 workspace, 34 mission, 40 mocked API, 15 capture/photo, 14 Lab, 21 map, 15 presentation/visit, 20 Decision brief, 29 evidence actions). TypeScript, full lint and production build pass; release details are in QA.md. Four bundled reports cover 210 checks; another 114 run through npm test. Mock hooks/recorders/MapLibre/timers and source colors do not establish browser outcomes or model accuracy. The user owns website/device QA; app stays stopped. See REAL_DATA_READINESS.md, DEMO_GUIDE.md and PROJECT_CONTEXT.md for remaining actions.
