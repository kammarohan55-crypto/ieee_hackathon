import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { sourceWeatherModules } from "./source-weather-modules.mjs";
const { source: s, route, catalogue } = await sourceWeatherModules();
const bundle = JSON.parse(await readFile(`public${s.SOURCE_WEATHER_ASSET}`, "utf8")), sample = bundle.entries[0], results = [];
async function test(name, run) { try { await run(); results.push({ name, passed: true }); } catch (error) { results.push({ name, passed: false, error: error.message }); } }
const invalid = (change) => assert.equal(s.sourceWeatherSchema.safeParse({ ...sample, ...change }).success, false);
await test("Nine recorded real archive windows match every active source digest, city and date", () => {
  const checked = s.sourceWeatherBundleSchema.parse(bundle);
  assert.equal(checked.entries.length, 9);
  assert.deepEqual(checked.entries.map((entry) => entry.photoId), catalogue.referencePhotos.map((photo) => photo.id));
  assert.ok(checked.entries.every((entry) => entry.days === 7 && entry.kind === "historical_weather_model_context"));
});
await test("Historical Indian sources and unknown IDs cannot acquire European coordinates", () => { assert.equal(s.sourceWeatherAnchor("mutha-river"), null); assert.equal(s.sourceWeatherAnchor("made-up"), null); });
await test("Calendar windows cross leap days and years in UTC without local timezone drift", () => {
  assert.deepEqual(s.sourceWeatherWindow("2020-03-01", 7), { start: "2020-02-27", end: "2020-03-04" });
  assert.deepEqual(s.sourceWeatherWindow("2020-01-01", 15), { start: "2019-12-25", end: "2020-01-08" });
});
await test("Null values stay unknown throughout chart series", () => {
  const daily = structuredClone(sample.daily); daily.precipitation_sum[0] = null; daily.temperature_2m_mean[0] = null; daily.wind_speed_10m_max[0] = null;
  const point = s.archiveSeries(s.sourceWeatherSchema.parse({ ...sample, daily }))[0];
  assert.equal(point.rain, null); assert.equal(point.temperature, null); assert.equal(point.wind, null);
});
await test("Negative rain or wind and non-finite temperatures fail", () => {
  for (const [name, amount] of [["precipitation_sum", -1], ["wind_speed_10m_max", -1], ["temperature_2m_mean", Infinity]]) { const daily = structuredClone(sample.daily); daily[name][0] = amount; invalid({ daily }); }
});
await test("Series lengths must match; values are never padded", () => { const daily = structuredClone(sample.daily); daily.precipitation_sum.pop(); invalid({ daily }); });
await test("Gaps, reversed days and impossible dates fail before plotting", () => {
  for (const mode of ["gap", "reverse", "impossible"]) { const daily = structuredClone(sample.daily); if (mode === "gap") daily.time[1] = daily.time[0]; if (mode === "reverse") daily.time.reverse(); if (mode === "impossible") daily.time[0] = "2020-02-30"; invalid({ daily }); }
});
await test("Archive cannot be attached to another photo, source date or digest", () => { invalid({ photoId: catalogue.referencePhotos[1].id }); invalid({ photoSha256: "a".repeat(64) }); invalid({ sourceDate: "2020-01-01" }); });
await test("Different city coordinates cannot masquerade as this source context", () => { invalid({ requestedCoordinates: { lat: 0, lon: 0 } }); invalid({ gridCoordinates: { lat: 91, lon: 0 } }); });
await test("Model, grid, timezone and precision labels stay fixed and explicit", () => { invalid({ model: "stream sensor" }); invalid({ nominalGridDegrees: .01 }); invalid({ timezone: "local" }); invalid({ locationScope: "camera" }); });
await test("Unknown host, extra observation claims and invalid retrieval time fail", () => { invalid({ sourceUrl: "https://example.test/archive" }); invalid({ reviewed: true }); invalid({ fetchedAt: "today" }); });
await test("A seven-day series cannot be relabeled as a fifteen-day series", () => { invalid({ days: 15 }); });
await test("Bundles reject duplicate windows and invented citizen records", () => {
  assert.equal(s.sourceWeatherBundleSchema.safeParse({ kind: bundle.kind, entries: [sample, sample] }).success, false);
  assert.equal(s.sourceWeatherBundleSchema.safeParse({ ...bundle, observations: [] }).success, false);
});
const originalFetch = globalThis.fetch;
let calls = [], responder;
const request = (photo = sample.photoId, days = "7") => new Request(`https://aqualens.test/api/source-weather?photoId=${encodeURIComponent(photo)}&days=${days}`);
const upstream = (url) => {
  const query = new URL(url).searchParams, start = Date.parse(query.get("start_date") + "T00:00:00Z"), end = Date.parse(query.get("end_date") + "T00:00:00Z");
  const time = Array.from({ length: (end - start) / 86400000 + 1 }, (_, i) => new Date(start + i * 86400000).toISOString().slice(0, 10));
  return { latitude: Number(query.get("latitude")), longitude: Number(query.get("longitude")), utc_offset_seconds: 0,
    daily_units: { time: "iso8601", temperature_2m_mean: "°C", precipitation_sum: "mm", wind_speed_10m_max: "km/h" },
    daily: { time, temperature_2m_mean: time.map(() => 12), precipitation_sum: time.map(() => 0), wind_speed_10m_max: time.map(() => 8) } };
};
globalThis.fetch = async (...args) => { calls.push(args); return responder(...args); };
try {
  await test("Bad photo/window parameters cause no upstream request", async () => {
    for (const [photo, days] of [["", "7"], ["mutha-river", "7"], ["https://private.test", "7"], [sample.photoId, "8"], [sample.photoId, "7.0"], [sample.photoId, "1000"]]) assert.equal((await route.GET(request(photo, days))).status, 400);
    assert.equal(calls.length, 0);
  });
  await test("Real handler requests the exact allowlisted archive contract without credentials", async () => {
    responder = (url) => Response.json(upstream(url));
    const response = await route.GET(request()), body = await response.json(); s.sourceWeatherSchema.parse(body);
    assert.equal(calls[0][0], s.archiveRequest(sample.photoId, 7)); assert.equal(calls[0][1].redirect, "manual"); assert.ok(calls[0][1].signal);
    assert.equal(response.headers.get("Cache-Control"), "no-store"); assert.equal(body.locationScope, "city_overview_not_camera");
  });
  await test("Repeated seven-day requests preserve retrieval time and reuse cache", async () => {
    const before = calls.length, first = await (await route.GET(request())).json(), second = await (await route.GET(request())).json();
    assert.equal(calls.length, before); assert.equal(first.fetchedAt, second.fetchedAt);
  });
  await test("Fifteen-day cache and request stay separate from seven-day context", async () => {
    const before = calls.length, response = await route.GET(request(sample.photoId, "15")), body = await response.json();
    assert.equal(response.status, 200); assert.equal(calls.length, before + 1); assert.equal(body.days, 15); assert.equal(body.daily.time.length, 15);
  });
  const next = catalogue.referencePhotos[1].id;
  await test("Unexpected upstream units are rejected without substitute values", async () => {
    responder = (url) => { const data = upstream(url); data.daily_units.precipitation_sum = "inches"; return Response.json(data); };
    assert.equal((await route.GET(request(next))).status, 503);
  });
  await test("Unexpected dates fail source alignment", async () => {
    responder = (url) => { const data = upstream(url); data.daily.time[0] = "1999-01-01"; return Response.json(data); };
    assert.equal((await route.GET(request(next))).status, 503);
  });
  await test("Non-UTC upstream offset cannot acquire a UTC label", async () => {
    responder = (url) => { const data = upstream(url); data.utc_offset_seconds = 3600; return Response.json(data); };
    assert.equal((await route.GET(request(next))).status, 503);
  });
  await test("HTTP failure, redirect and invalid JSON fail without raw response leakage", async () => {
    for (const status of [429, 500, 302]) { responder = () => new Response("private upstream detail", { status }); const response = await route.GET(request(next)); assert.equal(response.status, 503); assert.ok(!(await response.text()).includes("private upstream")); }
    responder = () => new Response("invalid-json", { status: 200 }); assert.equal((await route.GET(request(next))).status, 503);
  });
  await test("Timeout and network errors leave context missing, not fabricated", async () => {
    for (const failure of [new DOMException("timeout", "TimeoutError"), new Error("network")]) { responder = () => { throw failure; }; const response = await route.GET(request(next)); assert.equal(response.status, 503); assert.match((await response.json()).error, /No replacement values/); }
  });
  await test("Failed requests do not poison cache; explicit retry can recover with nulls", async () => {
    responder = (url) => { const data = upstream(url); data.daily.precipitation_sum[0] = null; return Response.json(data); };
    const response = await route.GET(request(next)), body = await response.json(); assert.equal(response.status, 200); assert.equal(body.daily.precipitation_sum[0], null);
  });
  await test("Cache expires after 24 hours and never serves stale data as a new fetch", async () => {
    const realNow = Date.now, before = calls.length;
    try { Date.now = () => realNow() + 86400001; responder = (url) => Response.json(upstream(url)); assert.equal((await route.GET(request())).status, 200); assert.equal(calls.length, before + 1); } finally { Date.now = realNow; }
  });
} finally { globalThis.fetch = originalFetch; }
await writeFile(".sites-runtime/source-weather-tests.json", JSON.stringify({ generatedAt: new Date().toISOString(), liveAI: false, liveWeather: false, results }, null, 2));
for (const result of results) if (!result.passed) console.error(`FAIL ${result.name}: ${result.error}`);
console.log(`${results.filter((item) => item.passed).length}/${results.length} source-weather checks pass; fixtures are authored and real recorded assets are validated, no live network calls.`);
if (results.some((item) => !item.passed)) process.exitCode = 1;
