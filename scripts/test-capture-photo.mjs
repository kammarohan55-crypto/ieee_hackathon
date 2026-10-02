import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

// Execute real component functions with explicit hook, media and timer doubles.
// This verifies event logic; it does not render a browser or operate a camera.
const require = createRequire(import.meta.url);
const filenames = ["lib/ai-metadata.ts", "lib/field.ts", "lib/references.ts", "lib/atlas.ts", "lib/mission-control.ts", "lib/assessment.ts", "lib/evidence-lab.ts", ...["field-studio", "photo-inspector", "evidence-visuals", "mission-control"].map((name) => `components/${name}.tsx`)];
const source = new Map(await Promise.all(filenames.map(async (name) => [name, await readFile(name, "utf8")])));
const jsx = { Fragment: "fragment", jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) };
const icons = new Proxy({}, { get: (_, name) => `icon:${String(name)}` });
const plain = (value) => JSON.parse(JSON.stringify(value));
function execute(file, imports, globals = {}) {
  const fixtureModule = { exports: {} };
  const output = ts.transpileModule(source.get(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(output, { module: fixtureModule, exports: fixtureModule.exports, require: imports, Blob, File, URL, crypto, AbortSignal, ...globals }, { filename: file });
  return fixtureModule.exports;
}
const pure = new Map();
function library(file) {
  if (!pure.has(file)) pure.set(file, execute(file, (name) => name === "zod" ? require(name) : library(`lib/${name.replace("./", "")}.ts`)));
  return pure.get(file);
}
const field = library("lib/field.ts"), mission = library("lib/mission-control.ts");
function hooks() {
  const slots = []; let cursor = 0, pending = [];
  const api = {
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === "function" ? initial() : initial, set: (next) => { slots[index].value = typeof next === "function" ? next(slots[index].value) : next; } };
      return [slots[index].value, slots[index].set];
    },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useId() { const index = cursor++; return `fixture-${index}`; },
    useMemo(callback) { cursor++; return callback(); },
    useEffect(callback, dependencies) {
      const index = cursor++, old = slots[index];
      if (!old || dependencies.some((value, i) => !Object.is(value, old.dependencies[i]))) {
        pending.push(() => { old?.cleanup?.(); slots[index] = { dependencies, cleanup: callback() }; });
      }
    },
    useEffectEvent(callback) {
      const index = cursor++;
      const slot = slots[index] ??= { callback, event: (...args) => slots[index].callback(...args) };
      slot.callback = callback; return slot.event;
    },
  };
  return { api, render(component, props) { cursor = 0; pending = []; const tree = component(props); pending.forEach((effect) => effect()); return tree; }, unmount() { slots.forEach((slot) => slot?.cleanup?.()); } };
}
function component(file, runtime, overrides = {}, globals = {}) {
  return execute(file, (name) => {
    if (Object.hasOwn(overrides, name)) return overrides[name];
    if (name === "react") return runtime.api;
    if (name === "react/jsx-runtime") return jsx;
    if (name === "lucide-react") return icons;
    if (name === "zod") return require(name);
    if (name.startsWith("@/lib/")) return library(`lib/${name.slice(6)}.ts`);
    if (name.startsWith("@/components/ui/")) return new Proxy({}, { get: (_, value) => `ui:${String(value)}` });
    throw new Error(`Unmocked component import: ${name}`);
  }, globals);
}
function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
function textOf(tree) {
  if (typeof tree === "string" || typeof tree === "number") return String(tree);
  if (Array.isArray(tree)) return tree.map(textOf).join("");
  return tree?.props ? textOf(tree.props.children) : "";
}
function button(tree, text) { const found = nodes(tree).find((node) => node.type === "button" && textOf(node) === text); assert.ok(found, `Missing button ${text}`); return found; }
const drain = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const fixtureMedia = { id: "photo-fixture", kind: "photo", width: 0, height: 0, mime: "image/jpeg", bytes: 5, sha256: "a".repeat(64), origin: "upload", createdAt: "2026-10-01T12:00:00Z", quality: { brightness: 0, edgeDetail: 0, warnings: [], method: "canvas-luma-v1" } };
const results = [];
async function test(name, callback) { try { await callback(); results.push({ name, passed: true }); } catch (error) { results.push({ name, passed: false, error: error.message }); } }

