# AquaLens — project handoff

Updated 2026-09-30, Asia/Kolkata. App checkout: streamcheck/. Former name StreamCheck; storage keys and working lifecycle preserved.

## User intent and active constraints
Competitive OneAquaHealth Track 3 AI-Supported Assessment. Premium aquatic, interactive mobile interface; genuine evidence, no fabricated AI/live data/scientific claims. Preserve working parts, use existing maintained libraries, efficient tokens. Ask only for a required missing credential. User registered; friends may join later.
LATEST: user personally tests the website. Do not start/restart a server, visit/check the website, take screenshots or run browser QA unless requested again. Source/type/lint/domain/build checks were used for this delivery. No broad planning questions.
A new AI must receive this workspace and read AGENTS.md + this file; automatic chat memory is not assumed. docs/BUILD_PLAN.md is historical intent, code/results establish status. docs/SOURCES.md records external/user-supplied claims.

## Track and delivery context
User rubric: impact30/innovation20/implementation20/usability15/feasibility15. Official deadline extension checked Sept28: Oct4 2026 21:00 PDT = Oct5 09:30 IST; recheck before submission. New user-pasted Sept30 brief emphasizes responsible prompts, checks, explainability and human oversight for Track3; contains contradictory eligibility text, so no fresh eligibility/prize claim. Public source repo delivered Sept30; actual3–5min video and judge-access deployment remain delivery tasks. No promise of winning, organizer endorsement or scientific validation.

## Architecture and core behavior
Vinext/React/TypeScript/Zod, Cloudflare Worker routes. app/page.tsx -> components/streamcheck.tsx.
- Original notes/time/appearance -> limited English rules + optional Gemini text -> explicit clarification/uncertainty/dismissal -> citizen confirmation -> local reviewer/history -> portable receipt.
- Field Studio: native camera/photo/10s silent video/upload, IndexedDB original Blobs+SHA256, canvas brightness/detail/resolution heuristics, manual ghost guide, instrument metadata, browser dictation with explicit transcript adoption.
- Optional visual Gemini accepts consented resized JPEG, returns strict enum candidate appearances/region/qualitative uncalibrated confidence. No pollutant identity, instrument readings, pathogens, safety or ecological conclusions. Humans must judge every candidate before final review; new judgment reopens review and retains old decisions.
- Evidence completeness0–100 is a transparent prototype checklist, never scientific accuracy/water health. JSON/CSV/GeoJSON tested; media separately downloaded. FAIR-oriented metadata, no certification.
- Browser-local reports: localStorage streamcheck-workspace-v1. Media: IndexedDB aqualens-evidence. Draft: aqualens-draft-v1. Cross-tab refresh supported. Demo roles/history are unauthenticated/unsigned, not a durable team backend.
- Workbox production precache/navigation after controlled online visit. AI/weather/tiles need network. Modeled city weather remains separate from stream evidence.
No community consensus, statistical outlier model, forecasting, calibrated ecological model, physical twin, official OneAquaHealth API/FHIR integration or custom training.

## Sept30 observatory / geographic / Evidence Lab delivery
Existing workflow retained; no new dependency/API/model.
- components/river-observatory.tsx + lib/river-observatory.ts + app/river.css: default River stories, original illustrated SVG river, actual exact-site counts, selected record chronology, Story/Evidence/Method, retained media/provenance/unknowns, pause/reduced motion. Persistent schematic/not-geographic/no-water-health labels. Matching labels establish no shared waterway.
- components/geographic-evidence-map.tsx + lib/geographic.ts + app/geographic-map.css: optional real MapLibre/OpenFreeMap map, neutral world with no GPS, exact-coordinate marker groups, date-line-safe fit, coordinate source/accuracy/time dossier, accessible record index, unplotted valid polar/missing/invalid distinctions, retry/network/WebGL fallback. No guessed site markers. Static unmodified licensed worker adapter preserved.
- components/evidence-lab.tsx + lib/evidence-lab.ts + app/evidence-lab.css: saved-record inspection first, source-highlighted stored checks, AI/rule labels, media/readings and retained decisions; deterministic replay uses creation time when available without changing stored decisions. Separate editable synthetic practice never saves or calls AI. Engineering report is collapsible, labeled software checks.
- lib/evidence-trail.ts + updated workbench/app/evidence-trail.css: graph separates citizen/rules/AI/human/pending, retains visual disagreements and reading metadata, collision-free graph IDs, keyboard/list inspection and no stale detail from another record.
- lib/atlas.ts + app/atlas.css: safe exact-site filter including real site named all, synthetic exclusion including illustrative media, immutable chronology, distinct-photo pairing, actual coverage, JSON collection receipts/CSV/GeoJSON. Focus view hides supporting panels (not browser fullscreen). Timeline/missions/comparisons collapsible; removed retired Lab UI/state and42dead CSS rules.
- pH comparison requires one selected site, three distinct actual instants, one instrument and passing metadata; timezone-equivalent timestamps cannot inflate distinct observations. No environmental trend or significance inference.
- Reliability: draft epoch guards prevent late AI attaching to reset draft; form/GPS/voice reset by generation; camera pending/late-unmount cleanup; media identity/disposal guards; reviewer note clears between reports.

