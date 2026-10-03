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

## Verification and user preview

Terminal verification: full401-check suite, TypeScript, ESLint,15 CSS parses and production build. Seven new lifecycle checks use real Three.js geometry/math with doubled GPU/DOM boundaries. They exercise finite geometry, portrait/zero sizing, throttling, pause/resume, pointer response, disposal, context loss and initialization/render failure. They **do not** establish successful WebGL drawing, device performance or visual quality.

The user explicitly asked the agent not to open/preview the website. No browser was opened, no screenshot made, no server started/restarted/stopped and no private data/AI request used for this redesign. Previous screenshots and browser results predate it.

User walkthrough on the existing local server (or start with npm run dev):

1. `/showcase`: let the existing nine-photo presentation load. Inspect the sculpture, move the pointer, pause/resume it and try both hero shortcuts.
2. Inspect at phone and desktop widths, including around850px and1120px. Navigation should remain reachable; the photo desk and source strip should retain their existing controls. Check with200% zoom and keyboard focus.
3. In Insights, inspect three city cards, chronology, filters, charts and receipt links. Values must still come from saved records and preserve example labels.
4. Inspect Photo desk, Compare, Evidence flow and Geographic map. Check source/weather disclosures and original image attribution.
5. Open Field notebook, Review desk, Evidence Lab and a presentation. Exercise the existing controls and confirm no panel text/buttons are clipped.
6. Enable OS reduced motion; check the still scene and keyboard controls. If WebGL2 is disabled/unavailable, static artwork and both hero shortcuts should remain usable.
7. Report the route, viewport/device, action and any screenshot or console message for a visual issue. No API key is required for this visual update.

Physical camera/microphone/GPS, actual offline installation, native downloads/imports, other browsers and expert review remain separate prior gaps. Decorative polish does not establish environmental accuracy or competition outcomes.