function captureFixture() {
  const runtime = hooks(), frames = [], recorders = [], timers = new Map(), saved = [], updates = [];
  let nextTimer = 1, streamNumber = 0;
  const mediaStore = {
    inspectImage: async () => ({ width: 100, height: 80, quality: fixtureMedia.quality }),
    hashBlob: async () => "b".repeat(64), saveMedia: async (id, blob) => { saved.push({ id, blob }); },
  };
  class Recorder {
    constructor(stream) { this.stream = stream; this.state = "inactive"; this.mimeType = "video/webm"; this.stopCalls = 0; recorders.push(this); }
    start() { if (this.failStart) throw new Error("Mock recorder start failed"); this.state = "recording"; }
    stop() { this.stopCalls++; this.state = "inactive"; }
    finish() { this.ondataavailable?.({ data: new Blob(["Authored mocked clip bytes"], { type: this.mimeType }) }); this.onstop?.(); }
  }
  const document = { createElement: () => ({ getContext: () => ({ drawImage() {} }), toBlob: (callback) => frames.push(callback) }) };
  const navigator = { mediaDevices: { getUserMedia: async () => { const track = { stopped: false, stop() { this.stopped = true; } }; return { number: ++streamNumber, getTracks: () => [track] }; } } };
  const { FieldStudio } = component("components/field-studio.tsx", runtime, { "@/lib/media-store": mediaStore }, {
    navigator, document, MediaRecorder: Recorder, window: { MediaRecorder: Recorder },
    setTimeout: (callback, duration) => { const id = nextTimer++; timers.set(id, { callback, duration }); return id; }, clearTimeout: (id) => timers.delete(id),
  });
  const props = { value: field.newField(), aiReady: false, onChange: (value) => updates.push(value), onBusy() {} };
  const render = () => runtime.render(FieldStudio, props);
  let tree = render();
  nodes(tree).find((node) => node.type === "video").props.ref.current = { videoWidth: 100, videoHeight: 80, play: async () => {} };
  return { render, runtime, frames, recorders, timers, saved, updates, async open() { await button(tree, "Open live camera").props.onClick(); tree = render(); }, record() { return button(render(), "10s clip").props.onClick(); }, close() { button(render(), "Close camera").props.onClick(); }, poster() { assert.ok(frames.length); frames.shift()(new Blob(["Authored poster bytes"], { type: "image/jpeg" })); }, getTree: () => tree };
}
await test("Rapid clip activations acquire one recorder and one ten-second timer", async () => {
  const fixture = captureFixture(); await fixture.open();
  const click = button(fixture.render(), "10s clip").props.onClick;
  const first = click(), second = click();
  assert.equal(fixture.frames.length, 1); fixture.poster(); await Promise.all([first, second]);
  assert.equal(fixture.recorders.length, 1); assert.equal(fixture.timers.size, 1);
  assert.equal([...fixture.timers.values()][0].duration, 10000);
  [...fixture.timers.values()][0].callback(); assert.equal(fixture.recorders[0].stopCalls, 1);
  fixture.recorders[0].finish(); await drain();
  assert.equal(fixture.saved.length, 1); assert.equal(fixture.updates[0].media[0].kind, "video"); assert.equal(fixture.timers.size, 0);
});
await test("Manual clip stop retains one clip and clears its timer", async () => {
  const fixture = captureFixture(); await fixture.open(); const start = fixture.record(); fixture.poster(); await start;
  const stop = button(fixture.render(), "Stop").props.onClick; await stop(); await stop();
  assert.equal(fixture.recorders[0].stopCalls, 1); assert.equal(fixture.timers.size, 0);
  fixture.recorders[0].finish(); await drain(); assert.equal(fixture.saved.length, 1);
});
await test("Closing the camera during poster capture cancels the pending recorder", async () => {
  const fixture = captureFixture(); await fixture.open(); const start = fixture.record(); fixture.close(); fixture.poster(); await start;
  assert.equal(fixture.recorders.length, 0); assert.equal(fixture.timers.size, 0); assert.equal(fixture.saved.length, 0);
});
await test("Unmount during poster capture prevents a recorder from starting", async () => {
  const fixture = captureFixture(); await fixture.open(); const start = fixture.record(); fixture.runtime.unmount(); fixture.poster(); await start;
  assert.equal(fixture.recorders.length, 0); assert.equal(fixture.timers.size, 0);
});
await test("Poster capture failure releases the start guard for retry", async () => {
  const fixture = captureFixture(); await fixture.open(); const failed = fixture.record(); fixture.frames.shift()(null); await failed;
  assert.match(textOf(fixture.render()), /Capture failed/);
  const retry = fixture.record(); fixture.poster(); await retry;
  assert.equal(fixture.recorders.length, 1); assert.equal(fixture.timers.size, 1);
});
await test("Reopening the camera invalidates an old poster while allowing the new capture", async () => {
  const fixture = captureFixture(); await fixture.open(); const oldStart = fixture.record(); fixture.close();
  const tree = fixture.render(); await button(tree, "Open live camera").props.onClick(); const newStart = fixture.record();
  fixture.poster(); await oldStart; assert.equal(fixture.recorders.length, 0);
  fixture.poster(); await newStart; assert.equal(fixture.recorders.length, 1); assert.equal(fixture.timers.size, 1);
});
await test("Recorder errors clear their timer and suppress failed clip retention", async () => {
  const fixture = captureFixture(); await fixture.open(); const start = fixture.record(); fixture.poster(); await start;
  fixture.recorders[0].onerror(); fixture.recorders[0].finish(); await drain();
  assert.equal(fixture.timers.size, 0); assert.equal(fixture.saved.length, 0);
  assert.match(textOf(fixture.render()), /Video capture failed/);
});
await test("A failed recorder's late stop cannot clear a subsequent recorder's timer", async () => {
  const fixture = captureFixture(); await fixture.open(); const first = fixture.record(); fixture.poster(); await first;
  fixture.recorders[0].onerror(); const second = fixture.record(); fixture.poster(); await second;
  fixture.recorders[0].finish(); assert.equal(fixture.timers.size, 1); assert.equal(fixture.recorders[1].state, "recording");
  [...fixture.timers.values()][0].callback(); assert.equal(fixture.recorders[1].stopCalls, 1);
});
await test("Unmount while recording stops the recorder without retaining a clip", async () => {
  const fixture = captureFixture(); await fixture.open(); const start = fixture.record(); fixture.poster(); await start;
  fixture.runtime.unmount(); fixture.recorders[0].finish(); await drain();
  assert.equal(fixture.recorders[0].stopCalls, 1); assert.equal(fixture.timers.size, 0); assert.equal(fixture.saved.length, 0);
});

