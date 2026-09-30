import { z } from "zod";
const source =
  "https://api.open-meteo.com/v1/forecast?latitude=40.2033&longitude=-8.4103&current=temperature_2m,precipitation,wind_speed_10m&timezone=UTC";
const weatherSchema = z.object({
  current: z.object({
    time: z.string(),
    interval: z.number(),
    temperature_2m: z.number(),
    precipitation: z.number(),
    wind_speed_10m: z.number(),
  }),
  current_units: z.object({
    temperature_2m: z.literal("°C"),
    precipitation: z.literal("mm"),
    wind_speed_10m: z.literal("km/h"),
  }),
});
let cache: { at: number; value: unknown } | null = null;
export async function GET() {
  if (cache && Date.now() - cache.at < 300000)
    return Response.json(cache.value, {
      headers: { "Cache-Control": "public, max-age=120" },
    });
  try {
    const response = await fetch(source, { signal: AbortSignal.timeout(9000) });
    if (!response.ok) throw new Error();
    const raw = weatherSchema.parse(await response.json());
    const value = {
      city: "Coimbra",
      temperature: raw.current.temperature_2m,
      rain: raw.current.precipitation,
      wind: raw.current.wind_speed_10m,
      interval: raw.current.interval,
      time: raw.current.time,
      fetchedAt: new Date().toISOString(),
      source: "Open-Meteo",
      sourceUrl: source,
      kind: "weather_model_context",
    };
    cache = { at: Date.now(), value };
    return Response.json(value, {
      headers: { "Cache-Control": "public, max-age=120" },
    });
  } catch {
    return Response.json(
      { error: "Current weather is unavailable. No values were estimated." },
      { status: 503 },
    );
  }
}
