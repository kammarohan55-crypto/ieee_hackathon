import { env } from "cloudflare:workers";
import { z } from "zod";
import { aiConsentScope, inspectWithAI, resolveAIConfig } from "@/lib/ai-provider";
const quota = new Map<string, { at: number; count: number }>();
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const fail = (error: string, status: number) =>
    Response.json({ error }, { status, headers });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return fail("Origin mismatch", 403);
  if (Number(request.headers.get("content-length")) > 3000000)
    return fail("Image too large", 413);
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 3000000) return fail("Image too large", 413);
    body = z
      .object({
        image: z.string().min(100).max(2900000).regex(/^[A-Za-z0-9+/]+=*$/),
        consent: z.literal(true),
        consentScope: z.unknown().optional(),
      })
      .strict()
      .parse(JSON.parse(raw));
  } catch {
    return fail("A valid JPEG image and explicit consent are required", 400);
  }
  const config = env as unknown as Record<string, string | undefined>;
  if (!resolveAIConfig(config).primary)
    return fail("Visual AI is not configured. Camera and local checks still work.", 503);
  if (body.consentScope !== aiConsentScope(config))
    return Response.json({ code: "consent_changed", error: "AI configuration changed. Refresh provider details and give consent again." }, { status: 409, headers });
  const client = request.headers.get("cf-connecting-ip") || "local", now = Date.now();
  const previous = quota.get(client);
  const count = previous && now - previous.at < 60000 ? previous : { at: now, count: 0 };
  count.count++;
  if (quota.size > 1000) quota.clear();
  quota.set(client, count);
  if (count.count > 4)
    return fail("Visual request limit reached. Try again in a minute; your image remains local.", 429);
  try {
    return Response.json(await inspectWithAI(body.image, config), { headers });
  } catch {
    return fail("Visual AI was unavailable, rate-limited, timed out or failed response validation. No AI findings were saved. Try later or continue with your own observations.", 503);
  }
}
