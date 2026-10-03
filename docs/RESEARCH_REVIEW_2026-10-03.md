# Decision on the returned Deep Research report

Checked October 3, 2026 (India time), starting main revision 3e6bfec7e39d865b18bcc3b7008c11ec650dd64b. Actual files and primary documentation establish status; the pasted report is advice, not scientific validation. Track 3 remains the lead, with citizen UX, geographic context and storytelling supporting it. No evidence establishes an easiest track or winning probability.

| Report recommendation / assertion | Actual state and decision |
|---|---|
| Add OSM with Leaflet | Already working using MapLibre/OpenFreeMap/OSM. Preserve tested functionality and attribution; no second map engine. |
| Add Sentinel-2 | Dated 2021 annual true-color composite already works. It is a landscape mosaic, not a single scene matched to a photo date. New scenes/NDWI remain optional and unimplemented; the report gives no demonstrated endpoint/authentication/masking contract. |
| Add context time series around the evidence date | Accepted. Added ERA5 daily history around the nine European source-photo dates; existing recent/next hourly weather stays separate. Reused Recharts/Zod, no new dependency. |
| Demonstrate Pune | Outdated. Active examples are Mondego/Coimbra, Garonne/Toulouse and Hoffselva/Oslo. Older Indian images only support old receipts. |
| Every organizer app requires login | Incorrect as a blanket claim. Fresh rendered /sites visit displayed the public map and approximately 106 marker controls without login. Other routes were not freshly audited. |
| Treat public organizer datasets as open | Rights unresolved. Link to organizer resources; do not redistribute registry/monitoring results or copy public map tokens without specific rights. |
| Validate a chart by plausible trends or a blue-looking river overlay | Reject. Validate dates, units, source identity, unknowns and failure behavior. Appearance does not establish calibration or environmental truth. |
| Obtain expert checks on 5–10 observations | Valuable remaining human work. No expert study or measured improvement was produced; example judgments remain visibly authored demonstrations. |

## Implemented extension

`lib/source-weather.ts` ties the allowlisted city overview, source date and SHA-256 to each source image. `/api/source-weather` accepts only nine catalogue IDs and seven/fifteen-day UTC windows, explicitly selects ERA5, checks units/dates/null alignment, uses a bounded 24-hour cache/nine-second deadline and rejects redirects. Errors supply no invented values. No private coordinates, media, notes or key are sent.

Nine genuine seven-day responses are retained in immutable `/source-weather-v1.json`. `npm run prepare:history` preserves its original retrieval times; deliberately bump the asset revision before replacing it. Existing recorded AI and presentation v2 assets were not rewritten. The archive ships in production offline assets; installed offline behavior still needs a physical-device check.

In Photo desk or Geographic map, expand **Weather around the source date**: rainfall bars, temperature/wind curves, source-date marker/cards, UTC table, requested/returned coordinates, retrieval time and exact request. Fifteen days load explicitly. **Archive JSON** is separate contextual evidence, not an approved Decision Receipt. No original observation, review or ecological score changes.

[Open-Meteo documentation](https://open-meteo.com/en/docs/historical-weather-api) documents ERA5 reanalysis at nominal 0.25° resolution, approximately 25 km, with delayed updates. This is regional atmospheric modeling, not a stream sensor or camera location. Source dates have day precision and unknown capture timezone; weather days are UTC. Calendar alignment establishes no causal relationship to a visible feature.

[Service terms](https://open-meteo.com/en/terms) distinguish free noncommercial access/request limits and CC BY 4.0 data attribution from commercial service access; availability is not guaranteed. [Organizer map](https://apps.oneaquahealth.eu/sites) was visited read-only. SOURCES S47 records these checks and limits; QA.md records verification. Genuine human review and an honest demo video remain higher-value submission evidence than further unverified breadth.
