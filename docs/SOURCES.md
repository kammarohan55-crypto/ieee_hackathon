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

## S20 — Official submission recheck (checked 2026-10-02)

Directly reopened the organizer's three public Devpost pages:

- https://oneaquahealth-ieee-hackathon.devpost.com/updates/46660-deadline-extended-to-october-4-keep-innovating-keep-submitting — extension still states October 4, 2026 at 9 PM; header specifies PDT. Converted deadline is October 5 at 09:30 Asia/Kolkata. The update explicitly permits continued registration and individual/team participation. No extension beyond October 4 was found or inferred.
- https://oneaquahealth-ieee-hackathon.devpost.com/rules — header agrees with October 4; body still lists September 16–30 and August 31 registration cutoff. It requires original work during the hackathon period and a public documented source repository. The newer extension explicitly allows continued refinement/submission; eligibility for a particular entrant is not established by this check.
- https://oneaquahealth-ieee-hackathon.devpost.com/ — Track 3 remains responsible AI assistance with validation/explainability/human oversight. Deliverables are track alignment, problem/solution/users/impact description, 3–5 minute video, public source/docs and prototype/mockup/proof of concept. Overview badges still say students only/team required, conflicting with rules/update individual participation wording. Do not treat registration, team membership or entrant eligibility as verified.

This is a fresh public-page check, not an account inspection, submission confirmation or organizer contact. No session recording was reviewed. Project collection quantities, reviewer evaluation suggestions and readiness gates in REAL_DATA_READINESS.md are recommendations, not verified organizer mandates.

## S21 — Import isolation and persistence APIs (checked 2026-10-02)

- https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request — native exclusive locks coordinate tabs/workers on the same origin, remain held until an asynchronous callback finishes and can bound acquisition with an abort signal. Secure-context/platform support applies. The project checks for an available manager; without one it keeps unreferenced bytes rather than attempting unsafe cross-tab deletion. These are cooperative locks for current-version imports, not protection against old clients or arbitrary storage writers.
- https://github.com/jakearchibald/idb#transaction-lifetime — inspected the maintained wrapper's transaction lifetime guidance, plus the installed idb README/ISC licence. IndexedDB transactions cover their store writes; they do not include localStorage. Import therefore uses atomic media additions and best-effort compensation after a failed report commit; cleanup failure keeps a retryable backup/error state.

Source inspection and mocked regression tests do not establish device storage behavior or durable multi-user synchronization.

## S22 — xAI/Groq adapters and access limits (checked 2026-10-02)

- https://docs.x.ai/developers/models/grok-4.20-0309-non-reasoning and https://docs.x.ai/developers/model-capabilities/text/structured-outputs — documented text/image model and strict JSON-schema support. Account access/billing still applies; xAI is not promised free.
- https://docs.x.ai/developers/model-capabilities/legacy/chat-completions and https://docs.x.ai/developers/rest-api-reference/inference/chat-completions.md — supported Bearer-authenticated Chat Completions endpoint, JPEG data-URL content, JSON response format and bounded output. Responses is recommended for new integrations; this prototype adapts the documented shared Chat Completions contract to avoid another SDK/dependency.
- https://console.groq.com/docs/vision, https://console.groq.com/docs/model/qwen/qwen3.8-27b, https://console.groq.com/docs/structured-outputs and https://console.groq.com/docs/api-reference — current Groq text/image + strict JSON model is qwen/qwen3.8-27b, marked Preview. Preview availability may change; model names are configurable.
- https://console.groq.com/docs/rate-limits — a Free Plan exists, with model/org request/token limits and HTTP429 responses. Account-specific access/limits are not established; no unlimited-free promise or key rotation workaround.

Implementation decisions: default xAI, optional explicitly configured distinct Groq/xAI fallback, fixed official endpoints, server-only credentials, bounded total deadlines, strict local response/quote validation, actual provider/model retention, and consent bound to the public provider/model scope. Configuration is not availability. Legacy Gemini helpers/reports remain historical; live routes no longer send to Gemini. October2 terminal smoke on synthetic text: model-list and completion both HTTP403; error categorized as billing/credits-related without retaining/exposing its raw message. Local rules fallback worked; no successful live xAI text/image output or Groq credential verified. An ignored sanitized local smoke log records the result. No ecological accuracy inferred.

## S23 — Real dated regional satellite context (checked 2026-10-02)

- https://nasa-gibs.github.io/gibs-api-docs/access-basics/ and https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml — public dated EPSG3857 WMTS; exact checked Terra/MODIS true-color layer MODIS_Terra_CorrectedReflectance_TrueColor uses GoogleMapsCompatible_Level9,256px JPEG, zoom0–9, row-before-column. One September30 tile returned HTTP200 image/jpeg with CORS access; scene coverage/cloud clarity for user sites is unverified.
- https://nasa-gibs.github.io/gibs-api-docs/ and https://www.earthdata.nasa.gov/engage/open-data-services-software/data-use-policy — source acknowledgment and NASA-led unrestricted-data CC0 policy; respect separately restricted third-party material. Attribution credits GIBS/ESDIS/Terra MODIS without endorsement. No Google images/token, registry data or logo copied.
- https://maplibre.org/maplibre-gl-js/docs/examples/add-a-raster-tile-source/ — reused the installed BSD-3-Clause MapLibre and official raster-source pattern rather than adding a custom renderer.

