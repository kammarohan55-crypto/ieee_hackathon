# Review of the supplied deep-research recommendation

Historical October2 review. Current Track3 framing and successful bounded Gemini connection are in PROJECT_CONTEXT and SOURCES S36–S38; the provider-failure/Track1 recommendation below is retained as history.

Checked **2026-10-02** against primary documentation, the current project handoff and the earlier October 2 rendered official-platform review. The supplied report did not inspect this repository. Its recommendations are useful proposals, not implementation or scientific-validation evidence. No AquaLens browser/server, private account or live AI was used for this review.

## What to carry forward

1. **Evidence history gallery:** extend retained local photographs, dates and existing comparison/review actions. Actual saved observations and historical references must remain separate. Unknown coordinates/timestamps stay unknown; nearby coordinates alone do not establish the same stream or viewpoint. Empty state is an honest, useful part of this feature.
2. **Dated weather-history context:** add a compact chart through the existing Open-Meteo integration, with units, requested/returned coordinates, date range, actual model basis, gaps and errors. Label model/reanalysis estimates rather than observed rainfall; do not connect precipitation to a water-quality conclusion. Recent archived forecast data and ERA5 are distinct products.
3. **Presentation from actual records:** show original evidence, issue/answer, explicit citizen confirmation, human-review reason and portable receipt in one focused walkthrough. Every absent stage remains absent. A presentation is a view of retained evidence, not a manufactured successful assessment.
4. **Keep existing dated NASA satellite context:** source, date, scale and availability are already implemented. New satellite products are optional; preserve the functioning map and fallback rather than adding an unverified tile URL.

These are engineering recommendations based on the current app. Root is changing the primary submission framing to **Track 1: Citizen Science UX**, with Track 3 validation/human oversight, Track 2 maps/context and Track 4 storytelling as supporting capabilities. This is a project decision authorized by the user's broader track request, not evidence that Track 1 is easier to win. The [official overview](https://oneaquahealth-ieee-hackathon.devpost.com/) calls for one chosen track; do not claim entry in multiple categories is established. Its Track 1 scope includes guided workflows, clearer terms, data accuracy and repeat engagement. Current xAI access is blocked; a complete citizen workflow can still be demonstrated truthfully.

## Material corrections

