"use client";
import { useEffect, useMemo, useRef, useState } from "react";
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
} from "lucide-react";
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
        <p className="eyebrow">OBSERVATION QUALITY</p>
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
  const [detail, setDetail] = useState("Select a node to inspect its source.");
  const data = useMemo(() => {
    const nodes: Node[] = [
      {
        id: "original",
        position: { x: 15, y: 130 },
        data: { label: "01 · Citizen original", detail: report.original.note },
        style: { background: "#e4f5ec", borderColor: "#3f7a62" },
      },
      {
        id: "review",
        position: { x: 560, y: 130 },
        data: {
          label: "04 · Human review",
          detail:
            report.reviewHistory.at(-1)?.note ||
            "Awaiting a human review. AI cannot approve this record.",
        },
      },
    ];
    const edges: Edge[] = [];
    if (report.field?.followupOf) {
      nodes.push({ id: "predecessor", position: { x: -235, y: 130 }, data: {
        label: "Previous observation", detail: `Follow-up source: ${report.field.followupOf}. A relationship, not proof that conditions are comparable.`,
      } });
      edges.push({ id: "followup-source", source: "predecessor", target: "original" });
    }
    const facts = [
      ...report.assessment.issues.map((i) => ({
        id: i.id,
        label: `${i.source === "ai" ? "AI" : "Rule"} · ${i.code.replaceAll("_", " ")}`,
        detail: `${i.quote}\n${i.detail}\nCitizen: ${i.answer || i.decision}`,
      })),
      ...(report.field?.media ?? []).map((m) => ({
        id: m.id,
        label: `${m.kind} · ${m.origin}`,
        detail: `${m.sha256}\n${m.visual ? `${m.visual.model}: ${m.visual.findings.map((f) => findingLabels[f.kind]).join(", ")}` : "No visual AI output"}`,
      })),
    ];
    if (!facts.length)
      facts.push({
        id: "clarity",
        label: "02 · Checks completed",
        detail: "No rule matched; no guarantee of correctness.",
      });
    facts.forEach((f, i) => {
      nodes.push({
        id: f.id,
        position: { x: 285, y: i * 100 },
        data: { label: f.label, detail: f.detail },
      });
      edges.push(
        { id: `e-${i}`, source: "original", target: f.id },
        { id: `r-${i}`, source: f.id, target: "review" },
      );
    });
    return { nodes, edges };
  }, [report]);
  return (
    <section className="graph-section">
      <div className="section-heading">
        <h3>
          <GitBranch size={18} /> Follow the evidence
        </h3>
        <span className="tag">Interactive provenance graph</span>
      </div>
      <div className="evidence-graph">
        <ReactFlow
          nodes={data.nodes}
          edges={data.edges}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          onNodeClick={(_, node) => setDetail(String(node.data.detail))}
          minZoom={0.3}
          maxZoom={1.5}
        >
          <Background color="#aac4bf" gap={22} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <p className="graph-detail" aria-live="polite">
        {detail}
      </p>
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
              ? `Local English rules + ${report.assessment.model}`
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
          <EvidenceImage media={m} />
          <div className="button-row">
            <span className="tag">
              {m.origin} · {m.kind}
            </span>
            <button className="plain-btn" onClick={() => original(m)}>
              <Download size={14} /> Download original
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
                  Visual method: {m.visual.model} · {m.visual.at}. Candidate
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
  const container = useRef<HTMLDivElement>(null),
    [status, setStatus] = useState("Loading the basemap…"),
    [selected, setSelected] = useState("all"),
    [slider, setSlider] = useState(50),
    [pair, setPair] = useState<string[]>([]);
  const located = useMemo(
    () => reports.filter((r) => r.field?.coordinates && (selected === "all" || r.original.site === selected)),
    [reports, selected],
  );
  const sites = [...new Set(reports.map((r) => r.original.site))];
  const shown = reports
    .filter((r) => selected === "all" || r.original.site === selected)
    .sort(
      (a, b) =>
        Date.parse(a.original.observedAt) - Date.parse(b.original.observedAt),
    );
  const photos = shown.flatMap((r) =>
    (r.field?.media ?? [])
      .filter((m) => m.kind === "photo")
      .map((m) => ({ report: r, media: m })),
  );
  const before = photos.find((p) => p.media.id === pair[0]) || photos[0],
    after = photos.find((p) => p.media.id === pair[1]) || photos.at(-1);
  useEffect(() => {
    let disposed = false;
    let map: import("maplibre-gl").Map | undefined;
    import("@/lib/maplibre-client").then((lib) => {
      if (disposed || !container.current) return;
      try {
        const c = located[0]?.field?.coordinates;
        map = new lib.Map({
          container: container.current,
          style: "https://tiles.openfreemap.org/styles/liberty",
          center: c ? [c.lon, c.lat] : [-8.4103, 40.2033],
          zoom: c ? 13 : 11,
          pitch: 35,
          attributionControl: { compact: true },
        });
        map.addControl(new lib.NavigationControl(), "top-right");
        map.on("load", () => {
          if (!disposed)
            setStatus(
              located.length
                ? `${located.length} geolocated observation${located.length === 1 ? "" : "s"}`
                : "Coimbra basemap · no located observations yet",
            );
        });
        map.on("error", () => {
          if (!disposed)
            setStatus(
              "Some map data is unavailable. Use the observation list below.",
            );
        });
        const bounds = new lib.LngLatBounds();
        located.forEach((r) => {
          const p = r.field!.coordinates!;
          const button = document.createElement("button");
          button.className = `atlas-marker ${r.original.synthetic ? "synthetic-marker" : ""}`;
          button.setAttribute(
            "aria-label",
            `${r.original.site}${r.original.synthetic ? " — synthetic" : ""}`,
          );
          button.textContent = "◉";
          button.onclick = () => onOpen(r.id);
          new lib.Marker({ element: button })
            .setLngLat([p.lon, p.lat])
            .addTo(map!);
          bounds.extend([p.lon, p.lat]);
        });
        if (located.length > 1)
          map.fitBounds(bounds, { padding: 75, maxZoom: 14, duration: 0 });
      } catch {
        setStatus(
          "WebGL mapping is unavailable on this device. Observation records remain accessible below.",
        );
      }
    }).catch(() => { if (!disposed) setStatus("Map code could not load. Your observation list remains available below."); });
    return () => {
      disposed = true;
      map?.remove();
    };
  }, [located, onOpen]);
  const comparable =
    selected === "all"
      ? []
      : shown
          .filter((r) => !r.original.synthetic)
          .flatMap((r) =>
            (r.field?.measurements ?? [])
              .filter(
                (m) =>
                  m.parameter === "pH" && measurementWarnings(m).length === 0,
              )
              .slice(0, 1)
              .map((m) => ({
                observedAt: r.original.observedAt,
                time: new Date(r.original.observedAt).toLocaleDateString(
                  "en-GB",
                  { timeZone: "UTC" },
                ),
                value: m.value,
                instrument: m.instrument,
              })),
          );
  const sameInstrument =
    comparable.length >= 3 &&
    new Set(comparable.map((m) => m.observedAt)).size >= 3 &&
    new Set(comparable.map((m) => m.instrument)).size === 1;
  return (
    <div className="atlas-view">
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE LIVING FIELD NOTEBOOK</p>
          <h1>Put evidence in its place.</h1>
          <p className="subtext">
            A spatial observation atlas. Every point leads back to its source.
          </p>
        </div>
        <span className="tag">Observation map · no physical simulation</span>
      </div>
      <section className="atlas-map-panel">
        <div
          ref={container}
          className="atlas-map"
          aria-label="Interactive stream observation map"
        />
        <div className="atlas-caption">
          <MapPin size={16} />
          <span aria-live="polite">{status}</span>
          <b>{shown.length - located.length} without coordinates in this view</b>
        </div>
      </section>
      <div className="atlas-toolbar">
        <Select
          value={selected}
          onValueChange={(v) => {
            setSelected(v);
            setPair([]);
          }}
        >
          <SelectTrigger aria-label="Filter atlas by site">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All observation sites</SelectItem>
            {sites.map((s) => (
              <SelectItem value={s} key={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          className="btn secondary"
          onClick={() =>
            downloadFile(
              exportCSV(shown),
              "aqualens-observations.csv",
              "text/csv",
            )
          }
        >
          <Download size={15} /> CSV
        </button>
        <button
          className="btn secondary"
          onClick={() =>
            downloadFile(
              JSON.stringify(exportGeoJSON(shown), null, 2),
              "aqualens-observations.geojson",
              "application/geo+json",
            )
          }
        >
          GeoJSON
        </button>
      </div>
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
                    {r.original.synthetic ? "Synthetic" : "Citizen"}
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
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 14]} />
                      <Tooltip />
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
                        ? "Earlier comparison image"
                        : "Later comparison image"
                    }
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {photos.map((p) => (
                      <SelectItem key={p.media.id} value={p.media.id}>
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
              {before.report.original.synthetic ||
              after.report.original.synthetic
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
      <div className="atlas-limit">
        <ShieldCheck size={20} />
        <p>
          Community consensus requires independent, authenticated observers.
          This local prototype records individual human judgments; it does not
          invent votes or claim a community consensus. A physical digital twin
          would require verified hydrological data and calibration.
        </p>
      </div>
    </div>
  );
}
