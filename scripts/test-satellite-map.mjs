import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import postcss from "postcss";

// Real date/style/component code with explicit React, MapLibre and DOM doubles.
// No browser, satellite request, WebGL rendering or field observation is tested.
const require = createRequire(import.meta.url);
const files = ["lib/european-sites.ts", "lib/weather-context.ts", "lib/satellite-context.ts", "lib/geographic.ts", "lib/atlas.ts", "lib/field.ts", "lib/assessment.ts", "lib/references.ts", "lib/ai-metadata.ts", "components/geographic-evidence-map.tsx"];
const sources = new Map(await Promise.all(files.map(async (file) => [file, await readFile(file, "utf8")])));
function execute(file, imports, globals = {}) {
  assert.ok(sources.has(file), `Missing source fixture dependency ${file}`);
  const fixtureModule = { exports: {} };
  const output = ts.transpileModule(sources.get(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(output, { module: fixtureModule, exports: fixtureModule.exports, require: imports, Date, ...globals }, { filename: file });
  return fixtureModule.exports;
}
const libraries = new Map();
function library(file) {
  if (!libraries.has(file)) libraries.set(file, execute(file, (name) => name === "zod" ? require(name) : library(`lib/${name.replace("./", "")}.ts`)));
  return libraries.get(file);
}
const satellite = library("lib/satellite-context.ts");
const now = new Date("2026-10-02T12:00:00Z");
const tests = [];
async function test(name, run) {
  try { await run(); tests.push({ name, passed: true }); }
  catch (error) { tests.push({ name, passed: false, error: error.stack }); }
}
const plain = (value) => JSON.parse(JSON.stringify(value));

await test("Satellite date validates actual calendar days and advertised request range", () => {
  for (const date of ["2000-02-24", "2024-02-29", "2026-10-02"]) assert.equal(satellite.validSatelliteDate(date, now), true);
  for (const date of ["2000-02-23", "2026-10-03", "2026-02-29", "2026-02-30", "2026-13-01", "2026-00-01", "2026-1-01", "", "default", "../../secret"]) assert.equal(satellite.validSatelliteDate(date, now), false, date);
});
await test("Default is yesterday UTC, including month/year boundaries", () => {
  assert.equal(satellite.defaultSatelliteDate(now), "2026-10-01");
  assert.equal(satellite.defaultSatelliteDate(new Date("2026-01-01T00:05:00Z")), "2025-12-31");
  assert.equal(satellite.defaultSatelliteDate(new Date("2026-10-02T01:00:00+05:30")), "2026-09-30");
});
await test("Day stepping respects leap days and lower/future bounds", () => {
  assert.equal(satellite.shiftSatelliteDate("2024-03-01", -1, now), "2024-02-29");
  assert.equal(satellite.shiftSatelliteDate("2000-02-24", -1, now), null);
  assert.equal(satellite.shiftSatelliteDate("2026-10-02", 1, now), null);
  assert.equal(satellite.shiftSatelliteDate("bad", 1, now), null);
});
await test("Observation-day shortcut converts real timestamps to UTC and leaves unknowns unknown", () => {
  assert.equal(satellite.satelliteObservationDate("2026-10-02T01:00:00+05:30", now), "2026-10-01");
  for (const timestamp of [undefined, "bad", "1999-01-01T00:00:00Z", "2026-10-03T00:00:00Z", "2026-02-30T00:00:00Z", "2026-10-01T24:00:00Z", "2026-10-01T09:00:00+24:00", "2026-10-01T10:00:00", "2026-10-01"]) assert.equal(satellite.satelliteObservationDate(timestamp, now), null);
});
await test("Tile URL uses verified layer/matrix/JPEG and WMTS row before column", () => {
  assert.equal(satellite.satelliteTileUrl("2026-09-30", now), "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2026-09-30/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpeg");
  assert.throws(() => satellite.satelliteTileUrl("2026-02-30", now));
});
await test("Raster style caps tile requests to z9 and retains NASA attribution", () => {
  const style = satellite.satelliteMapStyle("2026-09-30", now);
  const source = style.sources[satellite.SATELLITE_CONTEXT.sourceId];
  assert.equal(style.version, 8);
  assert.equal(source.type, "raster");
  assert.equal(source.tileSize, 256);
  assert.equal(source.maxzoom, 9);
  assert.match(source.attribution, /NASA GIBS \/ ESDIS/);
  assert.equal(style.layers.at(-1).source, satellite.SATELLITE_CONTEXT.sourceId);
});

const jsx = { Fragment: "fragment", jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) };
const icons = new Proxy({}, { get: (_, name) => `icon:${String(name)}` });
function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
function textOf(tree) {
  if (typeof tree === "string" || typeof tree === "number") return String(tree);
  if (Array.isArray(tree)) return tree.map(textOf).join("");
  return tree && typeof tree === "object" ? textOf(tree.props?.children) : "";
}
function button(tree, label) {
  const found = nodes(tree).find((node) => node.type === "button" && (textOf(node).includes(label) || node.props["aria-label"] === label));
  assert.ok(found, `Missing button ${label}`);
  return found;
}
function hooks() {
  const slots = []; let cursor = 0, effects = [];
  const api = {
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === "function" ? initial() : initial, set: (next) => { slots[index].value = typeof next === "function" ? next(slots[index].value) : next; } };
      return [slots[index].value, slots[index].set];
    },
    useMemo(callback, dependencies) {
      const index = cursor++, old = slots[index];
      if (!old || dependencies.some((value, i) => !Object.is(value, old.dependencies[i]))) slots[index] = { value: callback(), dependencies };
      return slots[index].value;
    },
    useCallback(callback, dependencies) { return api.useMemo(() => callback, dependencies); },
    useEffect(callback, dependencies) {
      const index = cursor++, old = slots[index];
      if (!old || dependencies.some((value, i) => !Object.is(value, old.dependencies[i]))) effects.push(() => { old?.cleanup?.(); slots[index] = { dependencies, cleanup: callback() }; });
    },
  };
  return { api, render(component, props) { cursor = 0; effects = []; const tree = component(props); nodes(tree).find((node) => node.props?.className === "geo-map").props.ref.current = {}; effects.forEach((effect) => effect()); return tree; }, unmount() { slots.forEach((slot) => slot?.cleanup?.()); } };
}
function mapFixture(records = [], options = {}) {
  const runtime = hooks(), maps = [], markers = [], timers = new Map(); let timerId = 0;
  class MockMap {
    constructor(options) { this.options = options; this.center = { lng: options.center[0], lat: options.center[1] }; this.zoom = options.zoom; this.bearing = options.bearing; this.events = {}; maps.push(this); }
    addControl() {}
    getCanvas() { return { setAttribute: (name, value) => { this.canvasLabel = value; } }; }
    on(event, callback) { this.events[event] = callback; }
    getCenter() { return this.center; }
    getZoom() { return this.zoom; }
    getBearing() { return this.bearing; }
    fitBounds(bounds, options) { this.fit = { bounds, options }; }
    easeTo(options) { this.ease = options; }
    flyTo(options) { this.flight = options; }
    setProjection(options) { this.projection = options; }
    setSky(options) { this.sky = options; }
    jumpTo(options) { this.jump = options; }
    resize() {}
    remove() { this.removed = true; }
  }
  class MockMarker {
    constructor(options) { this.options = options; markers.push(this); }
    setLngLat(coordinates) { this.coordinates = coordinates; return this; }
    addTo(map) { this.map = map; return this; }
    remove() { this.removed = true; }
  }
  const component = execute("components/geographic-evidence-map.tsx", (name) => {
    if (name === "react") return runtime.api;
    if (name === "react/jsx-runtime") return jsx;
    if (name === "lucide-react") return icons;
    if (name === "@/lib/maplibre-client") return { Map: MockMap, Marker: MockMarker, NavigationControl: class {} };
    if (name === "./european-context") return { EuropeanContext: "public-context-component-double" };
    if (name.startsWith("@/lib/")) return library(`lib/${name.slice(6)}.ts`);
    throw new Error(`Unmocked import ${name}`);
  }, {
    setTimeout: (callback) => { timers.set(++timerId, callback); return timerId; }, clearTimeout: (id) => timers.delete(id),
    ResizeObserver: class { observe() {} disconnect() { this.disconnected = true; } },
    document: { createElement: () => ({ attributes: {}, children: [], dataset: {}, setAttribute(name, value) { this.attributes[name] = value; }, appendChild(child) { this.children.push(child); } }) },
    window: { matchMedia: () => ({ matches: true }) },
  }).GeographicEvidenceMap;
  const props = { records, onOpen: () => {}, ...options };
  return { maps, markers, timers, render: () => runtime.render(component, props), setRecords: (next) => { props.records = next; }, unmount: () => runtime.unmount() };
}
async function flush() { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); }
const record = { id: "real-example", original: { site: "Supplied site", observedAt: "2026-09-30T12:00:00Z", note: "Original note", synthetic: false }, status: "awaiting_review", field: { coordinates: { lat: 18.52, lon: 73.85, method: "manual" }, media: [] } };

