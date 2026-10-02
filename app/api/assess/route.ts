import { assess, inputSchema } from "@/lib/assessment";
import { aiAvailability, aiConsentScope, assessWithAI, resolveAIConfig } from "@/lib/ai-provider";
import { env } from "cloudflare:workers";
const counts = new Map<string, { at: number; count: number }>();
const respond = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function GET() {
  const config = env as unknown as Record<string, string | undefined>;
  return Response.json(
    {
      ...aiAvailability(config),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return respond({ error: "Origin mismatch" }, 403);
  if (Number(request.headers.get("content-length")) > 24000)
    return respond(
      { error: "Observation is too large" },
      413,
    );
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 24000)
      return respond(
        { error: "Observation is too large" },
        413,
      );
    body = JSON.parse(raw);
  } catch {
    return respond({ error: "Invalid JSON" }, 400);
  }
  const parsed = inputSchema.safeParse(body?.observation);
  if (!parsed.success || typeof body.useAI !== "boolean")
    return respond(
      { error: "Invalid observation fields" },
      400,
    );
  const base = assess(parsed.data),
    config = env as unknown as Record<string, string | undefined>;
  if (!body.useAI) return respond(base);
  if (!resolveAIConfig(config).primary)
    return respond({
      ...base,
      notice: "Live AI is not configured. Local rules were used.",
    });
  if (body.consentScope !== aiConsentScope(config))
    return respond({ code: "consent_changed", error: "AI configuration changed. Refresh provider details and give consent again." }, 409);
  // Best-effort per-isolate throttling; not a billing or production quota guarantee.
  const client = request.headers.get("cf-connecting-ip") || "local";
  const now = Date.now();
  const prior = counts.get(client);
  const counter =
    prior && now - prior.at < 60000 ? prior : { at: now, count: 0 };
  counter.count++;
  if (counts.size > 1000) counts.clear();
  counts.set(client, counter);
  if (counter.count > 6)
    return respond({
      ...base,
      notice:
        "AI request limit reached. Local rules were used; try again in a minute.",
    });
  return Response.json(
    await assessWithAI(parsed.data, config),
    { headers: { "Cache-Control": "no-store" } },
  );
}
