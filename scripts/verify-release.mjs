import { readFile, readdir, stat, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

// Read the locally configured secret only to detect accidental inclusion.
// Never log its value, fingerprint, or matching text.
let keys = [];
try {
  const vars = await readFile(".dev.vars", "utf8");
  keys = [...vars.matchAll(/^(?:GEMINI|XAI|GROQ)_API_KEY\s*=\s*(.*)$/gm)]
    .map((match) => match[1].trim().replace(/^(["'])(.*)\1$/, "$2")).filter(Boolean);
} catch { /* A no-key installation is valid. */ }
const ignored = new Set(["node_modules", "dist", ".git", ".wrangler", ".sites-runtime", ".next", ".vinext", ".agents", ".codex", "outputs", "work"]);
async function walk(directory) {
  const result = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if (item.isSymbolicLink()) continue;
    const relative = path.join(directory, item.name);
    if (item.isDirectory()) {
      if (!ignored.has(item.name) && !(relative.replaceAll("\\", "/") === "public/vendor")) result.push(...await walk(relative));
    } else if ((/^(\.env|\.dev\.vars)/.test(item.name) && !item.name.endsWith(".example")) || item.name.endsWith(".tsbuildinfo") || item.name === "next-env.d.ts") {
      continue;
    } else if (item.isFile()) result.push(relative.replaceAll("\\", "/"));
  }
  return result;
}
const source = (await walk(".")).sort();
const built = (await walk("dist")).sort();
assert.ok(source.length > 0 && built.length > 0, "Source and production build must exist");
const leaks = [];
for (const file of [...source, ...built]) {
  const bytes = await readFile(file);
  if (keys.some((key) => bytes.includes(Buffer.from(key)))) leaks.push(file);
}
assert.deepEqual(leaks, [], "Configured credential found outside ignored local configuration; do not release");
const ignoredText = await readFile(".gitignore", "utf8");
assert.ok(ignoredText.includes(".dev.vars*") && ignoredText.includes(".env*"), "Secret files must remain ignored");
for (const file of ["dist/server/index.js", "dist/client/sw.js", "dist/client/manifest.webmanifest", "dist/client/vendor/maplibre/maplibre-gl-worker.mjs", "dist/client/vendor/maplibre/LICENSE.txt"]) {
  assert.ok((await stat(file)).size > 0, `Missing release asset: ${file}`);
}
for (const name of ["evaluation", "api-evaluation", "workspace-evaluation", "mission-evaluation"]) {
  const content = await readFile(`public/${name}.json`, "utf8");
  const test = JSON.parse(content);
  assert.equal(test.passed, test.total, `${name} has failed tests`);
  assert.equal(test.liveAI, false, "Authored test results must be labeled as non-live");
  assert.equal(await readFile(`dist/client/${name}.json`, "utf8"), content, "Rebuild after updating test results");
}
const sourceCatalogue = await import(pathToFileURL(path.resolve(".sites-runtime/domain-tests/references.mjs")));
const offlineWorker = await readFile("dist/client/sw.js", "utf8");
for (const photo of sourceCatalogue.allReferencePhotos) {
  const bytes = await readFile(`dist/client${photo.src}`);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), photo.sha256, "Built reference image must preserve its source digest");
  assert.ok(offlineWorker.includes(photo.src.slice(1)), "Reference photograph missing from offline cache");
}
const contextSource = await readFile("public/european-context.json", "utf8");
const { europeanBundleSchema, EUROPEAN_CONTEXT_ASSET } = await import(pathToFileURL(path.resolve(".sites-runtime/api-tests/european-sites.mjs")));
europeanBundleSchema.parse(JSON.parse(contextSource));
assert.equal(await readFile("dist/client/european-context.json", "utf8"), contextSource, "Rebuild changed recorded context assets");
assert.ok(offlineWorker.includes("european-context.json"), "Recorded source context must remain labeled offline");
assert.equal(await readFile(`public${EUROPEAN_CONTEXT_ASSET}`, "utf8"), contextSource, "Versioned and legacy context must agree");
assert.equal(await readFile(`dist/client${EUROPEAN_CONTEXT_ASSET}`, "utf8"), contextSource, "Versioned context must ship unchanged");
assert.ok(offlineWorker.includes(EUROPEAN_CONTEXT_ASSET.slice(1)), "Versioned source context must be cached for the new presentation");
const { sourceWeatherBundleSchema, SOURCE_WEATHER_ASSET } = await import(pathToFileURL(path.resolve(".sites-runtime/source-weather-tests/source-weather.mjs")));
const archiveSource = await readFile(`public${SOURCE_WEATHER_ASSET}`, "utf8");
const archive = sourceWeatherBundleSchema.parse(JSON.parse(archiveSource));
assert.equal(archive.entries.length, sourceCatalogue.referencePhotos.length, "Each active European source must have its own recorded archive");
assert.equal(await readFile(`dist/client${SOURCE_WEATHER_ASSET}`, "utf8"), archiveSource, "Rebuild changed archive assets");
assert.ok(offlineWorker.includes(SOURCE_WEATHER_ASSET.slice(1)), "Recorded weather archive must ship for offline reuse");
assert.ok((await stat("dist/client/images/references/CREDITS.md")).size > 0, "Photograph licence notice must ship with the images");
await mkdir(".sites-runtime", { recursive: true });
await writeFile(".sites-runtime/source-files.json", JSON.stringify(source, null, 2));
const report = {
  generatedAt: new Date().toISOString(), sourceFiles: source.length, buildFiles: built.length,
  configuredSecretChecked: keys.length > 0, configuredSecretsChecked: keys.length, configuredSecretMatches: leaks.length,
  buildAssetsPresent: true,
  limitations: ["Checks locally configured Gemini/xAI/Groq secrets, not every possible credential pattern.", "Does not validate browser permissions, service worker installation, deployment or scientific accuracy."],
};
await writeFile(".sites-runtime/release-check.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
