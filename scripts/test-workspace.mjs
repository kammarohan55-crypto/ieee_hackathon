import assert from "node:assert/strict";
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { createReport, assess, decideIssue, validObservationTime, exportReport } from "../.sites-runtime/domain-tests/assessment.mjs";
import { referencePhotos, displayEvidenceTime } from "../.sites-runtime/domain-tests/references.mjs";
import { evidenceTrail } from "../.sites-runtime/domain-tests/evidence-trail.mjs";
import { newField, decisionReceipt, createReferenceDraft, assertReferenceRecord, exportCSV } from "../.sites-runtime/domain-tests/field.mjs";
import { prepareImport, createFieldPack, mergeRecords, realRecords, digestBlob, searchReports, parseWorkspace, commitImportMedia, unreferencedMediaIds, withImportLock } from "../.sites-runtime/domain-tests/workspace.mjs";
import { weatherFreshness } from "../.sites-runtime/domain-tests/weather-freshness.mjs";

// Authored test fixtures. They are never seeded into the website or described as real observations.
const now = new Date("2026-09-29T10:00:00Z");
const input = { site: "Test-only footbridge", observedAt: "2026-09-29T09:00:00Z", note: "I could not see the water clearly.", appearance: "unsure", synthetic: false };
const base = { ...createReport(input, assess(input, now), now, "test-one"), field: newField() };
const blob = new Blob(["test bytes, not an actual field photograph"], { type: "image/jpeg" });
const hash = await digestBlob(blob);
const media = { id: "test-photo", kind: "photo", mime: "image/jpeg", bytes: blob.size, sha256: hash, createdAt: now.toISOString(), width: 100, height: 100, origin: "upload", filename: "test-only.jpg", quality: { brightness: 80, edgeDetail: 10, warnings: [], method: "canvas-luma-v1" } };
const withMedia = { ...base, field: { ...newField(), media: [media], oneHealth: { bank: "not_recorded", wildlife: "not_seen", humanUse: "walking", note: "Authored context for software testing only." } } };
const results = [];
async function test(name, callback) {
  try { await callback(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, error: error.message }); }
}

