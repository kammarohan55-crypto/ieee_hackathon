import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
// Explicit opt-in only: this command sends the supplied photo to the configured AI provider.
const filename = process.argv[2];
if (!filename || !process.argv.includes("--consent")) throw new Error("Usage: node scripts/test-live-visual.mjs /path/to/your-photo.jpg --consent. The photo is sent to your configured Gemini provider.");
const image = (await sharp(filename).resize({ width: 1280, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()).toString("base64");
const started = Date.now();
const response = await fetch("http://localhost:5173/api/visual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image, consent: true }), signal: AbortSignal.timeout(30000) });
const body = await response.json();
const report = { suite: "Visual API integration smoke test", generatedAt: new Date().toISOString(), inputSource: "Explicitly supplied local photo; authenticity not established by this test", status: response.status, passed: response.ok && Array.isArray(body.findings), latencyMs: Date.now() - started, result: body, limitations: ["Verifies live integration and accepted schema only, not visual accuracy.", "No expert ground truth or field photo validation.", "Model confidence is uncalibrated."] };
await mkdir(".sites-runtime", { recursive: true });
await writeFile(".sites-runtime/visual-evaluation.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify({ passed: report.passed, status: report.status, latencyMs: report.latencyMs, findings: body.findings?.map(f => f.kind), error: body.error }));
if (!report.passed) process.exitCode = 1;
