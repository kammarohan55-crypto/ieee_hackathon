"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Tabs } from "radix-ui";
import {
  ArrowRight, ArrowUpRight, Camera, Check, CheckCheck, CircleHelp,
  Clock3, FileText, Fingerprint, FlaskConical, GitBranch, Layers,
  RefreshCw, Scale, ShieldCheck, Sparkles,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Assessment, type Issue, type Report } from "@/lib/assessment";
import { findingLabels, measurementWarnings, observationQuality, type MediaEvidence } from "@/lib/field";
import { isSyntheticRecord } from "@/lib/atlas";
import { issueSourceSpan, labDecisionBrief, labRecordSummary, replayReportRules } from "@/lib/evidence-lab";
import { DemonstrationNote } from "./demonstration-note";
import { ReferenceCredit } from "./reference-gallery";
import { displayEvidenceTime } from "@/lib/references";
import { validationReportSchema, type ValidationReportSummary } from "@/lib/validation-report";
import { EvidenceImage } from "./field-studio";
import { recordedProviderLabel } from "@/lib/ai-metadata";

const timeLabel = displayEvidenceTime;

const statusLabels: Record<Report["status"], string> = {
  awaiting_review: "Awaiting human review",
  needs_information: "More information requested",
  reviewed: "Human reviewed",
};
const decisionLabels: Record<Issue["decision"], string> = {
  pending: "Awaiting citizen response", answered: "Citizen answered",
  uncertain: "Uncertainty retained", dismissed: "Citizen dismissed",
};

function SourceQuote({ original, issue }: { original: Report["original"]; issue: Issue }) {
  const span = issueSourceSpan(original, issue);
  return <div className="el-source-trace">
    <p className="el-label"><Fingerprint size={14} /> SOURCE FIELD · {issue.field}</p>
    {span ? <blockquote>{span.before}<mark>{span.quote}</mark>{span.after}</blockquote>
      : <p>{issue.quote ? "The saved quote cannot be located in this source field. Inspect the full receipt before relying on it." : "No source quote is retained; inspect the referenced field."}</p>}
    <small>An exact quote links a check to the record. It does not establish that the interpretation is correct.</small>
  </div>;
}

function CheckInspector({ assessment, original, stored }: {
  assessment: Assessment; original: Report["original"]; stored: boolean;
}) {
  const [selectedId, setSelectedId] = useState("");
  const issue = assessment.issues.find((item) => item.id === selectedId) ?? assessment.issues[0];
  return <div className={`el-check-inspector${assessment.issues.length ? "" : " el-no-checks"}`}>
    <div className="el-check-list" aria-label="Assessment checks">
      {assessment.issues.map((item) => <button type="button" key={item.id}
        className={`el-check-item${item.id === issue?.id ? " selected" : ""}`}
        aria-pressed={item.id === issue?.id} onClick={() => setSelectedId(item.id)}>
        <span className={`el-badge${item.source === "ai" ? " ai" : ""}`}>{item.source === "ai" ? <Sparkles size={12} /> : <GitBranch size={12} />}{item.source === "ai" ? "AI candidate" : "Rule check"}</span>
        <strong>{item.title}</strong><span>{stored ? decisionLabels[item.decision] : "Replay suggestion"}</span>
        <ArrowRight className="el-check-arrow" size={16} />
      </button>)}
      {!assessment.issues.length && <div className="el-empty"><ShieldCheck size={30} /><h4>No issue matched.</h4><p>These limited checks did not flag the note. This does not establish correctness, completeness or water safety.</p></div>}
    </div>
    {issue && <section className="el-check-detail" aria-label="Selected check explanation">
      <div className="el-detail-heading"><span className="el-label">WHY THIS CHECK APPEARED</span><span className="el-badge">{issue.code.replaceAll("_", " ")}</span></div>
      <h3>{issue.title}</h3><p>{issue.detail}</p>
      <SourceQuote original={original} issue={issue} />
      <div className="el-question"><CircleHelp size={19} /><div><span className="el-label">FOCUSED FOLLOW-UP</span><p>{issue.question}</p></div></div>
      {stored && <div className="el-human-response"><span className="el-label"><CheckCheck size={14} /> CITIZEN DECISION · {decisionLabels[issue.decision]}</span><p>{issue.answer || "No explanatory answer is recorded."}</p>{issue.decidedAt && <small>{timeLabel(issue.decidedAt)}</small>}</div>}
      {issue.source === "ai" && <p className="el-limitation">Recorded AI suggestion · {recordedProviderLabel(assessment.provider)} · {assessment.model || "Model not recorded"}. Text checks have no calibrated confidence score and require human interpretation.</p>}
    </section>}
  </div>;
}

