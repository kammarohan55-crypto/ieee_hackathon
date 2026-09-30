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

OpenCV/ONNX considered but not installed: no validated detector/model justified their cost. CSS already supports the required restrained motion; no additional animation dependency. Native canvas provides only exposure/detail heuristics, with limits stated. No unsupported image classification is attributed to those heuristics. Lockfile pins exact versions.

Open-Meteo: CC BY 4.0 modeled weather; free noncommercial evaluation/prototyping subject to its terms. Hero illustration generated with image generation. No private observations or uploaded user media are included in source.
