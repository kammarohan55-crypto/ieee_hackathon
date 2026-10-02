import type { Report } from "./assessment";
import { recordedProviderLabel } from "./ai-metadata";
import { isSyntheticRecord } from "./atlas";
import { findingLabels } from "./field";
import { labDecisionBrief } from "./evidence-lab";

export const presentationStages = ["evidence", "assessment", "judgment", "receipt"] as const;
export type PresentationStage = (typeof presentationStages)[number];
export const presentationLabels: Record<PresentationStage, string> = {
  evidence: "Original evidence", assessment: "Checks & clarification",
  judgment: "Human judgment", receipt: "Decision receipt",
};
export const presentationStatus: Record<Report["status"], string> = {
  awaiting_review: "Awaiting local human review", needs_information: "More information requested",
  reviewed: "Marked reviewed · local demo role",
};
/** Imported workflow flags alone cannot establish a retained human review. */
export function presentationWorkflow(report: Report): string {
  const brief = labDecisionBrief(report);
  if (report.status === "reviewed") return brief.reviewComplete
    ? `${brief.label} · local demo role` : brief.label;
  return `${presentationStatus[report.status]}${brief.statusMismatch ? " · history needs inspection" : ""}`;
}
export function nextPresentationStage(stage: PresentationStage, direction: -1 | 1): PresentationStage {
  return presentationStages[Math.max(0, Math.min(presentationStages.length - 1, presentationStages.indexOf(stage) + direction))];
}
function literalBlock(value: string) {
  // Preserve original characters, even if a note contains Markdown fences.
  const longest = Math.max(0, ...[...value.matchAll(/`+/g)].map((match) => match[0].length));
  const fence = "`".repeat(Math.max(3, longest + 1));
  return `${fence}text\n${value}\n${fence}`;
}
/** A local, readable export of retained decisions. No AI call, new facts or approvals. */
export function presentationBrief(report: Report): string {
  if (isSyntheticRecord(report)) throw new Error("Synthetic evidence cannot be presented as a real observation.");
  const ref = report.field?.reference;
  const brief = labDecisionBrief(report);
  const lines = [
    "# AquaLens — evidence and human judgment", `Record: ${report.id}`,
    `Workflow: ${presentationWorkflow(report)}`, `Stored workflow flag: ${report.status}`,
    `Source: ${ref ? "Historical credited photograph review" : "Citizen field observation"}`,
    `Site label: ${report.original.site}`, `Observation/source time as recorded: ${report.original.observedAt}`,
    `Report created: ${report.createdAt}`, "", "## Original note · unchanged", literalBlock(report.original.note),
    "", "## Checks and citizen clarification",
    report.assessment.mode === "ai" ? `Text method: local rules + ${recordedProviderLabel(report.assessment.provider)} · ${report.assessment.model || "Model not retained"}` : "Text method: local English rules",
    `Assessment notice: ${report.assessment.notice}`,
  ];
  for (const issue of report.assessment.issues) lines.push(`\n${issue.title} · ${issue.source} · ${issue.decision}`, "Original source quote:", literalBlock(issue.quote), "Citizen response:", literalBlock(issue.answer ?? "No response recorded"));
  if (!report.assessment.issues.length) lines.push("No text question was retained. This does not establish environmental health or safety.");
  for (const followup of report.field?.followups ?? []) lines.push(`\nFollow-up: ${followup.question}`, literalBlock(followup.answer));
  lines.push("", "## Citizen confirmation", `Confirmation timestamp as recorded: ${report.confirmedAt}`,
    brief.confirmed ? "Confirmation records approval/authorship, not scientific truth." : "A usable citizen confirmation timestamp is not retained; confirmation needs inspection.",
    "", "## Visual candidates and human judgment");
  for (const media of report.field?.media ?? []) {
    lines.push(`\nMedia metadata: ${media.filename || media.id} · ${media.kind}`, `SHA-256 as recorded: ${media.sha256}`);
    if (!media.visual) { lines.push("No visual AI response retained for this file."); continue; }
    lines.push(`Visual method: ${recordedProviderLabel(media.visual.provider)} · ${media.visual.model} · ${media.visual.at}`);
    for (const finding of media.visual.findings) {
      const judgment = report.field?.dispositions.filter((item) => item.mediaId === media.id && item.finding === finding.kind).at(-1);
      lines.push(`${findingLabels[finding.kind]} · ${finding.region} · ${finding.confidence} uncalibrated model confidence`, judgment ? `Current human judgment: ${judgment.decision} · ${judgment.at} · local demo reviewer` : "Current human judgment: not recorded");
      if (judgment) lines.push(literalBlock(judgment.reason));
    }
    if (!media.visual.findings.length) lines.push("No visual candidate was returned; absence of a condition is not established.");
  }
  lines.push("", "## Local review history");
  for (const review of report.reviewHistory) lines.push(`${review.at} · ${presentationStatus[review.action]} · local demo reviewer`, literalBlock(review.note));
  if (!report.reviewHistory.length) lines.push("No human review event recorded.");
  if (brief.gaps.length) lines.push("", "## Retained limits and history gaps", ...brief.gaps.map((gap) => `- ${gap}`));
  if (ref) lines.push("", "## Photograph credit", `${ref.title} · ${ref.author} · ${ref.capturedDate}`, `Source: ${ref.sourceUrl}`, `${ref.license}: ${ref.licenseUrl}`, `Derivative: ${ref.derivative}`);
  lines.push("", "## Limits", "This is a readable brief, not a complete field pack or a signed certificate. It does not contain original media bytes. Export the JSON receipt/field pack for structured provenance and original files.", "AI confidence is uncalibrated. Local reviewer identities are not authenticated. Appearance, satellite context and review cannot establish pollutants, pathogens, species, causes, water safety or ecological status.");
  return lines.join("\n") + "\n";
}
