"use client";

import { useId, useState } from "react";
import { CheckCheck, FileText, Fingerprint, Layers, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import type { Report } from "@/lib/assessment";
import { recordedProviderLabel } from "@/lib/ai-metadata";
import { labDecisionBrief, labRecordSummary } from "@/lib/evidence-lab";
import { findingLabels, measurementWarnings } from "@/lib/field";
import { displayEvidenceTime } from "@/lib/references";

type Layer = "original" | "checks" | "ai" | "confirmation" | "human";

/** Read-only presentation of retained sources. Opening a layer never assesses or approves it. */
export function ReceiptLayers({ report }: { report: Report }) {
  const [selected, setSelected] = useState<Layer>("original");
  const [expanded, setExpanded] = useState(true);
  const id = useId();
  const brief = labDecisionBrief(report), summary = labRecordSummary(report);
  const media = report.field?.media ?? [];
  const visual = media.filter((item) => item.visual);
  const rules = report.assessment.issues.filter((issue) => issue.source !== "ai");
  const textAI = report.assessment.issues.filter((issue) => issue.source === "ai");
  const readings = report.field?.measurements ?? [];
  const layers: { key: Layer; title: string; subtitle: string; icon: typeof FileText }[] = [
    { key: "human", title: "Human judgment", subtitle: brief.label, icon: ShieldCheck },
    { key: "confirmation", title: "Explicit confirmation", subtitle: brief.confirmed ? "Timestamp retained" : "Confirmation unavailable", icon: CheckCheck },
    { key: "ai", title: "Optional AI proposals", subtitle: `${summary.textAICandidates + summary.visualAICandidates} retained candidates`, icon: Sparkles },
    { key: "checks", title: "Deterministic checks", subtitle: `${rules.length} text questions · ${readings.length} readings`, icon: ScanLine },
    { key: "original", title: "Original evidence", subtitle: `${media.length} media references · original note`, icon: FileText },
  ];
  const current = layers.find((layer) => layer.key === selected)!;
  return <section className="receipt-layers" aria-label="Interactive Decision Receipt layers">
    <header className="rl-heading"><div><span className="mc-kicker">ONE RECORD / FIVE RETAINED LAYERS</span><h3>Nothing loses its source.</h3></div><button type="button" aria-pressed={expanded} onClick={() => setExpanded(!expanded)}><Layers size={15} />{expanded ? "Stack layers" : "Separate layers"}</button></header>
    <div className={`rl-scene${expanded ? " is-expanded" : ""}`}>
      <div className="rl-stack" role="group" aria-label="Choose an evidence layer">{layers.map((layer, index) => { const Icon = layer.icon; return <button type="button" key={layer.key} className={`rl-layer rl-${layer.key}`} aria-pressed={selected === layer.key} aria-controls={`${id}-detail`} onClick={() => setSelected(layer.key)}><span className="rl-number">{String(5 - index).padStart(2, "0")}</span><Icon size={19} /><span><strong>{layer.title}</strong><small>{layer.subtitle}</small></span><span className="rl-layer-dot" aria-hidden="true" /></button>; })}</div>
      <span className="rl-scene-caption">Presentation of record provenance · no scientific grade</span>
    </div>
    <div id={`${id}-detail`} className={`rl-detail rl-${selected}`} aria-live="polite"><span className="mc-kicker">INSPECT / {current.title}</span>
      {selected === "original" && <><blockquote>{report.original.note || "No original note retained."}</blockquote><dl><div><dt>Evidence time</dt><dd>{displayEvidenceTime(report.original.observedAt)}</dd></div><div><dt>Source</dt><dd>{report.field?.reference ? `${report.field.reference.author} · ${report.field.reference.license} · historical photograph` : "Citizen-supplied record"}</dd></div></dl>{media.map((item) => <div className="rl-digest" key={item.id}><Fingerprint size={14} /><code>{item.sha256 || "Digest not retained"}</code></div>)}<p className="rl-limit">Digests identify bytes. Media references do not guarantee those bytes are available in this browser or authenticate a scene.</p></>}
      {selected === "checks" && <><p>Local text rules and supplied-reading validation. Image usability checks are uncalibrated browser heuristics.</p>{rules.map((issue) => <article key={issue.id}><strong>{issue.title}</strong>{issue.quote && <blockquote>{issue.quote}</blockquote>}<p>{issue.detail}</p><small>Citizen disposition: {issue.decision}</small></article>)}{readings.map((reading, index) => <article key={index}><strong>{reading.parameter}: {reading.value} {reading.unit}</strong><p>{measurementWarnings(reading).join(" ") || "No prototype metadata warning; measurement accuracy is unverified."}</p></article>)}{!rules.length && !readings.length && <p className="rl-empty">No text rule issue or instrument reading was retained. This does not establish accuracy or water safety.</p>}<p className="rl-limit">Original entries stay intact; checks ask for context rather than replacing values.</p></>}
      {selected === "ai" && <><p>These are retained proposals. Opening this layer makes no new AI request.</p>{report.assessment.mode === "ai" && <small>{recordedProviderLabel(report.assessment.provider)} · {report.assessment.model || "Model not retained"} · recorded text assessment</small>}{textAI.map((issue) => <article key={issue.id}><strong>{issue.title}</strong>{issue.quote && <blockquote>Grounding: {issue.quote}</blockquote>}<p>{issue.detail}</p><small>Citizen disposition: {issue.decision}</small></article>)}{visual.map((item) => <article key={item.id}><small>{recordedProviderLabel(item.visual!.provider)} · {item.visual!.model} · {displayEvidenceTime(item.visual!.at)}</small>{item.visual!.findings.length ? item.visual!.findings.map((finding, index) => { const judgment = report.field?.dispositions.filter((entry) => entry.mediaId === item.id && entry.finding === finding.kind).at(-1); return <div className={`rl-proposal${judgment?.decision === "disagrees" ? " is-disagreed" : ""}`} key={`${finding.kind}-${index}`}><strong>{findingLabels[finding.kind]}</strong><span>{finding.confidence} confidence · uncalibrated · {finding.region.replaceAll("_", " ")}</span><p><ShieldCheck size={14} />{judgment ? `Human: ${judgment.decision}` : "Human judgment pending"}</p>{judgment && <blockquote>{judgment.reason}</blockquote>}</div>; }) : <p>No enumerated visual candidate returned. This is not a finding of absence.</p>}</article>)}{!textAI.length && !visual.length && <p className="rl-empty">No AI candidates are retained here. Local checks and human review remain available.</p>}<p className="rl-limit">Appearance cannot establish pollutant identity, pathogens, water safety or ecological status. Disagreement preserves the AI proposal and the human reason.</p></>}
      {selected === "confirmation" && <><h4>{brief.confirmed ? "The confirmation is recorded." : "A usable confirmation is not retained."}</h4><time>{displayEvidenceTime(report.confirmedAt)}</time><p>Confirmation records approval of the submitted record; it is not scientific validation.</p><dl><div><dt>Retained text responses</dt><dd>{report.assessment.issues.filter((issue) => issue.answer).length}</dd></div><div><dt>Adaptive answers</dt><dd>{report.field?.followups.filter((followup) => followup.answer).length ?? 0}</dd></div></dl></>}
      {selected === "human" && <><h4>{brief.label}</h4>{brief.latestReview ? <><blockquote>{brief.latestReview.note}</blockquote><time>{displayEvidenceTime(brief.latestReview.at)}</time><p>Recorded action: {brief.latestReview.action.replaceAll("_", " ")}. Earlier reviews do not override the current workflow.</p></> : <p className="rl-empty">No review event retained. Opening or exporting this receipt does not approve it.</p>}<dl><div><dt>Visual disagreements</dt><dd>{summary.visualDisagreements}</dd></div><div><dt>Awaiting / uncertain judgments</dt><dd>{summary.visualNeedsJudgment}</dd></div></dl><p className="rl-limit">Local reviewer roles are not authenticated. {report.demonstration ? "This record's initial decisions are authored software examples, not expert review." : "Human approval does not establish scientific truth."}</p></>}
    </div>
  </section>;
}