This is browse context: MODIS bands250–500m and a zoom9 grid about306m/pixel at the equator. Grid sampling is not native sensor resolution or stream-scale scientific validity. Explicit daily requests do not establish each pixel's exact acquisition time; clouds/gaps/processing can hide streams. No NDVI, water index, environmental grade, contaminant/pathogen/safety inference or retained satellite citizen evidence is implemented. Yesterday is a displayed request default, not a latest-coverage claim. See SATELLITE_CONTEXT.md for access checks and limits. Terminal/source tests do not establish browser rendering.

## S24 — Official research geography (checked 2026-10-02)

https://www.oneaquahealth.eu/research-cities/ and its linked pages:
https://www.oneaquahealth.eu/research-cities/benevento/ ; https://www.oneaquahealth.eu/research-cities/coimbra/ ; https://www.oneaquahealth.eu/research-cities/ghent/ ; https://www.oneaquahealth.eu/research-cities/oslo/ ; https://www.oneaquahealth.eu/research-cities/toulouse/ .

Public HTML and city text verified these five cities/countries and described water systems and dated community activities. Ghent's area includes Zottegem/Zwalm. Introductory plans and historical reports are not current monitoring measurements. Pune/Mutha River is not an official pilot. No city photographs or bulk site catalogue were copied into the project. Detailed review: OFFICIAL_PLATFORM_REVIEW.md.

## S25 — Public site catalogue and researcher tables (checked 2026-10-02)

https://apps.oneaquahealth.eu/sites ; https://apps.oneaquahealth.eu/sites-list ; https://apps.oneaquahealth.eu/city-dashboards .

Browsed the rendered unauthenticated UI after plain extraction returned an empty SPA shell. The list contained 106 rows: Benevento 20, Coimbra 20, Ghent 22, Oslo 20, Toulouse 24; code/name/city/latitude/longitude/altitude and dashboard links. T21/T24 names and 21 altitude cells were blank. Sampled C1 Exploratório (June 2020/June 2023/April 2024) and BN1 Capodimonte (June 2023) dashboards expose research quality/richness, nitrate and water-related risk fields. These are published historical research labels, not AquaLens AI outputs or evidence of current safety. Units/methods/risk definitions/coordinate precision/reuse license were not established; no documented public integration API verified.

## S26 — Public EO viewers and actual retrieval (checked 2026-10-02)

https://apps.oneaquahealth.eu/eo ; https://apps.oneaquahealth.eu/eo/imagery ; https://apps.oneaquahealth.eu/eo/indicators .

Official navigation embeds public ENORA viewers/guide. Coimbra June 2024 imagery and C1 NDVI analytics queries actually returned resources dated June 2/7/12/22. Site/index/date/opacity controls and a C1 NDVI statistics graph were observed. The guide states 2021 onward/global coverage/cloud filtering; latest availability, mission/native resolution/processing and reuse terms were not verified. An export control was clicked but no download was captured within the bounded wait; export contents/format/reliability remain unverified. No new API, license, Sentinel integration or ecological inference is implied.

## S27 — Public resilience-map feature surface (checked 2026-10-02)

https://apps.oneaquahealth.eu/resilience-map (officially embeds https://app.enora-oah.eu/resmap/v2).

Observed city/site/date controls, site comparison and menus for health/ecosystem, urban context, weather and EO. C1's default 2026 interval showed No data. Risk/biological-quality menu labels and map legends are platform output, not independently validated methods or permission to infer health/pathogens from a citizen photograph. Scientific model validity, complete dataset coverage and redistribution rights remain unverified.

## S28 — Reuse and authentication boundary (checked 2026-10-02)

https://www.oneaquahealth.eu/terms-conditions/ ; https://www.oneaquahealth.eu/community/ ; https://www.oneaquahealth.eu/project-solutions/ ; https://apps.oneaquahealth.eu/login .

Hub Terms 1.4 restrict copying to personal use unless otherwise stated and include publication restrictions; footer reserves rights. These do not settle every embedded dataset's terms. No explicit registry/research table/EO derivative/city image reuse license was found. Recommend sourced link-outs until rights are established. Community page instructs prior Community registration for the Citizen Science app; login/signup controls observed, account/submission/moderation/admin behavior not tested. No account creation, credentials, user evidence upload or external communication occurred. Public configuration URLs/tokens are not documented integration contracts.

## S29 — Current historical D5.3 link (checked 2026-10-02)

https://www.oneaquahealth.eu/about/ links to https://www.oneaquahealth.eu/app/uploads/2025/01/D5.3-Digital-app-and-backoffice.pdf . The old S5 `/wp-content/` URL now returned 404.