await test("Photo notes wait for decoded dimensions and use them without rewriting metadata", () => {
  for (const stored of [{ width: 0, height: 0 }, { width: 300, height: 300 }]) {
    const runtime = hooks(), saved = [], media = { ...fixtureMedia, ...stored };
    const frame = { key: "photo", width: stored.width || 4, height: stored.height || 3, media, report: { field: { annotations: [] } } };
    const before = plain(frame);
    const { PhotoInspector } = component("components/photo-inspector.tsx", runtime, { "./field-studio": { EvidenceImage: "evidence-image" } });
    const props = { frame, onAnnotate: (input) => saved.push(input) }, render = () => runtime.render(PhotoInspector, props);
    let tree = render(); assert.equal(button(tree, " Add visual note").props.disabled, true);
    const image = nodes(tree).find((node) => typeof node.type === "function" && node.type.name === "FrameImage");
    assert.ok(image); image.props.onAvailability(true); tree = render(); assert.equal(button(tree, " Add visual note").props.disabled, true);
    image.props.onDimensions({ width: 2000, height: 1000 }); tree = render();
    assert.equal(nodes(tree).find((node) => node.props?.className === "pi-image-plane").props.style["--frame-ratio"], 2);
    button(tree, " Add visual note").props.onClick(); tree = render();
    const plane = nodes(tree).find((node) => node.props?.className === "pi-image-plane");
    plane.props.onClick({ currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 300 }) }, clientX: 200, clientY: 49 });
    assert.equal(nodes(render()).filter((node) => node.type === "form").length, 0);
    plane.props.onClick({ currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 300 }) }, clientX: 200, clientY: 50 });
    tree = render(); nodes(tree).find((node) => node.type === "textarea").props.onChange({ target: { value: "Authored software test note" } });
    tree = render(); nodes(tree).find((node) => node.type === "form").props.onSubmit({ preventDefault() {} });
    assert.equal(saved[0].x, .5); assert.equal(saved[0].y, 0); assert.deepEqual(plain(frame), before);
  }
});
await test("Local image decoding forwards actual dimensions without re-reading bytes when callbacks change", async () => {
  const runtime = hooks(), dimensions = [], availability = [], reads = [], revoked = [];
  const { EvidenceImage } = component("components/field-studio.tsx", runtime, {
    "@/lib/media-store": { readMedia: async (id) => { reads.push(id); return new Blob(["Authored mock photo bytes"], { type: "image/jpeg" }); } },
  }, { URL: { createObjectURL: () => "blob:mock-image", revokeObjectURL: (url) => revoked.push(url) } });
  const props = { media: fixtureMedia, onAvailability: (value) => availability.push(value), onDimensions: (value) => dimensions.push(value) };
  const entry = EvidenceImage(props);
  runtime.render(entry.type, entry.props); await drain();
  let img = runtime.render(entry.type, entry.props); assert.equal(img.type, "img");
  img.props.onLoad({ currentTarget: { naturalWidth: 2000, naturalHeight: 1000 } });
  assert.deepEqual(plain(dimensions), [null, { width: 2000, height: 1000 }]);
  const changed = { ...entry.props, onDimensions: (value) => dimensions.push(value), onAvailability: (value) => availability.push(value) };
  img = runtime.render(entry.type, changed); await drain(); assert.deepEqual(reads, [fixtureMedia.id]);
  img.props.onError(); assert.equal(dimensions.at(-1), null); assert.equal(availability.at(-1), false);
  runtime.unmount(); assert.deepEqual(revoked, ["blob:mock-image"]);
});
await test("Reference image load forwards its natural dimensions and errors clear readiness", () => {
  const runtime = hooks(), dimensions = [], availability = [];
  const { FrameImage } = component("components/photo-inspector.tsx", runtime, { "./field-studio": { EvidenceImage: "evidence-image" } });
  const img = FrameImage({ frame: mission.evidenceFrames([])[0], onDimensions: (value) => dimensions.push(value), onAvailability: (value) => availability.push(value) });
  img.props.onLoad({ currentTarget: { naturalWidth: 2000, naturalHeight: 1000 } }); img.props.onError();
  assert.deepEqual(plain(dimensions), [{ width: 2000, height: 1000 }, null]); assert.deepEqual(availability, [true, false]);
});
await test("Comparison review actions always use the displayed A or B after either selector changes", () => {
  const runtime = hooks(), chosen = [], frames = mission.evidenceFrames([]);
  const { PhotoCompare } = component("components/evidence-visuals.tsx", runtime, { "./photo-inspector": { FrameImage: "frame-image" } });
  const props = { frames, onReview: (frame) => chosen.push(frame) }, render = () => runtime.render(PhotoCompare, props);
  let tree = render(); nodes(tree).find((node) => node.type === "select").props.onChange({ target: { value: frames[2].key } });
  tree = render(); const selectors = nodes(tree).filter((node) => node.type === "select"); selectors[1].props.onChange({ target: { value: frames[0].key } });
  tree = render(); button(tree, "Review A").props.onClick(); button(tree, "Review B").props.onClick();
  assert.equal(chosen[0].key, frames[2].key); assert.equal(chosen[1].key, frames[0].key);
  assert.match(button(tree, "Review A").props["aria-label"], new RegExp(frames[2].title));
});
await test("Mission control hides unrelated selected-frame actions and routes comparison receipts and sources", () => {
  const runtime = hooks(), opened = [], reviewed = [], compare = "photo-compare";
  const { MissionControl } = component("components/mission-control.tsx", runtime, {
    "./photo-inspector": { PhotoInspector: "photo-inspector", FrameImage: "frame-image" },
    "./evidence-visuals": { PhotoCompare: compare, EvidenceFlow: "evidence-flow", EvidenceReplay: "evidence-replay" },
    "./site-conditions": { SiteConditions: "site-conditions" }, "./geographic-evidence-map": { GeographicEvidenceMap: "geographic-map" },
    "./sampling-plan": { SamplingPlan: "sampling-plan" },
  }, { document: { addEventListener() {}, removeEventListener() {} } });
  const props = { records: [], aiReady: false, online: false, onStart() {}, onReviewReference: (photo) => reviewed.push(photo), onOpen: (id) => opened.push(id), onUpdate() {}, onInsights() {}, onKit() {} };
  let tree = runtime.render(MissionControl, props); button(tree, "Compare").props.onClick(); tree = runtime.render(MissionControl, props);
  assert.equal(nodes(tree).filter((node) => node.props?.className === "mc-frame-attribution" || node.type === "evidence-replay" || node.props?.className === "mc-start-review" || node.props?.className === "mc-inspector-source").length, 0);
  assert.equal(nodes(tree).filter((node) => node.type === "button" && /Review this photo|Write a photo review|Open full receipt/.test(textOf(node))).length, 0);
  const view = nodes(tree).find((node) => node.type === compare); view.props.onReview(view.props.frames[2]); view.props.onReview({ ...view.props.frames[1], report: { id: "saved-fixture" } });
  assert.equal(reviewed[0].id, view.props.frames[2].reference.id); assert.deepEqual(opened, ["saved-fixture"]);
});

