import type { Report } from "./assessment";
import { recordedProviderLabel } from "./ai-metadata";
import { findingLabels, measurementWarnings } from "./field";
import { labDecisionBrief } from "./evidence-lab";

export type TrailNode = {
  id: string;
  label: string;
  detail: string;
  source: "reference" | "citizen" | "rules" | "ai" | "human" | "pending";
  x: number;
  y: number;
};

// Connections express record provenance, never causation or scientific proof.
export function evidenceTrail(report: Report) {
  const review = labDecisionBrief(report);
  const nodes: TrailNode[] = [];
  const edges: { id: string; source: string; target: string }[] = [];
  const add = (id: string, label: string, detail: string, source: TrailNode["source"], x: number, y: number) => nodes.push({ id,
    label: report.demonstration ? label.replace(/^(Citizen|Photo reviewer|Human) · /, "Example · ").replace("human reviewed", "workflow review recorded") : label,
    detail: report.demonstration ? `${report.demonstration.authorship}. Software demonstration; no expert validation.\n${detail}` : detail, source, x, y });
  const link = (source: string, target: string) => edges.push({ id: `${source}>${target}`, source, target });
  add("original", report.field?.reference ? "Photo reviewer · original note" : "Citizen · original note", report.original.note || "No note supplied.", "citizen", 0, 100);
  add("confirmation", review.confirmed ? "Citizen · confirmation" : "Citizen · confirmation unavailable", `Timestamp as recorded: ${report.confirmedAt}. ${report.demonstration ? "Presentation workspace confirmation; not evidence of a citizen field visit or expert verification." : review.confirmed ? "Confirmation records the citizen's approval; it does not establish scientific truth." : "A usable confirmation timestamp is not retained; inspect the original record."}`, review.confirmed ? "citizen" : "pending", 560, 100);
  add("review", `Human · ${review.label.toLowerCase()}`, (report.reviewHistory.length
    ? report.reviewHistory.map((h) => `${h.at} · ${h.action.replaceAll("_", " ")}\n${h.note}`).join("\n\n")
    : "No human review recorded.") + `\nCurrent review completeness: ${review.label}. Local demo roles are not authenticated.`, review.reviewComplete ? "human" : "pending", 840, 100);
  link("confirmation", "review");
  const ref = report.field?.reference;
  if (ref) {
    add("photo-source", "Public source · historical photo", `${ref.title}\nPhotographer: ${ref.author}\nSource date: ${ref.capturedDate} (date only)\n${ref.sourceUrl}\n${ref.license} · ${ref.licenseUrl}\n${ref.derivative}\nSource metadata is unverified; not a new field visit.`, "reference", -280, 100);
    link("photo-source", "original");
  }
  if (report.field?.followupOf) {
    add("predecessor", "Source · earlier observation", `Follow-up source ID: ${report.field.followupOf}. This link does not establish comparable conditions or a shared waterway.`, "citizen", -280, 100);
    link("predecessor", "original");
  }
  if (!report.assessment.issues.length) {
    add("checks", "Rules · no issue matched", "No recorded issue. Limited rules and AI checks cannot guarantee correctness, completeness or water safety.", "rules", 280, 100);
    link("original", "checks"); link("checks", "confirmation");
  }
  report.assessment.issues.forEach((issue, i) => {
    const id = `issue:${i}`;
    add(id, `${issue.source === "ai" ? "AI" : "Rules"} · ${issue.code.replaceAll("_", " ")}`, `${issue.quote ? `Source quote: “${issue.quote}”` : `Field: ${issue.field}`}\n${issue.detail}\nQuestion: ${issue.question}\nCitizen decision: ${issue.decision}${issue.answer ? `\nCitizen answer: ${issue.answer}` : ""}`, issue.source === "ai" ? "ai" : "rules", 280, i * 100);
    link("original", id); link(id, "confirmation");
  });
  let row = Math.max(300, report.assessment.issues.length * 100 + 60);
  (report.field?.media ?? []).forEach((media, i) => {
    const id = `media:${i}`;
    add(id, `${media.origin === "public_reference" ? "Public source" : media.origin === "illustration" ? "Synthetic" : "Citizen"} · ${media.kind}`, `Origin: ${media.origin}\nRetained media metadata: ${media.id}\nSHA-256: ${media.sha256}\n${media.quality.warnings.join("\n") || "No canvas quality warning. This heuristic does not verify authenticity or image accuracy."}`, media.origin === "public_reference" ? "reference" : "citizen", 0, row);
    link(ref ? "photo-source" : "original", id);
    const annotations = report.field?.annotations?.filter((note) => note.mediaId === media.id) ?? [];
    if (annotations.length) {
      const annotationId = `photo-notes:${i}`;
      add(annotationId, `Human · ${annotations.length} visual notes`, annotations.map((note) => `${note.category}: ${note.note}\nImage position: ${Math.round(note.x * 100)}%, ${Math.round(note.y * 100)}% · ${note.at}`).join("\n\n") + "\nHuman notes, not model detections or geographic coordinates.", "human", -280, row);
      link(id, annotationId); link(annotationId, "review");
    }
    if (media.visual) {
      const visualId = `visual:${i}`, humanId = `judgment:${i}`;
      const findings = media.visual.findings;
      add(visualId, `AI · ${findings.length} visual candidates`, `Provider: ${recordedProviderLabel(media.visual.provider)}\nModel: ${media.visual.model}\nRecorded: ${media.visual.at}\n${findings.map((f) => `${findingLabels[f.kind]} · ${f.region.replaceAll("_", " ")} · ${f.confidence} uncalibrated confidence`).join("\n") || "No candidate finding returned; this is not a water-health conclusion."}`, "ai", 280, row);
      const judgments = (report.field?.dispositions ?? []).filter((d) => d.mediaId === media.id);
      const unanswered = findings.filter((f) => !judgments.some((d) => d.finding === f.kind)).length;
      add(humanId, unanswered ? `Human · ${unanswered} candidates pending` : judgments.length ? "Human · visual judgments" : "Human · no candidates to judge", judgments.map((d) => `${d.at}\n${findingLabels[d.finding]} · ${d.decision}\nReason: ${d.reason}`).join("\n\n") || "No human visual judgment recorded. AI findings remain candidate descriptions, not diagnoses.", judgments.length ? "human" : "pending", 560, row);
      link(id, visualId); link(visualId, humanId); link(humanId, "review");
    } else link(id, "confirmation");
    row += 110;
  });
  (report.field?.measurements ?? []).forEach((m, i) => {
    const id = `reading:${i}`, checkId = `measurement-check:${i}`;
    add(id, `Citizen · ${m.parameter} ${m.value} ${m.unit}`, `Instrument: ${m.instrument || "unknown"}\nCalibration: ${m.calibration}\nOriginal citizen-entered reading preserved; no independent instrument verification.`, "citizen", 0, row);
    const warnings = measurementWarnings(m);
    add(checkId, warnings.length ? "Rules · reading needs context" : "Rules · metadata checks", warnings.join("\n") || "This reading passes prototype range/unit/metadata checks. Passing does not establish accuracy or ecological status.", "rules", 280, row);
    link(id, checkId); link(checkId, "confirmation"); row += 110;
  });
  if (report.field?.followups.length) {
    add("followups", "Citizen · adaptive answers", report.field.followups.map((f) => `${f.question}\n${f.answer || "Unanswered"}`).join("\n\n"), "citizen", 560, row);
    link("followups", "review");
  }
  return { nodes, edges };
}