| Supplied claim | Finding and implementation consequence |
|---|---|
| All OneAquaHealth interactive tools require login; no public data appears | **Reject.** The earlier October 2 browser review directly observed 106 public catalogue rows, sampled historical research tables, and four dated June 2024 EO resources/graphs without login. See [OFFICIAL_PLATFORM_REVIEW.md](OFFICIAL_PLATFORM_REVIEW.md), Sources S25–S27. Do not repeat its entire SPA inspection because a text extractor returns an empty shell. |
| All official data are necessarily proprietary because Hub terms restrict copying | **Unresolved rights, not a universal conclusion.** Hub terms and embedded dataset terms are not interchangeable. No explicit reusable registry/EO/research-score licence was established; use links and citations until a specific permission/licence is supplied. Public viewing does not grant redistribution. |
| Open Sentinel data means keyless NDWI tiles can simply be fetched from Copernicus/AWS | **Reject as an integration promise.** Sentinel source-data rights do not identify a renderer or service contract. The documented CDSE Sentinel Hub Process API requires an OAuth access token and registered client. Anonymous public object storage can supply source rasters, but reprojection, masks, processing, bandwidth and tile delivery still need a demonstrated path. [CDSE authentication](https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Overview/Authentication.html), [data terms](https://dataspace.copernicus.eu/terms-and-conditions). |
| Sentinel is CC-BY; swath 305 km; 13 L2A bands | **Correct.** Copernicus Sentinel data uses its specific free/full/open legal notice. MSI's swath is 290 km and its sensor has 13 bands at 10/20/60 m; L2A surface-reflectance products omit B10. These specifications do not establish stream-scale interpretability. [Mission](https://sentiwiki.copernicus.eu/web/s2-mission), [products](https://sentiwiki.copernicus.eu/web/s2-products), [legal notice](https://cds.climate.copernicus.eu/licences/ec-sentinel). |
| NDWI blue pixels should highlight the river correctly | **Replace the acceptance criterion.** Green/NIR NDWI is spectral context, with built-up false positives and mixed/cloud pixels. Correctness requires scene/mask/processing checks and a suitable reference, not a blue-looking demo. It is no ecological grade or contamination measurement. [Provider's NDWI method](https://custom-scripts.sentinel-hub.com/custom-scripts/sentinel-2/ndwi/). This example page has CC BY-SA 4.0 terms; adapting its code also requires attribution/licence compliance. |
| ERA5 is observed precipitation with no restrictions | **Correct labels/rights.** ERA5 is model reanalysis combining observations and physics; the catalogue's atmosphere product is regridded to 0.25°, hourly from 1940, with about five-day early-release latency and later revisions. The current catalogue displays a CC-BY licence. A requested point represents a grid estimate, not a stream-side gauge. [ERA5 catalogue](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview). |
| OSM data is CC BY-SA | **Reject.** OSM data is ODbL; its documentation is CC BY-SA. Retain the map's visible contributor attribution/licence link and the basemap provider's attribution. [OSM copyright](https://www.openstreetmap.org/copyright). |
| WorldCover offers only 2020, five classes and requires Copernicus registration | **Correct.** Official WorldCover products include 2020/v100 and 2021/v200, 11 land-cover classes, CC BY 4.0, public WMTS/WMS and documented unsigned S3 access. Downloads through its viewer can require a separate Terrascope login. The different algorithms mean inter-year changes are not solely land-cover change. [Official access/rights](https://esa-worldcover.org/en/data-access). |
| No exact-domain public evaluation dataset exists; proposed pilot results can be narrated | **Do not claim either as verified.** A limited search cannot establish that no dataset exists. A planned study has no results; expert agreement, accuracy or prevented errors cannot be stated before actual retained evaluations. Software contracts and explicit human-review controls are engineering evidence, not model/environment validation. |

## Access choices and limits

**Weather:** [Open-Meteo historical documentation](https://open-meteo.com/en/docs/historical-weather-api) supports model/reanalysis time series. Its recent-data guidance links the Forecast API's `past_days` option; an ERA5-specific series must respect availability latency. [Current service terms](https://open-meteo.com/en/terms) permit a noncommercial free API subject to request limits and CC BY 4.0 attribution. Access to the free service and reuse of its data have distinct terms. Validate actual units/dates/nulls; no sensor-reading label, causal arrow, local risk alert or fabricated zero for a missing day.

**Sharper satellite context, optional:** the WorldCover access page names `WORLDCOVER_2020_MAP`/`WORLDCOVER_2021_MAP` and historical Sentinel-2 RGB/NDVI annual-composite web-map layers. RGB web-map imagery is display context and unsuitable for numeric raster analysis. The bounded follow-up below verifies an actual public RGB tile contract; it does not verify browser rendering or every location. No layer was implemented by this review.

### Verified historical RGB contract

Follow-up checked **2026-10-02**, anonymously through terminal HTTP requests; no private token/account, app startup or browser QA.

- [Official WMTS capabilities](https://wmts.terrascope.be/?request=GetCapabilities&service=WMTS): HTTP 200/application/xml; layer `esa-worldcover-s2rgbnir-10m-2021-v2_tcc`; style `default`; EPSG:3857; PNG 256×256; layer zooms **6–14**; coverage longitude −180…180, latitude −60…83. Its sole TIME value is `2021-01-01`, which selects the annual product and is **not a January 1 capture date**.
- The capabilities' advertised REST resource returned HTTP 400, missing SERVICE parameter. Use the **tested KVP** GetTile contract below, row/column in their named fields (`tms: false`), with normal XYZ placeholders. Its HTTPS Pune-region sample returned HTTP 200/image/png, 182,720 bytes, correct PNG signature and 256×256 IHDR, CORS echoed `http://localhost:5173`, with `Vary: Origin`. A separate Coimbra-region zoom-14 sample, column 7809/row 6190, returned HTTP 200/PNG, 99,764 bytes and CORS echoed `https://example.org`.

```text
https://wmts.terrascope.be/?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=esa-worldcover-s2rgbnir-10m-2021-v2_tcc&STYLE=default&FORMAT=image%2Fpng&TILEMATRIXSET=EPSG%3A3857&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}&TIME=2021-01-01
```

Tested Pune-region sample used zoom 12, column 2888, row 1833. Tile coverage does not establish citizen GPS or a field visit. Capabilities and CORS results are access evidence; they do not establish scene authenticity, completeness, pixel clarity, service uptime or broad offline permission.

**Composite licence, specifically:** dataset producer [VITO's annual-composite release](https://remotesensing.vito.be//news/simplify-your-processing-worldcover-annual-composites) explicitly applies **CC BY 4.0 to these side-product layers**, rather than merely to the classified land-cover map. It identifies the RGBNIR product as yearly-median Sentinel-2 bands, and warns of missing/corrupted inputs and residual cloud/snow artefacts. Label the layer **2021 annual Sentinel-2 composite · historical landscape context**, approximately 10 m, not current/day-specific imagery or numerical analysis. A rendered map needs loading/error/street fallback and a helpful zoom range, since the provider supports no tiles below zoom 6 for this layer.

Use the [official map attribution](https://esa-worldcover.org/en/data-access):

> © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium

Link source and [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), with the source-recommended [Zanaga et al. 2022 dataset citation](https://doi.org/10.5281/zenodo.7254221) in documentation. Do not claim ESA partnership or endorsement. Use bounded on-demand requests; no bulk tile downloader was tested or proposed.

**Defer** a new Sentinel-2 NDWI processing backend, GBIF/species layers, forecasting, new scoring models and a claimed expert pilot. They add dependencies or scientific obligations without closing the current citizen-to-reviewer demonstration gap. Real original photographs, dated visit notes, instrument methods where available and actual review decisions are the highest-value next evidence inputs.

The [official extension](https://oneaquahealth-ieee-hackathon.devpost.com/updates/46660-deadline-extended-to-october-4-keep-innovating-keep-submitting) remains October 4 at 9 PM PDT, equivalent to October 5 at 09:30 Asia/Kolkata. Eligibility wording still conflicts across official pages; this review does not verify a participant's eligibility or account submission.
