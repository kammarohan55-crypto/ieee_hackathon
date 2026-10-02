# Geographic satellite context

Checked 2026-10-02. Two public browse layers provide context: dated NASA Terra/MODIS regional imagery and a historical 2021 annual Sentinel-2 RGB composite. They are separate from retained citizen observations and assessment. No satellite-derived environmental grade, water measurement or spectral index is implemented.

## Verified access contract

The [NASA GIBS access documentation](https://nasa-gibs.github.io/gibs-api-docs/access-basics/) defines public WMTS REST endpoints, explicit date dimensions and EPSG:3857. It warns that imagery requested for today can be incomplete. A requested date identifies a daily visualization, not a timestamp verified for each pixel.

The exact [EPSG:3857 best-available WMTS capabilities](https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml) were retrieved directly and parsed on October 2:

| Field | Advertised value |
| --- | --- |
| Layer | `MODIS_Terra_CorrectedReflectance_TrueColor` |
| Title | Corrected Reflectance (True Color, MODIS, Terra) |
| Matrix set | `GoogleMapsCompatible_Level9` |
| Projection | EPSG:3857 |
| Format / extension | `image/jpeg` / `.jpeg` |
| Tile size | 256 × 256 |
| Matrix levels | 0–9; z9 is 512 × 512 tiles |
| Tile addressing | zoom / row / column, mapped to `{z}/{y}/{x}` |
| First advertised day | 2000-02-24 |
| Default day when checked | 2026-10-02 |

The advertised date intervals contain gaps. No date picker value guarantees imagery at a chosen location or a clear surface view. The app validates calendar dates and the request range; it does not fetch or claim complete historical availability.

At z9 the advertised scale denominator is 1,091,957.546931089. Using the [OGC standardized pixel size of 0.28 mm](https://docs.ogc.org/is/20-058/20-058.html) gives approximately 306 projected meters per pixel at the equator; Mercator's ground scale varies with latitude. This is a display-grid calculation, not a measured scene accuracy.

One minimal unauthenticated tile request to [2026-09-30, z5 row14 column22](https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2026-09-30/GoogleMapsCompatible_Level9/5/14/22.jpeg) returned HTTP200, `image/jpeg`, 16,873 bytes, and `Access-Control-Allow-Origin: *`. No API key was needed. This verifies public access to that tile at that time; it does not verify all dates, every tile, clouds or browser rendering.

## Scientific and reuse limits

[NASA's archived MODIS corrected-reflectance metadata](https://github.com/nasa-gibs/worldview-options-eosdis/blob/master/common/config/metadata/modis/CorrectedReflectance.md) describes red/green/blue bands 1/4/3, source-band resolutions of 250/500 m and daily browse imagery. It distinguishes this visualization from fully atmospherically corrected scientific products. This is archived background documentation; current layer access was independently checked through capabilities and the public tile.

Clouds, haze, missing acquisitions and processing can hide the surface. Small streams can be unresolved. The app performs no calibrated reflectance analysis, cloud masking, NDVI, contaminant identification, pathogen detection, water-safety assessment or ecological grading. A successfully loaded image does not validate a citizen observation.

[NASA Earthdata's data-use policy](https://www.earthdata.nasa.gov/engage/open-data-services-software/data-use-policy) was retrieved directly through the terminal after the browsing tool returned403. It states that unrestricted data from NASA-led missions use CC0; restrictions on third-party material must still be respected. No restriction was advertised for this selected Terra layer in the checked capabilities. [GIBS acknowledgement guidance](https://nasa-gibs.github.io/gibs-api-docs/) requests source acknowledgement. The map's source attribution and visible source panel credit NASA GIBS / ESDIS / Terra MODIS, without implying NASA endorsement. No NASA logos or Google imagery were copied. The matrix-set name is a standardized tile-grid identifier.

## Project decisions and implementation

- The standalone field-record map defaults to a neutral world satellite view with yesterday's explicitly displayed UTC request date. Mission control's public-source map instead starts at a sourced European city overview on the historical 2021 landscape layer. These city markers are labeled public context, not citizen positions or sampling stations. **European overview · streets** explicitly switches this detail-only layer to the street map for fitting the three city centers; it is not an error-driven silent image substitution. Yesterday is a UX choice, not a promise of latest or cloud-free imagery. Empty citizen collections stay empty.
- Retain the existing MapLibre library and local worker. Use the [official raster-source pattern](https://maplibre.org/maplibre-gl-js/docs/examples/add-a-raster-tile-source/) with the verified source parameters and max map zoom9. Keep original citizen markers, synthetic labels, coordinate dossier, fit action and accessible location index.
- Support previous/next day, an explicit apply action, and a shortcut to the selected observation's UTC day only for a valid zoned timestamp. A same-day composite is not the observer's exact time.
- Preserve the user's map center, bearing and supported zoom when requesting a new date, background or retry with an unchanged set of coordinates. Recenter/refit when the actual location set changes, including the first supplied coordinates after an empty world view. New markers initialize from the latest selected location before load completes. Keep street view as an explicit fallback; errors never silently substitute imagery.
- Display loading, incomplete/error, unavailable/WebGL and retry states. A completed tile request still warns about blank or obscured coverage. Network access is required. Satellite tiles are not retained in citizen records, exports or evidence grades.

## Verification and remaining QA

`node scripts/test-satellite-map.mjs` has **24 checks** of actual date/style/component code with explicit React, DOM, timer and MapLibre doubles: calendar/future/boundary/UTC checks; exact URLs/attribution; neutral empty standalone world view; camera and original marker preservation; coordinate-set refit; selected-marker initialization; error/fallback/timeout; historical zoom/coverage hints; date-only/unknown-zone labels; CSS parse/scoping; European city selection/overview, separate observation counts and reduced-motion handling. No browser or app server was used. TypeScript, full lint and production build pass separately.

Actual browser/WebGL/network integration, mobile date controls, accessibility and visible scene coverage still require the user's device walkthrough. The public tile access check and authored software tests do not establish ecological accuracy.

## Historical 2021 landscape layer

The [official ESA WorldCover data-access page](https://esa-worldcover.org/en/data-access) describes annual Sentinel-2 composite visualization. [Producer VITO's release](https://remotesensing.vito.be//news/simplify-your-processing-worldcover-annual-composites) explicitly applies **CC BY 4.0** to these side products, describes yearly-median bands and warns of missing/corrupted input and residual clouds/snow. This establishes rights for the selected composite, rather than assuming the classified land-cover map licence applies to every service.

The checked [Terrascope WMTS capabilities](https://wmts.terrascope.be/?request=GetCapabilities&service=WMTS) advertise layer `esa-worldcover-s2rgbnir-10m-2021-v2_tcc`, default style, PNG256px, EPSG:3857, zoom6–14 and bounds longitude −180…180 / latitude −60…83. The selector `TIME=2021-01-01` identifies the annual product; it is **not a January 1 scene date**. True color uses B04/B03/B02 from 10 m source bands; web-map RGB is unsuitable for numerical reflectance/index analysis.

The advertised REST resource returned HTTP400. The implementation uses the verified anonymous KVP contract, normal XYZ addressing (`TILECOL={x}`, `TILEROW={y}`):

```text
https://wmts.terrascope.be/?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=esa-worldcover-s2rgbnir-10m-2021-v2_tcc&STYLE=default&FORMAT=image%2Fpng&TILEMATRIXSET=EPSG%3A3857&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}&TIME=2021-01-01
```

Terminal samples returned HTTP200, valid256×256 PNG and origin CORS: Pune-region z12/x2888/y1833 (182,720bytes), Coimbra-region z14/x7809/y6190 (99,764bytes). These verify access to two tiles, not all coverage, scene clarity, browser rendering, uptime or caching rights. No key/account or bulk downloader was used.

Choose **Landscape · 2021** to retain the current map center and citizen markers. Below zoom6 a visible hint offers zoom to the current center; outside the advertised latitude range a coverage notice offers street fallback. Motion honors reduced-motion preference. The date controls apply only to NASA; the annual layer displays its own source/year. Both loading/error states and the location list remain explicit.

Visible attribution: **© ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium**, with Terrascope/VITO service, source and [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) links. Dataset citation: [Zanaga et al. (2022), ESA WorldCover 10 m 2021 v200](https://doi.org/10.5281/zenodo.7254221), using the producer's recommended credit. No partnership/endorsement is implied. Historical imagery does not establish present river conditions, validate an observation or supply a physical digital twin.