function MediaInspector({ report }: { report: Report }) {
  const [mediaId, setMediaId] = useState("");
  const mediaList = report.field?.media ?? [];
  const media = mediaList.find((entry) => entry.id === mediaId) ?? mediaList[0];
  const readings = report.field?.measurements ?? [];
  return <div className="el-media-readings">
    <section className="el-media-section">
      <div className="el-detail-heading"><h3><Camera size={18} /> Retained evidence</h3><span className="el-badge">{mediaList.length} file{mediaList.length === 1 ? "" : "s"}</span></div>
      {mediaList.length > 1 && <div className="el-media-picker" aria-label="Select retained evidence">{mediaList.map((item, i) => <button type="button" key={item.id} aria-pressed={media?.id === item.id} onClick={() => setMediaId(item.id)}>{item.kind} {i + 1}</button>)}</div>}
      {media ? <>
        <div className="el-media-frame"><EvidenceImage media={media} /><span>{media.origin === "illustration" ? "Synthetic illustration" : media.origin === "camera" ? "Citizen camera capture" : media.origin === "public_reference" ? "Historical source photograph" : "Citizen upload"}</span></div>
        <MediaMethod media={media} />
        <div className="el-candidates"><p className="el-label"><Sparkles size={14} /> RECORDED VISUAL AI · CANDIDATE FINDINGS</p>
          {media.visual ? <><p className="el-limitation">{recordedProviderLabel(media.visual.provider)} · {media.visual.model} · {timeLabel(media.visual.at)}. Confidence is qualitative and uncalibrated; it is not diagnostic accuracy.</p>
            {media.visual.findings.map((finding, i) => {
              const judgment = report.field?.dispositions.filter((entry) => entry.mediaId === media.id && entry.finding === finding.kind).at(-1);
              return <div className="el-visual-finding" key={`${finding.kind}-${i}`}><strong>{findingLabels[finding.kind]}</strong><span>{finding.confidence} confidence · {finding.region.replaceAll("_", " ")}</span><p><b>Human judgment:</b> {judgment ? judgment.decision : "Awaiting judgment"}</p>{judgment && <blockquote>{judgment.reason}</blockquote>}</div>;
            })}
            {!media.visual.findings.length && <p>No candidate finding was returned. This does not prove the image is clear or the water is healthy.</p>}
          </> : <p className="el-limitation">No visual AI result is recorded for this file. No analysis is triggered from the lab.</p>}
        </div>
      </> : <div className="el-empty"><Camera size={30} /><h4>No retained photo or video</h4><p>The written observation remains inspectable. Missing media is left unknown.</p></div>}
    </section>
    <section className="el-reading-section"><div className="el-detail-heading"><h3><Scale size={18} /> Citizen instrument readings</h3><span className="el-badge">{readings.length}</span></div>
      {readings.map((reading, i) => {
        const warnings = measurementWarnings(reading);
        return <div className="el-reading" key={`${reading.parameter}-${i}`}><div><strong>{reading.parameter}</strong><b>{reading.value} <small>{reading.unit || "Unit missing"}</small></b></div><p>{reading.instrument || "Instrument not supplied"} · Calibration {reading.calibration}</p>{warnings.length ? <ul>{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : <span className="el-badge"><Check size={12} /> Metadata checks passed</span>}</div>;
      })}
      {!readings.length && <p className="el-limitation">No readings supplied. The app never estimates pH, turbidity or other instrument values from a photo.</p>}
      <p className="el-limitation">Input plausibility and metadata checks do not verify an instrument, its calibration, or ecological status.</p>
    </section>
  </div>;
}

function MediaMethod({ media }: { media: MediaEvidence }) {
  return <details className="el-method-details"><summary><Fingerprint size={15} /> Image method & provenance</summary><dl><div><dt>Recorded</dt><dd>{timeLabel(media.createdAt)}</dd></div><div><dt>Dimensions</dt><dd>{media.width} × {media.height} · {media.mime}</dd></div><div><dt>Image heuristic</dt><dd>{media.quality.method} · browser brightness & edge detail</dd></div><div><dt>SHA-256</dt><dd className="el-digest">{media.sha256 || "Not recorded"}</dd></div></dl>{media.quality.warnings.length ? <ul>{media.quality.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : <p>No image-usability warning was stored. This is not scientific image validation.</p>}<p>A stored digest identifies recorded bytes; it does not prove authenticity. Media remains on this device.</p></details>;
}

function DecisionHistory({ report }: { report: Report }) {
  const summary = labRecordSummary(report);
  return <section className="el-decisions"><div className="el-detail-heading"><h3>People retain the decision.</h3><span className="el-badge">{statusLabels[report.status]}</span></div>
    <div className="el-decision-flow">
      <div><FileText size={20} /><span>Citizen original</span><strong>{timeLabel(report.createdAt)}</strong></div>
      <ArrowRight aria-hidden="true" size={17} />
      <div><CheckCheck size={20} /><span>Citizen confirmed</span><strong>{timeLabel(report.confirmedAt)}</strong></div>
      <ArrowRight aria-hidden="true" size={17} />
      <div><ShieldCheck size={20} /><span>Human workflow</span><strong>{statusLabels[report.status]}</strong></div>
    </div>
    <p className="el-limitation">Local demo roles have no authenticated identity. Confirmation establishes approval of the record; review does not establish scientific truth.</p>
    {(summary.visualDisagreements > 0 || summary.visualNeedsJudgment > 0) && <div className="el-attention"><CircleHelp size={19} /><p>{summary.visualDisagreements} visual disagreement{summary.visualDisagreements === 1 ? "" : "s"} retained · {summary.visualNeedsJudgment} candidate{summary.visualNeedsJudgment === 1 ? "" : "s"} unjudged or still uncertain. Original AI output and human reasons remain available in Media & readings.</p></div>}
    <div className="el-history-columns"><div><p className="el-label">HUMAN REVIEW HISTORY · {report.reviewHistory.length}</p>{report.reviewHistory.length ? <ol className="el-history">{report.reviewHistory.slice().reverse().map((entry, i) => <li key={`${entry.at}-${i}`}><span>{timeLabel(entry.at)} · Local reviewer</span><strong>{statusLabels[entry.action]}</strong><p>{entry.note || "No review note recorded."}</p></li>)}</ol> : <p className="el-limitation">No human review decision is recorded.</p>}</div><div><p className="el-label">RETAINED WORKFLOW EVENTS · {report.history.length}</p>{report.history.length ? <ol className="el-history">{report.history.slice().reverse().map((entry, i) => <li key={`${entry.at}-${i}`}><span>{timeLabel(entry.at)}</span><strong>{entry.action.replaceAll("_", " ")}</strong><p>{entry.detail}</p></li>)}</ol> : <p className="el-limitation">No additional workflow events are recorded.</p>}</div></div>
  </section>;
}

function DecisionBrief({ report, onInspect }: { report: Report; onInspect: (view: string) => void }) {
  const brief = labDecisionBrief(report);
  const mediaCount = report.field?.media.length ?? 0;
  const readingsCount = report.field?.measurements.length ?? 0;
  return <section className="el-brief" aria-label="Saved observation decision brief">
    <div className="el-brief-heading"><div><p className="el-label"><GitBranch size={14} /> ONE RECORD · FOUR PROVENANCE STAGES</p><h3>From observation to accountable judgment.</h3><p>Read what was supplied, which checks ran, and what people actually decided.</p></div><span className={`el-brief-status${brief.reviewComplete ? " reviewed" : ""}`}><ShieldCheck size={16} />{brief.label}</span></div>
    <ol className="el-brief-stages">
      <li><div className="el-brief-stage-top"><span>01</span><Fingerprint size={19} /></div><h4>Original source</h4><strong>{report.field?.reference ? "Historical photo review" : isSyntheticRecord(report) ? "Synthetic observation" : "Citizen supplied"}</strong><p>{mediaCount} retained file{mediaCount === 1 ? "" : "s"} · {readingsCount} supplied reading{readingsCount === 1 ? "" : "s"}. Original words remain unchanged.</p><button type="button" onClick={() => onInspect("media")}>Inspect evidence <ArrowRight size={14} /></button></li>
      <li><div className="el-brief-stage-top"><span>02</span><GitBranch size={19} /></div><h4>Method & checks</h4><strong>{report.assessment.mode === "ai" ? `Rules + ${recordedProviderLabel(report.assessment.provider)}` : "Local rules"}</strong><p>{brief.ruleChecks} rule check{brief.ruleChecks === 1 ? "" : "s"} · {brief.textAICandidates} text AI candidate{brief.textAICandidates === 1 ? "" : "s"} · {brief.visualAICandidates} recorded visual candidate{brief.visualAICandidates === 1 ? "" : "s"}.</p><button type="button" onClick={() => onInspect("checks")}>Inspect checks <ArrowRight size={14} /></button></li>
      <li><div className="el-brief-stage-top"><span>03</span><CheckCheck size={19} /></div><h4>Citizen confirmation</h4><strong>{brief.confirmed ? "Confirmation recorded" : "Confirmation unknown"}</strong><p>{brief.confirmed ? timeLabel(report.confirmedAt) : "No usable confirmation timestamp retained."} Approval records authorship and intent, not scientific truth.</p><button type="button" onClick={() => onInspect("decisions")}>Inspect decisions <ArrowRight size={14} /></button></li>
      <li><div className="el-brief-stage-top"><span>04</span><ShieldCheck size={19} /></div><h4>Human judgment</h4><strong>{brief.reviewRecorded && brief.latestReview ? statusLabels[brief.latestReview.action] : "No usable review event"}</strong><p>{brief.reviewRecorded && brief.latestReview ? `Recorded ${timeLabel(brief.latestReview.at)} · local demo reviewer.` : "Opening this brief never approves or reviews the record."} {brief.visualDisagreements} retained visual disagreement{brief.visualDisagreements === 1 ? "" : "s"}.</p><button type="button" onClick={() => onInspect("decisions")}>Inspect history <ArrowRight size={14} /></button></li>
    </ol>
    <div className="el-brief-bottom"><section className="el-brief-gaps"><p className="el-label"><CircleHelp size={14} /> OPEN QUESTIONS & RETAINED LIMITS</p>{brief.gaps.length ? <ul>{brief.gaps.map((gap) => <li key={gap}>{gap}</li>)}</ul> : <p>No open workflow gap was found by this limited checklist. This does not establish evidence accuracy or environmental health.</p>}</section><section className="el-brief-human"><p className="el-label"><FileText size={14} /> LATEST RECORDED HUMAN REASON</p>{brief.latestReview ? <><blockquote>{brief.latestReview.note || "No explanatory review note retained."}</blockquote><small>{brief.reviewTimestampKnown ? timeLabel(brief.latestReview.at) : "Review time unavailable"} · {statusLabels[brief.latestReview.action]} · unauthenticated local role</small></> : <p>A human review reason has not been recorded.</p>}<details><summary>Optional context & scientific limits</summary><p>{report.field?.coordinates ? "Citizen-supplied coordinates are retained; location is not independently verified." : "GPS was not supplied. It is optional; map placement remains unavailable."} {readingsCount ? "Instrument entries require their own method and calibration verification." : "No instrument values were supplied. They are optional and are never estimated from appearance."}</p><p>AI candidate confidence is uncalibrated. The checklist, appearance, satellite context and human review cannot establish pollutants, pathogens, water safety or ecological status.</p></details></section></div>
  </section>;
}

function SavedRecordInspector({ records, onOpen }: { records: Report[]; onOpen: (id: string) => void }) {
  const id = useId();
  const [recordId, setRecordId] = useState("");
  const [replay, setReplay] = useState<{ report: Report; result: ReturnType<typeof replayReportRules> } | null>(null);
  const [checkView, setCheckView] = useState("stored");
  const [inspectionView, setInspectionView] = useState("brief");
  const ordered = useMemo(() => records.slice().sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0)), [records]);
  const report = ordered.find((entry) => entry.id === recordId) ?? ordered[0];
  const activeReplay = replay?.report === report ? replay.result : undefined;
  const useReplay = checkView === "replay" && !!activeReplay;
  if (!report) return <div className="el-empty el-start-empty"><Layers size={36} /><h3>Your evidence workbench starts with a saved observation.</h3><p>Record and confirm an observation in the Field Studio, then return to inspect its original evidence, assessment and human decisions.</p></div>;
  const quality = observationQuality(report);
  const summary = labRecordSummary(report);
  return <>
    <div className="el-record-toolbar"><div><label id={`${id}-record-label`}>Choose a saved observation</label><Select value={report.id} onValueChange={(value) => { setRecordId(value); setReplay(null); setCheckView("stored"); setInspectionView("brief"); }}><SelectTrigger aria-labelledby={`${id}-record-label`}><SelectValue /></SelectTrigger><SelectContent>{ordered.map((entry) => <SelectItem key={entry.id} value={entry.id}>{entry.original.site || "Location unknown"} · {timeLabel(entry.original.observedAt)}{entry.field?.reference ? " · Historical photo review" : isSyntheticRecord(entry) ? " · Synthetic" : ""}</SelectItem>)}</SelectContent></Select></div><button type="button" className="el-button" onClick={() => onOpen(report.id)}>Open full receipt <ArrowRight size={16} /></button></div>
    <div className="el-workbench" key={report.id}>
      <aside className="el-original"><div className="el-original-heading"><p className="el-label"><Fingerprint size={15} /> {report.field?.reference ? "PRESERVED PHOTO-REVIEW NOTE" : "PRESERVED CITIZEN SOURCE"}</p><span className={`el-badge${isSyntheticRecord(report) ? " synthetic" : ""}`}>{report.field?.reference ? "Historical photo review" : isSyntheticRecord(report) ? "Synthetic record" : "Citizen supplied · unverified"}</span></div>{report.field?.reference && <ReferenceCredit reference={report.field.reference} />}<DemonstrationNote report={report} /><h2>{report.original.site || "Location unknown"}</h2><p className="el-original-time"><Clock3 size={14} /> {timeLabel(report.original.observedAt)}</p><blockquote>{report.original.note || "Original note is empty."}</blockquote><div className="el-appearance"><span>Citizen selected appearance</span><strong>{report.original.appearance === "unsure" ? "Unsure / not observed" : report.original.appearance}</strong></div>
        <div className="el-quality"><div><span>Evidence completeness</span><strong>{quality.value}<small>/100</small></strong></div><div className="el-quality-track" aria-hidden="true"><span style={{ width: `${quality.value}%` }} /></div><p>Prototype checklist score. Not water health, accuracy or scientific confidence.</p><details><summary>Inspect the score</summary>{quality.checks.map((check) => <div className="el-quality-row" key={check.label}><span>{check.label}</span><b>{check.earned}/{check.max}</b></div>)}<small>Method: {quality.method}. Optional media and location affect this score; never take risks to raise it.</small></details></div>
        <div className="el-provenance-counts"><span><b>{summary.ruleChecks}</b> retained rule checks</span><span><b>{summary.textAICandidates}</b> text AI candidates</span><span><b>{summary.visualAICandidates}</b> visual AI candidates</span><span><b>{summary.unresolvedText}</b> pending or uncertain text checks</span></div><p className="el-original-footer">The lab reads this record. Replay never changes the original or the decisions.</p>
      </aside>
      <div className="el-inspection"><Tabs.Root value={inspectionView} onValueChange={setInspectionView}><Tabs.List className="el-inspection-tabs" aria-label="Saved evidence inspection"><Tabs.Trigger value="brief"><Layers size={16} /> Decision brief</Tabs.Trigger><Tabs.Trigger value="checks"><GitBranch size={16} /> Checks</Tabs.Trigger><Tabs.Trigger value="media"><Camera size={16} /> Media & readings</Tabs.Trigger><Tabs.Trigger value="decisions"><ShieldCheck size={16} /> Decisions</Tabs.Trigger></Tabs.List>
        <Tabs.Content value="brief" className="el-inspection-content"><DecisionBrief report={report} onInspect={setInspectionView} /></Tabs.Content>
        <Tabs.Content value="checks" className="el-inspection-content"><div className="el-check-toolbar"><div><p className="el-label">{useReplay ? "LOCAL REPLAY · RULES ONLY" : "STORED ASSESSMENT"}</p><p>{useReplay ? "Fresh rule output; saved decisions are preserved." : report.assessment.notice}</p></div><button type="button" className="el-button" onClick={() => { setReplay({ report, result: replayReportRules(report) }); setCheckView("replay"); }}><RefreshCw size={15} /> Replay rules</button></div>
          {activeReplay && <div className="el-replay-bar"><div role="group" aria-label="Choose assessment output"><button type="button" aria-pressed={!useReplay} onClick={() => setCheckView("stored")}>Stored</button><button type="button" aria-pressed={useReplay} onClick={() => setCheckView("replay")}>Local replay</button></div><p>Time checks use {activeReplay.referenceSource === "record_creation" ? "record creation time" : "current time (creation time unavailable)"}: {timeLabel(activeReplay.referenceTime)}. Current rule version may differ from the saved assessment.</p></div>}
          <CheckInspector assessment={useReplay ? activeReplay!.assessment : report.assessment} original={report.original} stored={!useReplay} />
          <p className="el-limitation">{useReplay ? activeReplay!.assessment.version : report.assessment.version} · English text heuristics are deliberately limited. Original issues and citizen responses remain in the saved receipt.</p>
        </Tabs.Content><Tabs.Content value="media" className="el-inspection-content"><MediaInspector report={report} /></Tabs.Content><Tabs.Content value="decisions" className="el-inspection-content"><DecisionHistory report={report} /></Tabs.Content>
      </Tabs.Root></div>
    </div>
  </>;
}

