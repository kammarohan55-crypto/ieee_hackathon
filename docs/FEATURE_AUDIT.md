# AquaLens feature audit

Inspected 2026-09-28 before extending the existing StreamCheck checkout. Status is implementation evidence, not a scientific or production certification. Existing component library, domain engine, routes, fixtures, build scripts, configuration and documentation inspected; generated/dependency directories excluded.

| Planned feature | Starting status | Evidence / required completion |
|---|---|---|
| Citizen form, explicit confirmation | Working | components/streamcheck.tsx; domain tests |
| Original evidence, clarification, uncertainty | Working | lib/assessment.ts; immutable snapshots |
| Text contradiction detection | Partial | English heuristics and optional Gemini; limited coverage |
| Gemini text integration | Partial | Real success observed; provider 503/timeouts in 2 of 3 smoke cases |
| Reviewer workflow and local history | Working | Review notes and status; no authentication |
| JSON evidence export | Working | Schema round-trip tests |
| Live sourced weather | Working | Open-Meteo route, unrelated to water quality |
| Responsive cinematic shell | Partial | Artwork/motion present; mobile overflow correction needs verification |
| Live camera, photo/video capture | Missing | No media capture component |
| Image quality checks | Missing | No image processing |
| Visual AI observations | Missing | Current Gemini adapter sends text only |
| Measurement validation | Missing | No units/instrument/calibration fields |
| Adaptive visual follow-up | Missing | Existing text workflow is reusable |
| Transparent Observation Quality score | Missing | Must describe completeness, never ecological health |
| AI/human disagreement | Partial | Issue dismissal exists; no visual disposition/reason |
| Decision Receipt | Partial | Export/history exists; needs complete evidence and metadata |
| Stream map / digital twin | Missing | No coordinates/map; no physical simulation data |
| Timeline / before-after / graph | Partial | Text audit trail only |
| Repeat-photo ghost overlay | Missing | Requires retained media |
| Voice-to-structured observation | Missing | Browser speech availability varies |
| Provenance / AI Transparency Mode | Partial | Rules vs AI labeled; visual method/limits missing |
| Community consensus | Missing | No authenticated community backend; do not fake votes |
| Outlier / trend detection | Missing | Only meaningful with comparable instrument observations |
| Smart sampling missions | Missing | Can derive tasks from missing evidence locally |
| Offline / PWA | Partial | Records local; app shell not cached |
| CSV / GeoJSON export | Missing | Coordinates absent |
| FAIR metadata | Missing | No persistent identifier or repository registration |
| Accessible reviewer dashboard | Partial | Radix controls and labels; new features need QA |
| Documentation / context handoff | Partial | Existing context and README stale |

## Reuse choices before implementation

- Keep the existing Vinext/React app, shadcn/Radix controls, Zod schemas, report store and tested assessment engine.
- MapLibre GL JS (BSD-3-Clause) with attributed OpenFreeMap/OpenStreetMap basemap: real pan/zoom and explicitly entered coordinates. No invented monitoring stations or physical digital-twin claims.
- React Flow (MIT): interactive evidence graph, retaining its attribution.
- idb (ISC): browser IndexedDB Blob persistence. Native MediaDevices/MediaRecorder and canvas cover capture and basic exposure/detail heuristics; a large OpenCV/ONNX model adds no validated capability for this scope.
- Existing Recharts (MIT) for comparable measurement series; CSS for restrained transitions and reduced-motion support.
- Browser SpeechRecognition only when available, with permission/remote-service disclosure; transcript requires user adoption.
- Gemini server-side secret already configured. No additional API key needed for these integrations. Live availability remains quota/provider dependent.

Scope boundary: local demonstration roles, not multi-user auth; no environmental diagnoses, calibrated AI confidence, community vote fabrication, physical stream simulation, or claimed FAIR certification.

## After implementation — 2026-09-29

| Feature | Current status |
|---|---|
| Existing citizen text/confirmation/review | Working; preserved and browser-tested |
| Camera/photo/video/ghost overlay | Partial: implemented; local media/image checks and reference upload verified, physical capture/overlay alignment need device verification |
| Visual AI | Partial: real server integration, consent, schema and failure handling implemented; provider high-demand failures prevent live success verification |
| Instrument validation/adaptive questions | Working: original pH 19 retained/flagged in browser; domain tests passed |
| Completeness score | Working: transparent rubric and limits |
| Disagreement and Decision Receipt | Partial: mandatory judgment, immutable revisions and review reopening pass domain tests; successful live-candidate UI/download completion need device verification |
| Map and timeline | Working: real attributed basemap, supplied-coordinate points, filters and timeline |
| Digital twin | Missing physical simulation, explicitly excluded pending validated hydrological data |
| Comparison/evidence graph | Graph working; two-retained-photo slider implemented, full device verification pending |
| Voice | Partial: browser transcript/adoption UI; successful speech depends on browser permissions/provider |
| Provenance/transparency | Working |
| Community consensus | Missing; deliberately no fake votes, local demo judgments only |
| Trends/outliers | Partial: conservative comparable pH chart implemented; no statistical outlier model |
| Sampling missions | Working rule-based prompts derived from missing evidence; follow-ups retain source linkage and synthetic status without copying old measurements |
| Offline/PWA | Partial: local reports/drafts and generated Workbox assets; cross-browser install/offline navigation pending |
| JSON/CSV/GeoJSON/FAIR metadata | Serialization working/tests pass; metadata FAIR-oriented, not certified |
| Responsive/accessibility | Mobile/desktop widths verified, Radix controls/focus/reduced motion; no assistive-technology user study |
| Documentation/context | Working: README, dependency register, QA ledger, feature audit, submission draft/demo script and handoff provided |

Known prototype limits are visible, not silently represented as completed production features. Refer to app docs/QA.md for exact verification scope.
