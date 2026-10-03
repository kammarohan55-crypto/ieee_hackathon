import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import postcss from "postcss";

// Real helpers/components with explicit hook/JSX/media doubles; no browser or provider.
const require = createRequire(import.meta.url), cache = new Map();
function execute(file, imports) {
  const fixture = { exports: {} };
  const code = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { module: fixture, exports: fixture.exports, require: imports, structuredClone, crypto, Date }, { filename: file });
  return fixture.exports;
}
function library(name) {
  if (!cache.has(name)) cache.set(name, execute(`lib/${name}.ts`, (value) => value === "zod" ? require(value) : library(value.replace(/^\.\//, ""))));
  return cache.get(name);
}
const { presentationBrief, nextPresentationStage } = library("presentation-brief");
const { visitLinks } = library("visit-links");
const { createReport, assess } = library("assessment");
const { newField, createReferenceDraft } = library("field");
const { referencePhotos } = library("references");
const now = new Date("2026-10-02T03:00:00Z");
function record(id = "actual-fixture") {
  const input = { site: "Authored test site", observedAt: "2026-10-01T09:00:00Z", note: "I could not see the water. Its appearance is unknown.", appearance: "unsure", synthetic: false };
  return { ...createReport(input, assess(input, now), now, id), field: newField() };
}
function media() { return { id: "photo-fixture", kind: "photo", mime: "image/jpeg", bytes: 5, sha256: "a".repeat(64), createdAt: now.toISOString(), width: 100, height: 80, origin: "upload", quality: { brightness: 100, edgeDetail: 10, warnings: [], method: "canvas-luma-v1" } }; }
const results = [];
async function test(name, run) { try { await run(); results.push({ name, passed: true }); } catch (error) { results.push({ name, passed: false, error: error.message }); } }
await test("Readable brief preserves unusual original text literally and does not mutate reports", () => {
  const report = record(); report.original.note = "Original ```fence```\n[$()](https://example.test) <script>literal</script>\nUnknown remains unknown.";
  const original = JSON.stringify(report), brief = presentationBrief(report);
  assert.ok(brief.includes(report.original.note)); assert.match(brief, /````text\nOriginal ```fence```/); assert.equal(JSON.stringify(report), original);
});
await test("A reopened report retains earlier review as history without inventing current approval", () => {
  const report = record(); report.reviewHistory = [{ at: now.toISOString(), action: "reviewed", note: "Earlier human words.", actor: "demo_reviewer" }];
  const brief = presentationBrief(report);
  assert.match(brief, /Workflow: Awaiting local human review/); assert.match(brief, /Earlier human words/); assert.match(brief, /not scientific truth/);
});
await test("Visual brief uses latest human judgment and explicit unknown provider", () => {
  const report = record(), photo = media();
  photo.visual = { model: "recorded-vision", at: now.toISOString(), findings: [{ kind: "surface_foam", region: "center", confidence: "low" }] };
  report.field.media = [photo]; report.field.dispositions = [
    { mediaId: photo.id, finding: "surface_foam", decision: "supports", reason: "Old decision", at: now.toISOString(), actor: "demo_reviewer" },
    { mediaId: photo.id, finding: "surface_foam", decision: "disagrees", reason: "Reflection remains possible.", at: now.toISOString(), actor: "demo_reviewer" },
  ];
  const brief = presentationBrief(report); assert.match(brief, /Provider not retained/); assert.match(brief, /Current human judgment: disagrees/); assert.match(brief, /Reflection remains possible/); assert.ok(!brief.includes("Current human judgment: supports"));
});
await test("Historical photo brief retains catalogue credits without fabricated field context", () => {
  const source = referencePhotos[0], draft = createReferenceDraft(source), report = record();
  report.original = { ...draft.draft, note: "Historical photo test note." }; report.field = draft.field;
  const brief = presentationBrief(report); for (const item of [source.author, source.license, source.sourceUrl, source.capturedDate]) assert.ok(brief.includes(item));
  assert.match(brief, /Historical credited photograph review/); assert.ok(!brief.includes("latitude"));
});
await test("Synthetic records cannot become real evidence presentations", () => {
  const report = record(); report.original.synthetic = true; assert.throws(() => presentationBrief(report), /Synthetic/);
});
await test("Presentation navigation clamps at the first and last real chapter", () => {
  assert.equal(nextPresentationStage("evidence", -1), "evidence"); assert.equal(nextPresentationStage("evidence", 1), "assessment"); assert.equal(nextPresentationStage("receipt", 1), "receipt");
});
await test("Visit connections use explicit IDs rather than matching labels or proximity", () => {
  const first = record("a"), unrelated = record("same-label"), next = record("b"); next.field.followupOf = first.id;
  const links = visitLinks(first, [first, unrelated, next]); assert.deepEqual(links.children.map((r) => r.id), ["b"]); assert.equal(visitLinks(next, [first, next]).parent.id, "a");
});
await test("Visit connections preserve unavailable links and exclude historical/synthetic/self-links", () => {
  const report = record("a"), synthetic = record("b"), historical = record("c"); report.field.followupOf = "absent";
  synthetic.original.synthetic = true; synthetic.field.followupOf = report.id; historical.field.reference = referencePhotos[0]; historical.field.followupOf = report.id;
  assert.equal(visitLinks(report, [report, synthetic, historical]).missingParent, true); assert.equal(visitLinks(report, [report, synthetic, historical]).children.length, 0);
  report.field.followupOf = report.id; assert.equal(visitLinks(report, [report]).parent, undefined); assert.equal(visitLinks(historical, [report]).children.length, 0);
});
await test("Linked visits order unknown observation zones by valid creation time without inventing an instant", () => {
  const parent = record("parent"), early = record("early"), later = record("later");
  for (const child of [early, later]) { child.field.followupOf = parent.id; child.original.observedAt = "2026-01-01T09:00"; }
  early.createdAt = "2026-10-01T09:00:00Z"; later.createdAt = "2026-10-02T09:00:00Z";
  assert.deepEqual(visitLinks(parent, [later, early, parent]).children.map((item) => item.id), ["early", "later"]);
  early.original.observedAt = "1970-01-01T00:00:00Z";
  assert.deepEqual(visitLinks(parent, [later, early, parent]).children.map((item) => item.id), ["early", "later"]);
});

function hooks() { const slots = []; let cursor = 0; return { react: { useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], (next) => { slots[index] = typeof next === "function" ? next(slots[index]) : next; }]; } }, render(component, props) { cursor = 0; return component(props); } }; }
const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: "fragment" };
const icons = new Proxy({}, { get: (_, name) => `icon:${String(name)}` });
function nodes(value) { if (!value || typeof value !== "object") return []; if (Array.isArray(value)) return value.flatMap(nodes); return [value, ...nodes(value.props?.children)]; }
function textOf(value) { if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(textOf).join(""); return value?.props ? textOf(value.props.children) : ""; }
function fixture(report) {
  const runtime = hooks(), exports = [], props = { report };
  const { DecisionPresentation } = execute("components/decision-presentation.tsx", (name) => {
    if (name === "react") return runtime.react;
    if (name === "react/jsx-runtime") return jsx;
    if (name === "radix-ui") return { Dialog: new Proxy({}, { get: (_, key) => `Dialog.${String(key)}` }), Tabs: new Proxy({}, { get: (_, key) => `Tabs.${String(key)}` }) };
    if (name === "lucide-react") return icons;
    if (name === "./field-studio") return { EvidenceImage: "EvidenceImage" };
    if (name === "./demonstration-note") return { DemonstrationNote: "DemonstrationNote" }; // Provenance disclosure; no mutation handler.
    if (name === "./receipt-layers") return { ReceiptLayers: "ReceiptLayers" }; // Its actual data/interaction contracts are exercised below.
    if (name.startsWith("@/lib/")) { const lib = library(name.slice(6)); return name === "@/lib/field" ? { ...lib, downloadFile: (...args) => exports.push(args) } : lib; }
    throw new Error(`Unexpected import ${name}`);
  });
  const render = () => runtime.render(DecisionPresentation, props);
  return { render, exports, button(tree, label) { const result = nodes(tree).find((node) => node.type === "button" && textOf(node) === label); assert.ok(result, `Missing ${label}`); return result; } };
}
await test("Presentation chapter buttons remain bounded and reopening resets to original evidence", () => {
  const f = fixture(record()); let tree = f.render();
  assert.equal(f.button(tree, " Previous").props.disabled, true);
  for (let i = 0; i < 3; i++) { f.button(tree, "Next ").props.onClick(); tree = f.render(); }
  assert.equal(f.button(tree, "Next ").props.disabled, true); assert.equal(nodes(tree).find((n) => n.type === "Tabs.Root").props.value, "receipt");
  tree.props.onOpenChange(true); tree = f.render(); assert.equal(nodes(tree).find((n) => n.type === "Tabs.Root").props.value, "evidence");
});
await test("Presentation exports actual receipt and readable brief without approving the record", () => {
  const report = record(), before = JSON.stringify(report), f = fixture(report), tree = f.render();
  f.button(tree, " JSON receipt").props.onClick(); f.button(tree, " Readable brief").props.onClick();
  assert.equal(JSON.parse(f.exports[0][0]).report.status, "awaiting_review"); assert.ok(f.exports[1][0].includes(report.original.note)); assert.equal(JSON.stringify(report), before);
});
await test("Presentation switches actual media, labels missing files and never renders a synthetic report", () => {
  const report = record(), photo = media(); report.field.media = [photo, { ...photo, id: "second" }];
  const f = fixture(report); let tree = f.render(); f.button(tree, "Photo 2").props.onClick(); tree = f.render();
  const frame = nodes(tree).find((n) => n.type === "EvidenceImage"); assert.equal(frame.props.media.id, "second"); frame.props.onAvailability(false); tree = f.render(); assert.match(textOf(tree), /Media not loaded in this browser/);
  report.original.synthetic = true; assert.equal(f.render(), null);
});
await test("A reviewed import flag cannot manufacture missing, inconsistent or invalid human review", () => {
  const report = record(); report.status = "reviewed";
  assert.match(presentationBrief(report), /Workflow: Human review pending/);
  let tree = fixture(report).render();
  assert.match(textOf(tree), /Human review pending/);
  assert.ok(!nodes(tree).some((node) => node.props?.className?.includes("dp-review-status is-reviewed")));
  report.reviewHistory = [{ at: now.toISOString(), action: "needs_information", note: "Please clarify.", actor: "demo_reviewer" }];
  assert.match(presentationBrief(report), /Workflow: History needs inspection/);
  report.reviewHistory = [{ at: "not-a-time", action: "reviewed", note: "Retained words.", actor: "demo_reviewer" }];
  assert.match(presentationBrief(report), /Workflow: Human review pending/);
  tree = fixture(report).render(); assert.match(textOf(tree), /lacks a usable timestamp or explanation/);
});
await test("Usable review and confirmation metadata remain qualified rather than scientific approval", () => {
  const report = record(); report.status = "reviewed";
  report.reviewHistory = [{ at: now.toISOString(), action: "reviewed", note: "Evidence inspected; uncertainty retained.", actor: "demo_reviewer" }];
  assert.match(presentationBrief(report), /Workflow: (Human review recorded|Reviewed · limits retained) · local demo role/);
  assert.match(presentationBrief(report), /not scientific truth/);
  report.confirmedAt = "unknown";
  assert.match(presentationBrief(report), /confirmation needs inspection/);
});
await test("Presentation CSS parses and provides responsive/reduced-motion/focus styles", () => {
  const css = readFileSync("app/presentation.css", "utf8"); postcss.parse(css); assert.match(css, /prefers-reduced-motion/); assert.match(css, /max-width:460px/); assert.match(css, /:focus-visible/);
  const source = readFileSync("components/decision-presentation.tsx", "utf8"); for (const token of ["Dialog.Title", "Dialog.Description", "Dialog.Close", "Tabs.List", "aria-live"]) assert.ok(source.includes(token));
});
function layerFixture(report) {
  const runtime = hooks();
  const { ReceiptLayers } = execute("components/receipt-layers.tsx", (name) => {
    if (name === "react") return { ...runtime.react, useId: () => "authored-layer-fixture" };
    if (name === "react/jsx-runtime") return jsx;
    if (name === "lucide-react") return icons;
    if (name.startsWith("@/lib/")) return library(name.slice(6));
    throw new Error(`Unexpected layer import ${name}`);
  });
  return {
    render: () => runtime.render(ReceiptLayers, { report }),
    choose(tree, label) { const button = nodes(tree).find((node) => node.type === "button" && textOf(node).includes(label)); assert.ok(button, `Missing layer ${label}`); button.props.onClick(); },
    detail(tree) { return textOf(nodes(tree).find((node) => String(node.props?.className).startsWith("rl-detail "))); },
  };
}
await test("Receipt layer navigation and separation preserve unusual original evidence and every decision", () => {
  const report = record(); report.original.note = "Original <script>literal</script>\nUnknown remains unknown."; report.field.media = [media()];
  const original = JSON.stringify(report), f = layerFixture(report); let tree = f.render();
  assert.ok(f.detail(tree).includes(report.original.note)); assert.ok(f.detail(tree).includes(report.field.media[0].sha256));
  for (const label of ["Deterministic checks", "Optional AI proposals", "Explicit confirmation", "Human judgment", "Stack layers", "Separate layers", "Original evidence"]) { f.choose(tree, label); tree = f.render(); }
  assert.equal(JSON.stringify(report), original); assert.ok(f.detail(tree).includes(report.original.note));
});
await test("Receipt layers distinguish absent AI and invalid confirmation/review from approval", () => {
  const report = record(); report.status = "reviewed"; report.confirmedAt = "unknown";
  const original = JSON.stringify(report), f = layerFixture(report); let tree = f.render();
  f.choose(tree, "Optional AI proposals"); tree = f.render(); assert.match(f.detail(tree), /No AI candidates are retained/);
  f.choose(tree, "Explicit confirmation"); tree = f.render(); assert.match(f.detail(tree), /usable confirmation is not retained/);
  f.choose(tree, "Human judgment"); tree = f.render(); assert.match(f.detail(tree), /No review event retained/); assert.match(f.detail(tree), /does not approve/);
  assert.equal(JSON.stringify(report), original);
});
await test("Receipt AI layer retains latest human disagreement and unknown provider without claiming accuracy", () => {
  const report = record(), photo = media();
  photo.visual = { model: "authored-model", at: now.toISOString(), findings: [{ kind: "surface_foam", region: "center", confidence: "low" }] };
  report.field.media = [photo]; report.field.dispositions = [
    { mediaId: photo.id, finding: "surface_foam", decision: "supports", reason: "Earlier authored judgment", at: now.toISOString(), actor: "demo_reviewer" },
    { mediaId: photo.id, finding: "surface_foam", decision: "disagrees", reason: "Authored QA: reflection remains possible.", at: now.toISOString(), actor: "demo_reviewer" },
  ];
  const original = JSON.stringify(report), f = layerFixture(report); const initial = f.render(); f.choose(initial, "Optional AI proposals");
  const detail = f.detail(f.render()); assert.match(detail, /Provider not retained/); assert.match(detail, /low confidence · uncalibrated/); assert.match(detail, /Human: disagrees/); assert.match(detail, /reflection remains possible/); assert.ok(!detail.includes("Human: supports"));
  assert.equal(JSON.stringify(report), original);
});
await test("Receipt historical layer shows retained credit and digest availability limits without manufacturing a visit", () => {
  const source = referencePhotos[0], draft = createReferenceDraft(source), report = record();
  report.original = { ...draft.draft, note: "Authored software review of a historical photograph." }; report.field = draft.field;
  report.field.media = [{ ...media(), origin: "public_reference", sha256: source.sha256 }]; // Authored metadata fixture; no media bytes are supplied.
  const original = JSON.stringify(report), f = layerFixture(report), detail = f.detail(f.render());
  for (const value of [source.author, source.license, source.sha256]) assert.ok(detail.includes(value));
  assert.match(detail, /historical photograph/); assert.match(detail, /do not guarantee/); assert.equal(JSON.stringify(report), original);
});

