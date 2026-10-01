# Source and uncertainty register

## GitHub source delivery — checked 2026-09-30

User-authorized repository: https://github.com/kammarohan55-crypto/ieee_hackathon. The initial full-source commit `cd8a89a6c7abc70c95cd57bac2ad0d9548ad445c` was pushed to `main`; Git `ls-remote` returned the same SHA as local HEAD. GitHub's read-only API https://api.github.com/repos/kammarohan55-crypto/ieee_hackathon returned `private: false` and `default_branch: main`. This verifies source availability/visibility at that time, not app deployment, scientific validation or competition submission. Sept30 map/lab/observatory implementation commit14c5532 was subsequently pushed to the same main branch after source/build verification (86/86 authored domain checks); later documentation commits may advance main. No app deployment is implied.

Checked: 2026-09-28. Prefer direct organizer statements to stale search snippets. Recheck time-sensitive facts before submission.

## S1 — Organizer deadline extension (verified)
https://oneaquahealth-ieee-hackathon.devpost.com/updates/46660-deadline-extended-to-october-4-keep-innovating-keep-submitting

Directly opened. Announces October 4 at 9 PM; the page header specifies 2026 and PDT. Explicitly allows continued registration, individuals or teams, and solutions spanning multiple tracks. Converted deadline: October 5 at 09:30 Asia/Kolkata (PDT UTC−7 to IST UTC+5:30).

This resolves the older deadline and registration cutoff for planning. The user confirms they are registered and will invite friends later; no account was inspected. An overview search result also displayed “students only”; the extension does not explicitly settle that category. Do not assume all possible eligibility restrictions have been removed.

## S2 — Official rules (verified, internally stale dates)
https://oneaquahealth-ieee-hackathon.devpost.com/rules

Directly opened. Rubric and requirements agree with the user's pasted rules. Header shows October 4; body still shows September 30 and an August 31 registration cutoff. S1 is the explicit later clarification. Prize details also differ between overview and rules; prize amounts are not a planning assumption.

## S3 — User-supplied challenge (provided evidence)
Original attachment: `C:/Users/Rohan/.codex/attachments/89d6e010-400e-43a1-8c03-21828ea1af67/Pasted text.txt`.
Workspace copy: `docs/USER_CHALLENGE.txt`.

Contains all seven tracks, the Track 3 observation consistency challenge, and deliverables including a 3–5 minute video. The user's chat separately supplies the weighted rubric and rules. These are user-provided materials, not a recording of the present website state.

## S4 — Official learning-session index (located)
https://www.oneaquahealth.eu/project-events/

Page opened; no recordings watched or transcripts reviewed. Do not claim knowledge of sandbox endpoints, available datasets, or session-specific requirements from it.

## S5 — App technical deliverable (located, not a current integration contract)
https://www.oneaquahealth.eu/wp-content/uploads/2025/01/D5.3-Digital-app-and-backoffice.pdf

Opened the public 50-page document and inspected its identifying metadata. It describes an earlier app/backoffice deliverable from 2024. Its detailed observation schema was not reviewed. Do not treat it as proof of current API access, compatibility, or a data license.

## Open evidence needs
- Current observation vocabulary and its source; separate prototype checks from scientifically validated guidance.
- Any real observation dataset: permission, license, fields, dates, coverage, and anonymization needs.
- AI provider access, permitted budget, measured runtime behavior, and documented failure modes.
- Integration endpoints and FHIR profiles only if that optional work is selected.
- Independent domain evaluation and field-user feedback remain missing. Authored software tests and historical provider smoke results exist; they do not establish ecological accuracy.

## S6 — EPA visual assessment guidance (verified, archived)
https://archive.epa.gov/water/archive/web/html/vms32.html

Checked and directly opened 2026-09-28. Advises precise stream-location descriptions, recording observed conditions, identifiable photographs, and coordinator review. The page was last updated in 2012. Used only to inform observation context; not current local requirements, an official OneAquaHealth schema, or scientific validation of StreamCheck.

## S7 — EPA Stream Habitat Walk (verified, archived)
https://archive.epa.gov/water/archive/web/html/vms41.html

Checked and directly opened 2026-09-28. Lists visual appearance, vegetation, wildlife, and other stream observations. Notes some foam and sheens can have natural origins; explicitly permits unanswered fields when volunteers cannot determine an answer. The method itself notes limited scientific rigor. StreamCheck borrows vocabulary and uncertainty principles, not diagnostic suggestions or numerical thresholds.

## S8 — USGS Water Color (verified educational source)
https://www.usgs.gov/water-science-school/science/water-color