await test("Empty collection opens a neutral world satellite explorer without creating evidence", async () => {
  const fixture = mapFixture(); const tree = fixture.render(); await flush();
  assert.equal(fixture.maps.length, 1);
  assert.deepEqual(plain(fixture.maps[0].options.center), [0, 15]);
  assert.equal(fixture.maps[0].options.maxZoom, 9);
  assert.equal(fixture.markers.length, 0);
  assert.match(textOf(tree), /world satellite context/);
  assert.match(textOf(tree), /No observation positions are plotted/);
  assert.match(textOf(tree), /0plotted records0not plotted/);
  assert.match(textOf(tree), /cannot establish water quality/);
  assert.match(textOf(tree), /not retained as citizen evidence or used in assessment grades/);
  fixture.unmount(); assert.equal(fixture.maps[0].removed, true);
});
await test("Date changes preserve the map camera, requested timestamp and citizen marker coordinates", async () => {
  const fixture = mapFixture([record]); fixture.render(); await flush();
  const firstMap = fixture.maps[0]; firstMap.center = { lng: 74, lat: 19 }; firstMap.zoom = 7;
  firstMap.events.load(); const tree = fixture.render();
  button(tree, "Request observation day").props.onClick(); fixture.render(); await flush();
  const nextMap = fixture.maps.at(-1);
  assert.equal(firstMap.removed, true);
  assert.deepEqual(plain(nextMap.options.center), [74, 19]);
  assert.equal(nextMap.options.zoom, 7);
  assert.match(nextMap.options.style.sources[satellite.SATELLITE_CONTEXT.sourceId].tiles[0], /2026-09-30/);
  assert.deepEqual(plain(fixture.markers.at(-1).coordinates), [73.85, 18.52]);
  assert.equal(record.original.note, "Original note");
  fixture.unmount();
});
await test("The first supplied location replaces the empty world camera and further location sets refit", async () => {
  const fixture = mapFixture(); fixture.render(); await flush();
  fixture.maps[0].events.load(); fixture.render();
  fixture.setRecords([record]); fixture.render(); await flush();
  const firstLocatedMap = fixture.maps.at(-1);
  assert.deepEqual(plain(firstLocatedMap.options.center), [73.85, 18.52]);
  assert.equal(firstLocatedMap.options.zoom, 9);
  const second = { ...record, id: "second-location", field: { ...record.field, coordinates: { lat: 20, lon: 80, method: "manual" } } };
  fixture.setRecords([record, second]); fixture.render(); await flush();
  const changedMap = fixture.maps.at(-1);
  assert.ok(changedMap.fit, "Changing the set of coordinates should fit its bounds");
  assert.equal(changedMap.fit.options.maxZoom, 9);
  const bounds = plain(changedMap.fit.bounds);
  assert.ok(Math.abs(bounds[0][0] - 73.85) < 1e-9);
  assert.deepEqual([bounds[0][1], ...bounds[1]], [18.52, 80, 20]);
  fixture.unmount();
});
await test("New/reordered records at unchanged coordinates preserve the user's camera", async () => {
  const second = { ...record, id: "second-location", field: { ...record.field, coordinates: { lat: 20, lon: 80, method: "manual" } } };
  const fixture = mapFixture([record, second]); fixture.render(); await flush();
  const firstMap = fixture.maps[0]; firstMap.center = { lng: 76, lat: 19 }; firstMap.zoom = 6; firstMap.bearing = 30;
  const sameLocation = { ...record, id: "same-location-added" };
  fixture.setRecords([second, sameLocation, record]); fixture.render(); await flush();
  const nextMap = fixture.maps.at(-1);
  assert.deepEqual(plain(nextMap.options.center), [76, 19]);
  assert.equal(nextMap.options.zoom, 6); assert.equal(nextMap.options.bearing, 30);
  assert.equal(nextMap.fit, undefined);
  fixture.unmount();
});
await test("Retry initializes the selected marker before any new load/status event", async () => {
  const fixture = mapFixture([record]); fixture.render(); await flush();
  const firstMap = fixture.maps[0]; firstMap.events.load(); fixture.render();
  assert.equal(fixture.markers[0].options.element.attributes["aria-pressed"], "true");
  firstMap.events.error(); const tree = fixture.render();
  button(tree, "Retry map").props.onClick(); fixture.render(); await flush();
  assert.equal(fixture.maps.length, 2);
  assert.equal(fixture.markers.at(-1).options.element.attributes["aria-pressed"], "true");
  fixture.unmount();
});
await test("Tile errors retain evidence and expose a labeled street-map fallback", async () => {
  const fixture = mapFixture([record]); fixture.render(); await flush();
  fixture.maps[0].events.error(); const tree = fixture.render();
  assert.match(textOf(tree), /Satellite tiles unavailable or incomplete/);
  assert.match(textOf(tree), /Original note/);
  button(tree, "Use street map").props.onClick(); fixture.render(); await flush();
  assert.equal(fixture.maps.at(-1).options.style, "https://tiles.openfreemap.org/styles/dark");
  assert.equal(fixture.markers.at(-1).map, fixture.maps.at(-1));
  fixture.unmount();
});
await test("Satellite timeout reports incomplete coverage and a later error remains limited on load", async () => {
  const fixture = mapFixture(); fixture.render(); await flush();
  [...fixture.timers.values()][0](); assert.match(textOf(fixture.render()), /Satellite tiles unavailable or incomplete/);
  fixture.maps[0].events.error(); fixture.maps[0].events.load();
  assert.match(textOf(fixture.render()), /Satellite tiles unavailable or incomplete/);
  fixture.unmount();
});
await test("Invalid entered day does not replace the requested tiles", async () => {
  const fixture = mapFixture(); fixture.render(); await flush();
  const firstMap = fixture.maps[0]; let tree = fixture.render();
  nodes(tree).find((node) => node.type === "input").props.onChange({ target: { value: "2026-02-30" } });
  tree = fixture.render(); nodes(tree).find((node) => node.type === "form").props.onSubmit({ preventDefault() {} });
  tree = fixture.render(); await flush();
  assert.match(textOf(tree), /Choose a real UTC date/);
  assert.equal(fixture.maps.length, 1); assert.equal(firstMap.removed, undefined);
  fixture.unmount();
});
await test("Context controls and source styles parse and use scoped selectors", () => {
  const css = postcss.parse(require("node:fs").readFileSync("app/geographic-map.css", "utf8"));
  const contextSelectors = [];
  css.walkRules((rule) => { if (/geo-(satellite|context-controls|date-controls|basemap-switch|observation-day)/.test(rule.selector)) contextSelectors.push(rule.selector); });
  assert.ok(contextSelectors.length > 15);
  assert.ok(contextSelectors.every((selector) => selector.split(",").every((part) => part.trim().startsWith(".geographic-evidence "))));
});

