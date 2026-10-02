"use client";
/* Direct files keep photo pixels separate from non-destructive inspection overlays. */
/* eslint-disable @next/next/no-img-element */
import { useId, useState, type CSSProperties, type MouseEvent } from "react";
import { Crosshair, Grid2X2, Layers, MapPin, Minus, Plus, RotateCcw, X } from "lucide-react";
import { EvidenceImage } from "./field-studio";
import { imagePoint, type EvidenceFrame, type ImageDimensions } from "@/lib/mission-control";
import { findingLabels, type PhotoAnnotationInput } from "@/lib/field";
import type { EuropeanBundle } from "@/lib/european-sites";
import { displayEvidenceTime } from "@/lib/references";

export function FrameImage({ frame, onAvailability, onDimensions }: { frame: EvidenceFrame; onAvailability?: (available: boolean) => void; onDimensions?: (dimensions: ImageDimensions | null) => void }) {
  return frame.media ? <EvidenceImage media={frame.media} className="pi-photo" onAvailability={onAvailability} onDimensions={onDimensions} />
    : frame.reference ? <img className="pi-photo" src={frame.reference.src} width={frame.width} height={frame.height} alt={frame.reference.alt} onLoad={(event) => { onDimensions?.({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight }); onAvailability?.(true); }} onError={() => { onDimensions?.(null); onAvailability?.(false); }} /> : null;
}
const regions: Record<string, [number, number, number, number]> = { whole_frame: [2, 2, 96, 96], upper: [2, 2, 96, 46], lower: [2, 52, 96, 46], left: [2, 2, 46, 96], right: [52, 2, 46, 96], center: [27, 27, 46, 46] };
const noteLabels = { detail: "Visible detail", uncertain: "Uncertain detail", followup: "Follow-up question" };

