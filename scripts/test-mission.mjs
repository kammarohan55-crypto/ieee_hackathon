import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { assess, createReport, reviewReport, decideIssue, exportReport } from "../.sites-runtime/domain-tests/assessment.mjs";
import { newField, addPhotoAnnotation, assertPhotoAnnotations, createReferenceDraft, recordVisualJudgment } from "../.sites-runtime/domain-tests/field.mjs";
import { evidenceFrames, imagePoint, scopedRecords, workspaceAnalytics, recordSignals, reviewQueue, pendingVisualCount, evidenceReplay } from "../.sites-runtime/domain-tests/mission-control.mjs";
import { evidenceTrail } from "../.sites-runtime/domain-tests/evidence-trail.mjs";
import { referencePhotos, europeanPhotoLibrary } from "../.sites-runtime/domain-tests/references.mjs";
import { createFieldPack, prepareImport, parseWorkspace, digestBlob } from "../.sites-runtime/domain-tests/workspace.mjs";

// Authored software fixtures, never seeded into the application as field evidence.
const now = new Date("2026-10-01T12:00:00Z");
const input = { site: "Software test location", observedAt: "2026-09-30T10:00:00Z", note: "I could not see the water clearly.", appearance: "unsure", synthetic: false };
function record(id = "test-record", overrides = {}) {
  const original = { ...input, ...overrides };
  let assessment = assess(original, now);
  for (const issue of assessment.issues) assessment = decideIssue(assessment, issue.id, "uncertain", "", now);
  return { ...createReport(original, assessment, now, id), field: newField() };
}
const base = record();
const blob = new Blob(["Authored test bytes; not a real photograph."], { type: "image/jpeg" });
const media = { id: "test-photo", kind: "photo", mime: "image/jpeg", bytes: blob.size, sha256: await digestBlob(blob), createdAt: now.toISOString(), width: 100, height: 80, origin: "upload", filename: "test-fixture.jpg", quality: { brightness: 80, edgeDetail: 10, warnings: [], method: "canvas-luma-v1" } };
const photoRecord = { ...base, field: { ...base.field, media: [media] } };
const photoInput = { mediaId: media.id, x: .25, y: .75, category: "uncertain", note: "I cannot identify this visible detail." };
const source = referencePhotos[0];
const draft = createReferenceDraft(source);
const historical = { ...record("test-reference", { ...draft.draft, note: "I can see a river in this historical photograph." }), field: { ...draft.field, media: [{ ...media, id: "reference-photo", origin: "public_reference", sha256: source.sha256 }] } };
const visual = { ...photoRecord, field: { ...photoRecord.field, media: [{ ...media, visual: { model: "test-only-fixture", at: now.toISOString(), findings: [{ kind: "floating_material", confidence: "low", region: "center" }, { kind: "vegetation", confidence: "medium", region: "left" }] } }] } };
const results = [];
async function test(name, callback) {
  try { await callback(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, error: error.message }); }
}

