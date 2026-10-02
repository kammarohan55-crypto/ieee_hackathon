import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import sharp from "sharp";

// Explicitly authorized public source analyses, not fabricated citizen observations.
if (!process.argv.includes("--consent")) throw new Error("Pass --consent to send the three credited European photos to the configured Gemini provider. No request made.");
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
const bundle = { kind: "recorded_public_context", generatedAt: new Date().toISOString(), analyses: [], weather: [] };
for (const photo of referencePhotos) {
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
  const response = await conditions.GET(new Request(`https://source-preparation.test/api/conditions?lat=${place.lat}&lon=${place.lon}&hourly=1`));
  if (response.ok) bundle.weather.push({ placeId: place.id, snapshot: await response.json() });
  console.log(JSON.stringify({ place: place.id, weatherStatus: response.status, recordedSnapshot: response.ok }));
}
const checked = sites.europeanBundleSchema.parse(bundle);
await writeFile("public/european-context.json", JSON.stringify(checked, null, 2) + "\n");
console.log("Recorded source kit saved; no citizen notes, confirmations, instruments or human reviews created.");
