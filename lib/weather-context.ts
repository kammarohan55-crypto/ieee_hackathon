import { z } from "zod";
import { validRecordedTimestamp } from "./references";

export const sourceWeatherTimeSchema = z.string().refine((value) => validRecordedTimestamp(`${value}Z`), "Invalid source UTC time");
export const hourlyWeatherSchema = z.object({
  time: z.array(sourceWeatherTimeSchema).min(1).max(96),
  temperature_2m: z.array(z.number().finite()).min(1).max(96),
  precipitation: z.array(z.number().finite().nonnegative()).min(1).max(96),
  wind_speed_10m: z.array(z.number().finite().nonnegative()).min(1).max(96),
}).strict().refine((data) => [data.temperature_2m, data.precipitation, data.wind_speed_10m].every((series) => series.length === data.time.length)
  && data.time.every((time, index) => !index || time > data.time[index - 1]), "Hourly series must align and progress in UTC");
export const weatherContextSchema = z.object({
  temperature: z.number().finite(), rain: z.number().finite().nonnegative(), wind: z.number().finite().nonnegative(),
  interval: z.number().positive(), time: sourceWeatherTimeSchema, fetchedAt: z.string().datetime(),
  source: z.literal("Open-Meteo"), sourceUrl: z.string().url().refine((value) => new URL(value).hostname === "api.open-meteo.com"),
  kind: z.literal("weather_model_context"),
  requestedCoordinates: z.object({ lat: z.number().finite().min(-90).max(90), lon: z.number().finite().min(-180).max(180) }),
  gridCoordinates: z.object({ lat: z.number().finite().min(-90).max(90), lon: z.number().finite().min(-180).max(180) }),
  hourly: hourlyWeatherSchema.optional(),
});
export type WeatherContext = z.infer<typeof weatherContextSchema>;
export function weatherSeries(weather: WeatherContext) {
  const series = weather.hourly;
  return series?.time.map((time, index) => ({ time, timestamp: Date.parse(`${time}Z`),
    temperature: series.temperature_2m[index], rain: series.precipitation[index], wind: series.wind_speed_10m[index] })) ?? [];
}