await test("An empty collection has no invented metrics or activity", () => {
  const stats = workspaceAnalytics([], now);
  assert.equal(stats.total, 0);
  assert.equal(stats.visualCandidates, 0);
  assert.ok(stats.activity.every((point) => point.count === 0));
  assert.ok(stats.coverage.every((item) => item.count === 0 && item.total === 0));
});
await test("Review coverage and queue require usable retained review and confirmation events", () => {
  const source = { ...base, status: "reviewed", reviewHistory: [] };
  assert.equal(workspaceAnalytics([source], now).coverage.find((item) => item.key === "reviewed").count, 0);
  assert.match(reviewQueue([source])[0].reason, /history needs inspection/);
  const reviewed = reviewReport(base, "reviewed", "Authored real-event fixture", now);
  assert.equal(workspaceAnalytics([reviewed], now).coverage.find((item) => item.key === "reviewed").count, 1);
  reviewed.confirmedAt = "2026-09-28T09:00";
  assert.equal(workspaceAnalytics([reviewed], now).coverage.find((item) => item.key === "confirmed").count, 0);
  assert.match(reviewQueue([reviewed])[0].reason, /confirmation needs inspection/);
});
await test("Activity does not normalize impossible days or supply a missing time zone", () => {
  for (const createdAt of ["2026-09-28T09:00", "2026-09-31T09:00:00Z"])
    assert.ok(workspaceAnalytics([{ ...base, createdAt }], now).activity.every((day) => day.count === 0));
});
await test("Bundled photographs are source frames, not saved observations", () => {
  const frames = evidenceFrames([]);
  assert.equal(frames.length, europeanPhotoLibrary.length);
  assert.equal(frames[0].reference.id, "mondego-coimbra");
  assert.ok(frames.every((frame) => !frame.report && !frame.media && frame.reference));
  assert.deepEqual(new Set(frames.map((frame) => frame.reference.id)), new Set(europeanPhotoLibrary.map((photo) => photo.id)));
});
await test("Scopes exclude synthetic reports, synthetic locations and illustrations", () => {
  const synthetic = { ...base, original: { ...input, synthetic: true } };
  const locatedSynthetic = { ...base, field: { ...base.field, coordinates: { lat: 0, lon: 0, method: "synthetic" } } };
  const illustration = { ...photoRecord, field: { ...photoRecord.field, media: [{ ...media, origin: "illustration" }] } };
  const collection = [photoRecord, historical, synthetic, locatedSynthetic, illustration];
  assert.deepEqual(scopedRecords(collection, "all"), [photoRecord, historical]);
  assert.deepEqual(scopedRecords(collection, "field"), [photoRecord]);
  assert.deepEqual(scopedRecords(collection, "reference"), [historical]);
  assert.equal(workspaceAnalytics(collection, now).total, 2);
});
await test("Photo desk keeps saved source association and does not treat video as a still", () => {
  const frames = evidenceFrames([historical, { ...photoRecord, field: { ...photoRecord.field, media: [media, { ...media, id: "clip", kind: "video" }] } }]);
  assert.equal(frames.length, europeanPhotoLibrary.length + 1);
  assert.equal(frames.filter((frame) => frame.reference?.id === source.id).length, 1, "A retained review replaces its duplicate source-only frame");
  assert.equal(frames[0].reference.id, source.id);
  assert.equal(frames[0].report.id, historical.id);
  assert.equal(frames.filter((frame) => frame.media?.id === "clip").length, 0);
  assert.equal(new Set(frames.map((frame) => frame.key)).size, frames.length);
});
await test("Legacy unknown image dimensions use a valid inspection ratio", () => {
  for (const dimensions of [{ width: 0, height: -1 }, { width: 0, height: 1000 }, { width: 2000, height: 0 }]) {
    const original = { ...media, ...dimensions };
    const frame = evidenceFrames([{ ...photoRecord, field: { ...photoRecord.field, media: [original] } }])[0];
    assert.equal(frame.width / frame.height, 4 / 3);
    assert.deepEqual(frame.media, original);
  }
});
await test("Image coordinates exclude letterbox padding and preserve actual image edges", () => {
  const rect = { left: 10, top: 20, width: 400, height: 300 }, dimensions = { width: 2000, height: 1000 };
  assert.deepEqual(imagePoint(rect, dimensions, 10, 70), { x: 0, y: 0 });
  assert.deepEqual(imagePoint(rect, dimensions, 410, 270), { x: 1, y: 1 });
  assert.deepEqual(imagePoint(rect, dimensions, 210, 170), { x: .5, y: .5 });
  assert.equal(imagePoint(rect, dimensions, 210, 69), null);
  assert.equal(imagePoint(rect, dimensions, 210, 271), null);
});
await test("Portrait photo coordinates exclude side padding and follow zoomed bounds", () => {
  const rect = { left: -50, top: -100, width: 600, height: 400 }, dimensions = { width: 1000, height: 2000 };
  assert.deepEqual(imagePoint(rect, dimensions, 150, -100), { x: 0, y: 0 });
  assert.deepEqual(imagePoint(rect, dimensions, 350, 300), { x: 1, y: 1 });
  assert.equal(imagePoint(rect, dimensions, 149, 0), null);
  assert.equal(imagePoint(rect, dimensions, 351, 0), null);
});
await test("Unknown, zero-size and non-finite image geometry cannot produce a photo pin", () => {
  const rect = { left: 0, top: 0, width: 400, height: 300 }, dimensions = { width: 1000, height: 800 };
  for (const update of [{ width: 0 }, { height: -1 }, { width: Infinity }]) assert.equal(imagePoint(rect, { ...dimensions, ...update }, 100, 100), null);
  for (const update of [{ width: 0 }, { height: -1 }, { left: NaN }]) assert.equal(imagePoint({ ...rect, ...update }, dimensions, 100, 100), null);
  assert.equal(imagePoint(rect, dimensions, NaN, 100), null);
});
await test("Coordinates coverage excludes historical source reviews", () => {
  const located = { ...base, id: "located", field: { ...base.field, coordinates: { lat: 0, lon: 0, method: "manual" } } };
  const stats = workspaceAnalytics([base, located, historical], now);
  const coverage = stats.coverage.find((item) => item.key === "coordinates");
  assert.equal(coverage.total, 2); assert.equal(coverage.count, 1);
  assert.equal(recordSignals(historical).find((signal) => signal.key === "coordinates").applicable, false);
  assert.equal(stats.field, 2); assert.equal(stats.references, 1);
});
await test("Activity uses UTC record creation dates, not historical image dates", () => {
  const offset = { ...base, id: "offset", createdAt: "2026-09-30T23:30:00-02:00" };
  const stats = workspaceAnalytics([historical, offset], now);
  assert.equal(stats.activity.length, 14);
  assert.equal(stats.activity[0].day, "2026-09-18");
  assert.deepEqual(stats.activity.at(-1), { day: "2026-10-01", count: 2 });
  assert.equal(stats.activity.reduce((sum, point) => sum + point.count, 0), 2);
});
await test("Outside-window and invalid creation dates do not populate activity bars", () => {
  const dates = ["2026-09-17T12:00:00Z", "2026-10-02T01:00:00Z", "invalid"];
  const stats = workspaceAnalytics(dates.map((createdAt, i) => ({ ...base, id: `dated-${i}`, createdAt })), now);
  assert.equal(stats.total, 3);
  assert.equal(stats.activity.reduce((sum, point) => sum + point.count, 0), 0);
});
await test("Workflow distribution counts current states with no seeded segments", () => {
  const reviewed = reviewReport(base, "reviewed", "Test review", now);
  const more = reviewReport({ ...base, id: "more" }, "needs_information", "Test question", now);
  const stats = workspaceAnalytics([reviewed, more, { ...base, id: "waiting" }], now);
  assert.deepEqual(stats.statuses.map((state) => state.count), [1, 1, 1]);
});
await test("Uncertainty acknowledges a question without inventing an answer", () => {
  const clarified = record("uncertain-question", { note: "The water looks clear, so it is safe to drink.", appearance: "clear" });
  assert.ok(clarified.assessment.issues.length > 0);
  assert.equal(recordSignals(clarified).find((signal) => signal.key === "clarified").present, true);
  const pending = { ...clarified, assessment: { ...clarified.assessment, issues: clarified.assessment.issues.map((issue) => ({ ...issue, decision: "pending" })) } };
  assert.equal(recordSignals(pending).find((signal) => signal.key === "clarified").present, false);
  assert.ok(clarified.assessment.issues.every((issue) => issue.answer === ""));
});
await test("Rule and AI source counts come from retained issue sources", () => {
  const questioned = record("source-questions", { note: "The water looks clear, so it is safe to drink.", appearance: "clear" });
  const original = questioned.assessment.issues[0];
  const authored = { ...questioned, assessment: { ...questioned.assessment, issues: [{ ...original, source: "rules" }, { ...original, id: "test-ai", source: "ai" }] } };
  const stats = workspaceAnalytics([authored], now);
  assert.equal(stats.ruleQuestions, 1); assert.equal(stats.aiQuestions, 1);
});
await test("Visual candidates remain pending until an explicit human judgment", () => {
  assert.equal(pendingVisualCount(visual), 2);
  const judged = recordVisualJudgment(visual, { mediaId: media.id, finding: "floating_material", decision: "uncertain", reason: "Test uncertainty" }, now);
  assert.equal(pendingVisualCount(judged), 1);
  assert.equal(workspaceAnalytics([judged], now).visualCandidates, 2);
  assert.equal(workspaceAnalytics([judged], now).unjudgedCandidates, 1);
});
await test("Review queue prioritizes unjudged candidates then older creation dates", () => {
  const older = { ...base, id: "older", createdAt: "2026-09-25T12:00:00Z" };
  const reviewed = reviewReport({ ...base, id: "complete" }, "reviewed", "Test review", now);
  const flagged = { ...visual, id: "pending-visual", status: "reviewed" };
  const collection = [base, reviewed, older, flagged];
  const original = structuredClone(collection);
  assert.deepEqual(reviewQueue(collection).map((entry) => entry.report.id), [flagged.id, older.id, base.id]);
  assert.deepEqual(collection, original);
});
await test("A visual note preserves evidence and prior decisions while reopening review", () => {
  const reviewed = reviewReport(photoRecord, "reviewed", "Earlier test judgment", now);
  const before = structuredClone(reviewed);
  const updated = addPhotoAnnotation(reviewed, photoInput, now, "test-note");
  assert.deepEqual(reviewed, before);
  assert.equal(updated.status, "awaiting_review");
  assert.deepEqual(updated.original, before.original);
  assert.deepEqual(updated.assessment, before.assessment);
  assert.deepEqual(updated.field.media, before.field.media);
  assert.deepEqual(updated.reviewHistory, before.reviewHistory);
  assert.equal(updated.field.annotations[0].actor, "demo_reviewer");
  assert.equal(updated.history.at(-1).action, "photo_annotation");
  assert.equal(updated.history.length, before.history.length + 1);
});
await test("Notes retain normalized image coordinates, category and explicit uncertainty", () => {
  const updated = addPhotoAnnotation(photoRecord, { ...photoInput, x: 0, y: 1, note: "  I cannot identify this.  " }, now, "edge-note");
  assert.deepEqual(updated.field.annotations[0], { ...photoInput, x: 0, y: 1, note: "I cannot identify this.", id: "edge-note", at: now.toISOString(), actor: "demo_reviewer" });
  assert.equal(workspaceAnalytics([updated], now).annotations, 1);
  assert.equal(workspaceAnalytics([updated], now).visualCandidates, 0);
});
await test("Notes reject missing media and video references", () => {
  assert.throws(() => addPhotoAnnotation(base, photoInput, now, "bad"), /photograph/);
  assert.throws(() => addPhotoAnnotation(photoRecord, { ...photoInput, mediaId: "unknown" }, now, "bad"), /photograph/);
  assert.throws(() => addPhotoAnnotation({ ...photoRecord, field: { ...photoRecord.field, media: [{ ...media, kind: "video" }] } }, photoInput, now, "bad"), /photograph/);
});
await test("Notes reject out-of-frame, non-finite and malformed positions", () => {
  for (const position of [{ x: -0.01 }, { y: 1.01 }, { x: NaN }, { y: Infinity }, { x: "0.5" }]) {
    assert.throws(() => addPhotoAnnotation(photoRecord, { ...photoInput, ...position }, now, "bad"));
  }
});
await test("Notes reject empty or oversized text, invalid categories and invalid timestamps", () => {
  for (const change of [{ note: "   " }, { note: "x".repeat(501) }, { category: "diagnosis" }]) assert.throws(() => addPhotoAnnotation(photoRecord, { ...photoInput, ...change }, now, "bad"));
  assert.throws(() => addPhotoAnnotation(photoRecord, photoInput, new Date("invalid"), "bad"));
});
await test("Duplicate note IDs and the per-record limit fail before mutation", () => {
  const one = addPhotoAnnotation(photoRecord, photoInput, now, "same");
  assert.throws(() => addPhotoAnnotation(one, photoInput, now, "same"), /unique/);
  const full = { ...photoRecord, field: { ...photoRecord.field, annotations: Array.from({ length: 60 }, (_, i) => ({ ...one.field.annotations[0], id: `note-${i}` })) } };
  assert.throws(() => addPhotoAnnotation(full, photoInput, now, "extra"), /60-note/);
  assert.equal(full.field.annotations.length, 60);
});
await test("Older records without annotations remain valid", () => {
  assert.deepEqual(parseWorkspace([photoRecord]), [photoRecord]);
  assert.doesNotThrow(() => assertPhotoAnnotations(base));
});
await test("Photo notes and original bytes round-trip together through a field pack", async () => {
  const updated = addPhotoAnnotation(photoRecord, photoInput, now, "transfer-note");
  const pack = await createFieldPack([updated], async () => blob, true);
  const imported = await prepareImport(JSON.stringify(pack));
  assert.deepEqual(imported.records, [updated]);
  assert.equal(await imported.media[0].blob.text(), await blob.text());
  assert.equal(imported.records[0].field.media[0].sha256, media.sha256);
});
await test("Metadata-only receipts preserve notes and honestly mark missing photo bytes", async () => {
  const updated = addPhotoAnnotation(photoRecord, photoInput, now, "receipt-note");
  const imported = await prepareImport(exportReport(updated));
  assert.deepEqual(imported.records[0].field.annotations, updated.field.annotations);
  assert.equal(imported.missingMedia, 1); assert.equal(imported.media.length, 0);
});
await test("Workspace restore, import and export reject notes attached to another record's media", async () => {
  const updated = addPhotoAnnotation(photoRecord, photoInput, now, "foreign-note");
  updated.field.annotations[0].mediaId = "some-other-photo";
  assert.throws(() => parseWorkspace([updated]), /photograph in this record/);
  await assert.rejects(() => prepareImport(exportReport(updated)), /photograph in this record/);
  await assert.rejects(() => createFieldPack([updated], async () => blob, true), /photograph in this record/);
});
await test("Duplicate note IDs are rejected on workspace restore", () => {
  const updated = addPhotoAnnotation(photoRecord, photoInput, now, "duplicate");
  updated.field.annotations.push(updated.field.annotations[0]);
  assert.throws(() => parseWorkspace([updated]), /unique/);
});
await test("Historical photo notes retain fixed attribution, source date and absence of invented GPS", () => {
  const updated = addPhotoAnnotation(historical, { ...photoInput, mediaId: "reference-photo" }, now, "source-note");
  assert.deepEqual(parseWorkspace([updated]), [updated]);
  assert.equal(updated.original.observedAt, source.capturedDate);
  assert.deepEqual(updated.field.reference, historical.field.reference);
  assert.equal(updated.field.coordinates, undefined);
});
await test("Evidence graph links human visual notes to the photo and human review", () => {
  const updated = addPhotoAnnotation(photoRecord, photoInput, now, "graph-note");
  const graph = evidenceTrail(updated), note = graph.nodes.find((node) => node.id === "photo-notes:0");
  assert.equal(note.source, "human"); assert.match(note.detail, /25%, 75%/);
  assert.ok(graph.edges.some((edge) => edge.source === "media:0" && edge.target === note.id));
  assert.ok(graph.edges.some((edge) => edge.source === note.id && edge.target === "review"));
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  assert.equal(nodeIds.size, graph.nodes.length);
  assert.equal(new Set(graph.edges.map((edge) => edge.id)).size, graph.edges.length);
  assert.ok(graph.edges.every((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)));
});
await test("Replay preserves day-precision source dates and does not fabricate AI events", () => {
  const events = evidenceReplay(historical);
  assert.equal(events[0].at, source.capturedDate);
  assert.equal(events[0].kind, "source");
  assert.equal(events.filter((event) => event.kind === "ai").length, 0);
  assert.equal(events.length, historical.history.length + historical.assessment.issues.filter((issue) => issue.decidedAt).length + 1);
});
await test("Replay includes retained AI, question decisions, visual notes and review history in order", () => {
  const question = record("replay", { note: "The water looks clear, so it is safe to drink.", appearance: "clear" });
  const updated = addPhotoAnnotation({ ...question, field: visual.field }, photoInput, new Date("2026-10-01T12:05:00Z"), "replay-note");
  const before = structuredClone(updated), events = evidenceReplay(updated);
  assert.equal(events.filter((event) => event.kind === "ai").length, 1);
  assert.ok(events.some((event) => event.title === "Question uncertain"));
  assert.equal(events.at(-1).title, "photo annotation");
  assert.ok(events.every((event, i) => i === 0 || Date.parse(events[i - 1].at) <= Date.parse(event.at)));
  assert.equal(new Set(events.map((event) => event.id)).size, events.length);
  assert.deepEqual(updated, before);
});
await test("Replay keeps invalid imported times visible at the end without inventing dates", () => {
  const updated = { ...base, history: [...base.history, { at: "unknown", action: "imported_note", detail: "Authored malformed timestamp for testing" }] };
  const events = evidenceReplay(updated);
  assert.equal(events.at(-1).at, "unknown");
  assert.deepEqual(evidenceReplay(updated), events);
});

const report = { suite: "AquaLens visual workspace logic", generatedAt: new Date().toISOString(), liveAI: false, passed: results.filter((result) => result.passed).length, total: results.length, limitations: ["Authored software fixtures, not environmental measurements or model validation.", "No browser rendering, pointer placement, map, camera or live-provider test."], results };
await writeFile("public/mission-evaluation.json", JSON.stringify(report, null, 2));
for (const result of results) if (!result.passed) console.error(`FAIL ${result.name}: ${result.error}`);
console.log(`${report.passed}/${report.total} visual workspace checks passed.`);
if (report.passed !== report.total) process.exitCode = 1;
