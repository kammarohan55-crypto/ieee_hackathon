"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Activity, ArrowRight, ArrowUpRight, Camera, ChartNoAxesCombined, Check, ChevronRight, CircleHelp, Clock3, Crosshair, Expand, FileText, Fingerprint, GitBranch, Layers, MapPin, Minimize2, Search, ShieldCheck, Waves } from "lucide-react";
import type { Report } from "@/lib/assessment";
import { addPhotoAnnotation, observationQuality } from "@/lib/field";
import { evidenceFrames, recordSignals, reviewQueue, scopedRecords, workspaceAnalytics, workflowLabels, type EvidenceFrame, type EvidenceScope } from "@/lib/mission-control";
import { displayEvidenceTime, type ReferencePhoto } from "@/lib/references";
import { PhotoInspector, FrameImage } from "./photo-inspector";
import { EvidenceFlow, EvidenceReplay, PhotoCompare } from "./evidence-visuals";
import { SiteConditions } from "./site-conditions";
import { GeographicEvidenceMap } from "./geographic-evidence-map";
import { type EuropeanBundle } from "@/lib/european-sites";
import { sourceWeatherAnchor } from "@/lib/source-weather";
import { EuropeanContext } from "./european-context";
import { SamplingPlan } from "./sampling-plan";
import { SourceDateWeather } from "./source-date-weather";

