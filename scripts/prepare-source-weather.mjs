import { readFile, writeFile } from "node:fs/promises";
import { sourceWeatherModules } from "./source-weather-modules.mjs";

// Nine real, keyless city-overview requests. Never generates observation records.
const { source, route, catalogue } = await sourceWeatherModules();
const target = `public${source.SOURCE_WEATHER_ASSET}`;
let previous;
try { previous = await readFile(target, "utf8"); } catch (error) { if (error.code !== "ENOENT") throw error; }
if (previous) {
  const checked = source.sourceWeatherBundleSchema.parse(JSON.parse(previous));
  if (checked.entries.length !== catalogue.referencePhotos.length || checked.entries.some((entry) => entry.days !== 7)) throw new Error("Incomplete immutable archive: change SOURCE_WEATHER_ASSET revision before creating a different bundle.");
  console.log(`Preserved ${checked.entries.length} recorded seven-day windows with original retrieval times; no requests made.`);
} else {
  const entries = [];
  for (const photo of catalogue.referencePhotos) {
    const response = await route.GET(new Request(`https://source-preparation.test/api/source-weather?photoId=${photo.id}&days=7`));
    if (!response.ok) throw new Error(`Archive unavailable for ${photo.id}; no file or substitute written. Retry when connected.`);
    entries.push(source.sourceWeatherSchema.parse(await response.json()));
    console.log(JSON.stringify({ photoId: photo.id, status: response.status, days: 7, kind: "historical_weather_model_context" }));
  }
  const checked = source.sourceWeatherBundleSchema.parse({ kind: "recorded_archive_context", entries });
  await writeFile(target, JSON.stringify(checked, null, 2) + "\n", { flag: "wx" });
  console.log(`Retained ${entries.length} genuine archive windows; no AI or private evidence sent.`);
}
