"use client";
import { useId, useMemo, useState } from "react";
import { Tabs } from "radix-ui";
import {
  ArrowRight, Camera, Check, ChevronLeft, ChevronRight, CircleHelp,
  Clock3, FileText, Fingerprint, Layers, MapPin, Pause,
  Play, ShieldCheck, Sparkles, Target, Waves,
} from "lucide-react";
import type { Report } from "@/lib/assessment";
import { findingLabels, observationQuality, type MediaEvidence } from "@/lib/field";
import { EvidenceImage } from "./field-studio";
import { groupObservationSites, recordEvidenceGaps } from "@/lib/river-observatory";

function observedTime(value: string) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "Observation time unknown";
  return new Date(time).toLocaleString("en-GB", {
    timeZone: "UTC", day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) + " UTC";
}

function workflowLabel(status: Report["status"]) {
  return status === "reviewed" ? "Human reviewed" : status === "needs_information" ? "More information requested" : "Awaiting human review";
}

function LocalEvidence({ media }: { media: MediaEvidence }) {
  return (
    <div className="river-media-frame">
      <EvidenceImage media={media} />
      <span className="river-media-origin">{media.origin === "illustration" ? "Synthetic illustration" : `${media.origin === "camera" ? "Camera capture" : "Citizen upload"} · digest recorded`}</span>
    </div>
  );
}

