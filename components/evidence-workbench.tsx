"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
} from "@xyflow/react";
import {
  Download,
  Fingerprint,
  ShieldCheck,
  ScanLine,
  MapPin,
  ArrowRight,
  Target,
  GitBranch,
  Waves,
  Expand,
  Minimize2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PhotoInspector } from "./photo-inspector";
import { ReferenceCredit } from "./reference-gallery";
import { OneHealthSummary } from "./field-guide";
import { RiverObservatory } from "./river-observatory";
import { GeographicEvidenceMap } from "./geographic-evidence-map";
import { evidenceTrail } from "@/lib/evidence-trail";
import { recordedProviderLabel } from "@/lib/ai-metadata";
import { atlasPhotos, collectionCoverage, comparablePH, hasComparablePH, comparisonPair, filterAtlasRecords, isSyntheticRecord, siteFilterValue } from "@/lib/atlas";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { Report } from "@/lib/assessment";
import {
  decisionReceipt,
  downloadFile,
  exportCSV,
  exportGeoJSON,
  findingLabels,
  measurementWarnings,
  observationQuality,
  recordVisualJudgment,
  type FieldEvidence,
  type MediaEvidence,
} from "@/lib/field";
import { EvidenceImage } from "./field-studio";
import { readMedia } from "@/lib/media-store";
import "@xyflow/react/dist/style.css";
import "maplibre-gl/dist/maplibre-gl.css";

export function QualityScore({
  report,
}: {
  report: Pick<Report, "original" | "assessment"> & { field?: FieldEvidence };
}) {
  const quality = observationQuality(report);
  return (
    <section className="quality-panel">
      <div
        className="quality-ring"
        style={{ "--quality": `${quality.value}%` } as React.CSSProperties}
      >
        <span>
          {quality.value}
          <small>/ 100</small>
        </span>
      </div>
      <div>
        <p className="eyebrow">EVIDENCE COMPLETENESS</p>
        <h3>How complete is the evidence?</h3>
        <p>{quality.limitation}</p>
        <details>
          <summary>Inspect every point</summary>
          {quality.checks.map((c) => (
            <div className="score-row" key={c.label}>
              <span>{c.label}</span>
              <b>
                {c.earned}/{c.max}
              </b>
            </div>
          ))}
          <small>
            Prototype rubric {quality.method}. No ecological or expert
            validation. Optional media/location can improve completeness; never
            take risks to increase it.
          </small>
        </details>
      </div>
    </section>
  );
}

export function EvidenceGraph({ report }: { report: Report }) {
  const [selection, setSelection] = useState<{ reportId: string; nodeId: string } | null>(null);
  const data = useMemo(() => {
    const trail = evidenceTrail(report);
    const nodes: Node[] = trail.nodes.map((n) => ({
      id: n.id, position: { x: n.x, y: n.y },
      data: { label: n.label, detail: n.detail, source: n.source },
          className: `trail-node nopan trail-${n.source}`,
      ariaLabel: `${n.label}. Press Enter to inspect.`,
      selected: selection?.reportId === report.id && selection.nodeId === n.id,
    }));
    const edges: Edge[] = trail.edges;
    return { nodes, edges };
  }, [report, selection]);
  const selectedNode = selection?.reportId === report.id ? data.nodes.find((n) => n.id === selection.nodeId) : undefined;
  const inspect = (nodeId: string) => setSelection({ reportId: report.id, nodeId });
  return (
    <section className="graph-section">
      <div className="section-heading">
        <h3>
          <GitBranch size={18} /> Follow the evidence
        </h3>
        <span className="tag">Interactive provenance graph</span>
      </div>
      <div className="trail-legend" aria-label="Graph sources">
        <span className="trail-citizen">Citizen evidence</span><span className="trail-reference">Public photo source</span><span className="trail-rules">Local rules</span><span className="trail-ai">AI candidates</span><span className="trail-human">Human decisions</span><span className="trail-pending">Pending</span>
      </div>
      <div className="evidence-graph">
        <ReactFlow
          key={report.id}
          nodes={data.nodes}
          edges={data.edges}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          onNodeClick={(_, node) => inspect(node.id)}
          onNodesChange={(changes) => { const change = changes.find((c) => c.type === "select" && c.selected); if (change?.type === "select") inspect(change.id); }}
          deleteKeyCode={null}
          edgesFocusable={false}
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.15}
          maxZoom={1.5}
        >
          <Background color="#aac4bf" gap={22} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <div className="graph-detail" aria-live="polite"><b>{selectedNode ? String(selectedNode.data.label) : "Select a node to inspect its source."}</b><p>{selectedNode ? String(selectedNode.data.detail) : "Connections show retained evidence and workflow relationships. They do not establish causation or scientific truth."}</p></div>
      <details className="trail-readable"><summary>Read the evidence trail as a list</summary><div>{data.nodes.map((n) => <button className={`trail-list-item trail-${n.data.source}`} key={n.id} aria-pressed={selectedNode?.id === n.id} onClick={() => inspect(n.id)}>{String(n.data.label)}</button>)}</div></details>
    </section>
  );
}

