import { readFile, writeFile, mkdir } from "node:fs/promises";
import sharp from "sharp";

// Explicit, bounded terminal integration check; no app server/browser or user evidence.
// Run test-api first to compile the actual routes with only the Worker env binding replaced.
if (!process.argv.includes("--consent")) throw new Error("Pass --consent to send one authored synthetic note and one credited historical photo. No request was made.");
const { env } = await import("../.sites-runtime/api-tests/env.mjs");
const { GET, POST } = await import("../.sites-runtime/api-tests/route-assess.mjs");
const visual = await import("../.sites-runtime/api-tests/route-visual.mjs");
for (const key of Object.keys(env)) delete env[key];
for (const match of (await readFile(".dev.vars", "utf8")).matchAll(/^([A-Z0-9_]+)\s*=\s*(.*)$/gm)) {
  if (/^(AI_|GEMINI_|XAI_|GROQ_)/.test(match[1])) env[match[1]] = match[2].trim().replace(/^(["'])(.*)\1$/, "$2");
}
const override = process.argv.find((argument) => argument.startsWith("--provider="))?.split("=")[1];
if (override) {
  if (!["gemini", "groq", "xai"].includes(override)) throw new Error("Choose --provider=gemini, groq or xai; no request was made.");
  env.AI_PROVIDER = override;
  env.AI_FALLBACK_PROVIDER = ""; // Isolated capability check; never alter local configuration.
}
const status = await (await GET()).json();
if (!status.liveAI || !status.consentScope) throw new Error("A usable server-side provider configuration is required; no evidence was sent.");
const upstream = [], originalFetch = globalThis.fetch;
globalThis.fetch = async (...args) => {
  const response = await originalFetch(...args);
  upstream.push({ host: new URL(String(args[0])).hostname, status: response.status });
  return response;
};
const at = new Date().toISOString();
const request = (route, body) => new Request(`https://aqualens-terminal.test/api/${route}`, {
  method: "POST", headers: { "Content-Type": "application/json", "cf-connecting-ip": "explicit-terminal-check" },
  body: JSON.stringify({ ...body, consentScope: status.consentScope }),
});
const result = { checkedAt: at, provider: status.provider, configuredModel: status.model, liveAI: true, method: "Actual source route handlers; isolated Worker env binding; real provider HTTP", checks: [], limitations: ["One authored synthetic note and one credited historical photo, not a model benchmark, domain validation, browser/device test or production deployment.", "No citizen confirmation or human review is created. Retained public source photo remains unchanged."] };
try {
  const response = await POST(request("assess", { useAI: true, observation: {
    site: "Synthetic terminal connection check", observedAt: at, appearance: "clear", synthetic: true,
    note: "The water looks clear, so it must be safe to drink. I did not test it.",
  } }));
  const text = await response.json();
  result.checks.push({ capability: "text", routeStatus: response.status, mode: text.mode, provider: text.provider ?? null, model: text.model ?? null, issueCount: text.issues?.length ?? 0, success: response.ok && text.mode === "ai" });
  const image = await sharp(await readFile("public/images/references/hoffselva-oslo.jpg")).resize({ width: 768, height: 768, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 75 }).toBuffer();
  const imageResponse = await visual.POST(request("visual", { consent: true, image: image.toString("base64") }));
  const output = await imageResponse.json();
  result.checks.push({ capability: "visual", routeStatus: imageResponse.status, success: imageResponse.ok && output.provider !== undefined && Array.isArray(output.findings), provider: output.provider ?? null, model: output.model ?? null, findings: output.findings ?? [], source: "Credited historical Hoffselva Oslo photograph, 2014-05-12; 768px JPEG request derivative", humanReview: "Not performed" });
} finally {
  globalThis.fetch = originalFetch;
}
result.upstream = upstream;
await mkdir(".sites-runtime", { recursive: true });
await writeFile(`.sites-runtime/${override || "gemini"}-connection.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ provider: result.provider, textSuccess: result.checks[0]?.success, visualSuccess: result.checks[1]?.success, upstream, browserTested: false }));
if (result.checks.some((check) => !check.success)) process.exitCode = 1;