const { riverStory } = library("river-stories");
function storyTree(records, photoId) {
  const runtime = hooks();
  const { RiverStories } = execute("components/river-stories.tsx", (name) => {
    if (name === "react") return runtime.react;
    if (name === "react/jsx-runtime") return jsx;
    if (name === "radix-ui") return { Dialog: new Proxy({}, { get: (_, key) => `Dialog.${String(key)}` }) };
    if (name === "lucide-react") return icons;
    if (name.startsWith("@/lib/")) return library(name.slice(6));
    throw new Error(`Unexpected import ${name}`);
  });
  const props = { records, onOpen() {}, initialCity: "coimbra" };
  let tree = runtime.render(RiverStories, props);
  if (photoId) {
    const photo = referencePhotos.find((item) => item.id === photoId);
    const button = nodes(tree).find((node) => node.type === "button" && node.props["aria-label"] === `View ${photo.title}, ${photo.capturedDate}`);
    assert.ok(button); button.props.onClick(); tree = runtime.render(RiverStories, props);
  }
  return tree;
}
await test("River stories keep the nine credited sources separate from an empty citizen collection", () => {
  const seen = new Set();
  for (const city of ["coimbra", "toulouse", "oslo"]) {
    const story = riverStory([], city);
    assert.equal(story.photos.length, 3); assert.equal(story.report, undefined); assert.equal(story.media, undefined);
    assert.deepEqual(Array.from(story.photos, (p) => p.capturedDate), Array.from(story.photos, (p) => p.capturedDate).sort());
    story.photos.forEach((p) => seen.add(p.id));
  }
  assert.equal(seen.size, 9);
});
await test("Invalid city and cross-city photo selection fall back to known source metadata without invented positions", () => {
  const fallback = riverStory([], "unknown", "hoffselva-oslo");
  assert.equal(fallback.place.id, "coimbra"); assert.ok(fallback.photo.id.startsWith("mondego-"));
  assert.equal(fallback.report, undefined); assert.equal(fallback.media, undefined);
});
function storyReport(id = "story-fixture", source = referencePhotos[0]) {
  const r = record(id), draft = createReferenceDraft(source);
  r.original = { ...draft.draft, note: "Authored test review; no real observer or ecological claim." };
  r.field = draft.field; r.field.media = [{ ...media(), origin: "public_reference", sha256: source.sha256 }];
  return r;
}
await test("Story candidates belong only to an exact source digest, never another media file", () => {
  const r = storyReport(), extra = { ...media(), id: "unrelated", sha256: "b".repeat(64), visual: { model: "authored-test", at: now.toISOString(), findings: [{ kind: "surface_foam", confidence: "low", region: "center" }] } };
  r.field.media.push(extra); const before = JSON.stringify(r);
  const s = riverStory([r], "coimbra", referencePhotos[0].id);
  assert.equal(s.report.id, r.id); assert.equal(s.media.sha256, referencePhotos[0].sha256); assert.equal(s.media.visual, undefined);
  assert.equal(JSON.stringify(r), before);
  const literalTree = storyTree([r], referencePhotos[0].id);
  assert.equal(textOf(nodes(literalTree).find((node) => node.type === "blockquote")), r.original.note);
  r.original.note = "";
  const blankBefore = JSON.stringify(r), emptyTree = storyTree([r], referencePhotos[0].id);
  assert.equal(textOf(nodes(emptyTree).find((node) => node.type === "blockquote")), "No original note retained.");
  assert.match(textOf(emptyTree), /Original note unavailable/); assert.ok(!textOf(emptyTree).includes("Literal retained original note"));
  assert.equal(JSON.stringify(r), blankBefore);
});
await test("Synthetic records and unmatched media cannot become a story review", () => {
  const synthetic = storyReport("synthetic"); synthetic.original.synthetic = true;
  const wrong = storyReport("wrong"); wrong.field.media[0].sha256 = "c".repeat(64);
  const origin = storyReport("origin"); origin.field.media[0].origin = "illustration";
  assert.equal(riverStory([synthetic, wrong, origin], "coimbra", referencePhotos[0].id).report, undefined);
});
await test("Story selection prefers usable recent creation time and leaves report order and originals intact", () => {
  const old = storyReport("old"), latest = storyReport("latest"), unknown = storyReport("unknown");
  old.createdAt = "2026-10-01T01:00:00Z"; latest.createdAt = "2026-10-02T01:00:00Z"; unknown.createdAt = "2026-10-03T10:00";
  const records = [old, unknown, latest], before = JSON.stringify(records);
  assert.equal(riverStory(records, "coimbra", referencePhotos[0].id).report.id, "latest"); assert.equal(JSON.stringify(records), before);
});

await mkdir(".sites-runtime/presentation-tests", { recursive: true });
await writeFile(".sites-runtime/presentation-tests/results.json", JSON.stringify({ generatedAt: new Date().toISOString(), passed: results.filter((r) => r.passed).length, total: results.length, liveAI: false, limitations: ["Authored software fixtures and explicit hooks/JSX/media doubles; no browser focus/rendering, downloads, live AI or scientific evaluation."], results }, null, 2));
for (const r of results) if (!r.passed) console.error(`FAIL ${r.name}: ${r.error}`);
console.log(`${results.filter((r) => r.passed).length}/${results.length} presentation/visit checks passed.`);
if (results.some((r) => !r.passed)) process.exitCode = 1;
