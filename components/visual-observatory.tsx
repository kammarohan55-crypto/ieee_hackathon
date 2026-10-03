"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, ArrowUpRight, Camera, CalendarDays, ChevronLeft, ChevronRight, Download, Fingerprint, GitBranch, Globe2, Layers, Pause, Play, SlidersHorizontal, Waves } from "lucide-react";
import type { Report } from "@/lib/assessment";
import { europeanPhotoLibrary, displayEvidenceTime, photoViewingTitle } from "@/lib/references";
import { europeanPlaces } from "@/lib/european-sites";
import { archiveAnalytics, archiveCity, frameFormat } from "@/lib/visual-analytics";
import { evidenceFrames } from "@/lib/mission-control";
import { riverStory } from "@/lib/river-stories";
import { downloadFile } from "@/lib/field";
import { WORKSPACE_KEY, parseWorkspace } from "@/lib/workspace";
import { PRESENTATION_KEY } from "@/lib/presentation-workspace";
import { PhotoCompare } from "./evidence-visuals";
import { GeographicEvidenceMap } from "./geographic-evidence-map";
import { EvidenceGraph } from "./evidence-workbench";
import { DecisionPresentation } from "./decision-presentation";

const tabs = [{ id: "chronicle", label: "Photo chronicle", icon: CalendarDays }, { id: "compare", label: "Compare frames", icon: Layers }, { id: "globe", label: "Explore Earth", icon: Globe2 }, { id: "trail", label: "Evidence constellation", icon: GitBranch }] as const;
type View = typeof tabs[number]["id"];
const accent = ["#8de3c1", "#87cafa", "#baa4fa", "#efc789"];

