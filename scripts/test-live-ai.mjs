import { writeFile } from "node:fs/promises";

// Opt-in only. GET retrieves public configuration; POST sends synthetic notes.
const status = await fetch("http://localhost:5173/api/assess", { signal: AbortSignal.timeout(10000) });
if (!status.ok) throw new Error("Provider details are unavailable. No note was sent.");
const config = await status.json();
const labels = new Set(["xAI (Grok)", "Groq", "Google Gemini"]);
if (config.liveAI !== true || !labels.has(config.provider) || (config.fallbackProvider !== undefined && !labels.has(config.fallbackProvider)) || typeof config.consentScope !== "string" || config.consentScope.length > 1000)
  throw new Error("Live AI is not configured with verifiable recipient details. No note was sent.");
const recipients = `${config.provider}${config.fallbackProvider ? `, with ${config.fallbackProvider} as the configured availability fallback` : ""}`;
console.log(`Configured recipients: ${recipients}. This script sends three labeled synthetic notes and appearance selections.`);
if (!process.argv.includes("--consent"))
  throw new Error(`To consent to those recipients, run: node scripts/test-live-ai.mjs --consent. No note was sent.`);
const cases = [
  { id: "live-cause", note: "The water is brown, so it must be sewage.", expected: ["unsupported_conclusion"] },
  { id: "live-semantic", note: "The water's sparkle tells me children can drink it without worrying.", expected: ["unsupported_conclusion"] },
  { id: "live-unknown", note: "I could not see the water clearly from the path, so I do not know its appearance.", expected: [] },
];
const results = [];
for (const item of cases) {
  const observation = { site: "Synthetic engineering test", observedAt: "2026-09-26T09:00:00Z", appearance: "unsure", note: item.note, synthetic: true };
  const started = Date.now();
  const response = await fetch("http://localhost:5173/api/assess", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ observation, useAI: true, consentScope: config.consentScope }),
    signal: AbortSignal.timeout(25000),
  });
  const result = await response.json();
  if (response.status === 409 && result.code === "consent_changed")
    throw new Error("AI configuration changed. Run without --consent to inspect current recipients, then give consent again. No request was retried.");
  const actual = [...new Set((result.issues ?? []).map((issue) => issue.code))].sort();
  const passed = response.ok && result.mode === "ai" && JSON.stringify(actual) === JSON.stringify(item.expected);
  results.push({ id: item.id, note: item.note, expected: item.expected, actual, passed, mode: result.mode, provider: result.provider, model: result.model, latencyMs: Date.now() - started, issues: result.issues, notice: result.notice });
  console.log(JSON.stringify({ id: item.id, passed, mode: result.mode, provider: result.provider, actual, latencyMs: Date.now() - started }));
}
const report = {
  suite: "Live AI integration smoke test", generatedAt: new Date().toISOString(), synthetic: true,
  configuredRecipients: recipients, passed: results.filter((result) => result.passed).length, total: results.length,
  limitations: ["Three authored development scenarios, not a held-out benchmark.", "Labels not validated by an ecologist.", "This does not establish general accuracy or environmental safety."],
  results,
};
await writeFile("public/live-evaluation.json", JSON.stringify(report, null, 2));
if (report.passed !== report.total) process.exitCode = 1;
