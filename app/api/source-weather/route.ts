import { z } from "zod";
import { archiveDailySchema, archiveRequest, sourceWeatherAnchor, sourceWeatherSchema } from "@/lib/source-weather";

const headers = { "Cache-Control": "no-store" };
const cache = new Map<string, { at: number; value: unknown }>();
const upstreamSchema = z.object({
  latitude: z.number().finite(), longitude: z.number().finite(), utc_offset_seconds: z.literal(0),
  daily_units: z.object({ time: z.literal("iso8601"), temperature_2m_mean: z.literal("°C"), precipitation_sum: z.literal("mm"), wind_speed_10m_max: z.literal("km/h") }),
  daily: archiveDailySchema,
});
// Public catalogue only: no caller-supplied coordinates, private evidence or key.
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams, photoId = query.get("photoId") ?? "";
  const days = query.get("days") ?? "7", anchor = sourceWeatherAnchor(photoId);
  if (!anchor || !["7", "15"].includes(days)) return Response.json({ error: "Choose an included European photograph and a 7- or 15-day window." }, { status: 400, headers });
  const windowDays = Number(days) as 7 | 15, key = `${photoId}:${days}`, previous = cache.get(key);
  if (previous && Date.now() - previous.at < 86400000) return Response.json(previous.value, { headers });
  const sourceUrl = archiveRequest(photoId, windowDays);
  try {
    const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(9000), redirect: "manual" });
    if (!response.ok) throw new Error();
    const raw = upstreamSchema.parse(await response.json());
    const value = sourceWeatherSchema.parse({ kind: "historical_weather_model_context", photoId, photoSha256: anchor.photo.sha256,
      sourceDate: anchor.photo.capturedDate, days: windowDays, model: "ERA5", nominalGridDegrees: .25,
      locationScope: "city_overview_not_camera", source: "Open-Meteo", sourceUrl, fetchedAt: new Date().toISOString(),
      requestedCoordinates: { lat: Number(anchor.place.lat.toFixed(4)), lon: Number(anchor.place.lon.toFixed(4)) },
      gridCoordinates: { lat: raw.latitude, lon: raw.longitude }, timezone: "UTC", daily: raw.daily });
    if (cache.size >= 18) cache.delete(cache.keys().next().value!);
    cache.set(key, { at: Date.now(), value });
    return Response.json(value, { headers });
  } catch {
    return Response.json({ error: "Historical weather could not be retrieved or validated. No replacement values were generated." }, { status: 503, headers });
  }
}
