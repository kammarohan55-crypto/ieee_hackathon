import { readFile, readdir, stat, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

// Read the locally configured secret only to detect accidental inclusion.
// Never log its value, fingerprint, or matching text.
let key = "";
try {
  const vars = await readFile(".dev.vars", "utf8");
  const match = vars.match(/^GEMINI_API_KEY\s*=\s*(.*)$/m);
  key = (match?.[1] || "").trim().replace(/^(["'])(.*)\1$/, "$2");
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
  if (key && bytes.includes(Buffer.from(key))) leaks.push(file);
}
assert.deepEqual(leaks, [], "Configured credential found outside ignored local configuration; do not release");
const ignoredText = await readFile(".gitignore", "utf8");
assert.ok(ignoredText.includes(".dev.vars*") && ignoredText.includes(".env*"), "Secret files must remain ignored");
for (const file of ["dist/server/index.js", "dist/client/sw.js", "dist/client/manifest.webmanifest", "dist/client/vendor/maplibre/maplibre-gl-worker.mjs", "dist/client/vendor/maplibre/LICENSE.txt"]) {
  assert.ok((await stat(file)).size > 0, `Missing release asset: ${file}`);
}
for (const name of ["evaluation", "api-evaluation"]) {
  const content = await readFile(`public/${name}.json`, "utf8");
  const test = JSON.parse(content);
  assert.equal(test.passed, test.total, `${name} has failed tests`);
  assert.equal(test.liveAI, false, "Authored test results must be labeled as non-live");
  assert.equal(await readFile(`dist/client/${name}.json`, "utf8"), content, "Rebuild after updating test results");
}
await mkdir(".sites-runtime", { recursive: true });
await writeFile(".sites-runtime/source-files.json", JSON.stringify(source, null, 2));
const report = {
  generatedAt: new Date().toISOString(), sourceFiles: source.length, buildFiles: built.length,
  configuredSecretChecked: !!key, configuredSecretMatches: leaks.length,
  buildAssetsPresent: true,
  limitations: ["Checks this installation's configured Gemini secret, not every possible credential pattern.", "Does not validate browser permissions, service worker installation, deployment or scientific accuracy."],
};
await writeFile(".sites-runtime/release-check.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
