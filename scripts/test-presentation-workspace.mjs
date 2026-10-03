import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import ts from "typescript";
import { pathToFileURL } from "node:url";
import path from "node:path";
// Quality values below are test fixtures, not real image measurements.
const file = path.resolve(".sites-runtime/domain-tests/presentation-workspace.mjs");
const output = ts.transpileModule(await readFile("lib/presentation-workspace.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replace(/from "\.\/(assessment|field|references)"/g, 'from "./$1.mjs"');
await writeFile(file, output);
const { buildPresentationRecords, PRESENTATION_KEY, PRESENTATION_DRAFT_KEY } = await import(pathToFileURL(file));
const { referencePhotos, europeanPhotoLibrary } = await import("../.sites-runtime/domain-tests/references.mjs");
const { exportReport, reviewReport } = await import("../.sites-runtime/domain-tests/assessment.mjs");
const { decisionReceipt, exportCSV, exportGeoJSON, assertReferenceRecord } = await import("../.sites-runtime/domain-tests/field.mjs");
const { realRecords, parseWorkspace, prepareImport, WORKSPACE_KEY } = await import("../.sites-runtime/domain-tests/workspace.mjs");
const { evidenceFrames, workspaceAnalytics } = await import("../.sites-runtime/domain-tests/mission-control.mjs");
const bundle = JSON.parse(await readFile("public/european-context.json", "utf8")), now = new Date("2026-10-03T06:00:00Z");
const media = await Promise.all(referencePhotos.map(async (photo) => ({id:`presentation-${photo.id}`,kind:"photo",mime:"image/jpeg",bytes:(await readFile(`public${photo.src}`)).length,sha256:photo.sha256,createdAt:photo.capturedDate,width:photo.width,height:photo.height,origin:"public_reference",quality:{brightness:100,edgeDetail:8,warnings:[],method:"canvas-luma-v1"}})));
const records = buildPresentationRecords(media, bundle, now), results=[];
async function test(name, fn) { try { await fn(); results.push({name,passed:true}); } catch(error) {results.push({name,passed:false,error:error.message});} }
await test("Versioned public context cannot be substituted by an older cache path", async () => {
 const { EUROPEAN_CONTEXT_ASSET } = await import("../.sites-runtime/api-tests/european-sites.mjs");
 assert.notEqual(EUROPEAN_CONTEXT_ASSET, "/european-context.json");
 assert.deepEqual(JSON.parse(await readFile(`public${EUROPEAN_CONTEXT_ASSET}`, "utf8")), bundle);
 assert.equal(records[0].demonstration.packageId,"europe-river-walkthrough-v2");
 assert.equal(bundle.analyses.length,8);
});
await test("Examples have separate record/draft keys and are excluded from personal records", () => {
 assert.notEqual(PRESENTATION_KEY, WORKSPACE_KEY); assert.notEqual(PRESENTATION_DRAFT_KEY,"aqualens-draft-v1");
 assert.equal(records.length,9); assert.equal(realRecords(records).length,0);
 assert.equal(realRecords([{...records[0],demonstration:undefined},...records]).length,1);
});
await test("Each example retains its real photo credits and invents no GPS, measurements or field visit", () => {
 for(const record of records){assertReferenceRecord(record);assert.equal(record.original.synthetic,false);assert.equal(record.field.coordinates,undefined);assert.deepEqual(record.field.measurements,[]);assert.equal(record.field.oneHealth,undefined);assert.match(record.original.note,/AI-authored/);assert.match(record.demonstration.purpose,/no field visit/);}
});
await test("Recorded candidates exactly match the actual provider result and preserve its clock", () => {
 for(const record of records){const analysis=bundle.analyses.find((item)=>item.photoId===record.field.reference.id),visual=record.field.media[0].visual;
  if(analysis){assert.equal(visual.recorded,true);assert.deepEqual(visual.findings,analysis.findings);assert.equal(visual.at,analysis.at);assert.equal(visual.model,analysis.model);assert.equal(analysis.humanReview,"not_performed");}else assert.equal(visual,undefined);
 }
 assert.equal(records.find((record)=>record.field.reference.id==="mondego-riverbank").field.media[0].visual,undefined);
});
await test("Example states and notes are visibly authored, never backdated to make an activity chart", () => {
 assert.deepEqual(records.reduce((counts,r)=>({...counts,[r.status]:(counts[r.status]??0)+1}),{}),{reviewed:3,needs_information:3,awaiting_review:3});
 for(const record of records){assert.equal(record.createdAt,now.toISOString());assert.equal(record.confirmedAt,now.toISOString());assert.equal(record.history[0].action,"example_confirmation");assert.ok(record.reviewHistory.every((event)=>event.note.startsWith("Authored example")));assert.ok(record.field.dispositions.every((d)=>d.reason.startsWith("Authored example")));}
 assert.equal(records.at(-1).field.annotations.length,1);assert.match(records.at(-1).field.annotations[0].note,/Authored example/);
});
await test("Examples populate genuine source coverage and do not duplicate source-only frames", () => {
 const stats=workspaceAnalytics(records,now);assert.equal(stats.total,9);assert.equal(stats.field,0);assert.equal(stats.references,9);assert.equal(evidenceFrames(records).length,europeanPhotoLibrary.length);assert.equal(stats.visualCandidates,bundle.analyses.reduce((n,a)=>n+a.findings.length,0));
});
await test("JSON, receipt and CSV exports preserve example provenance; GeoJSON invents no points", () => {
 const parsed=parseWorkspace(JSON.parse(JSON.stringify(records)));assert.deepEqual(parsed[0].demonstration,records[0].demonstration);
 assert.deepEqual(JSON.parse(exportReport(records[0])).report.demonstration,records[0].demonstration);assert.deepEqual(decisionReceipt(records[0]).report.demonstration,records[0].demonstration);
 assert.match(exportCSV(records),/demonstration_package/);assert.match(exportCSV(records),/AI-authored example/);
 const geo=exportGeoJSON(records);assert.equal(geo.features.length,0);assert.equal(geo.omittedWithoutCoordinates,9);assert.equal(geo.demonstrationRecords,9);
});
await test("Personal import refuses presentation receipts without changing records or media", async () => {
 await assert.rejects(prepareImport(exportReport(records[0])),/Presentation examples stay/);
});
await test("Missing or substituted source media prevents preparation", () => {
 assert.throws(()=>buildPresentationRecords(media.slice(1),bundle,now),/Prepare and verify/);
 assert.throws(()=>buildPresentationRecords([{...media[0],sha256:"a".repeat(64)},...media.slice(1)],bundle,now),/Prepare and verify/);
});
await test("Human actions retain the example label and the original source", () => {
 const changed=reviewReport(records[0],"needs_information","Actual local test note: request a closer photograph",now);
 assert.deepEqual(changed.demonstration,records[0].demonstration);assert.deepEqual(changed.original,records[0].original);assert.deepEqual(changed.field.reference,records[0].field.reference);
});
await writeFile(".sites-runtime/presentation-workspace-tests.json",JSON.stringify({generatedAt:new Date().toISOString(),results},null,2));
for(const result of results)if(!result.passed)console.error(`FAIL ${result.name}: ${result.error}`);
console.log(`${results.filter((r)=>r.passed).length}/${results.length} presentation workspace checks pass; no live provider, real citizen or expert review in this suite.`);
if(results.some((r)=>!r.passed))process.exitCode=1;