Opened the 50-page public 2024 deliverable and reviewed metadata and relevant citizen-app/design sections. It describes guided media/location/questionnaire submissions, historic scoring and architecture. This is a historical design document; it does not establish present endpoint access, scientific validation, dataset reuse rights or compatibility with our schema. AquaLens does not adopt the ecological grading system. Current installation guide located through Community: https://www.oneaquahealth.eu/app/uploads/2025/07/OneAquaHealth-Guide-A4-Citizen-Science-App-Installation-0.4.pdf . No installation/authenticated walkthrough performed.

## S30 — Current track choice (checked 2026-10-02)

https://oneaquahealth-ieee-hackathon.devpost.com/ — the public overview asks each project to belong to **one chosen track**. Track1 covers citizen-science UX, guided workflows, clearer terminology, data accuracy and repeat engagement; Track3 covers responsible AI assessment/validation/explainability/human oversight, Track2 data insights, Track4 storytelling.

The user authorized choosing another primary track and supporting several. **Project decision:** primary Track1, supported by existing Track3/2/4 capabilities. The complete local guided workflow is demonstrable when live AI is unavailable. This is a scope/presentation judgment, not evidence that a track is easier to win or an entry is eligible in multiple categories. Older Track3 decisions in this register are historical, not the current primary selection. No organizer evaluation or account submission was inspected.

## S31 — Supplied research: accepted proposals and corrected claims (checked 2026-10-02)

User attachment `bb19e251-332a-4425-b4ba-57869f8058d3/Pasted text.txt` recommends Track3, imagery/index overlays, weather history and a retained evidence gallery. It did not inspect this repository and is not independent implementation/evaluation evidence. Its blanket claim that official tools require login conflicts with actual public retrieval in S25–S27. Proposed pilot/accuracy results are not actual results.

The primary-source review is recorded in RESEARCH_REVIEW_2026-10-02.md, including direct Sentinel/CDSE, ERA5 and OSM references and limitations. Relevant corrections: https://www.openstreetmap.org/copyright identifies ODbL for map data; https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Overview/Authentication.html documents OAuth for processing services; https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview describes model reanalysis, not a local rain gauge. Open data rights do not imply anonymous processing tiles. No NDWI/ERA5 processing, external ecological grade, real pilot results or expert evaluation was implemented by accepting the report. Actual retained-evidence presentation, explicit visit links and the verified historical RGB layer below were selected instead.

## S32 — Historical annual Sentinel-2 RGB access and licence (checked 2026-10-02)

- https://esa-worldcover.org/en/data-access — public WMTS/WMS composite visualization, source attribution and recommended dataset citation https://doi.org/10.5281/zenodo.7254221 .
- https://remotesensing.vito.be//news/simplify-your-processing-worldcover-annual-composites — dataset producer specifically grants CC BY4.0 for annual side-product composites; yearly-median Sentinel2 RGBNIR bands, with possible corrupt/missing inputs and cloud/snow artifacts. This is not merely the classified map's licence.
- https://wmts.terrascope.be/?request=GetCapabilities&service=WMTS — anonymous HTTP200 capabilities, exact layer `esa-worldcover-s2rgbnir-10m-2021-v2_tcc`, default style, EPSG3857, PNG256, zoom6–14, latitude−60…83. `TIME=2021-01-01` selects the annual2021 product, not a scene date. The advertised REST resource failed400; verified KVP GetTile is documented in SATELLITE_CONTEXT.md.

Two bounded terminal tile samples returned200 with valid256px PNG and CORS: z12/x2888/y1833 Pune-region, z14/x7809/y6190 Coimbra-region. No credentials, app browser or bulk retrieval. The app now exposes **Landscape · 2021**, retaining actual citizen marker positions and camera, with source/year/licence, supported-detail and latitude hints, error/retry/street fallback. True-color B04/B03/B02 source bands are10m; browse RGB is not numeric reflectance, NDWI, a current observation or a water/safety/ecological measure. Historical coverage/clarity for every site, browser rendering, uptime and offline tile permission remain unverified. Visible attribution credits ESA WorldCover/Copernicus and Terrascope/VITO without endorsement.

## S33 — Evidence presentation reuse (checked 2026-10-02)

https://www.radix-ui.com/primitives/docs/components/dialog and https://www.radix-ui.com/primitives/docs/components/tabs — existing MIT components supply dialog/tab semantics and documented focus/keyboard behavior. Installed React/Radix/Lucide components and original CSS were reused; no new package, service or model. The presentation is a read-only projection of retained source/check/confirmation/review events; it never manufactures a completed stage. Its Markdown/JSON export is a project-authored brief, not scientific certification or signed audit history. Software tests do not certify actual browser/assistive-device accessibility.

## S34 — Source handoff and licence boundary (checked 2026-10-02)

https://git-scm.com/docs/git-archive — inspected the built-in command's named-tree ZIP contract and commit ID in the ZIP comment. Use it for a source snapshot rather than a custom packer; it does not include ignored/untracked local configuration unless explicitly added. Inspect archive contents and configured-secret matches before delivery.

https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository — public repository visibility does not itself grant an open-source licence. Existing dependency/photo/data notices are retained; original-code licence/holder choice is still a user input. No MIT grant or contributor copyright ownership is fabricated. This is a documented boundary, not legal advice or a newly verified hackathon licence requirement.
