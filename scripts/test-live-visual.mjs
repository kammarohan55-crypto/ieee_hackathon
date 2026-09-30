import sharp from "sharp";
import { writeFile } from "node:fs/promises";
// Generated illustration only. No private media or key is logged by this test.
const image = (await sharp("public/images/stream-hero.png").resize({ width: 1280, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()).toString("base64");
const started = Date.now();
const response = await fetch("http://localhost:5173/api/visual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image, consent: true }), signal: AbortSignal.timeout(30000) });
const body = await response.json();
const report = { suite: "Visual API integration smoke test", generatedAt: new Date().toISOString(), synthetic: true, fixture: "AI-generated illustrative river image; not field evidence", status: response.status, passed: response.ok && Array.isArray(body.findings), latencyMs: Date.now() - started, result: body, limitations: ["Verifies live integration and accepted schema only, not visual accuracy.", "No expert ground truth or field photo validation.", "Model confidence is uncalibrated."] };
await writeFile("public/visual-evaluation.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify({ passed: report.passed, status: report.status, latencyMs: report.latencyMs, findings: body.findings?.map(f => f.kind), error: body.error }));
if (!report.passed) process.exitCode = 1;