await test("No records are invented for an empty workspace", () => {
  assert.deepEqual(realRecords(parseWorkspace([])), []);
});
await test("Failed report commit removes only this import's new media", async () => {
  const files = new Map([["existing", blob]]), storageError = new Error("Report quota exceeded");
  await assert.rejects(() => commitImportMedia([{ id: "new", blob }], {
    add: async (items) => { for (const item of items) files.set(item.id, item.blob); },
    rollback: async (ids) => { for (const id of ids) files.delete(id); },
  }, () => { throw storageError; }), (error) => error === storageError);
  assert.deepEqual([...files.keys()], ["existing"]);
});
await test("Successful report commit retains media and does not compensate", async () => {
  const order = [];
  await commitImportMedia([{ id: "new", blob }], {
    add: async () => { order.push("media"); },
    rollback: async () => { throw new Error("Unexpected compensation"); },
  }, () => { order.push("reports"); });
  assert.deepEqual(order, ["media", "reports"]);
});
await test("An atomic media write failure never attempts the report commit or rollback", async () => {
  await assert.rejects(() => commitImportMedia([{ id: "new", blob }], {
    add: async () => { throw new Error("Media quota exceeded"); },
    rollback: async () => { assert.fail("Failed atomic batch has nothing to compensate"); },
  }, () => { assert.fail("Reports cannot precede retained originals"); }), /Media quota/);
});
await test("Cleanup failure explicitly retains a retryable field pack", async () => {
  await assert.rejects(() => commitImportMedia([{ id: "new", blob }], {
    add: async () => {}, rollback: async () => { throw new Error("Storage denied"); },
  }, () => { throw new Error("Report quota exceeded"); }), /temporary media cleanup was unavailable.*Keep your field pack/);
});
await test("Metadata-only import does not open media storage", async () => {
  let committed = false;
  await commitImportMedia([], {
    add: async () => { assert.fail("No media should be written"); },
    rollback: async () => { assert.fail("No media should be removed"); },
  }, () => { committed = true; });
  assert.equal(committed, true);
});
await test("Report failure preserves newly restored bytes referenced by an existing record", async () => {
  const files = new Map();
  await assert.rejects(() => commitImportMedia([{ id: media.id, blob }, { id: "unused", blob }], {
    add: async (items) => { for (const item of items) files.set(item.id, item.blob); },
    rollback: async (ids) => { for (const id of unreferencedMediaIds(ids, [withMedia])) files.delete(id); },
  }, () => { throw new Error("Report quota exceeded"); }), /quota/);
  assert.deepEqual([...files.keys()], [media.id]);
});
await test("Cleanup protects references saved by another tab without touching unrelated IDs", () => {
  assert.deepEqual(unreferencedMediaIds([media.id, "unused"], [base, withMedia]), ["unused"]);
  assert.deepEqual(unreferencedMediaIds([], [withMedia]), []);
});
await test("Imports serialize through retention, report commit and cleanup", async () => {
  let tail = Promise.resolve(), release;
  const events = [], gate = new Promise((resolve) => { release = resolve; });
  const locks = { request: (name, options, callback) => {
    assert.equal(name, "aqualens-field-pack-import"); assert.equal(options.mode, "exclusive");
    assert.ok(options.signal instanceof AbortSignal);
    const next = tail.then(callback); tail = next.catch(() => {}); return next;
  } };
  const first = withImportLock(async (exclusive) => { assert.equal(exclusive, true); events.push("A retained"); await gate; events.push("A cleanup"); }, locks);
  const second = withImportLock(async (exclusive) => { assert.equal(exclusive, true); events.push("B commit"); }, locks);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(events, ["A retained"]); release(); await Promise.all([first, second]);
  assert.deepEqual(events, ["A retained", "A cleanup", "B commit"]);
});
await test("Unsupported import locks expose the conservative no-cleanup path", async () => {
  assert.equal(await withImportLock(async (exclusive) => exclusive), false);
});
await test("Failure to acquire a lock never starts an import", async () => {
  await assert.rejects(() => withImportLock(async () => { assert.fail("Import must wait for isolation"); }, {
    request: async () => { throw new Error("Lock unavailable"); },
  }), /Lock unavailable/);
});
await test("Recent weather remains explicitly timestamp-based", () => {
  assert.deepEqual(weatherFreshness("2026-09-29T09:30", "2026-09-29T09:45:00Z", now.getTime()), { stale: false, verified: true });
});
await test("Retained weather becomes stale as the session clock advances", () => {
  const result = weatherFreshness("2026-09-29T09:30", "2026-09-29T09:45:00Z", now.getTime() + 3 * 3600000);
  assert.equal(result.stale, true); assert.equal(result.verified, true);
});
await test("An old source timestamp is stale even after a recent fetch", () => {
  assert.equal(weatherFreshness("2026-09-29T06:00", now.toISOString(), now.getTime()).stale, true);
});
await test("Malformed or implausibly future weather timestamps are unverified", () => {
  for (const [modelTime, fetchedAt] of [["unknown", now.toISOString()], ["2026-09-29T09:30", "bad"], ["2026-09-30T09:30", now.toISOString()]]) {
    assert.deepEqual(weatherFreshness(modelTime, fetchedAt, now.getTime()), { stale: true, verified: false });
  }
});
await test("Migration excludes synthetic reports, illustrative media and synthetic coordinates", () => {
  const reports = [base, { ...base, original: { ...input, synthetic: true } }, { ...withMedia, field: { ...withMedia.field, media: [{ ...media, origin: "illustration" }] } }, { ...base, field: { ...newField(), coordinates: { lat: 0, lon: 0, method: "synthetic" } } }];
  assert.deepEqual(realRecords(reports), [base]);
  assert.equal(reports.length, 4, "Migration must not mutate original input");
});
await test("Field pack round-trip preserves original words, unknowns, filename, context and bytes", async () => {
  const pack = await createFieldPack([withMedia], async () => blob, true);
  const result = await prepareImport(JSON.stringify(pack));
  assert.deepEqual(result.records, [withMedia]);
  assert.equal(await result.media[0].blob.text(), await blob.text());
  assert.equal(result.missingMedia, 0);
});
await test("Changed bytes fail integrity validation before import", async () => {
  const pack = await createFieldPack([withMedia], async () => blob, true);
  pack.media[0].data = btoa("changed bytes");
  await assert.rejects(() => prepareImport(JSON.stringify(pack)), /integrity/);
});
await test("Changed digest, media size and MIME fail validation", async () => {
  for (const edit of [(p) => { p.media[0].sha256 = "a".repeat(64); }, (p) => { p.records[0].field.media[0].bytes += 1; }, (p) => { p.media[0].mime = "image/png"; }]) {
    const pack = structuredClone(await createFieldPack([withMedia], async () => blob, true)); edit(pack);
    await assert.rejects(() => prepareImport(JSON.stringify(pack)));
  }
});
await test("Missing local media is counted without invented replacement bytes", async () => {
  const pack = await createFieldPack([withMedia], async () => undefined, true);
  assert.deepEqual(pack.missingMedia, [media.id]);
  const imported = await prepareImport(JSON.stringify(pack));
  assert.equal(imported.media.length, 0); assert.equal(imported.missingMedia, 1);
});
await test("Metadata-only export never reads private media bytes", async () => {
  const pack = await createFieldPack([withMedia], async () => { throw new Error("Unexpected read"); }, false);
  assert.equal(pack.media.length, 0); assert.deepEqual(pack.missingMedia, [media.id]);
});
await test("Existing JSON receipts and collections remain importable", async () => {
  for (const text of [exportReport(base), JSON.stringify(decisionReceipt(base)), JSON.stringify({ format: "aqualens-observation-collection", records: [decisionReceipt(base)] })]) {
    assert.deepEqual((await prepareImport(text)).records, [base]);
  }
});
await test("Synthetic evidence is rejected even in a single receipt", async () => {
  await assert.rejects(() => prepareImport(exportReport({ ...base, original: { ...input, synthetic: true } })), /synthetic/);
});
await test("Duplicate import is idempotent despite property ordering", () => {
  const reordered = Object.fromEntries(Object.entries(base).reverse());
  const result = mergeRecords([base], [reordered]);
  assert.equal(result.added.length, 0); assert.deepEqual(result.duplicates, [base.id]);
});
await test("Conflicting report IDs preserve existing original and review decisions", () => {
  const result = mergeRecords([base], [{ ...base, status: "reviewed", original: { ...input, note: "Altered" } }]);
  assert.deepEqual(result.records, [base]); assert.deepEqual(result.conflicts, [base.id]);
});
await test("Shared media IDs with different metadata block merging", () => {
  const other = { ...withMedia, id: "test-two", field: { ...withMedia.field, media: [{ ...media, sha256: "b".repeat(64) }] } };
  assert.throws(() => mergeRecords([withMedia], [other]), /disagree/);
});
await test("Unreferenced or repeated embedded media cannot enter storage", async () => {
  for (const edit of [(p) => p.media.push(p.media[0]), (p) => { p.media[0].id = "unrelated"; }]) {
    const pack = await createFieldPack([withMedia], async () => blob, true); edit(pack);
    await assert.rejects(() => prepareImport(JSON.stringify(pack)), /duplicate|unreferenced/);
  }
});
await test("Malformed JSON, unsupported versions, empty collections and repeated record IDs are rejected", async () => {
  const pack = await createFieldPack([base], async () => undefined, false);
  for (const text of ["{", "{}", JSON.stringify({ ...pack, version: "999" }), JSON.stringify({ ...pack, records: [] }), JSON.stringify({ ...pack, records: [base, base] })]) await assert.rejects(() => prepareImport(text));
});
await test("Record limit prevents partial overflow imports", () => {
  const many = Array.from({ length: 500 }, (_, i) => ({ ...base, id: `test-${i}` }));
  assert.throws(() => mergeRecords(many, [{ ...base, id: "additional" }]), /500/);
});
await test("Review search matches words across site, note and ID while honoring status", () => {
  assert.deepEqual(searchReports([base], "FOOTBRIDGE water", "all"), [base]);
  assert.deepEqual(searchReports([base], "test-one", "reviewed"), []);
  assert.deepEqual(searchReports([base], "no match", "all"), []);
});
await test("SVG or script-like payload MIME cannot enter a field pack", async () => {
  const pack = await createFieldPack([withMedia], async () => blob, true);
  pack.media[0].mime = "image/svg+xml";
  await assert.rejects(() => prepareImport(JSON.stringify(pack)));
});
await test("Export rejects locally altered originals instead of emitting a misleading hash", async () => {
  await assert.rejects(() => createFieldPack([withMedia], async () => new Blob(["altered"], { type: "image/jpeg" }), true), /does not match/);
});

