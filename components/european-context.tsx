"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, CloudRain, Clock3, Download, Fingerprint, RefreshCw, Sparkles, Thermometer, Wind } from "lucide-react";
import { europeanBundleSchema, EUROPEAN_CONTEXT_ASSET, type EuropeanBundle, type EuropeanPlace } from "@/lib/european-sites";
import { weatherContextSchema, weatherSeries, type WeatherContext } from "@/lib/weather-context";
import { referencePhotos, displayEvidenceTime } from "@/lib/references";
import { downloadFile, findingLabels } from "@/lib/field";
import { weatherFreshness } from "@/lib/weather-freshness";

export function EuropeanContext({ place, weatherEnabled = true, onBundle }: { place: EuropeanPlace; weatherEnabled?: boolean; onBundle?: (bundle: EuropeanBundle) => void }) {
  const [bundle, setBundle] = useState<EuropeanBundle | null>(null), [sourceError, setSourceError] = useState("");
  const [live, setLive] = useState<{ placeId: string; value: WeatherContext } | null>(null);
  const [requestState, setRequestState] = useState({ placeId: place.id, busy: false, error: "" });
  const busy = requestState.placeId === place.id && requestState.busy;
  const error = requestState.placeId === place.id ? requestState.error : "";
  const [auto, setAuto] = useState(false);
  const [metric, setMetric] = useState<"temperature" | "rain" | "wind">("temperature");
  const [range, setRange] = useState<"past" | "next">("next"), [now, setNow] = useState(0);
  const request = useRef<AbortController | null>(null), id = useId().replaceAll(":", "");
  const photo = referencePhotos.find((value) => value.id === place.photoId)!;
  const analysis = bundle?.analyses.find((value) => value.photoId === photo.id);
  const weather = live?.placeId === place.id ? live.value : bundle?.weather.find((value) => value.placeId === place.id)?.snapshot;
  const current = now || (weather ? Date.parse(weather.fetchedAt) : 0);
  const freshness = weather ? weatherFreshness(weather.time, weather.fetchedAt, current) : null;
  const mode = live?.placeId === place.id ? "Fetched this session" : "Recorded public snapshot";
  const series = weather ? weatherSeries(weather).filter((point) => range === "next"
    ? point.timestamp >= current && point.timestamp <= current + 86400000
    : point.timestamp >= current - 86400000 && point.timestamp <= current) : [];
  const unit = metric === "temperature" ? "°C" : metric === "rain" ? "mm" : "km/h";

  useEffect(() => {
    const controller = new AbortController();
    fetch(EUROPEAN_CONTEXT_ASSET, { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error();
      const value = europeanBundleSchema.parse(await response.json());
      if (!controller.signal.aborted) { setBundle(value); onBundle?.(value); setSourceError(""); }
    }).catch(() => { if (!controller.signal.aborted) setSourceError("Recorded source context is unavailable. The credited photo and live weather controls remain usable."); });
    return () => controller.abort();
  }, [onBundle]);
  useEffect(() => {
    request.current?.abort();
    return () => request.current?.abort();
  }, [place.id]);
  useEffect(() => {
    const update = () => setNow(Date.now()); update();
    const timer = window.setInterval(update, 60000); window.addEventListener("focus", update);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", update); };
  }, []);
  const refresh = useCallback(async () => {
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    setRequestState({ placeId: place.id, busy: true, error: "" });
    try {
      const response = await fetch(`/api/conditions?lat=${place.lat}&lon=${place.lon}&hourly=1`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]) });
      if (!response.ok) throw new Error("Weather is unavailable. Retained snapshots are still labeled; retry when connected.");
      const value = weatherContextSchema.parse(await response.json());
      if (Math.abs(value.requestedCoordinates.lat - place.lat) > .0001 || Math.abs(value.requestedCoordinates.lon - place.lon) > .0001) throw new Error("The returned weather location did not match this city overview.");
      if (!controller.signal.aborted && request.current === controller) { setLive({ placeId: place.id, value }); setNow(Date.now()); }
    } catch (cause) {
      if (!controller.signal.aborted && request.current === controller) setRequestState({ placeId: place.id, busy: false, error: cause instanceof Error && cause.name !== "ZodError" ? cause.message : "Weather data could not be validated. Please retry." });
    } finally { if (!controller.signal.aborted && request.current === controller) setRequestState((value) => ({ ...value, busy: false })); }
  }, [place]);
  useEffect(() => {
    if (!auto || !weatherEnabled) return;
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 900000);
    return () => window.clearInterval(timer);
  }, [auto, weatherEnabled, refresh]);
  function exportContext() {
    downloadFile(JSON.stringify({ kind: "public_source_context", place, photo, analysis: analysis ?? null,
      weather: weatherEnabled ? weather ?? null : null, weatherMode: mode, humanReview: "not_performed",
      limitations: "Historical source image, recorded uncalibrated AI candidates and city-level modeled weather. Not a citizen observation, water measurement or approved Decision Receipt." }, null, 2), `aqualens-${place.id}-source-context.json`);
  }
  return <section className="eu-context" aria-label={`${place.city} public source context`}>
    <header className="eu-context-heading"><div><p className="eu-kicker"><Fingerprint size={14} /> THREE CLOCKS / ONE SOURCE TRAIL</p><h3>See the evidence in its own time.</h3></div><button type="button" className="eu-quiet-button" onClick={exportContext}><Download size={15} /> Context JSON</button></header>
    <div className="eu-clocks"><div><span>01 / PHOTOGRAPH</span><strong>{displayEvidenceTime(photo.capturedDate)}</strong><small>By {photo.author} · historical source</small></div><div><span>02 / AI INSPECTION</span><strong>{analysis ? displayEvidenceTime(analysis.at) : "No retained analysis"}</strong><small>Recorded Gemini result · requires verification</small></div><div><span>03 / WEATHER MODEL</span><strong>{weatherEnabled && weather ? `${weather.time.replace("T", " ")} UTC` : "Separate current context"}</strong><small>{weatherEnabled && weather ? mode : "Not weather at the photograph’s time"}</small></div></div>
    <div className="eu-candidates"><div><Sparkles size={18} /><strong>Recorded visual candidates</strong><span className="eu-source-tag">HUMAN REVIEW PENDING</span></div>{analysis ? <><p>{analysis.model} · {analysis.method}. Confidence is uncalibrated; regions are coarse image areas.</p><ul>{analysis.findings.map((finding) => <li key={finding.kind}><span>Possible {findingLabels[finding.kind].toLowerCase()}</span><small>{finding.region.replaceAll("_", " ")} · {finding.confidence} visual confidence</small></li>)}</ul>{!analysis.findings.length && <p className="eu-no-finding">No enumerated candidates were returned. This is not a finding of absence or good water quality.</p>}</> : <p>No recorded AI result is available for this frame. Start an explicit photo review to request a fresh analysis.</p>}</div>
    {sourceError && <p className="eu-error" role="status">{sourceError}</p>}
    {weatherEnabled && <div className="eu-weather"><div className="eu-weather-title"><div><p className="eu-kicker"><CloudRain size={14} /> {place.city.toUpperCase()} / CITY OVERVIEW</p><h3>Weather around the waterway.</h3><p>Recent model context and hourly projections. No stream sensor or water-health forecast.</p></div><div className="eu-weather-actions"><button type="button" onClick={() => void refresh()} disabled={busy}><RefreshCw size={15} className={busy ? "spin" : ""} />{busy ? "Requesting…" : "Refresh live context"}</button><button type="button" aria-pressed={auto} onClick={() => { setAuto(!auto); if (!auto) void refresh(); }}>{auto ? "Auto · 15 min · on" : "Auto · 15 min · off"}</button></div></div>
      {weather ? <><div className="eu-weather-stats"><div><Thermometer size={18} /><strong>{weather.temperature.toFixed(1)}<small>°C</small></strong><span>Air temperature</span></div><div><CloudRain size={18} /><strong>{weather.rain.toFixed(2)}<small>mm</small></strong><span>Precipitation / {weather.interval / 60} min</span></div><div><Wind size={18} /><strong>{weather.wind.toFixed(1)}<small>km/h</small></strong><span>Wind speed</span></div></div><div className="eu-chart-controls"><div role="group" aria-label="Weather chart metric">{(["temperature", "rain", "wind"] as const).map((value) => <button type="button" key={value} aria-pressed={metric === value} onClick={() => setMetric(value)}>{value === "temperature" ? "Air temperature" : value === "rain" ? "Precipitation" : "Wind"}</button>)}</div><div role="group" aria-label="Weather chart window"><button type="button" aria-pressed={range === "past"} onClick={() => setRange("past")}>Recent 24 h</button><button type="button" aria-pressed={range === "next"} onClick={() => setRange("next")}>Next 24 h · model</button></div></div>
        {series.length ? <div className="eu-weather-chart" role="img" aria-label={`${metric} weather-model hourly series; values available in the table below`}><ResponsiveContainer width="100%" height={210}><AreaChart data={series} margin={{ top: 15, right: 18, bottom: 5, left: 0 }} accessibilityLayer><defs><linearGradient id={`weather-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={place.accent} stopOpacity={.42} /><stop offset="100%" stopColor={place.accent} stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#253b50" vertical={false} /><XAxis dataKey="timestamp" type="number" domain={["dataMin", "dataMax"]} scale="time" tickFormatter={(value) => new Date(value).toISOString().slice(11, 16)} tick={{ fill: "#afc3d4", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis unit={unit} width={53} tick={{ fill: "#afc3d4", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#101e30", border: "1px solid #3f566a", borderRadius: 10, color: "#f1f7ff" }} labelFormatter={(value) => new Date(Number(value)).toISOString().replace("T", " ").slice(0, 16) + " UTC"} formatter={(value) => [typeof value === "number" ? `${value.toFixed(2)} ${unit}` : String(value), metric]} /><ReferenceLine x={current} stroke="#899aad" strokeDasharray="4 4" /><Area type="linear" dataKey={metric} stroke={place.accent} strokeWidth={2} fill={`url(#weather-${id})`} isAnimationActive={false} connectNulls={false} /></AreaChart></ResponsiveContainer></div> : <p className="eu-no-finding">This retained snapshot has no samples in the current 24-hour window. Refresh to request new modeled context.</p>}
        <details className="eu-data-table"><summary>Inspect hourly values · UTC · {series.length} samples</summary><div><table><caption>{place.city} · {range === "next" ? "hourly weather projections" : "recent modeled weather"}; not field measurements</caption><thead><tr><th>UTC hour</th><th>Air °C</th><th>Rain mm</th><th>Wind km/h</th></tr></thead><tbody>{series.map((point) => <tr key={point.time}><td>{point.time.replace("T", " ")}</td><td>{point.temperature}</td><td>{point.rain}</td><td>{point.wind}</td></tr>)}</tbody></table></div></details>
        <p className="eu-weather-provenance"><Clock3 size={13} /> {mode} · retrieved {displayEvidenceTime(weather.fetchedAt)} {freshness?.stale && "· Older than two hours; refresh before treating as current"}</p><p className="eu-footnote">Requested city overview {weather.requestedCoordinates.lat.toFixed(4)}, {weather.requestedCoordinates.lon.toFixed(4)} · model grid {weather.gridCoordinates.lat.toFixed(3)}, {weather.gridCoordinates.lon.toFixed(3)}. Current weather is independent of the historical photograph and its visual analysis.</p><a className="eu-source-link" href={weather.sourceUrl} target="_blank" rel="noreferrer">Open-Meteo source request · CC BY 4.0 <ArrowUpRight size={13} /></a></> : <p className="eu-no-finding">No weather snapshot is retained. Request live context when connected.</p>}
      {error && <p className="eu-error" role="alert">{error}</p>}
    </div>}
  </section>;
}