function EngineeringEvidence() {
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<ValidationReportSummary | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!open || result) return;
    let disposed = false;
    const controller = new AbortController();
    fetch("/evaluation.json", { signal: controller.signal }).then((response) => { if (!response.ok) throw new Error("Unavailable report"); return response.json(); }).then((data: unknown) => {
      const entry = validationReportSchema.parse(data);
      if (!disposed) setResult(entry);
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; controller.abort(); };
  }, [open, attempt, result]);
  return <details className="el-engineering" onToggle={(event) => setOpen(event.currentTarget.open)}><summary><div><ShieldCheck size={19} /><span>Inspect the engineering evidence</span></div><span>{result ? `${result.passed}/${result.total} assertions passed · no live AI` : failed ? "Report unavailable" : open ? "Loading software report…" : "Software fixtures · load on request"}</span></summary><div><p>Authored development fixtures check retention, uncertainty, decisions and export. These are software checks, not held-out AI accuracy, independent ecological validation or a claim that all device interactions were tested. This report uses no live AI.</p>{result && <p>Generated {timeLabel(result.generatedAt)}.</p>}{failed && <p role="status">The software report could not be loaded or validated. <button type="button" className="el-button" onClick={() => { setFailed(false); setAttempt((value) => value + 1); }}>Retry report</button></p>}<a href="/evaluation.json" target="_blank" rel="noreferrer">Open the test report <ArrowUpRight size={15} /></a></div></details>;
}

export function EvidenceLab({ records, onOpen }: { records: Report[]; onOpen: (id: string) => void }) {
  const id = useId();
  return <section className="evidence-lab" aria-labelledby={`${id}-title`}><header className="el-heading"><div><p className="el-label"><FlaskConical size={15} /> THE EVIDENCE LAB · CITIZEN TO REVIEWER</p><h1 id={`${id}-title`}>See the evidence.<br /><em>Question the assessment.</em></h1><p>A practical workbench for original observations, explainable checks and human judgment.</p></div><div className="el-heading-seal"><Fingerprint size={31} /><span>Original evidence retained<br />Human decisions visible</span></div></header><SavedRecordInspector records={records} onOpen={onOpen} /><EngineeringEvidence /></section>;
}
