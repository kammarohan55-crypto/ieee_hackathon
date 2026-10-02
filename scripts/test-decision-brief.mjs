import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import postcss from "postcss";

// Real domain and component event logic with explicit React/network doubles.
// No browser, live AI, seed record or environmental validation is involved.
const require = createRequire(import.meta.url);
const filenames = ["ai-metadata", "references", "field", "assessment", "evidence-lab"].map((name) => `lib/${name}.ts`);
filenames.push("components/evidence-lab.tsx", "lib/validation-report.ts");
const sources = new Map(await Promise.all(filenames.map(async (file) => [file, await readFile(file, "utf8")])));
function execute(file, imports, globals = {}) {
  const output = ts.transpileModule(sources.get(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const fixtureModule = { exports: {} };
  vm.runInNewContext(output, { module: fixtureModule, exports: fixtureModule.exports, require: imports, Date, AbortController, ...globals }, { filename: file });
  return fixtureModule.exports;
}
const libraries = new Map();
function library(file) {
  if (!libraries.has(file)) libraries.set(file, execute(file, (name) => name === "zod" ? require(name) : library(`lib/${name.replace("./", "")}.ts`)));
  return libraries.get(file);
}
const { labDecisionBrief } = library("lib/evidence-lab.ts");
const { newField } = library("lib/field.ts");
const base = () => ({ schemaVersion: "1.0", id: "authored-brief-fixture", createdAt: "2026-10-02T10:00:00Z", confirmedAt: "2026-10-02T10:00:00Z", status: "awaiting_review", original: { site: "Test footbridge", observedAt: "2026-10-02T09:00:00Z", note: "The appearance was not clear from this position.", appearance: "unsure", synthetic: false }, assessment: { issues: [], mode: "rules", notice: "Local authored test record", version: "test-version" }, reviewHistory: [], history: [], field: newField() });
const review = (action = "reviewed") => ({ action, note: "Visibility is limited; uncertainty stays in the report.", at: "2026-10-02T11:00:00Z", actor: "demo_reviewer" });
const media = () => ({ id: "fixture-photo", kind: "photo", mime: "image/jpeg", bytes: 3, sha256: "a".repeat(64), width: 100, height: 100, createdAt: "2026-10-02T09:00:00Z", origin: "upload", quality: { brightness: 1, edgeDetail: 1, warnings: [], method: "canvas-luma-v1" }, visual: { model: "authored-test-model", provider: "xai", at: "2026-10-02T10:00:00Z", findings: [{ kind: "surface_foam", region: "center", confidence: "low" }] } });
function judgment(decision) { return { mediaId: "fixture-photo", finding: "surface_foam", decision, reason: "Authored test judgment, not a real observation.", at: "2026-10-02T11:00:00Z", actor: "demo_reviewer" }; }
const results = [];
async function test(name, callback) { try { await callback(); results.push({ name, passed: true }); } catch (error) { results.push({ name, passed: false, error: error.message }); } }

await test("A status label cannot invent a missing human review event", () => {
  const report = base(); report.status = "reviewed";
  const brief = labDecisionBrief(report);
  assert.equal(brief.reviewComplete, false); assert.equal(brief.label, "Human review pending");
  assert.ok(brief.gaps.some((gap) => gap.includes("No human review event")));
});
await test("Actual review action, explanation and timestamp are required for the brief", () => {
  for (const partial of [{ note: "" }, { at: "not-a-time" }, { at: "7" }, { at: "2026-02-31T10:00:00Z" }]) {
    const report = base(); report.status = "reviewed"; report.reviewHistory = [{ ...review(), ...partial }];
    assert.equal(labDecisionBrief(report).reviewComplete, false);
    assert.equal(labDecisionBrief(report).reviewTimestampKnown, !Object.hasOwn(partial, "at"));
  }
});
await test("Requested information remains an open human workflow", () => {
  const report = base(); report.status = "needs_information"; report.reviewHistory = [review("needs_information")];
  const brief = labDecisionBrief(report);
  assert.equal(brief.label, "Information requested"); assert.equal(brief.reviewComplete, false);
});
await test("An inconsistent workflow status directs readers to the retained history", () => {
  const report = base(); report.reviewHistory = [review()];
  const brief = labDecisionBrief(report);
  assert.equal(brief.statusMismatch, true); assert.equal(brief.reviewComplete, false); assert.equal(brief.label, "History needs inspection");
});
await test("Missing GPS and absent instruments never become mandatory readiness gaps", () => {
  const report = base(); report.status = "reviewed"; report.reviewHistory = [review()];
  const brief = labDecisionBrief(report);
  assert.equal(brief.gaps.length, 0); assert.equal(brief.label, "Human review recorded");
});
await test("A missing or invalid citizen timestamp is preserved as unknown", () => {
  for (const confirmedAt of ["", "bad timestamp", "7", "2026-10-02", "2026-02-31T10:00:00Z"]) {
    const report = base(); report.confirmedAt = confirmedAt;
    assert.equal(labDecisionBrief(report).confirmed, false);
  }
});
await test("Invalid or zone-free observation times remain explicit brief gaps", () => {
  for (const observedAt of ["2026-02-30T09:00:00Z", "2026-02-29", "2026-10-01T24:00:00Z", "7", ""]) {
    const report = base(); report.original.observedAt = observedAt;
    assert.ok(labDecisionBrief(report).gaps.some((gap) => gap.includes("observation time")), observedAt);
  }
  const report = base(); report.original.observedAt = "2026-10-01T09:00";
  assert.ok(labDecisionBrief(report).gaps.some((gap) => gap.includes("time zone is unknown")));
  assert.equal(report.original.observedAt, "2026-10-01T09:00");
});
await test("A valid source day or supplied offset keeps its actual evidence precision", () => {
  for (const observedAt of ["2024-02-29", "2026-10-01T09:00+05:30", "2026-10-01T09:00:00Z"]) {
    const report = base(); report.original.observedAt = observedAt;
    assert.ok(!labDecisionBrief(report).gaps.some((gap) => gap.includes("observation time")), observedAt);
  }
});
await test("Unjudged and explicitly uncertain visual candidates are distinguished", () => {
  const report = base(); report.field.media = [media()];
  let brief = labDecisionBrief(report);
  assert.equal(brief.visualUnjudged, 1); assert.equal(brief.visualUncertain, 0);
  report.field.dispositions.push(judgment("uncertain")); brief = labDecisionBrief(report);
  assert.equal(brief.visualUnjudged, 0); assert.equal(brief.visualUncertain, 1);
});
await test("The latest human finding judgment supersedes prior disagreement without deleting it", () => {
  const report = base(); report.field.media = [media()]; report.field.dispositions = [judgment("disagrees"), judgment("supports")];
  assert.equal(labDecisionBrief(report).visualDisagreements, 0); assert.equal(report.field.dispositions.length, 2);
});
await test("Review retains disagreement and uncertainty instead of inventing resolution", () => {
  const report = base(); report.status = "reviewed"; report.reviewHistory = [review()]; report.field.media = [media()]; report.field.dispositions = [judgment("disagrees")];
  const brief = labDecisionBrief(report);
  assert.equal(brief.reviewComplete, true); assert.equal(brief.label, "Reviewed · limits retained"); assert.equal(brief.visualDisagreements, 1);
});
await test("Warnings on supplied instrument metadata and image usability remain inspectable", () => {
  const report = base(); report.field.measurements = [{ parameter: "pH", value: 7, unit: "pH", instrument: "", calibration: "unknown", method: "citizen_instrument" }];
  const photo = media(); photo.quality.warnings = ["Authored low-detail fixture"]; report.field.media = [photo];
  const gaps = labDecisionBrief(report).gaps;
  assert.ok(gaps.some((gap) => gap.includes("instrument reading"))); assert.ok(gaps.some((gap) => gap.includes("image-usability")));
});
await test("A brief never modifies original notes, AI results or human history", () => {
  const report = base(); report.field.media = [media()]; report.reviewHistory = [review()];
  const before = JSON.stringify(report); labDecisionBrief(report); assert.equal(JSON.stringify(report), before);
});

function hooks() {
  const slots = []; let cursor = 0, effects = [];
  const api = {
    useId() { return `brief-fixture-${cursor++}`; },
    useState(initial) { const index = cursor++; slots[index] ??= { value: typeof initial === "function" ? initial() : initial, set: (next) => { slots[index].value = typeof next === "function" ? next(slots[index].value) : next; } }; return [slots[index].value, slots[index].set]; },
    useMemo(callback) { cursor++; return callback(); },
    useEffect(callback, dependencies) { const index = cursor++, old = slots[index]; if (!old || dependencies.some((entry, i) => !Object.is(entry, old.dependencies[i]))) effects.push(() => { old?.cleanup?.(); slots[index] = { dependencies, cleanup: callback() }; }); },
  };
  return { api, render(component, props) { cursor = 0; effects = []; const tree = component(props); effects.forEach((effect) => effect()); return tree; }, unmount() { slots.forEach((slot) => slot?.cleanup?.()); } };
}
const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: "fragment" };
const icons = new Proxy({}, { get: (_, name) => `icon:${String(name)}` });
function nodes(tree) { if (!tree || typeof tree !== "object") return []; if (Array.isArray(tree)) return tree.flatMap(nodes); return [tree, ...nodes(tree.props?.children)]; }
function textOf(tree) { if (typeof tree === "string" || typeof tree === "number") return String(tree); if (Array.isArray(tree)) return tree.map(textOf).join(""); return tree?.props ? textOf(tree.props.children) : ""; }
const drain = async () => { for (let i = 0; i < 14; i++) await Promise.resolve(); };
function componentFixture() {
  const runtime = hooks(), requests = [];
  const { EvidenceLab } = execute("components/evidence-lab.tsx", (name) => {
    if (name === "react") return runtime.api;
    if (name === "react/jsx-runtime") return jsx;
    if (name === "lucide-react") return icons;
    if (name === "radix-ui") return { Tabs: new Proxy({}, { get: (_, item) => `tabs:${String(item)}` }) };
    if (name.startsWith("@/components/ui/")) return new Proxy({}, { get: (_, item) => `ui:${String(item)}` });
    if (name === "./reference-gallery") return { ReferenceCredit: "reference-credit" };
    if (name === "./field-studio") return { EvidenceImage: "retained-image" };
    if (name === "@/lib/atlas") return { isSyntheticRecord: (record) => record.original.synthetic };
    if (name.startsWith("@/lib/")) return library(`lib/${name.slice(6)}.ts`);
    throw new Error(`Unmocked import: ${name}`);
  }, { fetch: (url, options) => new Promise((resolve, reject) => requests.push({ url, options, resolve, reject })) });
  const tree = runtime.render(EvidenceLab, { records: [], onOpen() {} });
  const engineering = nodes(tree).find((node) => node.type?.name === "EngineeringEvidence").type;
  const inspector = nodes(tree).find((node) => node.type?.name === "SavedRecordInspector").type;
  return { runtime, requests, render: () => runtime.render(engineering), inspector };
}
const reportResponse = (extra = {}) => ({ ok: true, json: async () => ({ passed: 3, total: 4, generatedAt: "2026-10-02T10:00:00Z", liveAI: false, ...extra }) });
await test("Collapsed engineering diagnostics make no automatic report request", () => {
  const fixture = componentFixture(), tree = fixture.render();
  assert.equal(fixture.requests.length, 0); assert.match(textOf(tree), /Software fixtures · load on request/);
});
await test("Explicit diagnostics opening loads and labels the real software denominator", async () => {
  const fixture = componentFixture(); fixture.render().props.onToggle({ currentTarget: { open: true } }); fixture.render();
  assert.equal(fixture.requests.length, 1); assert.equal(fixture.requests[0].url, "/evaluation.json");
  fixture.requests[0].resolve(reportResponse()); await drain();
  assert.match(textOf(fixture.render()), /3\/4 assertions passed · no live AI/);
});
await test("Closing diagnostics aborts an unfinished request and ignores its late result", async () => {
  const fixture = componentFixture(); fixture.render().props.onToggle({ currentTarget: { open: true } }); fixture.render();
  fixture.render().props.onToggle({ currentTarget: { open: false } }); fixture.render();
  assert.equal(fixture.requests[0].options.signal.aborted, true);
  fixture.requests[0].resolve(reportResponse()); await drain();
  assert.doesNotMatch(textOf(fixture.render()), /3\/4 assertions passed/);
});
await test("Invalid or unavailable software evidence stays unavailable and can be retried", async () => {
  const fixture = componentFixture(); fixture.render().props.onToggle({ currentTarget: { open: true } }); fixture.render();
  fixture.requests[0].resolve(reportResponse({ liveAI: true })); await drain();
  let tree = fixture.render(); assert.match(textOf(tree), /Report unavailable/);
  nodes(tree).find((node) => node.type === "button" && textOf(node) === "Retry report").props.onClick(); fixture.render();
  assert.equal(fixture.requests.length, 2); fixture.requests[1].resolve(reportResponse()); await drain();
  tree = fixture.render(); assert.match(textOf(tree), /3\/4 assertions passed · no live AI/);
});
await test("Saved-record inspection starts at the brief and stage links change the active tab", () => {
  const fixture = componentFixture(); const props = { records: [base()], onOpen() {} };
  let tree = fixture.runtime.render(fixture.inspector, props);
  assert.equal(nodes(tree).find((node) => node.type === "tabs:Root").props.value, "brief");
  const brief = nodes(tree).find((node) => node.type?.name === "DecisionBrief");
  const briefTree = brief.type(brief.props);
  assert.equal(nodes(briefTree).filter((node) => node.type === "li" && node.props.children?.some?.((child) => child?.props?.className === "el-brief-stage-top")).length, 4);
  nodes(briefTree).find((node) => node.type === "button" && textOf(node).includes("Inspect checks")).props.onClick();
  tree = fixture.runtime.render(fixture.inspector, props);
  assert.equal(nodes(tree).find((node) => node.type === "tabs:Root").props.value, "checks");
});
await test("Selecting another saved record resets inspection to the decision brief", () => {
  const fixture = componentFixture(); const second = { ...base(), id: "second-fixture", createdAt: "2026-10-02T12:00:00Z" }, props = { records: [base(), second], onOpen() {} };
  let tree = fixture.runtime.render(fixture.inspector, props);
  nodes(tree).find((node) => node.type === "tabs:Root").props.onValueChange("checks"); tree = fixture.runtime.render(fixture.inspector, props);
  nodes(tree).find((node) => node.type === "ui:Select").props.onValueChange("authored-brief-fixture"); tree = fixture.runtime.render(fixture.inspector, props);
  assert.equal(nodes(tree).find((node) => node.type === "tabs:Root").props.value, "brief");
});
await test("Brief CSS parses and has scoped mobile single-column stages", async () => {
  const css = postcss.parse(await readFile("app/evidence-lab.css", "utf8"));
  let found = false;
  css.walkAtRules("media", (rule) => { if (rule.params === "(max-width: 650px)") rule.walkDecls("grid-template-columns", (decl) => { if (decl.parent.selector.includes(".el-brief-stages") && decl.value === "minmax(0, 1fr)") found = true; }); });
  assert.equal(found, true);
});

for (const result of results) console.log(`${result.passed ? "PASS" : "FAIL"} ${result.name}${result.error ? `: ${result.error}` : ""}`);
console.log(`Decision brief domain/event checks: ${results.filter((result) => result.passed).length}/${results.length} passed.`);
if (results.some((result) => !result.passed)) process.exitCode = 1;
