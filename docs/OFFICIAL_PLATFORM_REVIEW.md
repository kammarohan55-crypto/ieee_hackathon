# Official OneAquaHealth platform review

Checked **2026-10-02**. Primary scope: [Research Cities](https://www.oneaquahealth.eu/research-cities/) and [public Sites app](https://apps.oneaquahealth.eu/sites). Read their linked city pages and sampled all public app navigation areas in a browser. The app is client rendered: an empty text extraction was **not** evidence that the platform lacked features. No account was created or used; no observation was submitted; no private API was queried. AquaLens remained stopped and was not visited. This is a public-surface review, not a complete audit of authenticated functionality.

## Research geography

The five research cities and named water systems below are organizer descriptions, not new measurements or independent confirmation of environmental conditions. The pages mix introductory plans and dated activity reports. [Research Cities](https://www.oneaquahealth.eu/research-cities/), source register S24.

| Official city page | Country | Geographic context named on that page |
|---|---|---|
| [Benevento](https://www.oneaquahealth.eu/research-cities/benevento/) | Italy | Calore and Sabato; later citizen activity names San Nicola, Serretelle, Vallone Cornacchie and Jenga |
| [Coimbra](https://www.oneaquahealth.eu/research-cities/coimbra/) | Portugal | Mondego and urban tributaries; community activities at Ribeira de Eiras, Ribeira de Coselhas and Vale das Flores |
| [Ghent](https://www.oneaquahealth.eu/research-cities/ghent/) | Belgium | South-western Flanders, including Zottegem and the Zwalm basin; the research area extends beyond central Ghent |
| [Oslo](https://www.oneaquahealth.eu/research-cities/oslo/) | Norway | Sampling plans name Ljans elva, Hovinbekken and Hoffselven; activities cover multiple urban streams |
| [Toulouse](https://www.oneaquahealth.eu/research-cities/toulouse/) | France | Garonne, Ariège, Canal-du-Midi and smaller tributary streams |

**The current active photo case studies are the Mondego/Coimbra, Garonne/Toulouse and Hoffselva/Oslo**, selected from separately licensed Wikimedia sources. These are waterways in three official research cities, not verified project sampling stations or official monitoring evidence. The retired Pune/Mutha sources remain for existing receipt compatibility only. No photograph is relabeled as team work, current conditions or organizer partnership.

## Features and data actually observed

| Public route | Verified public behavior | Material limits |
|---|---|---|
| [Research Sites Map](https://apps.oneaquahealth.eu/sites) | Interactive map, site markers, zoom and location control; Mapbox/OpenStreetMap attribution | Basemap access is not permission to reuse the platform's token or monitoring data. Device location was not requested. |
| [Research Sites List](https://apps.oneaquahealth.eu/sites-list) | **106 rows**: Benevento 20, Coimbra 20, Ghent 22, Oslo 20, Toulouse 24. Columns: code, name, city, latitude, longitude, altitude; links to dashboards | Two names, T21/T24, and 21 altitude cells were blank. Capture date, coordinate accuracy/datum and altitude units were not established. Counts describe this observed catalogue, not a guaranteed complete network. No bulk registry was copied into AquaLens. |
| [City Dashboards](https://apps.oneaquahealth.eu/city-dashboards) | City/site selectors, map and historical research table. C1 Exploratório showed June 2020, June 2023 and April 2024 rows; BN1 Capodimonte showed June 2023 data after loading | Visible columns include fish, macroinvertebrate and diatom quality/richness, nitrate and water-related health risks. These are **platform-published research labels**, not AquaLens AI assessments. The sampled table did not establish units, sampling methods, numeric-risk definitions, validation, licenses or present conditions. A transient empty table during loading did not mean no data existed. |
| [EO overview](https://apps.oneaquahealth.eu/eo) | Embedded vegetation-index/band guide, with stated coverage from 2021 onward and cloud filtering | These are guide statements; the latest scene, source mission, native spatial resolution and processing chain were not verified from that guide. Its wording is not independent scientific validation. |
| [Satellite Imagery](https://apps.oneaquahealth.eu/eo/imagery) | Five-area, index and date selectors, opacity control and dated image resources. A Coimbra/BWDRVI query for June 2024 returned four resources | Dates observed: June 2, 7, 12 and 22, 2024. Resource thumbnails/overlays were available without login. No download license, public API contract, original raster metadata or pixel resolution was established. |
| [EO Indicators](https://apps.oneaquahealth.eu/eo/indicators) | City/site/index multiselect, dates, result table, opacity, 1/3/6-month graph choices and statistic toggles. C1/NDVI for June 2024 returned four dated resources and a graph with min/max/mean/median/standard deviation | An export button appeared and was clicked; a downloadable file was not captured within the bounded browser wait. File contents/format and export reliability remain unverified. Never call this a successfully obtained validation dataset. |
| [Resilience Map](https://apps.oneaquahealth.eu/resilience-map) | Embedded city/site/date explorer; site-comparison control; health/ecosystem, urban, weather and EO menus. A C1 selection was inspected | Menus expose research risk/biological-quality fields, vegetation/urbanisation context, weather and EO indices. C1's default 2026 interval displayed **No data**. Menu existence does not establish completeness, model validation or a causal link; no disease/pathogen/health prediction is justified for AquaLens. |
| [Login](https://apps.oneaquahealth.eu/login) | Login form, password recovery and sign-up link | Citizen submissions, moderation, roles and backend access were not tested. The official [Community page](https://www.oneaquahealth.eu/community/) instructs users to register with the Community first; that is a source statement, not a verified sign-in walkthrough. |

The EO and resilience tools load embedded ENORA applications through the official public navigation. Their presence does not authorize a new integration. Relevant source entries: S25–S27.

## Access and reuse

Public browsing worked without credentials for the catalogue, sampled research tables, EO resources/graph and resilience controls. **A documented, licensed third-party data API was not established.** A URL or token in public client configuration is not such a contract. No keys/tokens were retained in project files, and no authenticated or guessed endpoints were called.

The [Hub Terms, section 1.4](https://www.oneaquahealth.eu/terms-conditions/) restrict copying to personal use unless separately stated, with additional publication restrictions; the site footer reserves rights. Those Hub terms do not by themselves settle every embedded app dataset's license. No explicit reusable license for the registry, researcher scores, EO derivatives or city photographs was found in this review. Use citations and links; obtain an explicit dataset/asset license or permission before bundling or redistributing. Scientific methods and historical dates must accompany any later permitted integration. See S28.

The historical D5.3 PDF is now linked from [About](https://www.oneaquahealth.eu/about/) at [this current URL](https://www.oneaquahealth.eu/app/uploads/2025/01/D5.3-Digital-app-and-backoffice.pdf); the earlier `/wp-content/` URL returned 404. It documents a **2024 design**, including guided media/location/questionnaire submissions and architecture. It does not verify the present account workflow, endpoint access, reuse rights or current compatibility. Do not adopt its ecological grading system as an AquaLens validated measure. See S29.

## Implication for AquaLens — project recommendations

The October2 review temporarily favored Track1 while provider access was blocked. **Current October3 primary: Track3, AI-Supported Assessment**, as specified in the supplied project instructions, with citizen UX/context/storytelling supporting it. Bounded Gemini text/image checks now succeeded; local checks and human review still work during provider failure. The strongest complement to the official geographic/EO platform remains an inspectable citizen-to-reviewer trail: preserve originals, reference each suggestion, retain unknowns, require acceptance and show disagreements. This decision does not establish winning odds or scientific accuracy.

Source inspection confirms AquaLens already has photo comparison, supplied-coordinate maps, provenance/replay, weather timestamps, evidence coverage and software-validation views. Improvements should extend those surfaces rather than duplicate the official platform.

| Priority | Feasible visual | Why it helps Track 3 | Required evidence and fallback |
|---|---|---|---|
| 1 | Five official city/source cards and public-tool links, accessible with an empty saved collection | Gives verified geographic/project context before a user has field records, without turning external studies into citizen evidence | Cite city pages and checked date. Keep official history and separately licensed photos distinct. No copied registry or risk grades; links remain useful if integration rights are unavailable. |
| 2 | Evidence-time comparison in the existing Compare/Lab view | Makes old source photos, actual visit time, current weather-model time and later review time easy to distinguish | Use only retained timestamps and their precision. Unknown/date-only/stale values stay explicit. Existing Compare warnings and event replay already cover part of this; implement only the remaining clarity gap. |
| 3 | A location/context provenance panel alongside the existing map, with an optional licensed EO scene | Lets a reviewer inspect where context came from, scene date/cloud coverage, observation-to-scene time gap and footprint/resolution | First use actual supplied coordinates and existing weather provenance. Add Sentinel-2 or another EO layer only after current license, access, source metadata and spatial suitability are verified. Fall back to sourced links; do not use a satellite proxy to diagnose a small stream. |

Real field evidence and a disclosed human walkthrough remain higher value than speculative forecasting, custom training, FHIR claims or more dashboards. These priorities are design judgments, not organizer scores or a claim that the proposed visuals have already been implemented.

## Implementation follow-through — October2

The app now includes five city/country source link cards, dated keyless NASA Terra/MODIS regional context and a verified public **2021 annual Sentinel-2 RGB composite** from ESA WorldCover/Terrascope. Its 10 m source bands and zoom6–14 display are historical landscape context, with attribution, coverage limits and street fallback. This is not a dated single-scene processing integration, NDWI, current water measurement or imported official research grade. Scene-level cloud/acquisition metadata, authenticated official tools and licensed monitoring-data integration remain unimplemented. Presentation chapters, a readable evidence brief and explicit visit links extend the citizen workflow. See SATELLITE_CONTEXT.md and RESEARCH_REVIEW_2026-10-02.md. No browser QA of AquaLens was performed.

## European source experience — October3

Mission control now adds three licensed European river photos, separate Wikidata CC0 city-overview markers, source dossiers, recorded actual Gemini visual candidates and a three-clock trail. Open-Meteo supplies current and hourly weather context with refresh, optional visible-page polling, chart/table views and a separate source-context JSON export. City markers do not seed visits or become observation GPS. Historical photos, recorded AI and independently timed weather never establish current river health. See SOURCES S40–S42; no additional official dataset/API reuse is claimed. Browser testing remains assigned to the user.
