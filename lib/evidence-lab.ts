import { assess, type Issue, type Report } from "./assessment";

/** Recheck the retained original without changing any citizen or reviewer decision. */
export function replayReportRules(report: Report, fallbackNow = new Date()) {
  const creationTime = Date.parse(report.createdAt);
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
    visualNeedsJudgment: judgments.filter((judgment) =>
      !judgment || judgment.decision === "uncertain",
    ).length,
  };
}
