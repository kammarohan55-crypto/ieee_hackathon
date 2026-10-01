import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import ts from "typescript";

// Executes the real route handlers with an explicit mock Worker environment.
// Never loads .dev.vars, contacts a provider, or treats mock results as live AI.
const directory = path.resolve(".sites-runtime/api-tests");
await mkdir(directory, { recursive: true });
await writeFile(path.join(directory, "env.mjs"), "export const env = {};\n");
const files = [
  ["lib/references.ts", "references"], ["lib/field.ts", "field"], ["lib/assessment.ts", "assessment"], ["lib/gemini.ts", "gemini"],
  ...["assess", "visual", "conditions"].map((name) => [`app/api/${name}/route.ts`, `route-${name}`]),
];
for (const [file, name] of files) {
  const code = ts.transpileModule(await readFile(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText.replaceAll('"cloudflare:workers"', '"./env.mjs"')
    .replace(/"(?:@\/lib\/|\.\/)(field|assessment|gemini|references)"/g, '"./$1.mjs"');
  await writeFile(path.join(directory, `${name}.mjs`), code);
}
const moduleAt = (name) => import(pathToFileURL(path.join(directory, `${name}.mjs`)));
const { env } = await moduleAt("env");
const assess = await moduleAt("route-assess"), visual = await moduleAt("route-visual"), weather = await moduleAt("route-conditions");
const results = [];
async function test(name, fn) {
  try { await fn(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, error: error.message }); }
}
const originalFetch = globalThis.fetch;
let calls = [], responder = () => { throw new Error("Unexpected provider call"); };
globalThis.fetch = async (...args) => { calls.push(args); return responder(...args); };
let requestId = 0;
const request = (route, body, headers = {}) => new Request(`https://aqualens.test/api/${route}`, {
  method: "POST", headers: { "Content-Type": "application/json", "cf-connecting-ip": `test-${++requestId}`, ...headers },
  body: typeof body === "string" ? body : JSON.stringify(body),
});
const observation = { site: "Synthetic API fixture", observedAt: "2026-09-26T09:00:00Z", note: "The appearance is unknown.", appearance: "unsure", synthetic: true };
const image = { consent: true, image: "A".repeat(160) }; // Mock payload, not a photograph.
const provider = (findings, reason = "STOP", parts) => Response.json({ candidates: [{ finishReason: reason, content: { parts: parts || [{ text: JSON.stringify({ findings }) }] } }] });
const candidate = { kind: "surface_foam", confidence: "low", region: "center" };
try {
  await test("Configuration exposes capability, never the key", async () => {
    env.GEMINI_API_KEY = "test-only-credential";
    const response = await assess.GET();
    const body = await response.json();
    assert.equal(body.liveAI, true);
    assert.ok(!JSON.stringify(body).includes(env.GEMINI_API_KEY));
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  });
  await test("Text opt-out remains local and does not call the provider", async () => {
    calls = [];
    const response = await assess.POST(request("assess", { observation, useAI: false }));
    assert.equal((await response.json()).mode, "rules");
    assert.equal(calls.length, 0);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  });
  await test("Text missing-key fallback is explicit and uncached", async () => {
    delete env.GEMINI_API_KEY;
    const response = await assess.POST(request("assess", { observation, useAI: true }));
    assert.match((await response.json()).notice, /not configured/);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    env.GEMINI_API_KEY = "test-only-credential";
  });
  await test("Both AI routes reject cross-origin requests before provider access", async () => {
    calls = [];
    for (const [route, handler, body] of [["assess", assess, { observation, useAI: true }], ["visual", visual, image]])
      assert.equal((await handler.POST(request(route, body, { Origin: "https://elsewhere.test" }))).status, 403);
    assert.equal(calls.length, 0);
  });
  await test("Malformed and oversized text requests fail cleanly", async () => {
    assert.equal((await assess.POST(request("assess", "{"))).status, 400);
    assert.equal((await assess.POST(request("assess", { observation, useAI: "yes" }))).status, 400);
    assert.equal((await assess.POST(request("assess", "x".repeat(24001)))).status, 413);
    assert.equal((await assess.POST(request("assess", "{}", { "Content-Length": "24001" }))).status, 413);
  });
  await test("Visual requests require explicit consent and valid input shape", async () => {
    calls = [];
    for (const body of [{ ...image, consent: false }, { image: image.image }, { ...image, diagnosis: true }, { ...image, image: "not base64" }])
      assert.equal((await visual.POST(request("visual", body))).status, 400);
    assert.equal(calls.length, 0);
  });
  await test("Visual route rejects oversized bodies even without length headers", async () => {
    assert.equal((await visual.POST(request("visual", "A".repeat(3000001)))).status, 413);
    assert.equal((await visual.POST(request("visual", image, { "Content-Length": "3000001" }))).status, 413);
  });
  await test("Visual missing configuration never fabricates findings", async () => {
    delete env.GEMINI_API_KEY;
    const response = await visual.POST(request("visual", image));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).findings, undefined);
    env.GEMINI_API_KEY = "test-only-credential";
  });
  await test("Visual provider request excludes unrelated citizen data and uses a header key", async () => {
    calls = []; responder = () => provider([candidate]);
    const response = await visual.POST(request("visual", image));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body.findings, [candidate]);
    assert.ok(body.model && body.at);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    const [url, options] = calls[0];
    assert.ok(!url.includes(env.GEMINI_API_KEY));
    assert.equal(options.headers["x-goog-api-key"], env.GEMINI_API_KEY);
    const sent = JSON.parse(options.body);
    assert.equal(sent.contents[0].parts[0].inlineData.data, image.image);
    assert.ok(!options.body.includes(observation.site));
  });
  await test("Visual results deduplicate candidates and allow abstention", async () => {
    responder = () => provider([candidate, candidate]);
    assert.equal((await (await visual.POST(request("visual", image))).json()).findings.length, 1);
    responder = () => provider([]);
    assert.deepEqual((await (await visual.POST(request("visual", image))).json()).findings, []);
  });
  await test("Provider free-form diagnosis is rejected", async () => {
    responder = () => provider([{ ...candidate, diagnosis: "unsafe water" }]);
    const response = await visual.POST(request("visual", image));
    assert.equal(response.status, 503);
    assert.ok(!(await response.text()).includes("unsafe water"));
  });
  await test("Invalid visual vocabulary and confidence are rejected", async () => {
    for (const invalid of [{ ...candidate, kind: "pathogen" }, { ...candidate, confidence: 0.99 }]) {
      responder = () => provider([invalid]);
      assert.equal((await visual.POST(request("visual", image))).status, 503);
    }
  });
  await test("Truncated and safety-stopped visual completions cannot become evidence", async () => {
    for (const reason of ["MAX_TOKENS", "SAFETY"]) {
      responder = () => provider([candidate], reason);
      assert.equal((await visual.POST(request("visual", image))).status, 503);
    }
  });
  await test("Thought output is excluded from visual parsing", async () => {
    responder = () => provider([], "STOP", [{ thought: true, text: "untrusted reasoning" }, { text: '{"findings":[]}' }]);
    const response = await visual.POST(request("visual", image));
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).findings, []);
  });
  await test("Provider errors and timeouts disclose no internal text or key", async () => {
    for (const failure of [() => new Response("provider-private-error", { status: 503 }), () => { throw new Error("provider-private-error"); }]) {
      responder = failure;
      const response = await visual.POST(request("visual", image));
      assert.equal(response.status, 503);
      const body = await response.text();
      assert.ok(!body.includes("provider-private-error") && !body.includes(env.GEMINI_API_KEY));
    }
  });
  await test("Visual per-client throttle prevents a fifth provider request", async () => {
    calls = []; responder = () => provider([]);
    for (let i = 0; i < 5; i++) {
      const response = await visual.POST(request("visual", image, { "cf-connecting-ip": "rate-visual" }));
      assert.equal(response.status, i < 4 ? 200 : 429);
    }
    assert.equal(calls.length, 4);
  });
  await test("Text per-client throttle preserves honest local fallback", async () => {
    calls = []; responder = () => Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: '{"issues":[]}' }] } }] });
    for (let i = 0; i < 7; i++) {
      const response = await assess.POST(request("assess", { observation, useAI: true }, { "cf-connecting-ip": "rate-text" }));
      const body = await response.json();
      if (i === 6) { assert.equal(body.mode, "rules"); assert.match(body.notice, /limit reached/); }
    }
    assert.equal(calls.length, 6);
  });
  await test("Weather requires explicit finite coordinates before calling its provider", async () => {
    calls = [];
    for (const query of ["", "?lat=&lon=0", "?lat=91&lon=1", "?lat=1&lon=181", "?lat=NaN&lon=0"]) {
      assert.equal((await weather.GET(new Request(`https://aqualens.test/api/conditions${query}`))).status, 400);
    }
    assert.equal(calls.length, 0);
  });
  await test("Weather rejects unknown units instead of relabeling values", async () => {
    responder = () => Response.json({ latitude: 18.5, longitude: 73.875, current: { time: "2026-09-29T09:00", interval: 900, temperature_2m: 70, precipitation: 0, wind_speed_10m: 5 }, current_units: { temperature_2m: "°F", precipitation: "mm", wind_speed_10m: "km/h" } });
    assert.equal((await weather.GET(new Request("https://aqualens.test/api/conditions?lat=18.52&lon=73.85"))).status, 503);
  });
  await test("Weather retains source time, interval and provenance, then uses its cache", async () => {
    calls = [];
    responder = () => Response.json({ latitude: 18.5, longitude: 73.875, current: { time: "2026-09-29T09:00", interval: 900, temperature_2m: 21, precipitation: 0.2, wind_speed_10m: 5 }, current_units: { temperature_2m: "°C", precipitation: "mm", wind_speed_10m: "km/h" } });
    const body = await (await weather.GET(new Request("https://aqualens.test/api/conditions?lat=18.52&lon=73.85"))).json();
    assert.equal(body.time, "2026-09-29T09:00");
    assert.equal(body.interval, 900);
    assert.equal(body.kind, "weather_model_context");
    assert.equal(body.temperature, 21);
    assert.deepEqual(body.requestedCoordinates, { lat: 18.52, lon: 73.85 });
    assert.deepEqual(body.gridCoordinates, { lat: 18.5, lon: 73.875 });
    assert.match(calls[0][0], /latitude=18.5200&longitude=73.8500/);
    assert.deepEqual(await (await weather.GET(new Request("https://aqualens.test/api/conditions?lat=18.52&lon=73.85"))).json(), body);
    assert.equal(calls.length, 1);
  });
  await test("Weather never serves one location's cached data at another location", async () => {
    calls = [];
    responder = () => new Response("unavailable", { status: 503 });
    const result = await weather.GET(new Request("https://aqualens.test/api/conditions?lat=0&lon=0"));
    assert.equal(result.status, 503);
    assert.equal((await result.json()).temperature, undefined);
    assert.equal(calls.length, 1);
    assert.equal(result.headers.get("Cache-Control"), "no-store");
  });
} finally { globalThis.fetch = originalFetch; }
const report = { suite: "AquaLens route contracts", generatedAt: new Date().toISOString(), liveAI: false, providerTests: "Mocked fetch and Worker environment; actual route code. No live service or ecological validation.", passed: results.filter((r) => r.passed).length, total: results.length, results };
await writeFile("public/api-evaluation.json", JSON.stringify(report, null, 2));
for (const result of results) if (!result.passed) console.error(`FAIL ${result.name}: ${result.error}`);
console.log(`${report.passed}/${report.total} API contract tests passed. No live provider called.`);
if (report.passed !== report.total) process.exitCode = 1;
