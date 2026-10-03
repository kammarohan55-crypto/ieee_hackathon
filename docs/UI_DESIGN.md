# Current visual observatory ownership — 2026-10-03

app/observatory.css loads after stories.css. It scopes the separate editorial /visuals layout and fixes shared graph contrast/wider nodes/readable navigator and Atlas horizontal filmstrip. components/visual-observatory.tsx uses one primary view at a time; city/year/format controls belong to source views, not globe/graph. Every full photograph keeps credits; library crops are display only. Graph cards/list show provenance, never health colors. Globe framing is responsive presentation, not a physical twin. Source-year/quarter/frame-format analytics derive only catalogue metadata. Play starts only explicitly and respects reduced motion. Canonical source titles/dates/hashes are unchanged; curated viewing titles improve readability. Existing records, primary workflow, dependencies and durable storage namespaces retained. See OBSERVATORY_2026-10-03.md and QA.md.

# AquaLens visual system — October 3, 2026

## Direction and scope

An environmental field instrument with editorial typography: midnight aquatic surfaces, sea-glass accents, photographic place cards, optical rings and deliberate depth. All existing observations, originals, uncertainty labels, AI consent, source distinctions, reviews, maps, exports and local storage remain in place. The scene is an **abstract water study**, not telemetry, a scientific model or source imagery.

## Implemented

- Mission Control: procedural Three.js water ribbon, layered lens, engraved circular base, lights and gentle pointer response. New observation and Explore river insights use the existing actions.
- Motion: a brief progressively enhanced entrance, tab/panel reveals, pointer-only card elevation and camera-control feedback. Continuous 3D motion has a Pause/Play control; reduced-motion users get a still scene.
- Typography: locally packaged Manrope Variable and Instrument Serif normal/italic. Fallback system/Georgia text works while fonts load. No external font service.
- Shell and evidence desk: more space, larger display typography, softer instrument panels, redesigned actual-count cards, source thumbnails, controls and inspector. Mobile header scrolls away while navigation stays sticky; tablet breakpoints follow the existing layout.
- River portfolio and context: taller source-photograph cards, source-date filmstrip, map overlays/dossiers, weather metrics and archive panels. No image filters, synthesized measurements or changed geographic coordinates.
- Field/review: optical camera idle state, shutter feedback, Evidence Lab stage cards, reviewer queue, trail, Decision Receipt and presentation dialog refinements. Source/method/limitations and AI-vs-human distinctions remain visible.

## Architecture and boundaries

`components/aqua-hero.tsx` lazy-loads `lib/aqua-scene.ts` when visible. A ResizeObserver fits an orthographic camera to the host. Pixel ratio is capped at 1.5; drawing is capped at approximately30fps. Hidden/off-screen/paused/reduced-motion states stop the animation loop. Geometry/materials/listeners/observer/renderer are disposed on unmount, including late-import and initialization failures. WebGL context loss returns to static artwork. No IntersectionObserver means the static composition remains; it never blocks the observation controls. Canvas is decorative and hidden from assistive technology.

`app/immersive.css` owns the shell/hero/evidence desk; `review-atmosphere.css` owns the coordinated review/field skin. Existing scoped styles retain their layouts and the established evidence palette. Three.js and Motion MIT, Manrope/Instrument Serif OFL notices are copied from installed packages into public/VISUAL_LICENSES.txt and included in production offline assets. No commercial template or React Bits source was copied. See SOURCES S48 and DEPENDENCIES.

## Verification and remaining device checks

Terminal verification: full407-check suite, TypeScript, ESLint,16 CSS parses and production build. Seven new lifecycle checks use real Three.js geometry/math with doubled GPU/DOM boundaries. They exercise finite geometry, portrait/zero sizing, throttling, pause/resume, pointer response, disposal, context loss and initialization/render failure. They **do not** establish successful WebGL drawing, device performance or visual quality.

The latest user explicitly authorized running/testing the website, superseding the earlier no-preview instruction. Isolated installed-Chrome profiles exercised the current development and production interfaces; user windows/storage were untouched. Actual scene rendering, stable paused frames, changing played frames, reduced-motion still view and injected context-loss fallback passed. Screenshots of the desktop hero and phone Lab/receipt were inspected. Mission/Insights layouts fit375/680/850/1120/1440px; their internal matrix remains scrollable. All primary views and four Lab/presentation chapters work. Browser QA corrected mobile Insights overflow, legacy pale receipt background and a clipped provenance tag. Ctrl+K, photo grid/zoom, comparison, graph, confirmation/review/reload, disagreement and one completed JSON receipt download were exercised. No live AI or physical permission used. Full results/limits are in QA.md.

