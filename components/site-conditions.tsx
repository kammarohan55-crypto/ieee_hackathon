"use client";
import { useEffect, useRef, useState } from "react";
import { CloudSun, MapPin, RefreshCw, Wind } from "lucide-react";
import { z } from "zod";
import type { Report } from "@/lib/assessment";

const schema = z.object({
  temperature: z.number().finite(), rain: z.number().finite(), wind: z.number().finite(),
  interval: z.number().positive(), time: z.string(), fetchedAt: z.string(),
  kind: z.literal("weather_model_context"),
  requestedCoordinates: z.object({ lat: z.number(), lon: z.number() }),
  gridCoordinates: z.object({ lat: z.number(), lon: z.number() }),
});

export function SiteConditions({ records }: { records: Report[] }) {
  const located = records.filter((record) => record.field?.coordinates && record.field.coordinates.method !== "synthetic");
  const [selectedId, setSelectedId] = useState("");
  const selected = located.find((record) => record.id === selectedId) ?? located[0];
  const coords = selected?.field?.coordinates;
  const key = coords ? `${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}` : "";
  const [result, setResult] = useState<{ key: string; weather: z.infer<typeof schema>; receivedAt: number } | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const generation = useRef(0);
  useEffect(() => () => { generation.current += 1; }, []);
  const weather = result?.key === key ? result.weather : undefined;
  async function refresh() {
    if (!coords || busy) return;
    const epoch = ++generation.current;
    setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch(`/api/conditions?lat=${coords.lat}&lon=${coords.lon}`, { signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error("Weather is unavailable. Check your connection and retry.");
      const data = schema.parse(await response.json());
      if (`${data.requestedCoordinates.lat.toFixed(4)},${data.requestedCoordinates.lon.toFixed(4)}` !== key) throw new Error("Weather location did not match this observation.");
      if (generation.current === epoch) setResult({ key, weather: data, receivedAt: Date.now() });
    } catch (error) { if (generation.current === epoch) setError(error instanceof Error && error.name !== "ZodError" ? error.message : "Weather data could not be verified. Please retry."); }
    finally { if (generation.current === epoch) setBusy(false); }
  }
  return <section className="panel conditions site-conditions">
    <div className="panel-title"><div><p className="eyebrow">WEATHER AT YOUR SITE</p><h3>Context, with a source.</h3></div><CloudSun size={27} /></div>
    {selected ? <>
      <label className="field-weather-label">Observation location<select value={selected.id} onChange={(event) => { generation.current += 1; setBusy(false); setError(""); setSelectedId(event.target.value); }}>{located.map((record) => <option key={record.id} value={record.id}>{record.original.site} · {new Date(record.original.observedAt).toLocaleDateString()}</option>)}</select></label>
      <p className="micro-copy"><MapPin size={13} /> {coords!.lat.toFixed(4)}, {coords!.lon.toFixed(4)} · {coords!.method === "manual" ? "Manually entered" : "Device location"}</p>
      {weather && <><div className="weather-reading"><CloudSun size={30} /><strong>{Math.round(weather.temperature)}°</strong><span>Air temperature<br /><small>Current modeled conditions</small></span></div><div className="weather-pair"><span>{weather.rain} mm <small>/ {weather.interval / 60} min</small></span><span><Wind size={15} /> {weather.wind} km/h</span></div><p className="micro-copy">Model time: {weather.time.replace("T", " ")} UTC. {(result?.receivedAt ?? 0) - Date.parse(`${weather.time}Z`) > 7200000 ? "The model time was over two hours old when fetched." : ""}</p><p className="micro-copy">Model grid: {weather.gridCoordinates.lat.toFixed(3)}, {weather.gridCoordinates.lon.toFixed(3)}. Current context, not weather at the observation time.</p></>}
      <button className="btn secondary full" disabled={busy} onClick={() => void refresh()}><RefreshCw size={15} className={busy ? "spin" : ""} />{busy ? "Loading…" : weather ? "Refresh weather" : "Load site weather"}</button>
      {!weather && <p className="micro-copy">Loads modeled weather from Open-Meteo using this location. Water measurements remain separate.</p>}
      {error && <p className="notice error" role="alert">{error}</p>}
    </> : <div className="weather-empty"><MapPin size={24} /><p>Add coordinates to an observation to see weather for that site.</p><small>Weather loads only when you request it.</small></div>}
    <div className="source-line"><a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo · CC BY 4.0 ↗</a><span>Weather ≠ water quality</span></div>
  </section>;
}