export function VisualObservatory() {
  const [view, setView] = useState<View>("chronicle"), [city, setCity] = useState("all"), [year, setYear] = useState("all"), [format, setFormat] = useState("all");
  const [selected, setSelected] = useState("mondego-archive-11"), [records, setRecords] = useState<Report[]>([]);
  const [collection, setCollection] = useState<"personal" | "showcase">("personal"), [loaded, setLoaded] = useState(false), [error, setError] = useState("");
  const [motion, setMotion] = useState(false), [playing, setPlaying] = useState(false), [failedImage, setFailedImage] = useState("");
  useEffect(() => {
    const showcase = new URLSearchParams(window.location.search).get("collection") === "showcase";
    const read = () => {
      try { const raw = localStorage.getItem(showcase ? PRESENTATION_KEY : WORKSPACE_KEY); setRecords(raw ? parseWorkspace(JSON.parse(raw)) : []); setError(""); }
      catch { setRecords([]); setError("Saved reviews could not be read. The credited archive remains available; no saved data was changed."); }
      setLoaded(true);
    };
    window.addEventListener("storage", read);
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { setMotion(!preference.matches); if (preference.matches) setPlaying(false); };
    const bootstrap = window.setTimeout(() => { setCollection(showcase ? "showcase" : "personal"); read(); update(); }, 0);
    preference.addEventListener("change", update);
    return () => { window.clearTimeout(bootstrap); window.removeEventListener("storage", read); preference.removeEventListener("change", update); };
  }, []);
  const data = useMemo(() => archiveAnalytics(records, city, year), [records, city, year]);
  const collectionStats = useMemo(() => archiveAnalytics(records), [records]);
  const visible = useMemo(() => data.photos.filter((photo) => format === "all" || frameFormat(photo) === format), [data.photos, format]);
  const photo = visible.find((item) => item.id === selected) ?? visible[0];
  const story = photo ? riverStory(records, archiveCity(photo.id)!, photo.id) : undefined;
  const frames = useMemo(() => evidenceFrames(records).filter((frame) => frame.reference && europeanPhotoLibrary.some((photo) => photo.id === frame.reference!.id) && (city === "all" || archiveCity(frame.reference!.id) === city)), [records, city]);
  const index = photo ? visible.indexOf(photo) : -1;
  const step = (amount: number) => { if (visible[index + amount]) setSelected(visible[index + amount].id); };
  useEffect(() => {
    if (!playing || view !== "chronicle" || !motion || visible.length < 2) return;
    const timer = window.setInterval(() => setSelected((current) => {
      const at = visible.findIndex((item) => item.id === current);
      return visible[(at + 1) % visible.length].id;
    }), 3500);
    return () => window.clearInterval(timer);
  }, [playing, visible, view, motion]);
  const workspace = collection === "showcase" ? "/showcase" : "/";
  const exportCatalogue = () => downloadFile(JSON.stringify({ format: "aqualens-source-catalogue-v1", exportedAt: new Date().toISOString(), kind: "credited_historical_photographs", limitations: ["Catalogue sources, not citizen field observations or environmental measurements.", "Photographer-supplied dates have day precision; clocks and source metadata are not independently verified.", "Viewpoints are not aligned; source counts do not measure ecological trends."], filters: { city, year, format }, photos: visible }, null, 2), "aqualens-source-catalogue.json");
  return <main className="visual-observatory" data-motion={motion ? "allowed" : "reduced"}>
    <a className="vo-skip" href="#vo-content">Skip to visual workspace</a>
    <header className="vo-topbar"><a href={workspace}><ArrowLeft size={17} /> Evidence workspace</a><span><Waves size={19} /> AQUA / OBSERVATORY</span><div><a aria-current={collection === "personal" ? "page" : undefined} href="/visuals">My collection</a><a aria-current={collection === "showcase" ? "page" : undefined} href="/visuals?collection=showcase">Presentation collection</a></div></header>
    <header className="vo-heading"><div><p className="mc-kicker">EUROPEAN RIVER ARCHIVE / {data.first}–{data.last}</p><h1>Time, place.<br /><em>And a closer look.</em></h1><p>Explore real source photographs across years. See what is documented, what has been reviewed, and what remains unknown.</p></div><div className="vo-heading-facts"><strong>{europeanPhotoLibrary.length}<span>licensed photographs</span></strong><strong>{data.last - data.first + 1}<span>calendar years spanned</span></strong><strong>{europeanPlaces.length}<span>river / city contexts</span></strong><small>Historical catalogue · not continuous monitoring</small></div></header>
    <nav className="vo-tabs" aria-label="Visual workspace views">{tabs.map(({ id, label, icon: Icon }) => <button type="button" key={id} aria-pressed={view === id} onClick={() => { setView(id); setPlaying(false); }}><Icon size={17} /> {label}</button>)}</nav>
    <div className="vo-provenance" role="status"><Fingerprint size={16} /><span>{loaded ? collection === "showcase" ? "Presentation collection · saved example judgments remain labelled" : "Your local collection · read-only view" : "Reading local reviews…"} · {collectionStats.reviews} source-matched reviews · {collectionStats.aiResponses} retained AI responses{collectionStats.examples ? ` · ${collectionStats.examples} authored examples` : ""}</span></div>
    {error && <p className="vo-error" role="alert">{error}</p>}
    <div id="vo-content">
      {(view === "chronicle" || view === "compare") && <div className="vo-filters"><div role="group" aria-label="Filter archive by city"><button type="button" aria-pressed={city === "all"} onClick={() => { setCity("all"); setYear("all"); }}>All rivers</button>{europeanPlaces.map((place) => <button type="button" key={place.id} aria-pressed={city === place.id} onClick={() => { setCity(place.id); setYear("all"); }}>{place.city}</button>)}</div>{view === "chronicle" && <label><SlidersHorizontal size={15} /> Source year<select value={year} onChange={(event) => setYear(event.target.value)}><option value="all">All source years</option>{data.years.map((item) => <option key={item.year} value={item.year}>{item.year} · {item.count} photos</option>)}</select></label>}</div>}
      {view === "chronicle" && <>
        <section className="vo-photo-story" aria-label="Selected source photograph">
          <div className="vo-selected-frame">{photo && failedImage !== photo.id ? <img key={photo.id} src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} onError={() => setFailedImage(photo.id)} /> : <div className="vo-empty"><Camera size={34} /><h2>{photo ? "Photograph unavailable" : "No source photographs match"}</h2>{photo ? <button type="button" onClick={() => setFailedImage("")}>Retry photograph</button> : <button type="button" onClick={() => { setYear("all"); setFormat("all"); }}>Clear source filters</button>}</div>}<span className="vo-frame-badge">{photo ? "FULL SOURCE FRAME / HISTORICAL" : "SOURCE CATALOGUE"}</span></div>
          <div className="vo-photo-copy"><p className="mc-kicker">{photo ? `${archiveCity(photo.id)?.toUpperCase()} / ${String(index + 1).padStart(2, "0")} OF ${visible.length}` : "NO MATCHING SOURCE"}</p><h2>{photo ? archiveCity(photo.id) === "coimbra" ? "Mondego" : archiveCity(photo.id) === "toulouse" ? "Garonne" : "Hoffselva" : "Keep the gaps visible."}</h2>{photo && <><h3 title={photo.title}>{photoViewingTitle(photo)}</h3><time dateTime={photo.capturedDate}>{displayEvidenceTime(photo.capturedDate)}</time><p className="vo-credit"><a href={photo.sourceUrl} target="_blank" rel="noreferrer">{photo.author} ↗</a><a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license} ↗</a></p><p>{story?.report ? story.report.original.note || "No original note retained." : "No saved review for this exact source. This photograph is catalogue material; it is not a new field visit."}</p><small>{story?.report?.demonstration ? "Authored example note · no expert validation" : story?.report ? "Literal retained note" : "No AI or human judgment is invented for archive additions."}</small>{story?.report && <DecisionPresentation key={story.report.id} report={story.report} />}</>}
            <div className="vo-playback"><button type="button" disabled={index <= 0} onClick={() => step(-1)} aria-label="Previous historical source"><ChevronLeft size={18} /></button><button type="button" disabled={!motion || visible.length < 2} aria-pressed={playing} onClick={() => setPlaying(!playing)}>{playing ? <Pause size={16} /> : <Play size={16} />}{playing ? "Pause chronology" : "Play photo chronology"}</button><button type="button" disabled={index < 0 || index >= visible.length - 1} onClick={() => step(1)} aria-label="Next historical source"><ChevronRight size={18} /></button></div><small className="vo-limit">Different viewpoints. No automated change diagnosis. Original dates, credits and pixels retained.</small></div>
        </section>
        <section className="vo-chronology vo-panel" aria-labelledby="vo-time-title"><div className="vo-panel-heading"><div><p className="mc-kicker">SOURCE-DATE COVERAGE</p><h2 id="vo-time-title">The archive across time.</h2><p>Photo counts by photographer-supplied year. Empty years are gaps, not zero ecological activity.</p></div><span>{data.photos.length} sources / {data.sourceDates} dates</span></div>
          <div className="vo-year-chart" role="img" aria-label={`Source-photo counts across ${data.first} through ${data.last}; select a year using the buttons below.`}><ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 260 }}><BarChart data={data.years} margin={{ top: 18, right: 8, left: -25, bottom: 8 }}><CartesianGrid vertical={false} stroke="#36535c" strokeDasharray="3 5" /><XAxis dataKey="year" interval={2} tick={{ fill: "#bfd8dc", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fill: "#a6c4cc", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: "#ffffff09" }} contentStyle={{ background: "#102934", border: "1px solid #527480", color: "#e6f6ef", borderRadius: 12 }} labelFormatter={(label) => `Source year ${label}`} />{europeanPlaces.map((place, index) => <Bar key={place.id} dataKey={place.id} name={place.city} stackId="source" fill={accent[index]} maxBarSize={28} isAnimationActive={motion} animationDuration={650} />)}</BarChart></ResponsiveContainer></div>
          <div className="vo-chart-legend">{europeanPlaces.map((place, index) => <span key={place.id}><i style={{ background: accent[index] }} />{place.city}</span>)}</div><div className="vo-year-selector" role="group" aria-label="Choose a source year"><button type="button" aria-pressed={year === "all"} onClick={() => setYear("all")}>All years</button>{data.years.filter((item) => item.count).map((item) => <button type="button" key={item.year} aria-pressed={year === item.year} onClick={() => setYear(year === item.year ? "all" : item.year)}>{item.year}<b>{item.count}</b></button>)}</div>
        </section>
        <div className="vo-analysis-grid"><section className="vo-panel"><div className="vo-panel-heading"><div><p className="mc-kicker">WITHIN THE CALENDAR</p><h2>When sources were made.</h2></div><CalendarDays size={22} /></div><div className="vo-quarter-bars">{data.quarters.map((quarter, index) => <div key={quarter.label}><span>{quarter.label}</span><div><i style={{ width: `${data.photos.length ? quarter.count / data.photos.length * 100 : 0}%`, background: accent[index] }} /></div><strong>{quarter.count}</strong></div>)}</div><p className="vo-limit">Calendar-quarter coverage. Different years and viewpoints do not make a seasonal water-quality comparison.</p></section>
          <section className="vo-panel"><div className="vo-panel-heading"><div><p className="mc-kicker">FRAME GEOMETRY</p><h2>Ways to look closer.</h2></div><Camera size={22} /></div><div className="vo-format-cards">{data.formats.map((item) => <button type="button" key={item.label} aria-pressed={format === item.label} onClick={() => setFormat(format === item.label ? "all" : item.label)}><span className={`vo-format-glyph ${item.label}`} aria-hidden="true" /><strong>{item.count}</strong><span>{item.label}</span></button>)}</div><p className="vo-limit">Format groups use retained pixel dimensions. They are viewing aids, not image-quality or environmental scores.</p></section></div>
        <section className="vo-panel vo-library" aria-labelledby="vo-library-title"><div className="vo-panel-heading"><div><p className="mc-kicker">THE CREDITED COLLECTION</p><h2 id="vo-library-title">Choose a frame. Keep its story.</h2><p>{visible.length} matching photographs{format !== "all" ? ` · ${format} frames` : ""}. Select one to inspect above.</p></div><button type="button" onClick={exportCatalogue}><Download size={15} /> Export source catalogue</button></div>
          {format !== "all" && <button type="button" className="vo-clear-format" onClick={() => setFormat("all")}>Show all frame formats</button>}<div className="vo-library-grid">{visible.map((item) => <button type="button" key={item.id} aria-pressed={photo?.id === item.id} onClick={() => { setSelected(item.id); setPlaying(false); document.querySelector(".vo-photo-story")?.scrollIntoView({ behavior: motion ? "smooth" : "auto", block: "start" }); }}><span className="vo-library-image"><img src={item.src} alt={item.alt} width={item.width} height={item.height} loading="lazy" /></span><span><time dateTime={item.capturedDate}>{item.capturedDate}</time><strong title={item.title}>{photoViewingTitle(item)}</strong><small>{item.author} · {item.license}</small></span></button>)}</div>{!visible.length && <p className="vo-empty">No source photographs match. Clear year or format filters above.</p>}
        </section>
      </>}
      {view === "compare" && <div className="vo-panel"><div className="vo-panel-heading"><div><p className="mc-kicker">MANUAL INSPECTION</p><h2>Two frames. Independent evidence.</h2><p>Choose any two credited photographs. Drag the divider or use side-by-side viewing.</p></div></div><PhotoCompare frames={frames} actionLabel="Inspect source" onReview={(frame) => { if (frame.reference) { setSelected(frame.reference.id); setYear("all"); setFormat("all"); setView("chronicle"); } }} /></div>}
      {view === "globe" && <GeographicEvidenceMap records={[]} publicContext referenceActionLabel="Inspect source photograph" onOpen={() => { window.location.href = workspace; }} onReviewReference={(source) => { setSelected(source.id); setYear("all"); setCity("all"); setFormat("all"); setView("chronicle"); }} />}
      {view === "trail" && <section className="vo-panel"><div className="vo-panel-heading"><div><p className="mc-kicker">RETAINED SOURCES / HUMAN OVERSIGHT</p><h2>Every connection has a source.</h2><p>Select a saved review to inspect original evidence, local checks and retained human reasoning.</p></div></div>{records.some((report) => report.field?.reference) ? <><label className="vo-record-picker">Saved photo review<select value={story?.report?.id || ""} onChange={(event) => { const record = records.find((item) => item.id === event.target.value); if (record?.field?.reference) { setSelected(record.field.reference.id); setYear("all"); setCity("all"); setFormat("all"); } }}><option value="">Select a retained photo review</option>{records.filter((report) => report.field?.reference && europeanPhotoLibrary.some((photo) => photo.id === report.field!.reference!.id)).map((report) => <option key={report.id} value={report.id}>{report.field!.reference!.title}{report.demonstration ? " · example" : ""}</option>)}</select></label>{story?.report ? <><EvidenceGraph report={story.report} /><DecisionPresentation key={story.report.id} report={story.report} /></> : <div className="vo-empty">This source has no saved review. Choose a retained review above; no graph or AI findings are manufactured.</div>}</> : <div className="vo-empty"><Fingerprint size={32} /><h3>No saved source reviews in this collection.</h3><p>The archive remains usable. Open the evidence workspace to prepare and confirm a review, or use the separately labelled presentation collection.</p><a href={workspace}>Open evidence workspace <ArrowUpRight size={15} /></a></div>}</section>}
    </div>
    <footer className="vo-footer"><Waves size={20} /><p>Photographs open questions. Measurements and qualified review establish more.<br />No appearance-based water-safety, pollutant, pathogen or ecological-status conclusions.</p><a href="/images/references/CREDITS.md" target="_blank" rel="noreferrer">All credits &amp; licences <ArrowUpRight size={15} /></a></footer>
  </main>;
}