## Secrets and providers
Gemini already configured in ignored .dev.vars and prior private Sites secret. Never print/copy key, use it in client code, exports, screenshots or commits. A new key is not needed for this pass. Default/configured gemini-3.8-flash with low thinking; historical text success3/3 Sept29, high-demand failures preserved. Visual success remains unverified after503responses. Free tier is account/quota dependent and inputs may improve Google products; explicit consent retained.
OpenFreeMap/Open-Meteo keyless prototype usage and attribution in docs/SOURCES.md. Weather is modeled context, not stream sensors.

## Verification and limitations
Current86/86 authored domain assertions pass, adding map bounds/provenance, exact source spans, immutable replay, graph source/ID integrity, distinct timestamp/collection behavior. Existing19/19 actual route-contract tests passed earlier in this session using mocked Worker env/fetch; final map/lab pass changed no route and made no provider calls.
TypeScript/full ESLint0errors0warnings, six stylesheet parses and production build pass. Workbox18assets/5,836,055bytes. Existing>500kB chunk warning remains. Release check162source/84built files, configured-key matches0, required worker/license/PWA/assets present, test assets current. Not a comprehensive security/science/device audit.
Historical browser core flow/media/range warning/map/transparency/persistence verified before latest manual-only instruction. Basic River smoke: focus/sample toggle/site Evidence and390px no horizontal overflow; later new map/lab/graph not browser-tested. See docs/QA.md for precise separation.
User must check new UI, keyboard/mobile, camera/video/voice, ghost alignment, successful visual AI, native downloads, two-photo divider, PWA install/offline. Earlier receipt download-event wait timed out; completion unverified. No independent ecological benchmark, ecologist review, assistive-technology study or production security assessment.
The previously requested dev process was last started as PID13456; this pass did not start/restart/visit it. No current server-health claim. Logs/PID in ignored .sites-runtime.

## Repository / hosting
Origin: https://github.com/kammarohan55-crypto/ieee_hackathon.git, branch main. GitHub public visibility verified Sept30; user explicitly authorized this destination. Map/lab/observatory implementation commit14c5532 was pushed to origin/main after passing release checks. A documentation follow-up may advance main; inspect git status/log/remote for the exact HEAD. No Sites publication occurred.
On this Windows host use per-command trust only: git -c safe.directory='C:/Users/Rohan/OneDrive/Desktop/ieee hackathon/streamcheck' … . Do not change global Git trust. Secret/runtime/dependencies/build/outputs ignored. Local ZIP may be refreshed from git archive after commit.
Existing owner-private Sites project appgprj_6ab966e17e388191a45bd547269c9f45 in .openai/hosting.json, no live URL/deployment confirmed. Earlier automatic approval review rejected Sites source-export/publishing helper: destination not authorized. Do not bypass/retry without explicit Sites destination approval. GitHub authorization does not authorize Sites. No hosting change in this pass.

## Commands and exact next step
From streamcheck: npm install; npm test; npm run typecheck; npm run lint; npm run build; npm run verify:release. Windows npm fallback: node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js". Build wrapper scripts/build.mjs. npm run dev/npm start only when user requests; respect manual-only website checks.
docs/FEATURE_AUDIT.md classifies current features; README covers architecture/setup; docs/DEMO_GUIDE.md gives exact demo actions, manual checks and bug template; docs/SUBMISSION_KIT.md has truthful submission draft/rubric evidence.
Next: user manually walks new River Observatory/Geographic map/Evidence Lab, reports observed issues. Fix source with targeted checks; preserve original/unknowns and user testing preference. Submission still needs actual video, team credits, original-code license choice and verified judge-access deployment. Do not add unvalidated forecasting or duplicate dashboards.