export function PhotoInspector({ frame, onAnnotate, recordedVisual }: { frame: EvidenceFrame; onAnnotate?: (input: PhotoAnnotationInput) => void; recordedVisual?: EuropeanBundle["analyses"][number] }) {
  const id = useId();
  const [zoom, setZoom] = useState(1), [grid, setGrid] = useState(false), [pins, setPins] = useState(true), [ai, setAI] = useState(false);
  const [ready, setReady] = useState(false), [placing, setPlacing] = useState(false), [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [category, setCategory] = useState<PhotoAnnotationInput["category"]>("detail"), [note, setNote] = useState(""), [error, setError] = useState("");
  const [selected, setSelected] = useState("");
  const annotations = frame.report?.field?.annotations?.filter((annotation) => annotation.mediaId === frame.media?.id) ?? [];
  const selectedNote = annotations.find((annotation) => annotation.id === selected);
  const sourceAnalysis = !frame.report && recordedVisual?.recorded && recordedVisual.photoId === frame.reference?.id && recordedVisual.sha256 === frame.reference?.sha256 ? recordedVisual : undefined;
  const findings = frame.media?.visual?.findings ?? sourceAnalysis?.findings ?? [];
  const imageReady = ready && !!dimensions && dimensions.width > 0 && dimensions.height > 0;
  function place(event: MouseEvent<HTMLDivElement>) {
    if (!placing || !imageReady || !dimensions) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const position = imagePoint(rect, dimensions, event.clientX, event.clientY);
    if (!position) return;
    setPoint(position);
    setPlacing(false); setSelected(""); setError("");
  }
  function save() {
    if (!point || !imageReady || !frame.media || !onAnnotate) return;
    try { onAnnotate({ ...point, mediaId: frame.media.id, category, note }); setPoint(null); setNote(""); setError(""); setPins(true); }
    catch (error) { setError(error instanceof Error ? error.message : "This note could not be saved."); }
  }
  return <section className="photo-inspector" aria-label="Photograph inspection tools">
    <div className="pi-tools"><div className="pi-tool-group"><button type="button" aria-label="Zoom out" disabled={zoom <= 1} onClick={() => setZoom((value) => Math.max(1, value - .25))}><Minus size={15} /></button><output aria-label="Image zoom">{Math.round(zoom * 100)}%</output><button type="button" aria-label="Zoom in" disabled={zoom >= 2.5} onClick={() => setZoom((value) => Math.min(2.5, value + .25))}><Plus size={15} /></button><button type="button" aria-label="Reset zoom" onClick={() => setZoom(1)}><RotateCcw size={14} /></button></div>
      <div className="pi-tool-group"><button type="button" aria-pressed={grid} onClick={() => setGrid(!grid)}><Grid2X2 size={14} /><span>Grid</span></button><button type="button" aria-pressed={pins} onClick={() => setPins(!pins)}><MapPin size={14} /><span>Notes {annotations.length}</span></button><button type="button" aria-pressed={ai} disabled={!findings.length} title={findings.length ? "Show the model’s coarse frame regions" : "No visual AI candidates are recorded"} onClick={() => setAI(!ai)}><Layers size={14} /><span>{sourceAnalysis ? "Recorded regions" : "AI regions"} {findings.length}</span></button></div>
    </div>
    {sourceAnalysis && <p className="eu-footnote">Recorded {sourceAnalysis.model} analysis · {displayEvidenceTime(sourceAnalysis.at)} · coarse candidate regions, human review not performed.</p>}
    <div className={`pi-stage${placing ? " pi-placing" : ""}`}>
      <div className="pi-image-plane" style={{ "--frame-ratio": imageReady ? dimensions.width / dimensions.height : frame.width / frame.height, "--frame-zoom": zoom } as CSSProperties} onClick={place}>
        <FrameImage frame={frame} onAvailability={setReady} onDimensions={setDimensions} />
        {imageReady && grid && <div className="pi-grid" aria-hidden="true" />}
        {imageReady && ai && findings.length > 0 && <svg className="pi-regions" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Coarse AI candidate regions, not object detection boxes">{findings.map((finding, index) => { const [x, y, width, height] = regions[finding.region]; return <rect key={`${finding.kind}-${index}`} x={x} y={y} width={width} height={height} rx={.5}><title>{findingLabels[finding.kind]} · {finding.region.replaceAll("_", " ")} · unverified candidate</title></rect>; })}</svg>}
        {imageReady && pins && annotations.map((annotation, index) => <button type="button" key={annotation.id} className={`pi-pin pi-${annotation.category}${selected === annotation.id ? " selected" : ""}`} style={{ left: `${annotation.x * 100}%`, top: `${annotation.y * 100}%` }} aria-label={`Visual note ${index + 1}: ${annotation.note}`} aria-pressed={selected === annotation.id} onClick={(event) => { event.stopPropagation(); setSelected(annotation.id); setPoint(null); }}>{index + 1}</button>)}
        {imageReady && point && <span className="pi-draft-pin" style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}><Crosshair size={23} /></span>}
      </div>
      <span className="pi-frame-corner top-left" aria-hidden="true" /><span className="pi-frame-corner bottom-right" aria-hidden="true" />
      {imageReady && placing && <div className="pi-placement-hint" role="status">Click a visible detail, or <button type="button" onClick={() => { setPoint({ x: .5, y: .5 }); setPlacing(false); }}>place at center</button><button type="button" onClick={() => setPlacing(false)} aria-label="Cancel placing note"><X size={15} /></button></div>}
    </div>
    <div className="pi-caption"><span><span className="mc-status-dot" />{frame.report ? "RETAINED PHOTO" : "PUBLIC REFERENCE"}</span><span>{imageReady ? `${dimensions.width} × ${dimensions.height} image pixels` : "Waiting for image dimensions"} · {zoom === 1 ? "Full frame" : "Zoomed view"}</span>{onAnnotate && <button type="button" className="mc-text-button" disabled={!imageReady} onClick={() => { setZoom(1); setPlacing(true); setPoint(null); setSelected(""); }}><Plus size={14} /> Add visual note</button>}</div>
    {ai && findings.length > 0 && <div className="pi-ai-key"><b>AI candidates · coarse regions</b>{findings.map((finding, index) => <span key={index}>{findingLabels[finding.kind]} · {finding.region.replaceAll("_", " ")} · {finding.confidence} uncalibrated confidence</span>)}<small>Frame regions supplied by the model. These are not detected object boundaries or verified findings.</small></div>}
    {selectedNote && <div className={`pi-note-detail pi-${selectedNote.category}`}><div><b>{noteLabels[selectedNote.category]}</b><button type="button" aria-label="Close visual note" onClick={() => setSelected("")}><X size={15} /></button></div><p>{selectedNote.note}</p><small>Local human note · {displayEvidenceTime(selectedNote.at)}</small></div>}
    {point && <form className="pi-note-form" onSubmit={(event) => { event.preventDefault(); save(); }}><div><label htmlFor={`${id}-category`}>Visual note type</label><select id={`${id}-category`} value={category} onChange={(event) => setCategory(event.target.value as PhotoAnnotationInput["category"])}>{Object.entries(noteLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><label htmlFor={`${id}-note`}>Describe this detail in your own words</label><textarea id={`${id}-note`} required maxLength={500} rows={2} value={note} onChange={(event) => setNote(event.target.value)} placeholder="What can you see here? What remains uncertain?" /><p>Image position {Math.round(point.x * 100)}%, {Math.round(point.y * 100)}%. Saving a human note reopens this record for review. Original pixels stay unchanged.</p>{error && <p role="alert">{error}</p>}<div className="button-row"><button className="mc-button accent" type="submit" disabled={!imageReady || !note.trim()}>Save visual note</button><button className="mc-button" type="button" onClick={() => { setPoint(null); setNote(""); }}>Cancel</button></div></form>}
    {annotations.length > 0 && <details className="pi-note-list"><summary>{annotations.length} human visual note{annotations.length === 1 ? "" : "s"} · inspect as a list</summary>{annotations.map((annotation, index) => <button type="button" key={annotation.id} onClick={() => { setSelected(annotation.id); setPins(true); }}><b>{index + 1} · {noteLabels[annotation.category]}</b><span>{annotation.note}</span></button>)}</details>}
  </section>;
}