await test("Historical landscape uses the verified anonymous annual KVP contract and bounds", () => {
  const source = satellite.landscapeMapStyle().sources[satellite.LANDSCAPE_CONTEXT.sourceId];
  const url = new URL(source.tiles[0]);
  assert.equal(url.origin, "https://wmts.terrascope.be"); assert.equal(url.searchParams.get("SERVICE"), "WMTS");
  assert.equal(url.searchParams.get("LAYER"), "esa-worldcover-s2rgbnir-10m-2021-v2_tcc"); assert.equal(url.searchParams.get("TIME"), "2021-01-01");
  assert.equal(url.searchParams.get("TILEMATRIX"), "{z}"); assert.equal(url.searchParams.get("TILECOL"), "{x}"); assert.equal(url.searchParams.get("TILEROW"), "{y}");
  assert.equal(source.minzoom, 6); assert.equal(source.maxzoom, 14); assert.equal(source.tileSize, 256); assert.deepEqual(plain(source.bounds), [-180, -60, 180, 83]);
  assert.match(source.attribution, /ESA WorldCover.*2021/); assert.match(source.attribution, /CC BY 4.0/);
});
await test("Historical imagery preserves actual markers/camera and never uses the NASA request day", async () => {
  const fixture = mapFixture([record]); fixture.render(); await flush(); fixture.maps[0].center = { lng: 73.9, lat: 18.6 }; fixture.maps[0].zoom = 8; fixture.maps[0].events.load();
  button(fixture.render(), "Landscape").props.onClick(); fixture.render(); await flush();
  const map = fixture.maps.at(-1); assert.deepEqual(plain(map.options.center), [73.9, 18.6]); assert.equal(map.options.maxZoom, 14);
  assert.match(map.options.style.sources[satellite.LANDSCAPE_CONTEXT.sourceId].tiles[0], /TIME=2021-01-01/); assert.deepEqual(plain(fixture.markers.at(-1).coordinates), [73.85, 18.52]);
  const tree = fixture.render(); assert.equal(nodes(tree).filter((node) => node.type === "input" && node.props.type === "date").length, 0); assert.match(textOf(tree), /Annual median/); assert.match(textOf(tree), /no NDWI/);
  fixture.unmount();
});
await test("An empty historical explorer stays empty and explicit detail zoom respects reduced motion", async () => {
  const fixture = mapFixture(); fixture.render(); await flush(); fixture.maps[0].events.load();
  button(fixture.render(), "Landscape").props.onClick(); fixture.render(); await flush(); const map = fixture.maps.at(-1); map.events.load();
  const tree = fixture.render(); button(tree, "Zoom to landscape detail").props.onClick(); assert.equal(map.ease.zoom, 6); assert.equal(map.ease.duration, 0); assert.equal(fixture.markers.length, 0); assert.match(textOf(tree), /No observation positions are plotted/);
  fixture.unmount();
});
await test("Historical tile failures and uncovered recorded latitudes expose street fallback", async () => {
  const polar = { ...record, id: "latitude-84", field: { ...record.field, coordinates: { lat: 84, lon: 10, method: "manual" } } };
  const fixture = mapFixture([polar]); fixture.render(); await flush(); button(fixture.render(), "Landscape").props.onClick(); fixture.render(); await flush();
  fixture.maps.at(-1).events.error(); const tree = fixture.render(); assert.match(textOf(tree), /outside this historical layer/); assert.equal(fixture.markers.at(-1).coordinates[1], 84);
  button(tree, "Use street map").props.onClick(); fixture.render(); await flush(); assert.equal(fixture.maps.at(-1).options.style, "https://tiles.openfreemap.org/styles/dark");
  fixture.unmount();
});
await test("Location labels preserve date-only precision and do not infer a missing time zone", async () => {
  const dateOnly = { ...record, original: { ...record.original, observedAt: "2023-06-06" } };
  const fixture = mapFixture([dateOnly]); let tree = fixture.render(); await flush(); tree = fixture.render();
  assert.match(textOf(tree), /6 Jun 2023 · date only/); assert.ok(!textOf(tree).includes("00:00 UTC"));
  fixture.setRecords([{ ...dateOnly, original: { ...dateOnly.original, observedAt: "2026-09-30T09:00:00" } }]); fixture.render(); await flush(); tree = fixture.render();
  assert.match(textOf(tree), /Observation time zone not supplied/); fixture.unmount();
});
await test("An invalid imported day or clock never becomes a normalized map observation", async () => {
  for (const observedAt of ["2026-02-30T09:00:00Z", "2026-10-01T24:00:00Z", "2026-02-29"]) {
    const fixture = mapFixture([{ ...record, original: { ...record.original, observedAt } }]);
    fixture.render(); await flush(); const tree = fixture.render();
    assert.match(textOf(tree), /Observation (?:date|time) invalid/);
    assert.match(textOf(tree), /No valid observation day/);
    assert.ok(!textOf(tree).includes("Request observation day"));
    fixture.unmount();
  }
});
await test("European source context opens a real city overview while citizen counts stay zero", async () => {
  const fixture = mapFixture([], { publicContext: true }); const tree = fixture.render(); await flush();
  assert.deepEqual(plain(fixture.maps[0].options.center), [10, 38]);
  assert.equal(fixture.maps[0].options.zoom, 1.45); assert.equal(fixture.markers.length, 3);
  fixture.maps[0].events.load();
  assert.equal(fixture.maps[0].projection.type, "globe");
  assert.match(textOf(tree), /0plotted records0not plotted/); assert.match(textOf(tree), /Not the camera position/);
  assert.ok(fixture.markers.every((m) => m.options.element.attributes["aria-label"].includes("not a citizen observation")));
  fixture.unmount(); assert.ok(fixture.markers.every((m) => m.removed));
});
await test("European city selection moves the map without rewriting or manufacturing a field record", async () => {
  const fixture = mapFixture([record], { publicContext: true }); fixture.render(); await flush();
  const original = JSON.stringify(record); const tree = fixture.render();
  button(tree, "Hoffselva").props.onClick(); const next = fixture.render();
  assert.deepEqual(plain(fixture.maps[0].flight.center), [10.738889, 59.913333]);
  assert.equal(fixture.maps[0].flight.duration, 0); assert.equal(fixture.maps[0].flight.pitch, 45); assert.match(textOf(next), /Hoffselva · Oslo/);
  assert.equal(JSON.stringify(record), original); assert.equal(fixture.markers.length, 4);
  const citizen = fixture.markers.find((marker) => marker.options.element.attributes["aria-label"].includes("recorded observation"));
  assert.deepEqual(plain(citizen.coordinates), [73.85, 18.52]);
  fixture.unmount();
});
await test("Unknown reference city falls back to sourced context; Europe overview fits actual centres with a world-scale street layer", async () => {
  const fixture = mapFixture([], { publicContext: true, initialReferenceCity: "unknown-city" }); fixture.render(); await flush();
  fixture.maps[0].events.load(); const tree = fixture.render(); button(tree, "European overview").props.onClick();
  const bounds = plain(fixture.maps[0].fit.bounds);
  assert.equal(bounds[0][1], 40.211111); assert.equal(bounds[1][1], 59.913333);
  assert.equal(fixture.maps[0].fit.options.maxZoom, 6);
  assert.match(textOf(tree), /European overview/);
  fixture.render(); await flush();
  assert.equal(fixture.maps.at(-1).options.style, "https://tiles.openfreemap.org/styles/dark");
  assert.match(textOf(fixture.render()), /0plotted records0not plotted/);
  fixture.unmount();
});

