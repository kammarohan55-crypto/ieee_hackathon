import { assess, type Issue, type Report } from "./assessment";
import { measurementWarnings } from "./field";
import { evidenceTimePrecision, validRecordedTimestamp } from "./references";

/** Recheck the retained original without changing any citizen or reviewer decision. */
export function replayReportRules(report: Report, fallbackNow = new Date()) {
  const creationTime = validRecordedTimestamp(report.createdAt) ? Date.parse(report.createdAt) : NaN;
  const referenceTime = Number.isFinite(creationTime)
    ? new Date(creationTime)
    : fallbackNow;
  return {
    assessment: assess(report.original, referenceTime),
    referenceTime: referenceTime.toISOString(),
    referenceSource: Number.isFinite(creationTime)
      ? "record_creation" as const
      : "current_time" as const,
  };
}

/** Exact source spans establish provenance, not semantic or scientific correctness. */
export function issueSourceSpan(original: Report["original"], issue: Issue) {
  const value = original[issue.field];
  const text = typeof value === "string" ? value : String(value);
  const start = issue.quote ? text.indexOf(issue.quote) : -1;
  return start < 0 ? undefined : {
    before: text.slice(0, start),
    quote: text.slice(start, start + issue.quote.length),
    after: text.slice(start + issue.quote.length),
  };
}

export function labRecordSummary(report: Report) {
  const findings = report.field?.media.flatMap((media) =>
    (media.visual?.findings ?? []).map((finding) => ({ mediaId: media.id, finding })),
  ) ?? [];
  const judgments = findings.map(({ mediaId, finding }) =>
    report.field?.dispositions.filter((entry) =>
      entry.mediaId === mediaId && entry.finding === finding.kind,
    ).at(-1),
  );
  return {
    ruleChecks: report.assessment.issues.filter((issue) => issue.source === "rules").length,
    textAICandidates: report.assessment.issues.filter((issue) => issue.source === "ai").length,
    visualAICandidates: findings.length,
    unresolvedText: report.assessment.issues.filter((issue) =>
      issue.decision === "pending" || issue.decision === "uncertain",
    ).length,
    visualDisagreements: judgments.filter((judgment) => judgment?.decision === "disagrees").length,
    visualUnjudged: judgments.filter((judgment) => !judgment).length,
    visualUncertain: judgments.filter((judgment) => judgment?.decision === "uncertain").length,
    visualNeedsJudgment: judgments.filter((judgment) =>
      !judgment || judgment.decision === "uncertain",
    ).length,
  };
}

/** Read-only workflow brief. Presence of evidence or approval never proves scientific truth. */
export function labDecisionBrief(report: Report) {
  const summary = labRecordSummary(report);
  const latestReview = report.reviewHistory.at(-1);
  const confirmed = validRecordedTimestamp(report.confirmedAt);
  const reviewTimestampKnown = !!latestReview && validRecordedTimestamp(latestReview.at);
  const reviewRecorded = !!latestReview && !!latestReview.note.trim()
    && reviewTimestampKnown;
  const statusMismatch = !!latestReview && latestReview.action !== report.status;
  const gaps: string[] = [];
  if (!report.original.site.trim()) gaps.push("The original site label is unknown.");
  if (!report.original.note.trim()) gaps.push("The original written observation is empty.");
  const observationPrecision = evidenceTimePrecision(report.original.observedAt);
  if (observationPrecision === "missing" || observationPrecision === "invalid") {
    gaps.push("The observation time is missing or cannot be interpreted.");
  }
  if (observationPrecision === "zone_unknown") gaps.push("The observation time zone is unknown; no observation instant is inferred.");
  if (!confirmed) gaps.push("A usable citizen confirmation timestamp is not retained.");
  if (summary.unresolvedText) gaps.push(`${summary.unresolvedText} text check(s) remain pending or explicitly uncertain.`);
  if (summary.visualUnjudged) gaps.push(`${summary.visualUnjudged} visual candidate(s) have no retained human judgment.`);
  if (summary.visualUncertain) gaps.push(`${summary.visualUncertain} visual candidate(s) retain an uncertain human judgment.`);
  if (summary.visualDisagreements) gaps.push(`${summary.visualDisagreements} AI/human visual disagreement(s) are retained for interpretation.`);
  const readingWarnings = report.field?.measurements.filter((reading) => measurementWarnings(reading).length).length ?? 0;
  if (readingWarnings) gaps.push(`${readingWarnings} supplied instrument reading(s) have metadata or input-plausibility warnings.`);
  const limitedMedia = report.field?.media.filter((media) => media.quality.warnings.length).length ?? 0;
  if (limitedMedia) gaps.push(`${limitedMedia} retained media file(s) have image-usability limitations.`);
  if (!reviewRecorded) gaps.push(latestReview ? "The latest review event lacks a usable timestamp or explanation." : "No human review event is retained.");
  if (statusMismatch) gaps.push("The workflow status differs from the latest retained review action; inspect the history.");
  const reviewComplete = reviewRecorded && !statusMismatch && latestReview?.action === "reviewed";
  const label = statusMismatch ? "History needs inspection"
    : latestReview?.action === "needs_information" && reviewRecorded ? "Information requested"
    : reviewComplete ? gaps.length ? "Reviewed · limits retained" : "Human review recorded"
    : "Human review pending";
  return { ...summary, confirmed, latestReview, reviewTimestampKnown, reviewRecorded, reviewComplete, statusMismatch, gaps, label };
}
