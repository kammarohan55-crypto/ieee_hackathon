"use client";
/* eslint-disable @next/next/no-img-element -- Credited local source bytes are preserved; this thumbnail reuses the already-loaded photograph. */
import { useEffect, useRef, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, CalendarDays, CloudRain, Download, RefreshCw, Thermometer, Wind } from "lucide-react";
import { archiveSeries, SOURCE_WEATHER_ASSET, sourceWeatherAnchor, sourceWeatherBundleSchema, sourceWeatherSchema, type SourceWeather } from "@/lib/source-weather";
import { displayEvidenceTime } from "@/lib/references";
import { downloadFile } from "@/lib/field";

type Metric = "rain" | "temperature" | "wind";
const metrics = { rain: { label: "Daily precipitation", unit: "mm" }, temperature: { label: "Mean air temperature", unit: "°C" }, wind: { label: "Maximum wind", unit: "km/h" } };
const number = (value: number | null | undefined) => value == null ? "Unknown" : value.toFixed(1);

export function SourceDateWeather({ photoId }: { photoId: string }) {
  const anchor = sourceWeatherAnchor(photoId)!;
  const [open, setOpen] = useState(false), [days, setDays] = useState<7 | 15>(7), [metric, setMetric] = useState<Metric>("rain");
  const [recorded, setRecorded] = useState<SourceWeather[]>([]), [recordedError, setRecordedError] = useState("");
  const [live, setLive] = useState<SourceWeather | null>(null), [status, setStatus] = useState({ key: "", busy: false, error: "" });
  const request = useRef<AbortController | null>(null), key = `${photoId}:${days}`;
  const activeLive = live?.photoId === photoId && live.days === days ? live : null;
  const value = activeLive ?? recorded.find((entry) => entry.photoId === photoId && entry.days === days);
  const busy = status.key === key && status.busy, error = status.key === key ? status.error : "";
  const series = value ? archiveSeries(value) : [], center = series.find((point) => point.day === anchor.photo.capturedDate), config = metrics[metric];
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    fetch(SOURCE_WEATHER_ASSET, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]) }).then(async (response) => {
      if (!response.ok) throw new Error();
      const bundle = sourceWeatherBundleSchema.parse(await response.json());
      if (!controller.signal.aborted) { setRecorded(bundle.entries); setRecordedError(""); }
    }).catch(() => { if (!controller.signal.aborted) setRecordedError("The retained archive is unavailable. Request it again when connected."); });
    return () => controller.abort();
  }, [open]);
  useEffect(() => { request.current?.abort(); return () => request.current?.abort(); }, [photoId, days]);
  async function refresh() {
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    setStatus({ key, busy: true, error: "" });
    try {
      const response = await fetch(`/api/source-weather?photoId=${encodeURIComponent(photoId)}&days=${days}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]) });
      if (!response.ok) throw new Error();
      const data = sourceWeatherSchema.parse(await response.json());
      if (data.photoId !== photoId || data.days !== days) throw new Error();
      if (!controller.signal.aborted && request.current === controller) setLive(data);
    } catch {
      if (!controller.signal.aborted && request.current === controller) setStatus({ key, busy: false, error: "The archive request failed validation or could not connect. Any retained values shown below keep their original retrieval time." });
    } finally { if (request.current === controller) setStatus((previous) => previous.key === key ? { ...previous, busy: false } : previous); }
  }
  function exportArchive() {
    if (!value) return;
    downloadFile(JSON.stringify({ ...value, units: { temperature_2m_mean: "°C", precipitation_sum: "mm", wind_speed_10m_max: "km/h" }, photoSourceUrl: anchor.photo.sourceUrl,
      attribution: "Open-Meteo · ERA5 reanalysis · CC BY 4.0", humanReview: "not_performed",
      limitations: "Regional modeled weather at a city overview, not camera GPS, river measurements or causal evidence. Source date has day precision and unknown capture timezone; weather days are UTC. Not a Decision Receipt." }, null, 2), `aqualens-${photoId}-${days}day-weather-context.json`);
  }
  const axes = <><CartesianGrid stroke="#2c4357" vertical={false} /><XAxis dataKey="day" tickFormatter={(day: string) => day.slice(5)} tick={{ fill: "#b6c9d9", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={18} /><YAxis width={54} unit={config.unit} tick={{ fill: "#b6c9d9", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: "#86c9c6", fillOpacity: .06, stroke: "#42626b" }} contentStyle={{ background: "#102236", border: "1px solid #45677a", borderRadius: 10, color: "#f1f7ff" }} labelFormatter={(day) => `${day} · UTC model day`} formatter={(amount) => [typeof amount === "number" ? `${amount.toFixed(1)} ${config.unit}` : "Unknown", config.label]} /><ReferenceLine x={anchor.photo.capturedDate} stroke="#ffe0a6" strokeDasharray="4 4" label={{ value: "Source date", fill: "#ffe0a6", fontSize: 10, position: "insideTopRight" }} /></>;
  return <details className="eu-archive" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary><CalendarDays size={20} /><span><strong>Weather around the source date</strong><small>{anchor.place.river} · {anchor.photo.capturedDate} · historical model context</small></span><span className="eu-archive-chip">ERA5 ARCHIVE</span></summary>
    {open && <div className="eu-archive-content">
      <div className="eu-archive-anchor"><img src={anchor.photo.src} alt={anchor.photo.alt} /><div><p className="eu-kicker">PHOTOGRAPH / CALENDAR ALIGNMENT</p><h4>{anchor.photo.title}</h4><p>{displayEvidenceTime(anchor.photo.capturedDate)} · by {anchor.photo.author}</p><small>The dotted line marks the source calendar date. Capture time and timezone are unknown; the weather uses UTC days.</small></div></div>
      <div className="eu-chart-controls"><div role="group" aria-label="Historical weather metric">{(Object.keys(metrics) as Metric[]).map((name) => <button type="button" key={name} aria-pressed={metric === name} onClick={() => setMetric(name)}>{metrics[name].label}</button>)}</div><div role="group" aria-label="Historical weather window">{([7, 15] as const).map((count) => <button type="button" key={count} aria-pressed={days === count} onClick={() => setDays(count)}>{count} days</button>)}</div></div>
      <div className="eu-archive-toolbar"><span role="status">{busy ? "Requesting the archive…" : value ? activeLive ? "Retrieved this session · regional model" : "Recorded archive · regional model" : "No retained values for this window"}</span><button type="button" className="eu-quiet-button" disabled={busy} onClick={() => void refresh()}><RefreshCw size={14} className={busy ? "spin" : ""} />{busy ? "Loading…" : value ? "Refresh archive" : "Load archive"}</button></div>
      {value ? <>
        <div className="eu-weather-stats eu-archive-stats"><div><CloudRain size={18} /><strong>{number(center?.rain)}<small>mm</small></strong><span>Source-date modeled precipitation</span></div><div><Thermometer size={18} /><strong>{number(center?.temperature)}<small>°C</small></strong><span>Source-date mean air temperature</span></div><div><Wind size={18} /><strong>{number(center?.wind)}<small>km/h</small></strong><span>Source-date maximum wind at 10 m</span></div></div>
        <div className="eu-weather-chart eu-archive-chart" role="img" aria-label={`${config.label}, ${days} UTC days around ${anchor.photo.capturedDate}; exact values in the table below`}><ResponsiveContainer width="100%" height={225}>{metric === "rain" ? <BarChart data={series} margin={{ top: 25, right: 18, left: 0, bottom: 0 }} accessibilityLayer>{axes}<Bar dataKey="rain" fill={anchor.place.accent} radius={[4, 4, 0, 0]} maxBarSize={45} isAnimationActive={false} /></BarChart> : <AreaChart data={series} margin={{ top: 25, right: 18, left: 0, bottom: 0 }} accessibilityLayer>{axes}<Area type="linear" dataKey={metric} stroke={anchor.place.accent} fill={anchor.place.accent} fillOpacity={.13} strokeWidth={2} connectNulls={false} isAnimationActive={false} /></AreaChart>}</ResponsiveContainer></div>
        <details className="eu-data-table"><summary>Inspect historical values · {days} UTC days</summary><div><table><caption>ERA5 city-overview weather; unknown values are never replaced with zero.</caption><thead><tr><th>UTC model day</th><th>Rain mm</th><th>Mean air °C</th><th>Max wind km/h</th></tr></thead><tbody>{series.map((point) => <tr key={point.day} className={point.day === anchor.photo.capturedDate ? "eu-source-day" : ""}><th scope="row">{point.day}{point.day === anchor.photo.capturedDate ? " · source date" : ""}</th><td>{number(point.rain)}</td><td>{number(point.temperature)}</td><td>{number(point.wind)}</td></tr>)}</tbody></table></div></details>
        <p className="eu-weather-provenance">Retrieved {displayEvidenceTime(value.fetchedAt)} · {value.daily.time[0]} → {value.daily.time.at(-1)} UTC</p>
        <p className="eu-footnote">ERA5 reanalysis · nominal 0.25° grid, about 25 km. Requested city overview {value.requestedCoordinates.lat.toFixed(4)}, {value.requestedCoordinates.lon.toFixed(4)} · returned grid {value.gridCoordinates.lat.toFixed(3)}, {value.gridCoordinates.lon.toFixed(3)}. Regional weather cannot establish river flow, pollution, water safety or the cause of a visible feature.</p>
        <div className="eu-archive-links"><a className="eu-source-link" href={value.sourceUrl} target="_blank" rel="noreferrer">Open-Meteo archive request · CC BY 4.0 <ArrowUpRight size={13} /></a><button type="button" className="eu-quiet-button" onClick={exportArchive}><Download size={14} /> Archive JSON</button></div>
      </> : <p className="eu-no-finding">{recordedError || "The seven-day recorded archive loads when this panel opens. For a different window, choose Load archive. No generated replacement values are used."}</p>}
      {error && <p className="eu-error" role="alert">{error}</p>}
    </div>}
  </details>;
}
