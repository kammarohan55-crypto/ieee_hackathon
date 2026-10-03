import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import sharp from "sharp";
const require = createRequire(import.meta.url), cache = new Map();
async function library(name) {
  if (cache.has(name)) return cache.get(name);
  const file = `lib/${name}.ts`, imports = new Map(), source = await readFile(file, "utf8");
  const fixtureModule = { exports: {} }, code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  cache.set(name,fixtureModule.exports);
  for (const match of code.matchAll(/require\("\.\/([^\"]+)"\)/g)) imports.set(`./${match[1]}`, await library(match[1]));
  vm.runInNewContext(code, { module: fixtureModule, exports: fixtureModule.exports, require: (name) => imports.has(name) ? imports.get(name) : require(name), Date, structuredClone, crypto }, { filename: file });
  cache.set(name, fixtureModule.exports); return fixtureModule.exports;
}
const { referencePhotos, extendedReferencePhotos, europeanPhotoLibrary, archivedReferencePhotos, evidenceTimePrecision } = await library("references");
const { archiveAnalytics } = await library("visual-analytics");
const { createReferenceDraft, newField } = await library("field");
const { createReport, assess } = await library("assessment");
const results=[];
async function test(name, run) { try { await run(); results.push({name,passed:true}); } catch(error) { results.push({name,passed:false,error:error.message}); } }
await test("Thirty additional licensed source files preserve actual pixel dimensions and digests", async () => {
  assert.equal(referencePhotos.length,9); assert.equal(extendedReferencePhotos.length,30); assert.equal(europeanPhotoLibrary.length,39); assert.equal(archivedReferencePhotos.length,3);
  assert.equal(new Set(europeanPhotoLibrary.map((photo)=>photo.id)).size,39);
  assert.equal(new Set(europeanPhotoLibrary.map((photo)=>photo.sha256)).size,39);
  for (const photo of extendedReferencePhotos) {
    const bytes=await readFile(`public${photo.src}`), metadata=await sharp(bytes).metadata();
    assert.equal(createHash("sha256").update(bytes).digest("hex"),photo.sha256); assert.equal(metadata.width,photo.width); assert.equal(metadata.height,photo.height); assert.equal(metadata.format,"jpeg");
    assert.match(photo.sourceUrl,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/); assert.match(photo.license,/^(CC BY|CC0)/); assert.match(photo.licenseUrl,/^https?:\/\/creativecommons\.org\//); assert.ok(photo.author.length>0);
  }
});
await test("Source coverage has real varied calendar dates and no invented saved reviews or AI", () => {
  const data=archiveAnalytics([]); assert.equal(data.photos.length,39); assert.equal(data.first,2005); assert.equal(data.last,2026); assert.ok(data.sourceDates>20);
  assert.equal(data.reviews,0); assert.equal(data.aiResponses,0); assert.equal(data.candidates,0); assert.equal(data.examples,0);
  assert.equal(data.quarters.reduce((n,item)=>n+item.count,0),39); assert.equal(data.formats.reduce((n,item)=>n+item.count,0),39);
  assert.deepEqual(Array.from(data.cities,(item)=>item.count),[18,17,4]);
  assert.ok(europeanPhotoLibrary.every((photo)=>evidenceTimePrecision(photo.capturedDate)==="date_only"));
});
await test("Year coverage retains empty years and original chronology instead of retiming records", () => {
  const data=archiveAnalytics([]); assert.equal(data.years.length,22); assert.equal(data.years.reduce((n,item)=>n+item.count,0),39);
  for (const item of data.years) assert.equal(item.count,europeanPhotoLibrary.filter((photo)=>photo.capturedDate.startsWith(item.year)).length);
  assert.equal(data.years.find((item)=>item.year==="2017").count,0);
  assert.ok(data.photos.every((photo,index)=>!index||photo.capturedDate>=data.photos[index-1].capturedDate));
});
await test("City and year filters cannot invent sources or silently fill a missing year", () => {
  const data=archiveAnalytics([],"oslo","2014"); assert.equal(data.photos.length,2); assert.equal(data.sourceDates,1);
  assert.ok(data.photos.every((photo)=>photo.id.startsWith("hoffselva-")&&photo.capturedDate==="2014-05-12"));
  assert.equal(archiveAnalytics([],"coimbra","2017").photos.length,0); assert.equal(archiveAnalytics([],"unknown-city").photos.length,0);
});
function fixture(photo=extendedReferencePhotos[0], id="authored-source-fixture") {
  const now=new Date("2026-10-03T10:00:00Z"), {draft,field}=createReferenceDraft(photo);
  draft.note="Authored software test; no real citizen observation.";
  field.media=[{id:"fixture-photo",kind:"photo",mime:"image/jpeg",bytes:10,sha256:photo.sha256,createdAt:now.toISOString(),width:photo.width,height:photo.height,origin:"public_reference",quality:{brightness:100,edgeDetail:10,warnings:[],method:"canvas-luma-v1"}}];
  return {...createReport(draft,assess(draft,now),now,id),field};
}
await test("Only a matched real-source review contributes AI counts; unrelated, synthetic and mismatched records are excluded", () => {
  const valid=fixture(); valid.field.media[0].visual={provider:"groq",model:"authored-test-model",at:"2026-10-03T10:00:00Z",findings:[{kind:"surface_foam",confidence:"low",region:"center"}]};
  const mismatch=fixture(extendedReferencePhotos[1],"wrong-digest"); mismatch.field.media[0].sha256="b".repeat(64);
  const synthetic=fixture(extendedReferencePhotos[2],"synthetic"); synthetic.original.synthetic=true;
  const field={...valid,id:"field-only",field:newField()};
  const data=archiveAnalytics([valid,mismatch,synthetic,field]); assert.equal(data.reviews,1); assert.equal(data.aiResponses,1); assert.equal(data.candidates,1); assert.equal(data.examples,0);
});
await test("Latest usable review is counted once; archive statistics never modify timestamps, notes or record order", () => {
  const first=fixture(), newer=fixture(extendedReferencePhotos[0],"newer"); first.createdAt="2026-10-02T00:00:00Z"; newer.createdAt="2026-10-03T00:00:00Z";
  const records=[first,newer], before=JSON.stringify(records), data=archiveAnalytics(records);
  assert.equal(data.reviews,1); assert.equal(JSON.stringify(records),before);
  assert.equal(data.photos.find((photo)=>photo.id===extendedReferencePhotos[0].id).capturedDate,extendedReferencePhotos[0].capturedDate);
});
await mkdir(".sites-runtime/source-archive-tests",{recursive:true});
await writeFile(".sites-runtime/source-archive-tests/results.json",JSON.stringify({generatedAt:new Date().toISOString(),passed:results.filter(r=>r.passed).length,total:results.length,liveAI:false,limitations:["Authored software fixtures and real source-file digests/dimensions. No external metadata authenticity, live provider, citizen or scientific validation."],results},null,2));
for (const result of results) if(!result.passed) console.error(`FAIL ${result.name}: ${result.error}`);
console.log(`${results.filter(r=>r.passed).length}/${results.length} source archive checks passed.`);
if(results.some(r=>!r.passed))process.exitCode=1;
