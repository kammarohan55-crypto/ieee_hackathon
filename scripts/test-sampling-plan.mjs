import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import postcss from "postcss";

// Authored software fixtures and mocked React events. No field data, browser or AI call.
const directory = path.resolve(".sites-runtime/sampling-tests");
await mkdir(directory, { recursive: true });
for (const name of ["ai-metadata", "references", "field", "assessment", "atlas", "evidence-lab", "sampling-plan"]) {
  const source = await readFile(`lib/${name}.ts`, "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 } }).outputText
    .replace(/from "\.\/(ai-metadata|references|field|assessment|atlas|evidence-lab)"/g, 'from "./$1.mjs"');
  await writeFile(path.join(directory, `${name}.mjs`), output);
}
const { samplingMissions } = await import(pathToFileURL(path.join(directory, "sampling-plan.mjs")));
const { newField, fieldQuestions, createFollowupDraft, createReferenceDraft } = await import(pathToFileURL(path.join(directory, "field.mjs")));
const { referencePhotos } = await import(pathToFileURL(path.join(directory, "references.mjs")));
const at = "2026-10-02T10:00:00Z";
function report(id = "fixture", field = {}) {
  return { schemaVersion: "1.0", id, createdAt: at, confirmedAt: at, original: { site: "Authored test site", observedAt: at, note: "I could see the surface.", appearance: "unsure", synthetic: false }, assessment: { issues: [], mode: "rules", notice: "Authored fixture", version: "test" }, status: "awaiting_review", reviewHistory: [], history: [], field: { ...newField(), ...field } };
}
const photo = { id: "fixture-photo", kind: "photo", mime: "image/jpeg", bytes: 10, sha256: "a".repeat(64), createdAt: at, width: 640, height: 480, origin: "upload", quality: { brightness: 80, edgeDetail: 10, warnings: [], method: "canvas-luma-v1" } };
const candidatePhoto = { ...photo, visual: { model: "authored-test-response", provider: "xai", at, findings: [{ kind: "floating_material", confidence: "low", region: "center" }] } };
const judgment = (decision, reason = "Authored judgment") => ({ mediaId: photo.id, finding: "floating_material", decision, reason, at, actor: "demo_reviewer" });
const reviewed = (record) => ({ ...record, status: "reviewed", reviewHistory: [{ at, action: "reviewed", note: "Authored test review; uncertainty retained.", actor: "demo_reviewer" }] });
const results = [];
async function test(name, callback) { try { await callback(); results.push({ name, passed: true }); } catch (error) { results.push({ name, passed: false, error: error.message }); } }

await test("Empty workspace has no invented mission", () => assert.deepEqual(samplingMissions([]), []));
await test("All three synthetic markers exclude their record", () => {
  const original = report("synthetic-note"); original.original.synthetic = true;
  const gps = report("synthetic-gps", { coordinates: { lat: 0, lon: 0, method: "synthetic" } });
  const illustration = report("illustration", { media: [{ ...photo, origin: "illustration" }] });
  assert.deepEqual(samplingMissions([original, gps, illustration]), []);
});
await test("A confirmed photograph receives one real review action", () => {
  const missions = samplingMissions([report("real-target", { media: [photo] })]);
  assert.equal(missions.length, 1); assert.equal(missions[0].action, "review"); assert.equal(missions[0].reportId, "real-target");
});
await test("Reviewed evidence without open flags has no action", () => assert.deepEqual(samplingMissions([reviewed(report("done", { media: [photo] }))]), []));
await test("An imported reviewed flag cannot suppress missing, mismatched or invalid review history", () => {
  const source = reviewed(report("history-gap", { media: [photo] }));
  for (const history of [[], [{ at, action: "needs_information", note: "Clarify.", actor: "demo_reviewer" }], [{ at: "2026-02-30T09:00:00Z", action: "reviewed", note: "Inspected.", actor: "demo_reviewer" }]]) {
    source.reviewHistory = history;
    const mission = samplingMissions([source])[0];
    assert.equal(mission.action, "review"); assert.equal(mission.priority, "review_first");
    assert.equal(mission.title, "Inspect the review history"); assert.match(mission.reason, /stored reviewed flag/);
  }
});
await test("Missing confirmation stays actionable without manufacturing citizen approval", () => {
  const source = reviewed(report("confirmation-gap", { media: [photo] })); source.confirmedAt = "2026-10-02T09:00";
  const mission = samplingMissions([source])[0];
  assert.equal(mission.title, "Inspect citizen confirmation"); assert.match(mission.reason, /before treating it as citizen-confirmed/);
});
await test("An unzoned creation date cannot manufacture sampling order", () => {
  const first = report("a", { media: [photo] }), second = report("b", { media: [photo] });
  first.createdAt = "2020-01-01T09:00"; second.createdAt = "2026-10-01T09:00:00Z";
  assert.deepEqual(samplingMissions([first, second]).map((mission) => mission.reportId), ["b", "a"]);
});
await test("A text-only observation has an optional photo action without GPS or instrument demands", () => {
  const missions = samplingMissions([report()]);
  assert.equal(missions.length, 2); assert.equal(missions[1].action, "followup"); assert.equal(missions[1].priority, "optional_visit");
  assert.match(missions[1].nextAction, /Coordinates and instruments are optional/);
  assert.ok(missions.every((mission) => !mission.basis.some((reason) => /coordinates.*missing|no instrument/i.test(reason))));
});
await test("Video evidence is not misrepresented as a still photograph", () => {
  const missions = samplingMissions([report("clip", { media: [{ ...photo, kind: "video" }] })]);
  assert.match(missions.find((mission) => mission.action === "followup").basis[0], /video is still valid/);
});
await test("Historical source limitations always open the source, never a new field mission", () => {
  const draft = createReferenceDraft(referencePhotos[0]);
  const historical = { ...report("historical", draft.field), original: { ...draft.draft, note: "I see a historical river photo." }, field: { ...draft.field, media: [{ ...photo, origin: "public_reference", quality: { ...photo.quality, warnings: ["Low image detail"] } }] } };
  const missions = samplingMissions([historical]);
  assert.equal(missions.length, 1); assert.equal(missions[0].source, "historical"); assert.equal(missions[0].action, "review");
  assert.match(missions[0].nextAction, /not a new field visit/);
});
await test("A clearer repeat is suggested only when every still photo is limited", () => {
  const limited = { ...photo, quality: { ...photo.quality, warnings: ["Low image detail"] } };
  assert.equal(samplingMissions([report("limited", { media: [limited] })]).filter((mission) => mission.action === "followup").length, 1);
  assert.equal(samplingMissions([report("mixed", { media: [limited, { ...photo, id: "usable" }] })]).filter((mission) => mission.action === "followup").length, 0);
});
await test("An unjudged AI candidate outranks a routine review", () => {
  const missions = samplingMissions([report("routine", { media: [photo] }), report("candidate", { media: [candidatePhoto] })]);
  assert.equal(missions[0].reportId, "candidate"); assert.equal(missions[0].priority, "review_first");
  assert.match(missions[0].reason, /1 unjudged/);
});
await test("Only the latest retained visual disposition governs the action", () => {
  const source = report("latest", { media: [candidatePhoto], dispositions: [judgment("uncertain", "Earlier uncertainty"), judgment("supports", "Later supported detail")] });
  assert.equal(samplingMissions([source])[0].priority, "clarify_next");
  assert.ok(!samplingMissions([source])[0].basis.some((reason) => reason.includes("Earlier uncertainty")));
  source.field.dispositions.push(judgment("disagrees", "Later disagreement"));
  assert.match(samplingMissions([source])[0].reason, /1 disputed/);
  assert.match(samplingMissions([source])[0].basis[0], /Later disagreement/);
});
await test("Human-reviewed uncertainty stays in its receipt without reopening review", () => {
  const source = reviewed(report("uncertain", { media: [candidatePhoto], dispositions: [judgment("uncertain")] }));
  assert.deepEqual(samplingMissions([source]), []);
});
await test("Current reviewer request shows its actual last request note", () => {
  const source = { ...report("requested", { media: [photo] }), status: "needs_information", reviewHistory: [{ action: "needs_information", note: "Earlier request", at, actor: "demo_reviewer" }, { action: "needs_information", note: "Explain what the reflection obscured.", at, actor: "demo_reviewer" }] };
  const mission = samplingMissions([source])[0];
  assert.equal(mission.priority, "review_first"); assert.equal(mission.reason, "Explain what the reflection obscured.");
});
await test("A real linked visit suppresses the parent's repeated optional visit prompt", () => {
  const parent = report("parent");
  const child = reviewed(report("child", { followupOf: "parent", media: [photo] }));
  const missions = samplingMissions([parent, child]);
  assert.ok(!missions.some((mission) => mission.action === "followup" && mission.reportId === "parent"));
  assert.ok(missions.some((mission) => mission.action === "review" && mission.reportId === "parent"));
});
await test("Synthetic linked children do not claim to fulfill real follow-up", () => {
  const child = report("fake-child", { followupOf: "parent", media: [photo] }); child.original.synthetic = true;
  assert.ok(samplingMissions([report("parent"), child]).some((mission) => mission.action === "followup" && mission.reportId === "parent"));
});
await test("A retained human follow-up pin can create an optional fresh visit", () => {
  const mission = samplingMissions([reviewed(report("pin", { media: [photo], annotations: [{ category: "followup", note: "Repeat from the footbridge if safe." }] }))])[0];
  assert.equal(mission.action, "followup"); assert.match(mission.basis[0], /Repeat from the footbridge/);
});
await test("Adaptive questions use exact retained answers and never manufacture answers", () => {
  const source = report("question", { media: [{ ...photo, quality: { ...photo.quality, warnings: ["Low detail"] } }, { ...photo, id: "usable" }] });
  assert.match(samplingMissions([source])[0].reason, /1 unanswered/);
  source.field.followups.push({ question: fieldQuestions(source.field, source.original.appearance)[0], answer: "The far bank was unclear." });
  assert.ok(!samplingMissions([source])[0].basis.some((reason) => reason.startsWith("Unanswered follow-up")));
});
await test("Measurement metadata checks apply only to measurements actually supplied", () => {
  const source = report("meter", { media: [photo], measurements: [{ parameter: "pH", value: 7, unit: "pH", instrument: "", calibration: "unknown", method: "citizen_instrument" }] });
  const mission = samplingMissions([source])[0];
  assert.ok(mission.basis.some((reason) => reason.includes("Instrument or method is missing")));
  assert.ok(mission.basis.some((reason) => reason.includes("Calibration is unconfirmed")));
});
await test("Equal workflow priorities sort by retained creation time then ID", () => {
  const older = { ...report("older", { media: [photo] }), createdAt: "2026-10-01T09:00:00Z" };
  const unknown = { ...report("unknown", { media: [photo] }), createdAt: "unknown" };
  assert.deepEqual(samplingMissions([unknown, report("z", { media: [photo] }), report("a", { media: [photo] }), older]).map((mission) => mission.reportId), ["older", "a", "z", "unknown"]);
});
await test("Deriving actions preserves original notes, measurements, files and judgments", () => {
  const source = report("unchanged", { media: [candidatePhoto], dispositions: [judgment("uncertain")] });
  const before = structuredClone(source); samplingMissions([source]); assert.deepEqual(source, before);
});
await test("A linked fresh draft copies only the site and source link", () => {
  const source = report("source", { media: [candidatePhoto], coordinates: { lat: 1, lon: 2, method: "device" }, measurements: [{ parameter: "pH", value: 7, unit: "pH", instrument: "test", calibration: "checked", method: "citizen_instrument" }], followups: [{ question: "Earlier", answer: "Earlier answer" }] });
  const draft = createFollowupDraft(source);
  assert.equal(draft.draft.site, source.original.site); assert.equal(draft.field.followupOf, source.id);
  assert.equal(draft.draft.observedAt, ""); assert.equal(draft.draft.note, ""); assert.equal(draft.draft.appearance, "unsure");
  assert.deepEqual(draft.field.media, []); assert.deepEqual(draft.field.measurements, []); assert.deepEqual(draft.field.followups, []); assert.equal(draft.field.coordinates, undefined);
});

const jsx = { jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }), Fragment: "fragment" };
function nodes(tree) { return !tree || typeof tree !== "object" ? [] : Array.isArray(tree) ? tree.flatMap(nodes) : [tree, ...nodes(tree.props?.children)]; }
function textOf(tree) { return typeof tree === "string" || typeof tree === "number" ? String(tree) : Array.isArray(tree) ? tree.map(textOf).join("") : tree && typeof tree === "object" ? textOf(tree.props?.children) : ""; }
function componentFixture(records, onFollowup = () => {}) {
  let index = 0; const state = [], opened = [], followed = [];
  const react = { useMemo: (callback) => callback(), useState: (initial) => { const slot = index++; if (!(slot in state)) state[slot] = initial; return [state[slot], (value) => { state[slot] = value; }]; } };
  const exports = {};
  const source = ts.transpileModule(awaitSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(source, { exports, require: (id) => id === "react" ? react : id === "react/jsx-runtime" ? jsx : id === "lucide-react" ? new Proxy({}, { get: (_, name) => `icon:${String(name)}` }) : id === "@/lib/sampling-plan" ? { samplingMissions, missionPriorityLabels: { review_first: "Review first", clarify_next: "Clarify next", optional_visit: "Optional fresh visit" } } : (() => { throw new Error(`Unexpected import ${id}`); })() });
  const props = { records, onOpen: (id) => opened.push(id), onFollowup: onFollowup ? (record) => { followed.push(record); onFollowup(record); } : undefined };
  return { render() { index = 0; return exports.SamplingPlan(props); }, opened, followed };
}
const awaitSource = await readFile("components/sampling-plan.tsx", "utf8");
await test("Review and fresh-visit buttons invoke the actual retained source record", () => {
  const source = report("action-target"); const fixture = componentFixture([source]); const tree = fixture.render();
  const buttons = nodes(tree).filter((node) => node.type === "button");
  buttons.find((node) => textOf(node) === "Open evidence & review").props.onClick();
  buttons.find((node) => textOf(node) === "Start linked visit").props.onClick();
  assert.deepEqual(fixture.opened, ["action-target"]); assert.equal(fixture.followed[0], source);
});
await test("Board starts with four options and reveals additional actual cards", () => {
  const fixture = componentFixture(Array.from({ length: 6 }, (_, index) => report(`item-${index}`, { media: [photo] })));
  let tree = fixture.render(); assert.equal(nodes(tree).filter((node) => node.type === "article").length, 4);
  nodes(tree).find((node) => node.type === "button" && textOf(node).startsWith("Show 2 more")).props.onClick();
  tree = fixture.render(); assert.equal(nodes(tree).filter((node) => node.type === "article").length, 6);
});
await test("Fresh-visit filter shows optional cards and exposes pressed state", () => {
  const fixture = componentFixture([report("one"), report("two", { media: [photo] })]); let tree = fixture.render();
  nodes(tree).find((node) => node.type === "button" && textOf(node).startsWith("Fresh visit")).props.onClick(); tree = fixture.render();
  assert.equal(nodes(tree).filter((node) => node.type === "article").length, 1);
  assert.equal(nodes(tree).find((node) => node.type === "button" && textOf(node).startsWith("Fresh visit")).props["aria-pressed"], true);
});
await test("Empty board labels its real zero count and scope limits", () => {
  const tree = componentFixture([]).render(); assert.match(textOf(tree), /0 OPTIONS/); assert.match(textOf(tree), /not ecological risk/);
  assert.equal(nodes(tree).filter((node) => node.type === "article").length, 0);
});
await test("Absent follow-up callback safely opens the source instead of a dead action", () => {
  const fixture = componentFixture([report("fallback")], null); const tree = fixture.render();
  const visit = nodes(tree).find((node) => node.type === "article" && node.props.className.includes("optional_visit"));
  nodes(visit).find((node) => node.type === "button").props.onClick(); assert.deepEqual(fixture.opened, ["fallback"]);
});
await test("Scoped board CSS parses and includes focus and phone controls", async () => {
  const source = await readFile("app/console.css", "utf8"); postcss.parse(source);
  assert.match(source, /\.sampling-plan button:focus-visible/); assert.match(source, /\.sampling-filters button \{ min-height: 44px/);
});

console.log(`Evidence actions: ${results.filter((result) => result.passed).length}/${results.length} checks pass.`);
for (const result of results.filter((item) => !item.passed)) console.error(`${result.name}: ${result.error}`);
if (results.some((result) => !result.passed)) process.exitCode = 1;