await test("Globe and flat perspectives keep all records intact and reset pitch without forced motion", async () => {
  const original = JSON.stringify(record), fixture = mapFixture([record], { publicContext: true });
  fixture.render(); await flush(); const map = fixture.maps[0]; map.events.load();
  button(fixture.render(), "Flat map").props.onClick();
  assert.equal(map.projection.type, "mercator"); assert.equal(map.ease.pitch, 0); assert.equal(map.ease.duration, 0);
  button(fixture.render(), "Globe overview").props.onClick();
  assert.equal(map.projection.type, "globe"); assert.deepEqual(plain(map.jump.center), [10, 38]);
  assert.equal(map.jump.zoom, 1.45); assert.equal(JSON.stringify(record), original);
  fixture.unmount(); assert.ok(map.removed);
});

await test("Globe request from historical landscape restores world-scale streets and preserves source/coordinate separation", async () => {
  const fixture = mapFixture([], { publicContext: true }); fixture.render(); await flush();
  fixture.maps[0].events.load(); button(fixture.render(), "Landscape · 2021").props.onClick();
  fixture.render(); await flush(); fixture.maps.at(-1).events.load();
  button(fixture.render(), "Globe overview").props.onClick();
  const tree = fixture.render(); await flush();
  assert.equal(fixture.maps.at(-1).options.style, "https://tiles.openfreemap.org/styles/dark");
  assert.equal(fixture.maps.at(-1).options.zoom, 1.45);
  assert.match(textOf(tree), /0plotted records0not plotted/);
  assert.match(textOf(tree), /Not the camera position/);
  fixture.unmount();
});
for (const result of tests) console.log(`${result.passed ? "PASS" : "FAIL"} ${result.name}${result.error ? `: ${result.error}` : ""}`);
console.log(`${tests.filter((result) => result.passed).length}/${tests.length} satellite/map checks passed; no browser or live imagery validation.`);
if (tests.some((result) => !result.passed)) process.exitCode = 1;
