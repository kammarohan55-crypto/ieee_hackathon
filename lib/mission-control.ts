import type { Report } from "./assessment";
import type { MediaEvidence } from "./field";
import { isSyntheticRecord } from "./atlas";
import { referencePhotos, allReferencePhotos, referenceDimensions, validRecordedTimestamp, type ReferencePhoto } from "./references";
import { recordedProviderLabel } from "./ai-metadata";
import { labDecisionBrief } from "./evidence-lab";

export type EvidenceFrame = {
  key: string; title: string; date: string; width: number; height: number;
  reference?: ReferencePhoto; report?: Report; media?: MediaEvidence;
};
export type EvidenceScope = "all" | "field" | "reference";
export type ImageDimensions = { width: number; height: number };
export function imagePoint(rect: { left: number; top: number; width: number; height: number }, dimensions: ImageDimensions, clientX: number, clientY: number) {
  if (![rect.left, rect.top, rect.width, rect.height, dimensions.width, dimensions.height, clientX, clientY].every(Number.isFinite) ||
    rect.width <= 0 || rect.height <= 0 || dimensions.width <= 0 || dimensions.height <= 0) return null;
  const scale = Math.min(rect.width / dimensions.width, rect.height / dimensions.height);
  const width = dimensions.width * scale, height = dimensions.height * scale;
  const x = (clientX - rect.left - (rect.width - width) / 2) / width;
  const y = (clientY - rect.top - (rect.height - height) / 2) / height;
  return x >= 0 && x <= 1 && y >= 0 && y <= 1 ? { x, y } : null;
}
export const workflowLabels = { awaiting_review: "Awaiting review", needs_information: "More information", reviewed: "Reviewed" } as const;
export function scopedRecords(records: Report[], scope: EvidenceScope) {
  return records.filter((r) => !isSyntheticRecord(r) && (scope === "all" || (scope === "reference" ? !!r.field?.reference : !r.field?.reference)));
}
export function evidenceFrames(records: Report[]): EvidenceFrame[] {
  const saved = scopedRecords(records, "all").flatMap((report) => (report.field?.media ?? [])
    .filter((media) => media.kind === "photo").map((media) => ({
      key: `record:${report.id}:${media.id}`, title: report.field?.reference?.title ?? report.original.site,
      date: report.original.observedAt,
      width: media.width > 0 && media.height > 0 ? media.width : 4,
      height: media.width > 0 && media.height > 0 ? media.height : 3,
      report, media, reference: allReferencePhotos.find((p) => p.id === report.field?.reference?.id),
    })));
  const represented = new Set(saved.map((frame) => frame.reference?.id));
  const sources = referencePhotos.filter((reference) => !represented.has(reference.id)).map((reference) => ({
    key: `source:${reference.id}`, title: reference.title, date: reference.capturedDate,
    ...referenceDimensions(reference), reference,
  }));
  return [...saved, ...sources];
}
export function pendingVisualCount(report: Report) {
  return (report.field?.media ?? []).reduce((sum, media) => sum + (media.visual?.findings ?? []).filter((finding) =>
    !report.field?.dispositions.some((entry) => entry.mediaId === media.id && entry.finding === finding.kind)).length, 0);
}
export function recordSignals(report: Report) {
  const field = report.field;
  return [
    { key: "note", label: "Original note", present: !!report.original.note.trim(), applicable: true },
    { key: "media", label: "Media metadata", present: !!field?.media.length, applicable: true },
    { key: "coordinates", label: "Coordinates", present: !!field?.coordinates, applicable: !field?.reference },
    { key: "clarified", label: "Questions acknowledged", present: report.assessment.issues.every((i) => i.decision !== "pending"), applicable: true },
    { key: "confirmed", label: "Author confirmation", present: validRecordedTimestamp(report.confirmedAt), applicable: true },
    { key: "reviewed", label: "Human review", present: labDecisionBrief(report).reviewComplete, applicable: true },
  ];
}
export function workspaceAnalytics(records: Report[], now = new Date()) {
  const source = scopedRecords(records, "all");
  const statuses = (Object.keys(workflowLabels) as Report["status"][]).map((status) => ({
    status, label: workflowLabels[status], count: source.filter((r) => r.status === status).length,
  }));
  const coverage = ["note", "media", "coordinates", "clarified", "confirmed", "reviewed"].map((key) => {
    const values = source.map((r) => recordSignals(r).find((s) => s.key === key)!);
    const applicable = values.filter((s) => s.applicable);
    return { key, label: values[0]?.label ?? ({ note: "Original note", media: "Media metadata", coordinates: "Coordinates", clarified: "Questions acknowledged", confirmed: "Author confirmation", reviewed: "Human review" }[key]!), count: applicable.filter((v) => v.present).length, total: applicable.length };
  });
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const activity = Array.from({ length: 14 }, (_, index) => {
    const day = new Date(end - (13 - index) * 86400000).toISOString().slice(0, 10);
    return { day, count: source.filter((r) => validRecordedTimestamp(r.createdAt) && new Date(r.createdAt).toISOString().slice(0, 10) === day).length };
  });
  const visualCandidates = source.reduce((n, r) => n + (r.field?.media ?? []).reduce((v, m) => v + (m.visual?.findings.length ?? 0), 0), 0);
  return { total: source.length, field: source.filter((r) => !r.field?.reference).length,
    references: source.filter((r) => r.field?.reference).length, statuses, coverage, activity,
    visualCandidates, unjudgedCandidates: source.reduce((n, r) => n + pendingVisualCount(r), 0),
    ruleQuestions: source.reduce((n, r) => n + r.assessment.issues.filter((i) => i.source === "rules").length, 0),
    aiQuestions: source.reduce((n, r) => n + r.assessment.issues.filter((i) => i.source === "ai").length, 0),
    annotations: source.reduce((n, r) => n + (r.field?.annotations?.length ?? 0), 0),
  };
}
export function reviewQueue(records: Report[]) {
  return scopedRecords(records, "all").filter((r) => !labDecisionBrief(r).reviewComplete || !validRecordedTimestamp(r.confirmedAt) || pendingVisualCount(r) > 0)
    .map((report) => ({ report, pending: pendingVisualCount(report), reason: pendingVisualCount(report) ? "Visual candidates need a judgment" : report.status === "reviewed" && !labDecisionBrief(report).reviewComplete ? "Review history needs inspection" : !validRecordedTimestamp(report.confirmedAt) ? "Citizen confirmation needs inspection" : report.status === "needs_information" ? "Information requested" : "Ready for a human review" }))
    .sort((a, b) => b.pending - a.pending || (validRecordedTimestamp(a.report.createdAt) ? Date.parse(a.report.createdAt) : 0) - (validRecordedTimestamp(b.report.createdAt) ? Date.parse(b.report.createdAt) : 0) || a.report.id.localeCompare(b.report.id));
}
export type ReplayEvent = { id: string; at: string; title: string; detail: string; kind: "source" | "rules" | "ai" | "human" };
export function evidenceReplay(report: Report): ReplayEvent[] {
  const events: ReplayEvent[] = [{ id: "source", at: report.original.observedAt,
    title: report.field?.reference ? "Photograph source date" : "Supplied observation time",
    detail: report.field?.reference ? `${report.field.reference.title} · ${report.field.reference.author}. Date supplied by the public source.` : report.original.note,
    kind: "source" }];
  report.assessment.issues.forEach((issue, index) => {
    if (issue.decidedAt) events.push({ id: `question:${index}`, at: issue.decidedAt, title: `Question ${issue.decision}`, detail: `${issue.title}. ${issue.answer || "Uncertainty or dismissal retained without an answer."}`, kind: "human" });
  });
  (report.field?.media ?? []).forEach((media, index) => {
    if (media.visual) events.push({ id: `visual:${index}`, at: media.visual.at, title: "Visual AI response retained", detail: `${recordedProviderLabel(media.visual.provider)} · ${media.visual.model} · ${media.visual.findings.length} candidate descriptions, not verified conclusions.`, kind: "ai" });
  });
  report.history.forEach((event, index) => events.push({ id: `history:${index}`, at: event.at, title: event.action.replaceAll("_", " "), detail: event.detail, kind: "human" }));
  return events.sort((a, b) => {
    const time = (event: ReplayEvent) => Number.isFinite(Date.parse(event.at)) ? Date.parse(event.at) : Infinity;
    return time(a) - time(b) || a.id.localeCompare(b.id);
  });
}