// Historical source bytes and authored review notes are deliberately different evidence.
const reference = createReferenceDraft(referencePhotos[0]);
const sourceBlob = new Blob([await readFile(`public${referencePhotos[0].src}`)], { type: "image/jpeg" });
const referenceInput = { ...reference.draft, note: "Test-only review note about this historical image." };
let referenceAssessment = assess(referenceInput, now);
for (const issue of referenceAssessment.issues) referenceAssessment = decideIssue(referenceAssessment, issue.id, "uncertain", "Test fixture: source date is historical.", now);
const referenceRecord = { ...createReport(referenceInput, referenceAssessment, now, "test-reference"), field: { ...reference.field, media: [{ ...media, id: "test-reference-photo", origin: "public_reference", sha256: referencePhotos[0].sha256, bytes: sourceBlob.size }] } };
await test("All three bundled source photographs match the recorded digest and decode as JPEG", async () => {
  for (const photo of referencePhotos) {
    const bytes = await readFile(`public${photo.src}`);
    const info = await sharp(bytes).metadata();
    assert.equal(info.format, "jpeg");
    assert.equal(info.width, 1280);
    assert.ok(info.height >= 800);
    assert.equal(await digestBlob(new Blob([bytes])), photo.sha256);
  }
});
await test("Reference drafts retain source dates and leave words, readings and coordinates unknown", () => {
  assert.equal(reference.draft.note, "");
  assert.equal(reference.draft.appearance, "unsure");
  assert.equal(reference.draft.observedAt, "2010-08-03");
  assert.deepEqual(reference.field.measurements, []);
  assert.equal(reference.field.coordinates, undefined);
  assert.equal(reference.field.oneHealth, undefined);
  assert.equal(reference.field.reference.author, "Ak2431989");
});
await test("Source day precision never becomes an invented midnight or a shifted local date", () => {
  assert.equal(validObservationTime("2010-08-03", now), true);
  assert.equal(validObservationTime("2024-02-29", now), true);
  for (const date of ["2023-02-29", "2023-06-31", "2099-01-01", "2023-13-01"]) assert.equal(validObservationTime(date, now), false);
  const prior = process.env.TZ;
  try {
    for (const tz of ["Pacific/Honolulu", "Asia/Kolkata", "Pacific/Kiritimati"]) {
      process.env.TZ = tz;
      assert.equal(displayEvidenceTime("2023-06-06"), "6 Jun 2023 · date only");
    }
  } finally { if (prior === undefined) delete process.env.TZ; else process.env.TZ = prior; }
});
await test("A historical photo review round-trips with licence, source and unchanged source bytes", async () => {
  const pack = await createFieldPack([referenceRecord], async () => sourceBlob, true);
  const restored = await prepareImport(JSON.stringify(pack));
  assert.deepEqual(restored.records[0], referenceRecord);
  assert.equal(await digestBlob(restored.media[0].blob), referencePhotos[0].sha256);
  assert.equal(restored.records[0].field.reference.license, "CC BY 3.0");
});
await test("Public photos cannot be imported as firsthand uploads after stripping attribution", async () => {
  for (const origin of ["public_reference", "upload"]) {
    const altered = structuredClone(referenceRecord);
    delete altered.field.reference;
    altered.field.media[0].origin = origin;
    assert.throws(() => parseWorkspace([altered]), /attribution/);
    await assert.rejects(() => prepareImport(JSON.stringify({ format: "aqualens-decision-receipt", report: altered })), /attribution/);
  }
});
await test("Unknown or altered source credits cannot enter the workspace", () => {
  const altered = structuredClone(referenceRecord);
  altered.field.reference.author = "Invented photographer";
  assert.throws(() => parseWorkspace([altered]), /catalogue/);
});
await test("Historical review rejects invented field coordinates, instrument readings or context", () => {
  for (const field of [
    { ...referenceRecord.field, coordinates: { lat: 18.5, lon: 73.8, method: "manual" } },
    { ...referenceRecord.field, measurements: [{ parameter: "pH", value: 7, unit: "pH", instrument: "not real", calibration: "unknown", method: "citizen_instrument" }] },
    { ...referenceRecord.field, oneHealth: { bank: "mixed", wildlife: "seen", humanUse: "walking", note: "not a new visit" } },
  ]) assert.throws(() => assertReferenceRecord({ ...referenceRecord, field }), /field measurements/);
});
await test("Historical photo date and site cannot be relabeled as a new visit", () => {
  assert.throws(() => assertReferenceRecord({ ...referenceRecord, original: { ...referenceInput, observedAt: now.toISOString() } }), /source date/);
  assert.throws(() => assertReferenceRecord({ ...referenceRecord, original: { ...referenceInput, site: "A different river" } }), /source date/);
});
await test("Reference media cannot be removed or replaced with unrelated bytes", () => {
  assert.throws(() => assertReferenceRecord({ ...referenceRecord, field: { ...referenceRecord.field, media: [] } }), /credited source/);
  assert.throws(() => assertReferenceRecord({ ...referenceRecord, field: { ...referenceRecord.field, media: [media] } }), /credited source/);
});
await test("Receipt, CSV and graph explicitly distinguish photographer from review author", () => {
  const receipt = decisionReceipt(referenceRecord);
  assert.equal(receipt.metadata.evidenceBasis, "historical_photo_review");
  assert.equal(receipt.metadata.photoAttribution.sourceUrl, referencePhotos[0].sourceUrl);
  assert.match(exportCSV([referenceRecord]), /historical_photo_review/);
  assert.match(exportCSV([referenceRecord]), /Ak2431989/);
  const graph = evidenceTrail(referenceRecord);
  const node = graph.nodes.find((node) => node.id === "photo-source");
  assert.equal(node.source, "reference");
  assert.ok(node.detail.includes(referencePhotos[0].license));
  assert.ok(graph.edges.some((edge) => edge.source === "photo-source" && edge.target === "media:0"));
  for (const issue of graph.nodes.filter((node) => node.id.startsWith("issue:"))) assert.ok(graph.edges.some((edge) => edge.source === "original" && edge.target === issue.id));
});

const report = { suite: "AquaLens real-evidence transfers", generatedAt: new Date().toISOString(), liveAI: false, passed: results.filter((r) => r.passed).length, total: results.length, limitations: ["Authored software fixtures, not field evidence.", "No browser, IndexedDB transaction, camera or download completion test."], results };
await writeFile("public/workspace-evaluation.json", JSON.stringify(report, null, 2));
for (const result of results) if (!result.passed) console.error(`FAIL ${result.name}: ${result.error}`);
console.log(`${report.passed}/${report.total} workspace integrity checks passed.`);
if (report.passed !== report.total) process.exitCode = 1;