Checked and directly opened 2026-09-28. Describes dissolved and suspended sources of visible water color. Supports keeping an observed color separate from its unverified cause; it cannot establish the cause or safety of a particular observation. See `docs/ASSESSMENT_RESEARCH.md` for prototype wording and explicit engineering decisions.

## S9 — Gemini Developer API pricing (verified, time-sensitive)
https://ai.google.dev/gemini-api/docs/pricing

Checked and directly opened 2026-09-28. Standard API pricing lists free input/output for `gemini-2.5-flash`, `gemini-2.5-flash-lite`, and current `gemini-3.8-flash`. This is API free-tier pricing, not merely free AI Studio use. Free-tier content is marked as used to improve Google's products. Project/region availability, actual quota, credentials, and successful requests remain unverified; do not promise unlimited or permanently free service. No fixed request quota is assumed.

## S10 — Gemini structured outputs (verified)
https://ai.google.dev/gemini-api/docs/structured-output

Checked and directly opened 2026-09-28. Current guide examples use the Interactions endpoint and `response_format: {type: "text", mime_type: "application/json", schema: ...}`. This differs from `generateContent` fields in S11: do not mix the two request formats. JSON Schema support is a subset. Validate returned values and evidence references in the app; syntactic JSON conformance does not establish truth. No authenticated model call was made during this research.

## S11 — Gemini generateContent REST contract (verified documentation)
https://ai.google.dev/api/generate-content

Checked and directly opened 2026-09-28. Endpoint: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`. For a single text request use `contents: [{role: "user", parts: [{text: "..."}]}]`; optional `systemInstruction: {parts: [{text: "..."}]}`. Current recommended JSON output configuration is `generationConfig: {responseFormat: {text: {mimeType: "APPLICATION_JSON", schema: <JSON Schema>}}, maxOutputTokens: <integer>}`. Reference marks `responseSchema` and `_responseJsonSchema` deprecated in favor of `responseFormat`; old examples coexist on the page. API-key authentication can use the `x-goog-api-key` header (shown in S10). Keep the key server-side. Inspect response candidates/content/parts and failure/finish state before parsing; do not assume a successful response contains usable JSON. Documentation was checked, but the chosen model/configuration pair still needs a real authenticated test.

## S12 — Open-Meteo current-weather context (verified docs and unauthenticated endpoint)
https://open-meteo.com/en/docs

Checked and directly opened 2026-09-28. `GET https://api.open-meteo.com/v1/forecast` accepts required WGS84 `latitude`/`longitude` and a comma-separated `current` field list. Example: `?latitude=52.52&longitude=13.41&current=temperature_2m,precipitation,weather_code,wind_speed_10m&timezone=UTC`. API key is only required for commercial reserved API resources. Documentation says current conditions use 15-minutely weather-model data, assembled from national-service forecasts. Label them **current weather model context**, not live sensor measurements or water measurements.

The example request succeeded without a key during research. Actual response had `current.time`, `current.interval` (900 seconds), requested variables, `current_units`, `timezone`, `utc_offset_seconds`, and returned grid coordinates. Preserve source/time/units in the app and exports, handle missing/stale values, and keep weather separate from citizen evidence. This endpoint does not establish causes, water safety, or ecological status. Docs were the sole Open-Meteo page reviewed within the research budget; exact request limits, license/attribution terms, and commercial rights still need checking before public deployment. A visible Open-Meteo source link is recommended regardless.

## S13 — Field extensions: official engineering references (checked 2026-09-28/29)
- https://openfreemap.org/quick_start/ — MapLibre integration and attributed keyless basemap; does not supply monitoring observations.
- https://github.com/maplibre/maplibre-gl-js/blob/main/LICENSE.txt — BSD-3-Clause. Installed6.11.2 worker copied unmodified with license.
- https://xyflow.com/open-source — React Flow MIT; visible attribution retained.
- https://github.com/jakearchibald/idb — ISC IndexedDB helper.
- https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder — browser capture capability, device/permission dependent.
- https://developer.chrome.com/docs/workbox/modules/workbox-build — production precache/runtime navigation configuration; no claim of universal offline compatibility.
- https://ai.google.dev/gemini-api/docs/image-understanding — JPEG inline-data visual inputs; actual model outputs still require schema and human review.
- https://ai.google.dev/gemini-api/docs/generate-content/thinking — Gemini3.8 low thinking level supported; minimal unsupported.
- https://ai.google.dev/gemini-api/docs/pricing — Gemini3.8 Flash and3.5 Flash-Lite Standard free tier listed. Account quota/billing not verified. Free-tier inputs may improve products.
- https://open-meteo.com/en/terms and https://open-meteo.com/en/pricing — noncommercial prototype/evaluation limits and CC-BY4.0 attribution; model context only.

