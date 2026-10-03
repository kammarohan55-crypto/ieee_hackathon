# Reuse and attribution

Checked official documentation and installed licenses 2026-09-28/29 before implementation.

| Dependency | License / source | Reason |
|---|---|---|
| MapLibre GL JS 6.11.2 | BSD-3-Clause, https://github.com/maplibre/maplibre-gl-js/blob/main/LICENSE.txt | Maintained interactive WebGL map; worker copied unmodified with license |
| OpenFreeMap | https://openfreemap.org/quick_start/ | Keyless map style; OpenStreetMap/OpenMapTiles attribution retained |
| React Flow | MIT, https://xyflow.com/open-source | Interactive evidence graph; attribution retained |
| idb | ISC, https://github.com/jakearchibald/idb | Promise-based IndexedDB Blob persistence |
| Workbox | MIT, https://github.com/GoogleChrome/workbox | Production app caching |
| sharp 0.35.4 | Apache-2.0, installed package.json/LICENSE | Development-only image resizing for the live visual smoke script; explicit dependency for reproducibility |
| Recharts | MIT, installed LICENSE | Existing maintained chart package for comparable readings |
| React, Radix, shadcn, Zod | MIT, installed and vendor notices retained | Existing app/controls/validation reused |
| MediaRecorder | https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder | Native recording; no unnecessary media library |

OpenCV/ONNX considered but not installed: no validated detector/model justified their cost. Initial motion used CSS; the October3 visual redesign below adds Three.js and Motion. Native capture canvas provides only exposure/detail heuristics, with limits stated. No unsupported image classification is attributed to those heuristics. Lockfile pins exact versions.

Open-Meteo: CC BY 4.0 modeled weather; free noncommercial evaluation/prototyping subject to its terms. The former generated hero has been removed. Bundled historical photographs retain their individual source credits in public/images/references/CREDITS.md; private user observations and uploaded media are not included in source.

Sept30 map/lab/observatory update reuses installed MapLibre, React Flow, Radix and Lucide (ISC), plus original SVG/CSS. No packages, model weights or third-party component code were added. Existing basemap/graph/worker attribution remains visible; docs/SOURCES.md records the official APIs inspected.

Oct2 debugging reuses the installed idb transaction API and ISC notice (README/license inspected locally), React/native image and recording APIs, existing Zod report validation and the existing UI/CSS system. No additional dependencies or copied third-party implementations were needed. Import compensation spans separate browser stores and is best-effort; it is not a distributed transaction.

October2 provider/satellite pass reuses installed MapLibre, its BSD-3-Clause notice/local worker, Zod schemas and React/Radix/Lucide controls. The NASA raster integration follows the official MapLibre source pattern; source credits and limitations remain visible. A small server adapter follows official xAI/Groq REST/schema examples rather than adding another SDK. No package, copied model, registry dataset, copyrighted Google image or third-party token was added. Provider models are remote services, not bundled open-source models. NASA access/reuse terms and provider limits are recorded in SOURCES S22/S23.

October2 presentation/actions/Decision-brief work reuses existing Radix Dialog/Tabs (MIT), React, Lucide (ISC), Zod and CSS. [Radix's official Dialog documentation](https://www.radix-ui.com/primitives/docs/components/dialog) informed modal structure; no claim of completed assistive-technology QA follows from using it. Existing components/native exports provide media display and readable briefs; no animation, speech, detector or satellite-processing package was added.

Historical landscape context uses the producer's anonymous Terrascope KVP WMTS service: ESA WorldCover 2021 annual Sentinel-2 RGB median, not a dated single-scene or quantitative index. Retain **© ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium** and CC BY 4.0 source/license links. Underlying 10 m source bands do not establish an observable small-stream condition. Service contract, sampled access, coverage and artifacts are recorded in SATELLITE_CONTEXT.md/SOURCES.md. OpenStreetMap data is **ODbL**, not blanket CC BY-SA. No organizer dataset reuse license has been inferred.

October3 European visuals reuse the installed Recharts AreaChart (MIT), MapLibre (BSD-3-Clause), React/Lucide/Zod and scoped CSS. Official Open-Meteo hourly documentation and Recharts AreaChart documentation were checked before extending these existing surfaces. No new dependency, SDK, processing model or copied component implementation was added. Wikidata CC0 supplies city-overview coordinates; the three unchanged Wikimedia thumbnails retain individual CC BY / CC BY-SA attribution and licence links in CREDITS. Recorded Gemini candidates are remote service outputs, not model weights or human observations. SOURCES S40–S42 record metadata, method and limits.

## October 3 — optical visual system

Before implementing the large UI upgrade, checked official Three.js/Motion APIs, Magic UI/React Bits template licenses and installed Fontsource packages. Selected exact three@0.186.1 (MIT), motion@14.0.0 (MIT), @fontsource-variable/manrope@5.3.0 (OFL-1.1) and @fontsource/instrument-serif@5.3.0 (OFL-1.1), plus development-only @types/three@0.186.0 (MIT). Registry dates inspected showed current September/October2026 releases for the renderer/animation packages; this is not a security or performance certification.

Three.js provides a dynamically imported decorative scene; Motion's mini DOM API provides progressive entrance animation. Native visibility/resize APIs and existing CSS provide lifecycle/adaptive layout. R3F/OGL/reflective Water addon were considered but not needed for one bounded sculpture. Magic UI Ripple was an aesthetic reference (MIT); no template source was copied. Current React Bits is MIT with Commons Clause, not plain MIT; it was not copied or installed. Local Fontsource Google Fonts packages carry the bundled OFL text; do not substitute another upstream Manrope distribution under different terms. See public/VISUAL_LICENSES.txt for full installed copyright/license notices, and SOURCES S48 for primary links.
