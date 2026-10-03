import { z } from "zod";
import { referencePhotos } from "./references";
import { europeanPlaces } from "./european-sites";

export const SOURCE_WEATHER_ASSET = "/source-weather-v1.json";
export const archiveMetrics = "temperature_2m_mean,precipitation_sum,wind_speed_10m_max";
export function sourceWeatherAnchor(photoId: string) {
  const photo = referencePhotos.find((item) => item.id === photoId);
  const city = photoId.startsWith("mondego-") ? "coimbra" : photoId.startsWith("garonne-") ? "toulouse" : photoId.startsWith("hoffselva-") ? "oslo" : null;
  const place = europeanPlaces.find((item) => item.id === city);
  return photo && place ? { photo, place } : null;
}
export function sourceWeatherWindow(day: string, days: 7 | 15) {
  const center = Date.parse(`${day}T00:00:00Z`), half = (days - 1) / 2;
  return { start: new Date(center - half * 86400000).toISOString().slice(0, 10), end: new Date(center + half * 86400000).toISOString().slice(0, 10) };
}
export function archiveRequest(photoId: string, days: 7 | 15) {
  const anchor = sourceWeatherAnchor(photoId);
  if (!anchor) throw new Error("Choose a credited European source photograph.");
  const range = sourceWeatherWindow(anchor.photo.capturedDate, days);
  return `https://archive-api.open-meteo.com/v1/archive?latitude=${anchor.place.lat.toFixed(4)}&longitude=${anchor.place.lon.toFixed(4)}&start_date=${range.start}&end_date=${range.end}&daily=${archiveMetrics}&models=era5&timezone=UTC`;
}
const nullableNumber = z.number().finite().nullable();
const nullablePositive = z.number().finite().nonnegative().nullable();
const daySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const at = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(at) && new Date(at).toISOString().slice(0, 10) === value;
}, "Invalid UTC calendar day");
export const archiveDailySchema = z.object({
  time: z.array(daySchema).min(7).max(15),
  temperature_2m_mean: z.array(nullableNumber).min(7).max(15),
  precipitation_sum: z.array(nullablePositive).min(7).max(15),
  wind_speed_10m_max: z.array(nullablePositive).min(7).max(15),
}).strict().refine((data) => [data.temperature_2m_mean, data.precipitation_sum, data.wind_speed_10m_max].every((series) => series.length === data.time.length)
  && data.time.every((time, index) => !index || Date.parse(`${time}T00:00:00Z`) - Date.parse(`${data.time[index - 1]}T00:00:00Z`) === 86400000), "Archive values must align on consecutive UTC days");
const coordinates = z.object({ lat: z.number().finite().min(-90).max(90), lon: z.number().finite().min(-180).max(180) });
export const sourceWeatherSchema = z.object({
  kind: z.literal("historical_weather_model_context"), photoId: z.string(), photoSha256: z.string(), sourceDate: daySchema,
  days: z.union([z.literal(7), z.literal(15)]), model: z.literal("ERA5"), nominalGridDegrees: z.literal(.25),
  locationScope: z.literal("city_overview_not_camera"), source: z.literal("Open-Meteo"), sourceUrl: z.string().url(),
  fetchedAt: z.string().datetime(), requestedCoordinates: coordinates, gridCoordinates: coordinates,
  timezone: z.literal("UTC"), daily: archiveDailySchema,
}).strict().refine((value) => {
  const anchor = sourceWeatherAnchor(value.photoId);
  if (!anchor || value.photoSha256 !== anchor.photo.sha256 || value.sourceDate !== anchor.photo.capturedDate || value.sourceUrl !== archiveRequest(value.photoId, value.days)) return false;
  const { start, end } = sourceWeatherWindow(value.sourceDate, value.days);
  return value.requestedCoordinates.lat === Number(anchor.place.lat.toFixed(4)) && value.requestedCoordinates.lon === Number(anchor.place.lon.toFixed(4))
    && value.daily.time.length === value.days && value.daily.time[0] === start && value.daily.time.at(-1) === end;
}, "Archive must match this source photo, city overview and exact UTC window");
export type SourceWeather = z.infer<typeof sourceWeatherSchema>;
export const sourceWeatherBundleSchema = z.object({
  kind: z.literal("recorded_archive_context"), entries: z.array(sourceWeatherSchema).max(18),
}).strict().refine((value) => new Set(value.entries.map((entry) => `${entry.photoId}:${entry.days}`)).size === value.entries.length, "Duplicate source window");
export function archiveSeries(value: SourceWeather) {
  return value.daily.time.map((day, index) => ({ day, rain: value.daily.precipitation_sum[index], temperature: value.daily.temperature_2m_mean[index], wind: value.daily.wind_speed_10m_max[index] }));
}