New image heuristics, completeness weights, measurement input bounds and mission rules are authored prototype engineering choices. They are not thresholds validated by these sources. No scientific inference should be attributed to them.

## S14 — Observatory, map and lab reuse (checked 2026-09-30)
- https://www.radix-ui.com/primitives/docs/components/tabs — existing MIT Radix tabs for accessible view selection. This does not certify the complete app's accessibility.
- https://www.radix-ui.com/primitives/docs/components/slider — existing slider for manual comparison controls; no automatic image registration.
- https://reactflow.dev/api-reference/react-flow — selection/focus controls and provenance visualization. Connections are project-authored record relationships, not scientific causation.
- https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/ and https://maplibre.org/maplibre-gl-js/docs/API/classes/Marker/ — existing MapLibre map/markers, fit/cleanup behavior. Static licensed worker preserved; no new monitoring data/API access.
- https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/viewBox — original SVG schematic rendering. Decorative river geometry has no geographic or physical interpretation.

No packages or scientific model were added for this pass. Exact-coordinate groups, date-line extents, completeness coverage and deterministic rule replay are authored engineering logic. Local replay uses recorded creation time when available and explicitly discloses fallback; it does not reproduce an earlier model run.

## S15 — User-supplied hackathon brief (received 2026-09-30)
Source: pasted attachment `c6c75095-c6b2-47ce-8d36-ab683caa2bab/Pasted text.txt`, supplied by the user; not a fresh verification of the public rules. It describes Track 3 as responsible AI prompts, validation, explainability and human oversight, and requests a public repository, working demo and 3–5 minute video. Used to focus presentation on assessment reliability. It contains conflicting individual/team eligibility statements; no new eligibility conclusion, prize promise or organizer endorsement is inferred. Existing verified deadline source remains S1 and must be rechecked before submission.


## S18 — Real-evidence workflow pass (checked 2026-09-30)

- Reopened https://open-meteo.com/en/docs and confirmed coordinate-based current-model request parameters. The app now requires observation coordinates, validates returned units, retains model time and grid position, and keeps cache entries separate by coordinate. Current weather is not the weather at an older observation time; no causal/stream-health inference is made. API behavior was tested with mocks; no live weather call was made in this session.
- Reopened https://archive.epa.gov/water/archive/web/html/vms32.html for the field-guide background. It supports recording location/context and identifiable photos for later review. The three-photo kit is this project's own UX choice, not an official protocol or validated ecological score.
- Reopened https://oneaquahealth-ieee-hackathon.devpost.com/ alongside the supplied challenge brief. The current work targets Track 3: responsible assistance, traceable checks and human judgment. No session recording was watched and no official data API integration is claimed.
- User-provided brief read from `upload/Pasted text.txt` in this session. No older unrelated hackathon deadlines/tracks were used.
- No external field photographs were copied. Generated hero imagery was removed, and synthetic software fixtures remain confined to tests and explicitly labeled historical test results.


## S19 — Bundled historical Mutha River photographs (checked 2026-10-01)

Opened the three Wikimedia Commons file pages, inspected source metadata, downloaded the public 1280px thumbnails and visually inspected the local files:

- https://commons.wikimedia.org/wiki/File:Mutha_River,_Pune.jpg — Ak2431989, CC BY 3.0, source date 2010-08-03. Original 1600×1200; bundled thumbnail 1280×960.
- https://commons.wikimedia.org/wiki/File:Scenic_Reflection.jpg — Sharvarism, CC BY-SA 4.0, source date 2023-06-06. Original 5400×3600; bundled thumbnail 1280×853.
- https://commons.wikimedia.org/wiki/File:Sambhaji_Bridge_as_seen_through_the_trees_on_the_banks_of_Mutha_River_in_Pune.jpg — DesiBoy101, CC BY-SA 4.0, source date 2023-06-12. Original 4000×3000; bundled thumbnail 1280×960.

Full source titles, licence links and reuse notes travel in `public/images/references/CREDITS.md`; the exact bytes are checked against `lib/references.ts` SHA-256 digests. Dates are source supplied with day precision in the app. Exact time zone, camera clock and authenticity are not independently verified. Source metadata names editing software on the latter two files; no camera-original claim is made. Photos are historical references, never seeded citizen records, current conditions, instrument data, field GPS or recorded AI output. New reviews retain user-written words and explicit confirmation. No ecological comparison is inferred from these different dates/viewpoints.