Production navigation for both / and /showcase reloaded offline after controlled online visits; source images/fonts loaded. This does not prove installed-PWA behavior or remote-map/API availability. OpenFreeMap emitted three nonblocking missing-number road-shield warnings; no application page exceptions occurred. Physical device performance, other browsers,200% zoom/full accessibility and authentic expert review still need separate checks.

User walkthrough on the existing local server (or start with npm run dev):

1. `/showcase`: let the existing nine-photo presentation load. Inspect the sculpture, move the pointer, pause/resume it and try both hero shortcuts.
2. Inspect at phone and desktop widths, including around850px and1120px. Navigation should remain reachable; the photo desk and source strip should retain their existing controls. Check with200% zoom and keyboard focus.
3. In Insights, inspect three city cards, chronology, filters, charts and receipt links. Values must still come from saved records and preserve example labels.
4. Inspect Photo desk, Compare, Evidence flow and Geographic map. Check source/weather disclosures and original image attribution.
5. Open Field notebook, Review desk, Evidence Lab and a presentation. Exercise the existing controls and confirm no panel text/buttons are clipped.
6. Enable OS reduced motion; check the still scene and keyboard controls. If WebGL2 is disabled/unavailable, static artwork and both hero shortcuts should remain usable.
7. Report the route, viewport/device, action and any screenshot or console message for a visual issue. No API key is required for this visual update.

Physical camera/microphone/GPS, installed PWA, native import/all export formats, other browsers and expert review remain separate gaps. One JSON receipt download completed in the isolated browser; this is not proof of every device/format. Decorative polish does not establish environmental accuracy or competition outcomes.


## Clean workspace / source-aware depth refinement

The full supplied visual brief led to scoped improvements, not15 competing visual systems. app/clarity.css loads last and owns the calmer density: short hero, restrained cards, compact photographic source rail, clearer heading hierarchy and native details for secondary information. Mandatory provenance/uncertainty/consent remains visible where decisions are made. The existing decorative Three.js scene stays unchanged.

GeographicEvidenceMap starts the public gallery on a real MapLibre globe using the dark vector basemap, with source-aware city chips, Globe/Flat controls and bounded city flights. NASA/WorldCover remain separate context layers. Perspective is navigation, never terrain/sensing or a physical twin.

EvidenceGraph retains its graph/readable list and highlights the selected upstream path. Only that route animates; Pause and reduced-motion alternatives remain. Source node styles distinguish solid originals/human decisions from dashed AI candidates. ReceiptLayers renders five real provenance layers with CSS perspective, Stack/Separate, pointer/keyboard detail and unchanged exports. Nested preserve-3d caused an actual Chrome pointer bug; child controls are flattened before the single perspective transform. Reduced motion disables transitions. No synthetic physics or additional canvas needed.

Focused final production checks: all six views375/850/1440 with no page overflow; Mission also680/1120; focused canvas full width; Enter disclosure; globe/city/flat actions; eight-node graph path and pause; five receipt pointer/keyboard layers, stack/separate, phone375/reduced motion and actual JSON download. These complement, rather than repeat, prior hero/capture/offline QA. Screenshots/logs are ignored outputs; QA.md records limits. App stopped. For review, request/start npm run dev, use /showcase and follow DEMO_GUIDE.md.


## River Atlas — source-led storytelling

Latest brief matches the previous file; built beyond existing globe/layers. Native Radix modal, full/cropped licensed photo, date filmstrip, three city choices and Look/Question/Decide make the evidence journey presentable without another WebGL scene. Desktop photo/narrative split becomes a single scrolling column on phone; sticky dialog header/city/footer keeps controls reachable. Sources/example labels/uncertainty remain. Empty/failed image states preserve metadata and retry; animations are short, never autoplay navigation. Atlas opens exact matching media/record; no borrowed candidate or automatic approval. Details in DEMO_GUIDE/QA.

PhotoCompare now has a native on-image range for direct drag/keyboard. EvidenceFlow highlights a selected branch with pause/reduced-motion controls. Header Evidence / Story reflects broader user-authorized scope. New styles scoped in stories.css; original data/schemas/actions and established optical hero/globe/receipt remain.
