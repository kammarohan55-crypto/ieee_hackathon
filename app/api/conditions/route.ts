import { z } from "zod";
import { hourlyWeatherSchema, sourceWeatherTimeSchema } from "@/lib/weather-context";

const weatherSchema = z.object({
  latitude: z.number().finite(), longitude: z.number().finite(),
  current: z.object({
    time: sourceWeatherTimeSchema,
    interval: z.number().positive(), temperature_2m: z.number().finite(),
    precipitation: z.number().nonnegative(), wind_speed_10m: z.number().nonnegative(),
  }),
  current_units: z.object({ temperature_2m: z.literal("°C"), precipitation: z.literal("mm"), wind_speed_10m: z.literal("km/h") }),
});
// Bounded, coordinate-specific cache. Never reuse another site's weather.
const cache = new Map<string, { at: number; value: unknown }>();
const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const rawLat = query.get("lat"), rawLon = query.get("lon");
  const lat = Number(rawLat), lon = Number(rawLon);
  if (!rawLat?.trim() || !rawLon?.trim() || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180)
    return Response.json({ error: "Provide valid observation coordinates. No default location is assumed." }, { status: 400, headers });
  const includeHourly = query.get("hourly") === "1";
  const coordinatesKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const key = `${coordinatesKey}:${includeHourly ? "hourly" : "current"}`;
  const previous = cache.get(key);
  if (previous && Date.now() - previous.at < 300000) return Response.json(previous.value, { headers });
  const [latitude, longitude] = coordinatesKey.split(",");
  const source = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation,wind_speed_10m&timezone=UTC${includeHourly ? "&hourly=temperature_2m,precipitation,wind_speed_10m&past_days=1&forecast_days=2" : ""}`;
  try {
    const response = await fetch(source, { signal: AbortSignal.timeout(9000) });
    if (!response.ok) throw new Error();
    const payload = z.object({ hourly: z.unknown().optional(), hourly_units: z.unknown().optional() }).passthrough().parse(await response.json());
    const raw = weatherSchema.parse(payload);
    let hourly: z.infer<typeof hourlyWeatherSchema> | undefined;
    if (includeHourly) {
      z.object({ temperature_2m: z.literal("°C"), precipitation: z.literal("mm"), wind_speed_10m: z.literal("km/h"), time: z.literal("iso8601") }).parse(payload.hourly_units);
      hourly = hourlyWeatherSchema.parse(payload.hourly);
    }
    const value = {
      temperature: raw.current.temperature_2m, rain: raw.current.precipitation,
      wind: raw.current.wind_speed_10m, interval: raw.current.interval,
      time: raw.current.time, fetchedAt: new Date().toISOString(),
      source: "Open-Meteo", sourceUrl: source, kind: "weather_model_context",
      requestedCoordinates: { lat: Number(latitude), lon: Number(longitude) },
      gridCoordinates: { lat: raw.latitude, lon: raw.longitude },
      ...(hourly ? { hourly } : {}),
    };
    if (cache.size >= 100) cache.delete(cache.keys().next().value!);
    cache.set(key, { at: Date.now(), value });
    return Response.json(value, { headers });
  } catch {
    return Response.json({ error: "Weather is unavailable. Try again when connected." }, { status: 503, headers });
  }
}
