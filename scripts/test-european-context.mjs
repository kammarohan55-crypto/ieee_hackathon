import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import postcss from "postcss";
import { europeanBundleSchema, europeanPlaces, sourceAnalysisSchema } from "../.sites-runtime/api-tests/european-sites.mjs";
import { hourlyWeatherSchema, weatherContextSchema, weatherSeries } from "../.sites-runtime/api-tests/weather-context.mjs";
import { referencePhotos, archivedReferencePhotos } from "../.sites-runtime/api-tests/references.mjs";

// Actual recorded asset validation plus authored failure fixtures, not model accuracy.
const bundle = JSON.parse(await readFile("public/european-context.json", "utf8")), results = [];
async function test(name, callback) { try { await callback(); results.push({ name, passed: true }); } catch (error) { results.push({ name, passed: false, error: error.message }); } }
await test("Active European images and recorded source analyses preserve real byte digests and pending review", async () => {
  assert.equal(referencePhotos.length, 9); assert.equal(archivedReferencePhotos.length, 3);
  assert.ok(referencePhotos.every((photo) => !photo.site.includes("Pune")));
  const checked = europeanBundleSchema.parse(bundle);
  for (const photo of referencePhotos) {
    const bytes = await readFile(`public${photo.src}`);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), photo.sha256);
    const analysis = checked.analyses.find((item) => item.photoId === photo.id);
    if (analysis) { assert.equal(analysis.recorded, true); assert.equal(analysis.humanReview, "not_performed"); }
  }
  assert.equal(checked.kind, "recorded_public_context");
});
await test("A recorded candidate cannot attach to a different photo or changed source bytes", () => {
  const analysis = bundle.analyses[0]; assert.ok(analysis);
  assert.equal(sourceAnalysisSchema.safeParse({ ...analysis, sha256: "a".repeat(64) }).success, false);
  assert.equal(sourceAnalysisSchema.safeParse({ ...analysis, photoId: referencePhotos[1].id }).success, false);
});
await test("Recorded AI never becomes a completed human review or silently live result", () => {
  const analysis = bundle.analyses[0];
  assert.equal(sourceAnalysisSchema.safeParse({ ...analysis, humanReview: "approved" }).success, false);
  assert.equal(sourceAnalysisSchema.safeParse({ ...analysis, recorded: false }).success, false);
  assert.equal(sourceAnalysisSchema.safeParse({ ...analysis, findings: [] }).success, true);
});
await test("City context has source coordinates without invented field observations or station IDs", () => {
  assert.deepEqual(europeanPlaces.map((p) => p.id), ["coimbra", "toulouse", "oslo"]);
  assert.ok(europeanPlaces.every((p) => p.wikidata.startsWith("Q") && p.official.startsWith("https://www.oneaquahealth.eu/research-cities/")));
  assert.equal(bundle.records, undefined); assert.equal(bundle.observations, undefined);
  assert.equal(europeanBundleSchema.safeParse({ ...bundle, observations: [{ reviewed: true }] }).success, false);
});
await test("A city's recorded weather cannot be transplanted to another reference location", () => {
  const broken = structuredClone(bundle); assert.ok(broken.weather.length);
  broken.weather[0].placeId = "oslo";
  assert.equal(europeanBundleSchema.safeParse(broken).success, false);
});
await test("Hourly series preserve every numeric value and actual UTC timestamp", () => {
  for (const entry of bundle.weather) {
    const checked = weatherContextSchema.parse(entry.snapshot), points = weatherSeries(checked);
    assert.equal(points.length, checked.hourly.time.length);
    for (let index = 0; index < points.length; index++) {
      assert.equal(points[index].rain, checked.hourly.precipitation[index]);
      assert.equal(points[index].timestamp, Date.parse(`${checked.hourly.time[index]}Z`));
    }
  }
});
await test("Missing hours are never padded or converted into observed zeros", () => {
  const h = bundle.weather[0].snapshot.hourly, broken = { ...h, precipitation: h.precipitation.slice(1) };
  assert.equal(hourlyWeatherSchema.safeParse(broken).success, false);
  const noHourly = { ...bundle.weather[0].snapshot }; delete noHourly.hourly;
  assert.deepEqual(weatherSeries(weatherContextSchema.parse(noHourly)), []);
});
await test("Unknown weather host or malformed retrieval timestamp cannot appear as sourced context", () => {
  const weather = bundle.weather[0].snapshot;
  assert.equal(weatherContextSchema.safeParse({ ...weather, sourceUrl: "https://unverified.test/forecast" }).success, false);
  assert.equal(weatherContextSchema.safeParse({ ...weather, fetchedAt: "not-recorded" }).success, false);
});
await test("Impossible or reordered UTC hours fail before plotting", () => {
  const hourly = structuredClone(bundle.weather[0].snapshot.hourly);
  hourly.time[0] = "2026-02-30T00:00"; assert.equal(hourlyWeatherSchema.safeParse(hourly).success, false);
  hourly.time = [...bundle.weather[0].snapshot.hourly.time].reverse(); assert.equal(hourlyWeatherSchema.safeParse(hourly).success, false);
});
await test("European visualization styles parse with mobile, focus and reduced-motion states", async () => {
  const css = await readFile("app/european-context.css", "utf8"); postcss.parse(css);
  assert.match(css, /max-width: 680px/); assert.match(css, /focus-visible/); assert.match(css, /prefers-reduced-motion/);
});
await writeFile(".sites-runtime/european-context-tests.json", JSON.stringify({ generatedAt: new Date().toISOString(), liveAI: false, results }, null, 2));
for (const result of results) if (!result.passed) console.error(`FAIL ${result.name}: ${result.error}`);
console.log(`${results.filter((r) => r.passed).length}/${results.length} European context checks pass; no browser/provider call or scientific validation.`);
if (results.some((r) => !r.passed)) process.exitCode = 1;