function RiverRibbon({ id }: { id: string }) {
  const river = "M -90 355 C 125 535 126 83 336 133 S 470 501 646 354 S 775 178 1030 65";
  return (
    <svg className="river-ribbon" viewBox="0 0 1000 540" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-water`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#244e58" /><stop offset="48%" stopColor="#44867f" /><stop offset="100%" stopColor="#7bada0" />
        </linearGradient>
        <linearGradient id={`${id}-bank`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#476b61" stopOpacity=".5" /><stop offset="100%" stopColor="#172f38" stopOpacity=".2" />
        </linearGradient>
      </defs>
      <g className="river-contours" fill="none" stroke="#8fb4a4" strokeOpacity=".09">
        <path d="M-80 68 C190 173 133-35 395 39 S730 142 1030-50" /><path d="M-70 87 C190 192 137-17 398 62 S754 160 1030-27" />
        <path d="M-60 107 C190 211 145 4 401 85 S776 178 1030-4" /><path d="M-50 129 C190 230 153 25 410 110 S788 198 1030 23" />
        <path d="M-80 474 C192 606 427 512 630 460 S855 390 1090 449" /><path d="M-80 492 C192 624 427 530 630 478 S855 408 1090 467" />
        <path d="M-80 510 C192 642 427 548 630 496 S855 426 1090 485" /><path d="M-80 528 C192 660 427 566 630 514 S855 444 1090 503" />
      </g>
      <path d={river} fill="none" stroke={`url(#${id}-bank)`} strokeWidth="132" />
      <path d={river} fill="none" stroke="#799887" strokeWidth="99" strokeOpacity=".18" />
      <path d={river} fill="none" stroke="#0d2933" strokeWidth="86" />
      <path d={river} fill="none" stroke={`url(#${id}-water)`} strokeWidth="72" />
      <path d={river} fill="none" stroke="#abc9b6" strokeWidth="56" strokeOpacity=".07" />
      <path className="river-flow-line" d={river} fill="none" stroke="#dfebe0" strokeWidth="1.5" strokeOpacity=".35" strokeDasharray="4 28 42 100" />
      <path d="M335 133 C278 219 370 286 474 270" fill="none" stroke="#87b4a0" strokeWidth=".8" strokeOpacity=".3" />
      <path d="M646 354 C647 453 768 504 934 477" fill="none" stroke="#7ca28a" strokeWidth="10" strokeOpacity=".12" />
    </svg>
  );
}

export function RiverObservatory({ records, onOpen, onMission }: {
  records: Report[];
  onOpen: (id: string) => void;
  onMission: (report: Report) => void;
}) {
  const id = useId().replace(/:/g, "");
  const sites = useMemo(() => groupObservationSites(records), [records]);
  const [siteKey, setSiteKey] = useState<string | undefined>();
  const [recordId, setRecordId] = useState("");
  const [mediaId, setMediaId] = useState("");
  const [paused, setPaused] = useState(false);
  const site = sites.find((s) => s.key === siteKey) ?? sites[0];
  const record = site?.records.find((r) => r.id === recordId) ?? site?.records[0];
  const quality = record ? observationQuality(record) : undefined;
  const gaps = record ? recordEvidenceGaps(record) : [];
  const media = record?.field?.media.find((m) => m.id === mediaId) ?? record?.field?.media[0];
  const index = record && site ? site.records.findIndex((r) => r.id === record.id) : -1;
  const synthetic = record?.original.synthetic || record?.field?.media.some((m) => m.origin === "illustration");
  const reviewed = records.filter((r) => r.status === "reviewed").length;
  const mediaCount = records.reduce((n, r) => n + (r.field?.media.length ?? 0), 0);
  function selectRecord(id: string) {
    setRecordId(id);
    setMediaId("");
  }
  return (
    <section className={`river-observatory${paused ? " river-paused" : ""}`} aria-labelledby={`${id}-title`}>
      <div className="river-layout">
        <div className="river-stage">
          <RiverRibbon id={id} />
          <div className="river-stage-vignette" aria-hidden="true" />
          <header className="river-stage-heading">
            <div>
              <p className="river-kicker"><Waves size={15} /> THE RIVER OBSERVATORY</p>
              <h2 id={`${id}-title`}>Every observation.<br /><em>A richer story.</em></h2>
              <p>Explore the evidence behind each place, with uncertainty kept in view.</p>
            </div>
            <button type="button" className="river-motion-control" onClick={() => setPaused(!paused)} aria-label={paused ? "Resume decorative river animation" : "Pause decorative river animation"} aria-pressed={paused}>
              {paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          </header>
          <div className="river-stations" aria-label="Observation sites">
            {sites.map((s, i) => (
              <button type="button" key={s.key} className={`river-station${s.key === site?.key ? " river-station-selected" : ""}`} aria-pressed={s.key === site?.key} onClick={() => { setSiteKey(s.key); selectRecord(s.records[0].id); }}>
                <span className="river-station-top"><span className="river-station-number">{String(i + 1).padStart(2, "0")}</span><span className="river-station-dot" /></span>
                <strong>{s.label}</strong>
                <span className="river-station-details">{s.records.length} record{s.records.length === 1 ? "" : "s"} <span>·</span> {s.media} media</span>
                <span className="river-station-bottom"><span>{s.synthetic ? `${s.synthetic} synthetic` : "Citizen records"}</span><ArrowRight size={16} /></span>
              </button>
            ))}
            {!sites.length && (
              <div className="river-empty-stage">
                <Camera size={30} />
                <h3>The next story starts in the field.</h3>
                <p>Create and confirm an observation to add your first site. A location pin is optional.</p>
              </div>
            )}
          </div>
          <footer className="river-stage-footer">
            <div className="river-local-counts"><span><b>{sites.length}</b> site labels</span><span><b>{records.length}</b> local records</span><span><b>{mediaCount}</b> media</span><span><b>{reviewed}</b> human reviewed</span></div>
            <p><Layers size={14} /><span><strong>Schematic · not geographic · not a water-health assessment.</strong> Arrangement and animation are illustrative. Matching labels do not establish a shared waterway.</span></p>
          </footer>
        </div>
        <aside className="river-story" aria-label="Selected observation evidence">
          {record && site && quality ? (
            <>
              <header className="river-story-heading">
                <p className="river-kicker">SELECTED FIELD RECORD <span>{index + 1} / {site.records.length}</span></p>
                <h3>{site.label}</h3>
                <p><Clock3 size={14} /> {observedTime(record.original.observedAt)}</p>
                <div className="river-badges">
                  <span className={synthetic ? "river-badge synthetic" : "river-badge"}>{synthetic ? "Synthetic / demo" : "Citizen observation"}</span>
                  <span className="river-badge"><ShieldCheck size={12} /> {workflowLabel(record.status)}</span>
                </div>
              </header>
              <Tabs.Root defaultValue="story" className="river-detail-tabs">
                <Tabs.List className="river-tabs-list" aria-label="Selected observation detail">
                  <Tabs.Trigger value="story"><FileText size={14} /> Story</Tabs.Trigger>
                  <Tabs.Trigger value="evidence"><Camera size={14} /> Evidence</Tabs.Trigger>
                  <Tabs.Trigger value="method"><Fingerprint size={14} /> Method</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="story" className="river-tab-content">
                  <p className="river-section-label">CITIZEN’S ORIGINAL WORDS</p>
                  <blockquote>{record.original.note || "No original note supplied."}</blockquote>
                  <div className="river-observed-appearance"><Waves size={17} /><div><span>Reported appearance</span><strong>{record.original.appearance === "unsure" ? "Not established / unsure" : record.original.appearance}</strong></div></div>
                  <div className="river-completeness">
                    <div><span>Observation completeness</span><strong>{quality.value}<small>/100</small></strong></div>
                    <div className="river-completeness-track" aria-hidden="true"><i style={{ width: `${quality.value}%` }} /></div>
                    <p>Rule-based evidence checklist. This is not accuracy, water health or scientific confidence.</p>
                  </div>
                  <details className="river-gaps">
                    <summary><CircleHelp size={16} /> What remains unknown <span>{gaps.length}</span></summary>
                    {gaps.length ? <ul>{gaps.map((gap) => <li key={gap}>{gap}</li>)}</ul> : <p>No gaps flagged by the prototype checklist. Environmental safety and causes still require independent verification.</p>}
                    <p>Review and confirmation do not establish water safety, pollutant identity or ecological condition.</p>
                  </details>
                </Tabs.Content>
                <Tabs.Content value="evidence" className="river-tab-content">
                  {media ? (
                    <>
                      <LocalEvidence key={media.id} media={media} />
                      {(record.field?.media.length ?? 0) > 1 && <div className="river-media-selector" aria-label="Retained media selection">{record.field?.media.map((m, i) => <button type="button" key={m.id} aria-pressed={media.id === m.id} onClick={() => setMediaId(m.id)}>{m.kind === "photo" ? <Camera size={14} /> : <Play size={14} />}{i + 1}</button>)}</div>}
                      <p className="river-media-meta">{media.width} × {media.height} · {Math.round(media.bytes / 1024)} KB · {media.kind}</p>
                      {media.quality.warnings.length > 0 && <p className="river-evidence-warning">Image heuristics: {media.quality.warnings.join("; ")}. These checks do not validate scene interpretation.</p>}
                      {media.visual && <div className="river-visual-candidates"><p className="river-section-label"><Sparkles size={13} /> AI VISUAL CANDIDATES</p>{media.visual.findings.length ? media.visual.findings.map((finding, i) => {
                        const judgment = record.field?.dispositions.filter((d) => d.mediaId === media.id && d.finding === finding.kind).at(-1);
                        return <div key={`${finding.kind}-${finding.region}-${i}`}><strong>{findingLabels[finding.kind]}</strong><span>{finding.confidence} uncalibrated confidence · {finding.region.replaceAll("_", " ")}</span><span>Human judgment: {judgment?.decision || "pending"}</span></div>;
                      }) : <p>No candidate findings returned. This does not establish absence of a condition.</p>}<p>Model: {media.visual.model}. Visual suggestions require verification; review the full evidence record for reasons and limitations.</p></div>}
                    </>
                  ) : <div className="river-no-media"><Camera size={26} /><h4>No media retained</h4><p>This record contains a citizen note. A repeat photo can help a reviewer inspect visible details.</p></div>}
                  {(record.field?.measurements.length ?? 0) > 0 && <div className="river-readings"><p className="river-section-label">CITIZEN INSTRUMENT READINGS</p>{record.field?.measurements.map((m, i) => <div key={i}><strong>{m.parameter} <span>{m.value} {m.unit}</span></strong><p>{m.instrument || "Instrument unknown"} · calibration {m.calibration}</p></div>)}<p>Transcribed by the citizen; not independently validated.</p></div>}
                </Tabs.Content>
                <Tabs.Content value="method" className="river-tab-content">
                  <div className="river-provenance-list">
                    <div><Fingerprint size={18} /><p><strong>Original + confirmation retained</strong><span>Local citizen confirmation: {observedTime(record.confirmedAt)}. Authorship and approval are not scientific validation.</span></p></div>
                    <div>{record.assessment.mode === "ai" ? <Sparkles size={18} /> : <Check size={18} />}<p><strong>{record.assessment.mode === "ai" ? "AI-assisted text assessment" : "Rule-based text assessment"}</strong><span>{record.assessment.notice}</span>{record.assessment.model && <span>Model: {record.assessment.model}</span>}</p></div>
                    <div><MapPin size={18} /><p><strong>{record.field?.coordinates ? "Coordinates retained" : "No coordinates supplied"}</strong><span>{record.field?.coordinates ? `${record.field.coordinates.lat.toFixed(5)}, ${record.field.coordinates.lon.toFixed(5)} · ${record.field.coordinates.method}` : "This view includes records without a map location."}</span></p></div>
                    <div><ShieldCheck size={18} /><p><strong>{workflowLabel(record.status)}</strong><span>Local demo reviewer role; identity is not authenticated. Review decisions and AI disagreements are retained in the full record.</span></p></div>
                  </div>
                  <details className="river-quality-method"><summary>How completeness is calculated</summary><ul>{quality.checks.map((check) => <li key={check.label}><span>{check.label}</span><b>{check.earned}/{check.max}</b></li>)}</ul><p>Method: {quality.method}. {quality.limitation}</p></details>
                  <p className="river-local-note">Evidence stays in this browser. The river graphic represents no measured flow, topology, sensor feed or environmental forecast.</p>
                </Tabs.Content>
              </Tabs.Root>
              <div className="river-story-actions">
                <button type="button" className="river-action-primary" onClick={() => onOpen(record.id)}>Open full evidence <ArrowRight size={16} /></button>
                <button type="button" className="river-action-secondary" onClick={() => onMission(record)}><Target size={16} /> Start a follow-up</button>
              </div>
            </>
          ) : <div className="river-empty-story"><Layers size={27} /><h3>Evidence, connected.</h3><p>Confirmed observations will appear here. Select a site to inspect its original note, retained media, review status and evidence gaps.</p></div>}
        </aside>
      </div>
      {site && record && <section className="river-time-section" aria-labelledby={`${id}-timeline`}>
        <div className="river-time-heading"><div><p className="river-kicker">THE RECORD OVER TIME</p><h3 id={`${id}-timeline`}>Revisit {site.label}</h3><p>Observation dates · newest first · select a record to inspect its evidence.</p></div><div className="river-time-controls"><button type="button" disabled={index >= site.records.length - 1} onClick={() => selectRecord(site.records[index + 1].id)} aria-label="Select older observation"><ChevronLeft size={19} /></button><button type="button" disabled={index <= 0} onClick={() => selectRecord(site.records[index - 1].id)} aria-label="Select newer observation"><ChevronRight size={19} /></button></div></div>
        <div className="river-time-track" aria-label={`Observations at ${site.label}`}>{site.records.map((r) => <button type="button" key={r.id} className={r.id === record.id ? "river-time-selected" : ""} aria-pressed={r.id === record.id} onClick={() => selectRecord(r.id)}><span className="river-time-dot" /><small>{observedTime(r.original.observedAt)}</small><strong>{r.original.note || "No original note"}</strong><span>{r.original.synthetic || r.field?.media.some((m) => m.origin === "illustration") ? "Synthetic / demo" : "Citizen record"} · {workflowLabel(r.status)}</span></button>)}</div>
      </section>}
    </section>
  );
}