function FindingDecision({
  media,
  finding,
  report,
  onUpdate,
}: {
  media: MediaEvidence;
  finding: NonNullable<MediaEvidence["visual"]>["findings"][number];
  report: Report;
  onUpdate: (r: Report) => void;
}) {
  const [decision, setDecision] = useState<
      "supports" | "disagrees" | "uncertain"
    >("uncertain"),
    [reason, setReason] = useState(""),
    [error, setError] = useState("");
  const previous =
    report.field?.dispositions.filter(
      (d) => d.mediaId === media.id && d.finding === finding.kind,
    ) ?? [];
  return (
    <div className="finding-decision">
      <span className="tag amber">AI candidate · requires verification</span>
      <h4>{findingLabels[finding.kind]}</h4>
      <p>
        Region: {finding.region.replaceAll("_", " ")} · model confidence:{" "}
        {finding.confidence}, uncalibrated.
      </p>
      {previous.map((d, i) => (
        <blockquote key={i}>
          <b>
            Human {d.decision} · {d.at}
          </b>
          <p>{d.reason}</p>
        </blockquote>
      ))}
      <div className="form-grid">
        <div>
          <label id={`decision-${media.id}-${finding.kind}`}>
            Reviewer judgment
          </label>
          <Select
            value={decision}
            onValueChange={(v) => setDecision(v as typeof decision)}
          >
            <SelectTrigger
              aria-labelledby={`decision-${media.id}-${finding.kind}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="supports">
                Supports visual description
              </SelectItem>
              <SelectItem value="disagrees">Disagrees with AI</SelectItem>
              <SelectItem value="uncertain">Still uncertain</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label>
          Reason
          <input
            maxLength={1000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What visible evidence supports your judgment?"
          />
        </label>
      </div>
      <button
        className="btn secondary"
        disabled={!reason.trim()}
        onClick={() => {
          try {
            onUpdate(recordVisualJudgment(report, { mediaId: media.id, finding: finding.kind, decision, reason }));
            setReason("");
            setError("");
          } catch (e) { setError((e as Error).message); }
        }}
      >
        Record human judgment
      </button>
      {error && <p role="alert">{error}</p>}
      <small>
        Original AI suggestion remains visible. A disagreement does not silently
        replace either source. A new judgment reopens the record for review.
      </small>
    </div>
  );
}

export function EvidenceReceipt({
  report,
  onUpdate,
}: {
  report: Report;
  onUpdate: (r: Report) => void;
}) {
  const [transparent, setTransparent] = useState(true),
    [message, setMessage] = useState("");
  async function original(media: MediaEvidence) {
    try {
      const blob = await readMedia(media.id);
      if (!blob) throw new Error();
      downloadFile(
        blob,
        `aqualens-${media.id}.${media.kind === "video" ? (media.mime.includes("mp4") ? "mp4" : "webm") : media.mime.includes("png") ? "png" : media.mime.includes("webp") ? "webp" : "jpg"}`,
      );
    } catch {
      setMessage(
        "Original bytes are unavailable in this browser. The digest is retained.",
      );
    }
  }
  return (
    <div className="receipt-extension">
      {report.field?.reference && <ReferenceCredit reference={report.field.reference} />}
      <QualityScore report={report} />
      {report.field?.followupOf && <p className="micro-copy">Follow-up source record: {report.field.followupOf}. The original report remains separate.</p>}
      <div className="transparency-toggle">
        <label htmlFor="ai-transparency">
          <ScanLine size={17} /> AI Transparency Mode
        </label>
        <Switch
          id="ai-transparency"
          checked={transparent}
          onCheckedChange={setTransparent}
        />
      </div>
      {transparent && (
        <div className="transparency-card">
          <p>
            <b>Method:</b>{" "}
            {report.assessment.mode === "ai"
              ? `Local English rules + ${recordedProviderLabel(report.assessment.provider)} · ${report.assessment.model || "Model not retained"}`
              : "Local English heuristics"}
            . Visual outputs use only enumerated candidate findings.
          </p>
          <p>
            <b>Confidence:</b> Visual AI confidence is its own uncalibrated
            assessment. Text checks have no probability score.
          </p>
          <p>
            <b>Limitations:</b> Lighting, framing, reflections and model errors
            can mislead. Neither an image nor a review establishes
            contamination, species, causes or safety.
          </p>
          <p>
            <b>Human status:</b> {report.status.replaceAll("_", " ")}. Reviewer
            identity is a local demo role.
          </p>
        </div>
      )}
      {report.field?.media.map((m) => (
        <section className="receipt-media" key={m.id}>
          {m.kind === "photo" ? <PhotoInspector key={m.id} frame={{ key: `${report.id}:${m.id}`, title: report.original.site, date: report.original.observedAt, width: m.width > 0 ? m.width : 4, height: m.height > 0 ? m.height : 3, media: m, report }} /> : <EvidenceImage media={m} />}
          <div className="button-row">
            <span className="tag">
              {m.origin} · {m.kind}
            </span>
            <button className="plain-btn" onClick={() => original(m)}>
              <Download size={14} /> {m.origin === "public_reference" ? "Download retained source image" : "Download original"}
            </button>
          </div>
          {transparent && (
            <>
              <p className="hash">
                <Fingerprint size={14} /> SHA-256: {m.sha256}
              </p>
              <p className="micro-copy">
                Local image heuristic:{" "}
                {m.quality.warnings.join("; ") || "no warning matched"}. A video
                check samples its first frame.
              </p>
              {m.visual && (
                <p className="micro-copy">
                  {m.visual.recorded ? "Recorded visual method" : "Visual method"}: {recordedProviderLabel(m.visual.provider)} · {m.visual.model} · {m.visual.at}. Candidate
                  regions refer to image layout, not geographic positions.
                </p>
              )}
            </>
          )}
          {m.visual?.findings.map((f) => (
            <FindingDecision
              key={f.kind}
              finding={f}
              media={m}
              report={report}
              onUpdate={onUpdate}
            />
          ))}
        </section>
      ))}
      {!!report.field?.measurements.length && (
        <section>
          <h3>Instrument evidence</h3>
          {report.field.measurements.map((m, i) => (
            <div className="measurement-row" key={i}>
              <b>
                {m.parameter}: {m.value} {m.unit}
              </b>
              <span>
                Citizen reported · {m.instrument || "instrument unknown"} ·
                calibration {m.calibration}
              </span>
              {measurementWarnings(m).map((w) => (
                <small key={w}>{w}</small>
              ))}
            </div>
          ))}
        </section>
      )}
      {!!report.field?.followups.length && (
        <section>
          <h3>Adaptive follow-up</h3>
          {report.field.followups.map((a) => (
            <blockquote key={a.question}>
              <b>{a.question}</b>
              <p>Citizen: {a.answer || "Unanswered"}</p>
            </blockquote>
          ))}
        </section>
      )}
      <OneHealthSummary field={report.field} />
      <EvidenceGraph report={report} />
      <div className="decision-receipt">
        <ShieldCheck size={27} />
        <h3>Your Decision Receipt</h3>
        <p>
          Original evidence, AI candidates, human disagreements, completeness
          rubric and reuse metadata — together in one portable record.
        </p>
        <button
          className="btn primary"
          onClick={() =>
            downloadFile(
              JSON.stringify(decisionReceipt(report), null, 2),
              `aqualens-receipt-${report.id}.json`,
            )
          }
        >
          <Download size={16} /> Download Decision Receipt
        </button>
        <p className="micro-copy">
          FAIR-oriented metadata, not FAIR certification. Download media
          separately. This local receipt is not signed or tamper-proof.
        </p>
      </div>
      {message && <p role="alert">{message}</p>}
    </div>
  );
}

export function StreamAtlas({
  reports,
  onOpen,
  onMission,
}: {
  reports: Report[];
  onOpen: (id: string) => void;
  onMission: (source: Report) => void;
}) {
  const [selected, setSelected] = useState("all"),
    [slider, setSlider] = useState(50),
    [pair, setPair] = useState<string[]>([]);
  const [view, setView] = useState("observatory");
  const [presenting, setPresenting] = useState(false);
  const sites = useMemo(() => [...new Set(reports.map((r) => r.original.site))], [reports]);
  const activeFilter = selected === "all" || sites.some((s) => siteFilterValue(s) === selected) ? selected : "all";
  const shown = useMemo(() => filterAtlasRecords(reports, activeFilter, false), [reports, activeFilter]);
  const photos = useMemo(() => atlasPhotos(shown), [shown]);
  const { before, after } = comparisonPair(photos, pair);
  const coverage = collectionCoverage(shown);
  useEffect(() => {
    if (!presenting) return;
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") setPresenting(false); };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [presenting]);
  const comparable = comparablePH(shown, activeFilter);
  const sameInstrument = hasComparablePH(comparable);
  return (
    <div className={`atlas-view${presenting ? " is-presenting" : ""}`}>
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE RIVER OBSERVATORY / TRACK 3</p>
          <h1>See the stream. Trace the evidence.</h1>
          <p className="subtext">
            One visual workspace for your stream sites, observations and human decisions.
          </p>
        </div>
        <button className="btn secondary" aria-pressed={presenting} onClick={() => setPresenting((p) => !p)}>
          {presenting ? <Minimize2 size={16} /> : <Expand size={16} />}
          {presenting ? "Exit focus view" : "Focus view"}
        </button>
      </div>
      <Tabs value={view} onValueChange={setView} className="atlas-explorer">
      <div className="atlas-commandbar">
        <TabsList aria-label="River visualization" className="atlas-view-tabs">
          <TabsTrigger value="observatory"><Waves size={16} /> River stories</TabsTrigger>
          <TabsTrigger value="map"><MapPin size={16} /> Geographic map</TabsTrigger>
        </TabsList>
        <span className="tag">Citizen evidence only</span>
      </div>
      <div className="atlas-toolbar">
        <Select value={activeFilter} onValueChange={(v) => { setSelected(v); setPair([]); }}>
          <SelectTrigger aria-label="Filter observations by site"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All observation sites</SelectItem>
            {sites.map((s) => <SelectItem value={siteFilterValue(s)} key={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="atlas-record-count">{shown.length} citizen records</span>
        <button className="btn secondary" onClick={() => downloadFile(JSON.stringify({ format: "aqualens-observation-collection", version: "1.0", records: shown.map(decisionReceipt) }, null, 2), "aqualens-receipts.json", "application/json")}><Download size={15} /> JSON receipts</button>
        <button className="btn secondary" onClick={() => downloadFile(exportCSV(shown), "aqualens-observations.csv", "text/csv")}>CSV</button>
        <button className="btn secondary" onClick={() => downloadFile(JSON.stringify(exportGeoJSON(shown), null, 2), "aqualens-observations.geojson", "application/geo+json")}>GeoJSON</button>
      </div>
      <TabsContent value="observatory"><RiverObservatory records={shown} onOpen={onOpen} onMission={onMission} /></TabsContent>
      <TabsContent value="map"><GeographicEvidenceMap records={shown} onOpen={onOpen} /></TabsContent>
      </Tabs>
      <section className="atlas-coverage" aria-label="Evidence coverage in this view">
        <div className="atlas-coverage-title"><p className="eyebrow">EVIDENCE COVERAGE</p><h2>What is here. What is missing.</h2></div>
        <div className="atlas-coverage-grid">{coverage.map((c) => <div key={c.key} className="atlas-coverage-item"><div><strong>{c.count}<small> / {shown.length}</small></strong><span>{c.label}</span></div><div className="atlas-coverage-track" aria-hidden="true"><span style={{ width: `${shown.length ? 100 * c.count / shown.length : 0}%` }} /></div><p>{c.detail}</p></div>)}</div>
        <p className="micro-copy">Coverage and workflow only; no water-health inference. Media counts refer to retained metadata, not verified availability of files.</p>
      </section>
      <details className="atlas-details">
      <summary>Explore the timeline, follow-up missions and photo comparison <ArrowRight size={17} /></summary>
      <div className="atlas-details-body">
      <div className="atlas-columns">
        <section className="panel">
          <p className="eyebrow">01 / OBSERVATION TIMELINE</p>
          <h2>A record over time.</h2>
          <div className="atlas-timeline">
            {shown.map((r) => (
              <button key={r.id} onClick={() => onOpen(r.id)}>
                <span className="timeline-dot" />
                <small>
                  {new Date(r.original.observedAt).toLocaleString("en-GB", {
                    timeZone: "UTC",
                  })}{" "}
                  UTC
                </small>
                <h3>{r.original.site}</h3>
                <p>{r.original.note}</p>
                <div>
                  <span className="tag">
                    {isSyntheticRecord(r) ? "Synthetic" : "Citizen"}
                  </span>
                  <span className="tag">{r.status.replaceAll("_", " ")}</span>
                </div>
              </button>
            ))}
          </div>
          {!shown.length && (
            <p>
              No observations yet. Capture a field note to start a timeline.
            </p>
          )}
        </section>
        <aside>
          <section className="panel sampling-missions">
            <p className="eyebrow">02 / NEXT BEST OBSERVATION</p>
            <h2>Return with a purpose.</h2>
            <p>
              Rule-based missions from missing evidence. No invented urgency or
              ecological forecast.
            </p>
            {shown
              .slice(-3)
              .reverse()
              .map((r) => (
                <div className="mission" key={r.id}>
                  <Target size={20} />
                  <div>
                    <h3>{r.original.site}</h3>
                    <p>
                      {!r.field?.media.length
                        ? "Add a repeat photo from a safe, accessible position."
                        : !r.field.coordinates
                          ? "Record a location for the retained evidence."
                          : r.status === "needs_information"
                            ? "Address the reviewer's request for more information."
                            : "Repeat the observation at a comparable time and viewpoint."}
                    </p>
                    <button
                      className="plain-btn"
                      onClick={() => onMission(r)}
                    >
                      Start follow-up <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
          </section>
          <section className="panel">
            <p className="eyebrow">03 / COMPARABLE MEASUREMENTS</p>
            <h3>pH over time</h3>
            {sameInstrument ? (
              <>
                <div className="trend-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={comparable}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={(v) => new Date(v).toLocaleDateString("en-GB", { timeZone: "UTC" })} />
                      <YAxis domain={[0, 14]} />
                      <Tooltip labelFormatter={(v) => `${new Date(Number(v)).toLocaleString("en-GB", { timeZone: "UTC" })} UTC`} />
                      <Area dataKey="value" stroke="#168d89" fill="#168d8940" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="micro-copy">
                  {comparable.length} citizen readings, same site and named
                  instrument, calibration reported checked. Temporal comparison
                  only; no significance or health inference.
                </p>
              </>
            ) : (
              <p>
                Select one site with at least three non-synthetic pH readings
                from the same named instrument with calibration checked.
                Insufficient comparable evidence; no trend estimated.
              </p>
            )}
          </section>
        </aside>
      </div>
      <section className="panel comparison-panel">
        <p className="eyebrow">04 / REPEAT-PHOTO COMPARISON</p>
        <h2>Look again. Keep context.</h2>
        {photos.length >= 2 && before && after ? (
          <>
            <div className="form-grid">
              {[0, 1].map((side) => (
                <Select
                  key={side}
                  value={side === 0 ? before.media.id : after.media.id}
                  onValueChange={(v) =>
                    setPair(
                      side === 0 ? [v, after.media.id] : [before.media.id, v],
                    )
                  }
                >
                  <SelectTrigger
                    aria-label={
                      side === 0
                        ? "Comparison image A"
                        : "Comparison image B"
                    }
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {photos.map((p) => (
                      <SelectItem key={p.media.id} value={p.media.id} disabled={p.media.id === (side === 0 ? after.media.id : before.media.id)}>
                        {p.report.original.site} ·{" "}
                        {p.report.original.observedAt} ·{" "}
                        {p.media.id.slice(0, 5)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
            </div>
            <div className="photo-comparison">
              <EvidenceImage media={after.media} />
              <div
                className="comparison-before"
                style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}
              >
                <EvidenceImage media={before.media} />
              </div>
              <span
                className="comparison-line"
                style={{ left: `${slider}%` }}
              />
              <span className="compare-label">IMAGE A</span>
              <span className="compare-label right">IMAGE B</span>
            </div>
            <label id="compare-slider">Comparison divider · {slider}%</label>
            <Slider
              aria-labelledby="compare-slider"
              value={[slider]}
              onValueChange={(v) => setSlider(v[0])}
            />
            <p>
              Images are fitted to the same frame, not scientifically
              registered. Different lighting, viewpoint, dates or sites can
              explain apparent differences.{" "}
              {isSyntheticRecord(before.report) ||
              isSyntheticRecord(after.report)
                ? "Synthetic imagery is included."
                : "Citizen imagery is unverified."}
            </p>
          </>
        ) : (
          <p>
            Retain at least two photos to compare them. No artificial
            before/after imagery is generated.
          </p>
        )}
      </section>
      </div>
      </details>
      <p className="micro-copy atlas-scope-note">Browser-local observation collection · supplied evidence and demo review decisions. No stream sensors, ecological classification or physical simulation.</p>
    </div>
  );
}
