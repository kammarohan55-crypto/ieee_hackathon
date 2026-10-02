import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import sharp from "sharp";

// Explicitly authorized public source analyses, not fabricated citizen observations.
if (!process.argv.includes("--consent")) throw new Error("Pass --consent to send eligible credited European photos to the configured Gemini provider. No request made.");
const moduleAt = (name) => import(pathToFileURL(path.resolve(`.sites-runtime/api-tests/${name}.mjs`)));
const { env } = await moduleAt("env");
const { GET } = await moduleAt("route-assess");
const visual = await moduleAt("route-visual"), conditions = await moduleAt("route-conditions");
const { referencePhotos } = await moduleAt("references");
const sites = await moduleAt("european-sites");
for (const key of Object.keys(env)) delete env[key];
for (const match of (await readFile(".dev.vars", "utf8")).matchAll(/^([A-Z_]+)\s*=\s*(.*)$/gm)) {
  if (/^(AI_|GEMINI_|XAI_|GROQ_)/.test(match[1])) env[match[1]] = match[2].trim().replace(/^(["'])(.*)\1$/, "$2");
}
const status = await (await GET()).json();
if (!status.liveAI || status.provider !== "Google Gemini" || status.fallbackProvider) throw new Error("Only the explicitly configured Gemini recipient, without fallback, is supported by this source kit.");
const preserve = process.argv.includes("--missing-only");
const previous = preserve ? sites.europeanBundleSchema.parse(JSON.parse(await readFile("public/european-context.json", "utf8"))) : null;
const bundle = { kind: "recorded_public_context", generatedAt: previous?.generatedAt ?? new Date().toISOString(), analyses: previous?.analyses ?? [], weather: previous?.weather ?? [] };
for (const photo of referencePhotos) {
  if (bundle.analyses.some((entry) => entry.photoId === photo.id && entry.sha256 === photo.sha256)) continue;
  // This portrait includes visible people. Keep the watermark and original bytes,
  // and use local checks rather than sending this frame for visual AI.
  if (photo.id === "mondego-riverbank") { console.log(JSON.stringify({ photoId: photo.id, analysis: "not requested; people visible; local checks only" })); continue; }
  const image = await sharp(await readFile(`public${photo.src}`)).resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
  const response = await visual.POST(new Request("https://source-preparation.test/api/visual", {
    method: "POST", headers: { "Content-Type": "application/json", "cf-connecting-ip": `authorized-source-${photo.id}` },
    body: JSON.stringify({ consent: true, consentScope: status.consentScope, image: image.toString("base64") }),
  }));
  if (response.ok) {
    const result = await response.json();
    const analysis = sites.sourceAnalysisSchema.parse({ ...result, recorded: true, photoId: photo.id, sha256: photo.sha256,
      humanReview: "not_performed", method: "Resized JPEG · enumerated visual candidates" });
    bundle.analyses.push(analysis);
    console.log(JSON.stringify({ photoId: photo.id, routeStatus: response.status, candidates: analysis.findings.length, humanReview: "not_performed" }));
  } else console.log(JSON.stringify({ photoId: photo.id, routeStatus: response.status, analysis: "unavailable; no substitute" }));
}
for (const place of sites.europeanPlaces) {
  if (bundle.weather.some((entry) => entry.placeId === place.id)) continue;
  const response = await conditions.GET(new Request(`https://source-preparation.test/api/conditions?lat=${place.lat}&lon=${place.lon}&hourly=1`));
  if (response.ok) bundle.weather.push({ placeId: place.id, snapshot: await response.json() });
  console.log(JSON.stringify({ place: place.id, weatherStatus: response.status, recordedSnapshot: response.ok }));
}
const checked = sites.europeanBundleSchema.parse(bundle);
const output = JSON.stringify(checked, null, 2) + "\n";
const revisionPath = `public${sites.EUROPEAN_CONTEXT_ASSET}`;
let oldRevision;
try { oldRevision = await readFile(revisionPath, "utf8"); } catch (error) { if (error.code !== "ENOENT") throw error; }
if (oldRevision && oldRevision !== output) throw new Error("Recorded dataset changed. Bump EUROPEAN_CONTEXT_ASSET and the presentation preset keys before publishing a new revision; no files overwritten.");
await writeFile("public/european-context.json", output);
await writeFile(revisionPath, output);
console.log("Recorded source kit saved; no citizen notes, confirmations, instruments or human reviews created.");