type View = "photo" | "compare" | "flow" | "map";
export function MissionControl({ records, aiReady, online, onStart, onReviewReference, onOpen, onFollowup, onUpdate, onInsights, onKit }: {
  records: Report[]; aiReady: boolean; online: boolean; onStart: () => void;
  onReviewReference: (photo: ReferencePhoto) => void; onOpen: (id: string) => void;
  onFollowup?: (report: Report) => void;
  onUpdate: (report: Report) => void; onInsights: () => void; onKit: () => void;
}) {
  const [sourceBundle, setSourceBundle] = useState<EuropeanBundle | null>(null);
  const [scope, setScope] = useState<EvidenceScope>("all"), [query, setQuery] = useState(""), [selectedKey, setSelectedKey] = useState("");
  const [view, setView] = useState<View>("photo"), [focus, setFocus] = useState(false), [limit, setLimit] = useState(20);
  const search = useRef<HTMLInputElement>(null);
  const frames = useMemo(() => evidenceFrames(records), [records]);
  const filtered = frames.filter((frame) => (scope === "all" || (scope === "field" ? !!frame.report && !frame.reference : !!frame.reference)) && query.toLowerCase().trim().split(/\s+/).every((word) => `${frame.title} ${frame.report?.original.note ?? ""} ${frame.reference?.author ?? ""} ${frame.report?.id ?? ""}`.toLowerCase().includes(word)));
  const selected = filtered.find((frame) => frame.key === selectedKey) ?? filtered[0];
  const sourcePlace = selected?.reference ? sourceWeatherAnchor(selected.reference.id)?.place : undefined;
  const analytics = useMemo(() => workspaceAnalytics(records), [records]);
  const queue = useMemo(() => reviewQueue(records), [records]);
  const fieldRecords = useMemo(() => scopedRecords(records, "field"), [records]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); search.current?.focus(); }
      if (event.key === "Escape") setFocus(false);
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, []);
  function choose(frame: EvidenceFrame) { setSelectedKey(frame.key); setView("photo"); }
  function reviewFrame(frame: EvidenceFrame) { if (frame.report) onOpen(frame.report.id); else if (frame.reference) onReviewReference(frame.reference); }
  const modes: { value: View; label: string; icon: ReactNode }[] = [
    { value: "photo", label: "Photo desk", icon: <Crosshair size={15} /> }, { value: "compare", label: "Compare", icon: <Layers size={15} /> },
    { value: "flow", label: "Evidence flow", icon: <GitBranch size={15} /> }, { value: "map", label: "Geographic map", icon: <MapPin size={15} /> },
  ];
  return <div className={`mission-control${focus ? " is-focused" : ""}`}>
    <header className="mc-page-heading"><div><p className="mc-kicker"><Waves size={15} /> RIVER EVIDENCE / MISSION CONTROL</p><h1>Make every observation <em>count.</em></h1><p>A closer look at the water. A clearer path from evidence to review.</p></div><div className="mc-heading-actions"><span className="mc-chip"><span className="mc-status-dot" />{online ? "BROWSER WORKSPACE" : "OFFLINE WORKSPACE"}</span><button type="button" className="mc-button accent" onClick={onStart}><Camera size={16} /> New observation <ArrowUpRight size={15} /></button></div></header>
    <div className="mc-top-metrics"><Metric icon={<FileText />} label="Field observations" value={analytics.field} detail="Saved in this browser" tone="cyan" /><Metric icon={<Camera />} label="Photo reviews" value={analytics.references} detail="Historical, source credited" tone="violet" /><Metric icon={<ShieldCheck />} label="Needs attention" value={queue.length} detail="Records needing attention" tone="amber" /><Metric icon={<MapPin />} label="Located field records" value={fieldRecords.filter((record) => !!record.field?.coordinates).length} detail="Supplied coordinates only" tone="mint" /></div>
    <div className="mc-command-bar"><label><Search size={16} /><input ref={search} type="search" value={query} onChange={(event) => { setQuery(event.target.value); setLimit(20); }} placeholder="Search photo sources, sites, notes…" aria-label="Search photo sources, sites or notes" /><kbd>Ctrl / ⌘ K</kbd></label><div className="mc-capabilities"><span><i className="ready" /> LOCAL RULES</span><span><i className={aiReady && online ? "ready" : "idle"} />{aiReady && online ? "AI CONFIGURED" : "AI UNAVAILABLE"}</span><span><Fingerprint size={13} /> SOURCE TRACEABLE</span></div></div>
    <div className={`mc-workbench${view === "map" ? " is-map" : ""}`}>
      <aside className="mc-source-panel"><div className="mc-panel-heading"><span><Layers size={15} /> PHOTO SOURCES</span><b>{filtered.length}</b></div><div className="mc-scope-buttons" role="group" aria-label="Photo source filter">{(["all", "field", "reference"] as const).map((value) => <button type="button" key={value} aria-pressed={scope === value} onClick={() => { setScope(value); setLimit(20); }}>{value === "all" ? "All" : value === "field" ? "Your field" : "Historical"}</button>)}</div>
        <div className="mc-source-list">{filtered.slice(0, limit).map((frame) => <button type="button" key={frame.key} className={`mc-source-card${selected?.key === frame.key ? " selected" : ""}`} aria-pressed={selected?.key === frame.key} onClick={() => choose(frame)}><div className="mc-source-thumbnail"><FrameImage frame={frame} /><span>{frame.report ? "SAVED" : "REFERENCE"}</span></div><div><strong>{frame.title}</strong><small>{frame.date.slice(0, 10)} · {frame.report ? "Your review" : frame.reference?.author}</small><span className="mc-source-type"><i />{frame.reference ? "Historical photo" : "Field photograph"}<ChevronRight size={13} /></span></div></button>)}
          {!filtered.length && <div className="mc-source-empty"><Camera size={26} /><p>{query ? "No matching photo sources." : "Add a field photograph to see it here."}</p><button className="mc-text-button" type="button" onClick={() => { setQuery(""); setScope("all"); }}>Show all sources</button></div>}
          {filtered.length > limit && <button type="button" className="mc-button" onClick={() => setLimit(limit + 20)}>Show 20 more sources</button>}
        </div><div className="mc-source-footer"><Fingerprint size={18} /><p>Nine licensed European river photos included. Your collection keeps explicit reviews; presentation examples are labelled separately.</p><button type="button" className="mc-text-button" onClick={onKit}>Credits & field packs <ArrowUpRight size={12} /></button></div>
      </aside>
      <div className="mc-main-panel"><div className="mc-view-tabs" role="group" aria-label="Evidence visualization">{modes.map((mode) => <button type="button" key={mode.value} aria-pressed={view === mode.value} onClick={() => setView(mode.value)}>{mode.icon}<span>{mode.label}</span></button>)}<button type="button" className="mc-focus-button" aria-label={focus ? "Exit canvas focus" : "Focus on visualization"} aria-pressed={focus} onClick={() => setFocus(!focus)}>{focus ? <Minimize2 size={15} /> : <Expand size={15} />}</button></div>
        {view === "map" ? <div className="mc-map-container"><GeographicEvidenceMap records={fieldRecords} onOpen={onOpen} publicContext initialReferenceCity={sourcePlace?.id} onReviewReference={onReviewReference} />{fieldRecords.some((record) => record.field?.coordinates) && <details className="mc-site-weather"><summary>Load weather for a saved field location</summary><SiteConditions records={fieldRecords} /></details>}</div> : selected ? <>
          <div className="mc-canvas-heading"><div><span className="mc-kicker">{view === "photo" ? "VISUAL INSPECTION" : view === "compare" ? "MANUAL COMPARISON" : "SOURCE → QUESTION → HUMAN DECISION"}</span><h2>{view === "compare" ? "Inspect two frames." : selected.title}</h2></div>{view !== "compare" && <span className={`mc-chip${selected.reference ? " violet" : ""}`}>{selected.reference ? "HISTORICAL SOURCE" : "FIELD EVIDENCE"}</span>}</div>
          {view === "photo" && <PhotoInspector key={selected.key} frame={selected} recordedVisual={!selected.report ? sourceBundle?.analyses.find((value) => value.photoId === selected.reference?.id) : undefined} onAnnotate={selected.report ? (input) => onUpdate(addPhotoAnnotation(selected.report!, input)) : undefined} />}
          {view === "photo" && sourcePlace && !selected.report && <EuropeanContext key={selected.reference?.id} place={sourcePlace} photoId={selected.reference?.id} weatherEnabled={false} onBundle={setSourceBundle} />}
          {view === "photo" && sourcePlace && selected.report && selected.reference && <section className="eu-context" aria-label={`${sourcePlace.city} historical model weather`}><SourceDateWeather key={selected.reference.id} photoId={selected.reference.id} /></section>}
          {view === "compare" && <PhotoCompare frames={filtered} onReview={reviewFrame} />}
          {view === "flow" && <EvidenceFlow key={selected.key} frame={selected} />}
          {view !== "compare" && <><FrameAttribution frame={selected} />
          {selected.report ? <EvidenceReplay key={selected.report.id} report={selected.report} /> : <div className="mc-start-review"><div><span className="mc-kicker">YOUR JUDGMENT STARTS HERE</span><h3>Turn this frame into a traceable review.</h3><p>Write what you can see, keep uncertainty visible, and inspect every decision.</p></div><button type="button" className="mc-button accent" onClick={() => selected.reference && onReviewReference(selected.reference)}>Review this photo <ArrowRight size={16} /></button></div>}</>}
        </> : <div className="mc-empty"><Camera size={38} /><h3>Choose your evidence.</h3><p>Select another source filter or add a field photo.</p><button type="button" className="mc-button accent" onClick={onStart}>Make an observation <ArrowUpRight size={14} /></button></div>}
      </div>
      <aside className="mc-inspector"><div className="mc-panel-heading"><span><Crosshair size={15} /> EVIDENCE INSPECTOR</span></div>{view === "compare" ? <div className="mc-source-empty"><Layers size={26} /><p>Each comparison frame shows its own source and review action below the image. Open A or B to inspect that photograph’s record.</p></div> : selected ? <><div className="mc-inspector-source"><span className="mc-kicker">{selected.report ? selected.report.id.slice(0, 12) : "PUBLIC SOURCE / EUROPE"}</span><h2>{selected.title}</h2><p><Clock3 size={13} />{displayEvidenceTime(selected.date)}</p><span className={`mc-chip${selected.reference ? " violet" : ""}`}>{selected.report ? workflowLabels[selected.report.status] : "READY FOR YOUR REVIEW"}</span></div>
        <div className="mc-completeness"><CompletenessRing report={selected.report} /><div><h3>Evidence completeness</h3><p>{selected.report ? "Prototype checklist points. Inspect each part in the receipt." : "Available after you write and confirm a review."}</p></div></div>
        <div className="mc-signal-list"><span className="mc-kicker">RECORD COMPONENTS</span>{(selected.report ? recordSignals(selected.report) : [{ key: "source", label: "Credited source photo", present: true, applicable: true }, { key: "note", label: "Your original note", present: false, applicable: true }, { key: "confirmation", label: "Your confirmation", present: false, applicable: true }, { key: "review", label: "Human review", present: false, applicable: true }]).map((signal) => <div key={signal.key}><span>{signal.label}</span><span className={!signal.applicable ? "signal-na" : signal.present ? "signal-yes" : "signal-no"}>{!signal.applicable ? "N/A" : signal.present ? <><Check size={12} /> Present</> : "Pending"}</span></div>)}</div>
        <div className="mc-inspector-note"><span className="mc-kicker">{selected.report ? "ORIGINAL NOTE" : "NEXT ACTION"}</span><p>{selected.report?.original.note || "Start a photo review and describe a visible detail in your own words. No field observation has been created from this photo."}</p>{selected.report ? <button type="button" className="mc-button" onClick={() => onOpen(selected.report!.id)}>Open full receipt <ArrowUpRight size={14} /></button> : <button type="button" className="mc-button" onClick={() => selected.reference && onReviewReference(selected.reference)}>Write a photo review <ArrowUpRight size={14} /></button>}</div>
        {selected.report?.field?.coordinates && !selected.reference && <details className="mc-site-weather"><summary>Weather at this recorded location</summary><SiteConditions records={[selected.report]} /></details>}
        <div className="mc-hash"><Fingerprint size={14} /><div><span>FILE SHA-256</span><code>{selected.media?.sha256 || selected.reference?.sha256}</code></div></div><p className="mc-inspector-limit"><CircleHelp size={14} />Completeness and a matching digest do not establish water safety, accuracy or authenticity.</p>
      </> : <div className="mc-source-empty">Select a photo to inspect its source.</div>}</aside>
    </div>
    <div className="mc-bottom-grid"><SamplingPlan records={records} onOpen={onOpen} onFollowup={onFollowup} /><section className="mc-insights-invite"><div className="mc-panel-heading"><span><ChartNoAxesCombined size={15} /> COLLECTION SIGNALS</span><button className="mc-text-button" type="button" onClick={onInsights}>Explore <ArrowUpRight size={14} /></button></div><div className="mc-mini-signals">{analytics.coverage.slice(0, 4).map((signal, index) => <div key={signal.key}><span>{signal.label}</span><div><i style={{ width: `${signal.total ? signal.count / signal.total * 100 : 0}%`, background: ["#35c9e8", "#a58bff", "#4bd6b0", "#e9b66b"][index] }} /></div><b>{signal.count}<small>/{signal.total}</small></b></div>)}</div><p className="mc-footnote">Coverage from saved records. Open Insights for the matrix, activity charts and software validation.</p></section></div>
    <div className="mc-statusbar"><span><Activity size={13} /> {analytics.total} SAVED RECORDS</span><span>ORIGINAL FILES PRESERVED</span><span>LOCAL HUMAN REVIEW</span><span><span className="mc-status-dot" />{online ? "NETWORK AVAILABLE" : "OFFLINE"}</span></div>
  </div>;
}
function Metric({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: number; detail: string; tone: string }) {
  return <article className={`mc-metric mc-${tone}`}><div className="mc-metric-label">{icon}<span>{label}</span></div><div><strong>{String(value).padStart(2, "0")}</strong><span className="mc-metric-trace" aria-hidden="true">{icon}</span></div><small>{detail}</small></article>;
}
function CompletenessRing({ report }: { report?: Report }) {
  const score = report ? observationQuality(report).value : undefined;
  return <svg viewBox="0 0 110 110" className="mc-score-ring" role="img" aria-label={score === undefined ? "No saved record to score" : `${score} out of 100 prototype evidence-completeness points`}><circle className="ring-track" cx="55" cy="55" r="44" /><circle className="ring-value" cx="55" cy="55" r="44" pathLength="100" strokeDasharray={`${score ?? 0} 100`} transform="rotate(-90 55 55)" /><text className="score-value" x="55" y="56">{score ?? "—"}</text><text className="score-unit" x="55" y="73">{score === undefined ? "NO RECORD" : "/ 100 POINTS"}</text></svg>;
}
function FrameAttribution({ frame }: { frame: EvidenceFrame }) {
  return <div className="mc-frame-attribution"><Fingerprint size={14} /><div>{frame.reference ? <><a href={frame.reference.sourceUrl} target="_blank" rel="noreferrer">{frame.reference.title} · {frame.reference.author} <ArrowUpRight size={12} /></a><span><a href={frame.reference.licenseUrl} target="_blank" rel="noreferrer">{frame.reference.license}</a> · Source date {frame.reference.capturedDate} · Wikimedia thumbnail · No project pixel edits</span></> : <><strong>Original {frame.media?.origin === "camera" ? "camera" : "uploaded"} photo</strong><span>Recorded in this browser workspace. The source file is available only where its bytes have been retained or imported.</span></>}</div></div>;
}
