import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
// Explicit opt-in only: this command sends the supplied photo to the configured AI provider.
const filename = process.argv[2];
const status = await fetch("http://localhost:5173/api/assess", { signal: AbortSignal.timeout(10000) });
if (!status.ok) throw new Error("Provider details are unavailable. No photo was sent.");
const config = await status.json();
const labels = new Set(["xAI (Grok)", "Groq", "Google Gemini"]);
if (config.liveAI !== true || !labels.has(config.visualProvider) || (config.fallbackProvider !== undefined && !labels.has(config.fallbackProvider)) || typeof config.consentScope !== "string" || config.consentScope.length > 1000)
  throw new Error("Live AI is not configured with verifiable recipient details. No photo was sent.");
const recipients = `${config.visualProvider}${config.fallbackProvider ? `, with ${config.fallbackProvider} as the configured availability fallback` : ""}`;
console.log(`Configured recipients: ${recipients}. This script sends the selected resized JPEG photo.`);
if (!filename || filename.startsWith("--") || !process.argv.includes("--consent")) throw new Error("To consent to those recipients, run: node scripts/test-live-visual.mjs /path/to/your-photo.jpg --consent. No photo was sent.");
const image = (await sharp(filename).resize({ width: 1280, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()).toString("base64");
const started = Date.now();
const response = await fetch("http://localhost:5173/api/visual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image, consent: true, consentScope: config.consentScope }), signal: AbortSignal.timeout(30000) });
const body = await response.json();
if (response.status === 409 && body.code === "consent_changed")
  throw new Error("AI configuration changed. Run without --consent to inspect current recipients, then give consent again. No request was retried.");
const report = { suite: "Visual API integration smoke test", generatedAt: new Date().toISOString(), configuredRecipients: recipients, inputSource: "Explicitly supplied local photo; authenticity not established by this test", status: response.status, passed: response.ok && Array.isArray(body.findings), latencyMs: Date.now() - started, result: body, limitations: ["Verifies live integration and accepted schema only, not visual accuracy.", "No expert ground truth or field photo validation.", "Model confidence is uncalibrated."] };
await mkdir(".sites-runtime", { recursive: true });
await writeFile(".sites-runtime/visual-evaluation.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify({ passed: report.passed, status: report.status, latencyMs: report.latencyMs, findings: body.findings?.map(f => f.kind), error: body.error }));
if (!report.passed) process.exitCode = 1;