await test("Photo consent expires on a changed provider scope and stale actions send no evidence", async () => {
  const runtime = hooks(); let readCount = 0;
  const { FieldStudio } = component("components/field-studio.tsx", runtime, {
    "@/lib/media-store": { readMedia: async () => { readCount++; throw new Error("Must not read evidence without current consent"); } },
  });
  const props = { value: { ...field.newField(), media: [fixtureMedia] }, aiReady: true, aiConsentScope: "synthetic-xai-scope", aiRecipients: "xAI (Grok)", onChange() {}, onBusy() {} };
  const render = () => runtime.render(FieldStudio, props);
  const checkbox = (tree) => nodes(nodes(tree).find((node) => node.type === "label" && node.props.className === "consent-row")).find((node) => node.type === "ui:Checkbox");
  let tree = render();
  assert.equal(checkbox(tree).props.checked, false);
  checkbox(tree).props.onCheckedChange(true);
  tree = render(); assert.equal(checkbox(tree).props.checked, true); assert.equal(button(tree, "Ask visual AI").props.disabled, false);
  props.aiConsentScope = "synthetic-groq-scope"; props.aiRecipients = "Groq";
  tree = render(); assert.equal(checkbox(tree).props.checked, false); assert.equal(button(tree, "Ask visual AI").props.disabled, true);
  await button(tree, "Ask visual AI").props.onClick(); assert.equal(readCount, 0);
  runtime.unmount();
});

await mkdir(".sites-runtime/component-tests", { recursive: true });
await writeFile(".sites-runtime/component-tests/capture-photo.json", JSON.stringify({ suite: "Capture and photo interaction regressions", generatedAt: new Date().toISOString(), passed: results.filter((result) => result.passed).length, total: results.length, limitations: ["Explicit mock hooks, media, storage and timers; no browser rendering, camera/device, IndexedDB, live provider or scientific test."], results }, null, 2));
for (const result of results) if (!result.passed) console.error(`FAIL ${result.name}: ${result.error}`);
console.log(`${results.filter((result) => result.passed).length}/${results.length} capture/photo interaction checks passed.`);
if (results.some((result) => !result.passed)) process.exitCode = 1;
