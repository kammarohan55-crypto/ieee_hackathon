import type { Report } from "./assessment";
import { isSyntheticRecord } from "./atlas";
import { fieldQuestions, findingLabels, measurementWarnings } from "./field";
import { labDecisionBrief } from "./evidence-lab";
import { validRecordedTimestamp } from "./references";

export type SamplingMission = {
  id: string;
  reportId: string;
  site: string;
  source: "field" | "historical";
  action: "review" | "followup";
  priority: "review_first" | "clarify_next" | "optional_visit";
  title: string;
  reason: string;
  nextAction: string;
  basis: string[];
};

export const missionPriorityLabels = {
  review_first: "Review first",
  clarify_next: "Clarify next",
  optional_visit: "Optional fresh visit",
} as const;

/** Evidence-workflow priorities, never environmental risk or a sampling requirement. */
export function samplingMissions(records: Report[]): SamplingMission[] {
  const retained = records.filter((record) => !isSyntheticRecord(record));
  const followed = new Set(retained.filter((record) => !record.field?.reference).map((record) => record.field?.followupOf).filter(Boolean));
  const missions: SamplingMission[] = [];
  const creationTimes = new Map(retained.map((record) => [record.id, validRecordedTimestamp(record.createdAt) ? Date.parse(record.createdAt) : Infinity]));
  for (const report of retained) {
    const field = report.field;
    const review = labDecisionBrief(report);
    const base = { reportId: report.id, site: report.original.site.trim() || "Site label not supplied", source: field?.reference ? "historical" as const : "field" as const };
    const basis: string[] = [];
    let visualPending = 0, visualUncertain = 0, visualDisagreed = 0;
    for (const media of field?.media ?? []) for (const finding of media.visual?.findings ?? []) {
      // Append order is the retained judgment sequence; do not guess from wall-clock times.
      const judgment = field?.dispositions.findLast((entry) => entry.mediaId === media.id && entry.finding === finding.kind);
      if (!judgment) { visualPending++; basis.push(`${findingLabels[finding.kind]}: no human judgment recorded.`); }
      else if (judgment.decision === "uncertain") { visualUncertain++; basis.push(`${findingLabels[finding.kind]}: latest judgment uncertain — ${judgment.reason}`); }
      else if (judgment.decision === "disagrees") { visualDisagreed++; basis.push(`${findingLabels[finding.kind]}: latest judgment disagrees — ${judgment.reason}`); }
    }
    const pendingQuestions = report.assessment.issues.filter((issue) => issue.decision === "pending");
    const uncertainQuestions = report.assessment.issues.filter((issue) => issue.decision === "uncertain");
    pendingQuestions.forEach((issue) => basis.push(`${issue.title}: not acknowledged.`));
    uncertainQuestions.forEach((issue) => basis.push(`${issue.title}: uncertainty retained.`));
    const unanswered = field ? fieldQuestions(field, report.original.appearance).filter((question) => !field.followups.some((answer) => answer.question === question && answer.answer.trim())) : [];
    unanswered.forEach((question) => basis.push(`Unanswered follow-up: ${question}`));
    const measurementFlags = (field?.measurements ?? []).flatMap((measurement) => measurementWarnings(measurement).map((warning) => `${measurement.parameter}: ${warning}`));
    basis.push(...measurementFlags);
    const photos = (field?.media ?? []).filter((media) => media.kind === "photo");
    const limitedPhotos = photos.filter((photo) => photo.quality.warnings.length > 0);
    limitedPhotos.forEach((photo) => basis.push(`Image check: ${photo.quality.warnings.join(" ")}`));
    const request = report.reviewHistory.findLast((entry) => entry.action === "needs_information");
    const needsRequest = report.status === "needs_information";
    if (needsRequest) basis.unshift(`Reviewer request: ${request?.note || "The record is marked as needing more information; no request note was retained."}`);

    // Keep one review card per record. Human-reviewed uncertainty remains in the receipt;
    // it does not automatically reopen a completed review or demand a new instrument.
    const historyGap = report.status === "reviewed" && !review.reviewComplete;
    if (historyGap) basis.unshift(`Review history: ${review.label}. A workflow flag alone does not establish a retained review.`);
    if (!review.confirmed) basis.unshift("A usable citizen confirmation timestamp is not retained.");
    const reviewNeeded = !review.reviewComplete || !review.confirmed || visualPending > 0 || pendingQuestions.length > 0;
    if (reviewNeeded) {
      const visualPriority = visualPending > 0 || visualUncertain > 0 || visualDisagreed > 0;
      const title = historyGap ? "Inspect the review history" : !review.confirmed ? "Inspect citizen confirmation" : needsRequest ? "Respond to the reviewer" : visualPriority ? "Inspect the AI / human evidence" : pendingQuestions.length || unanswered.length || measurementFlags.length ? "Clarify the retained evidence" : "Complete the human review";
      const reason = historyGap ? `${review.label}: the stored reviewed flag is not supported by a usable, matching latest review event.` : !review.confirmed ? "The retained confirmation timestamp is missing or invalid; inspect the original record before treating it as citizen-confirmed." : needsRequest ? request?.note || "A human reviewer requested more information." : visualPriority ? `${visualPending} unjudged, ${visualUncertain} uncertain and ${visualDisagreed} disputed visual candidate${visualPending + visualUncertain + visualDisagreed === 1 ? "" : "s"}.` : pendingQuestions.length || unanswered.length || measurementFlags.length ? `${pendingQuestions.length} pending clarification${pendingQuestions.length === 1 ? "" : "s"}, ${unanswered.length} unanswered follow-up${unanswered.length === 1 ? "" : "s"} and ${measurementFlags.length} measurement metadata check${measurementFlags.length === 1 ? "" : "s"}.` : "This citizen-confirmed record is waiting for a reasoned human review.";
      missions.push({ ...base, id: `review:${report.id}`, action: "review", priority: historyGap || !review.confirmed || needsRequest || visualPriority ? "review_first" : "clarify_next", title, reason,
        nextAction: field?.reference ? "Inspect the credited historical photo and original words. Record what remains unknown; this is not a new field visit." : "Inspect the original evidence and retained questions. Record a reasoned judgment; uncertainty is a valid outcome.",
        basis: basis.length ? basis : ["Workflow state: awaiting human review."] });
    }

    if (!field?.reference && !followed.has(report.id)) {
      const annotatedVisit = field?.annotations?.filter((annotation) => annotation.category === "followup") ?? [];
      const missingPhoto = photos.length === 0;
      const allPhotosLimited = photos.length > 0 && limitedPhotos.length === photos.length;
      if (missingPhoto || allPhotosLimited || annotatedVisit.length) {
        const visitBasis = missingPhoto ? ["No still photograph is retained in this record. A written observation or video is still valid evidence."] : allPhotosLimited ? limitedPhotos.map((photo) => `Retained image check: ${photo.quality.warnings.join(" ")}`) : [];
        visitBasis.push(...annotatedVisit.map((annotation) => `Human follow-up note: ${annotation.note}`));
        missions.push({ ...base, id: `visit:${report.id}`, action: "followup", priority: "optional_visit",
          title: annotatedVisit.length ? "Plan a linked follow-up visit" : missingPhoto ? "Add a fresh photo visit" : "Try a clearer repeat photograph",
          reason: annotatedVisit.length ? "A retained human photo note asks for a follow-up." : missingPhoto ? "A fresh still image could make the next observation easier to inspect." : "Every retained still image has a usability warning; a clearer repeat may help a reviewer.",
          nextAction: "If safe and useful, start a linked observation with a new time, note and photo. Coordinates and instruments are optional; previous evidence is not copied.", basis: visitBasis });
      }
    }
  }
  const order = { review_first: 0, clarify_next: 1, optional_visit: 2 };
  return missions.sort((a, b) => order[a.priority] - order[b.priority] || (creationTimes.get(a.reportId)! - creationTimes.get(b.reportId)!) || a.id.localeCompare(b.id));
}
