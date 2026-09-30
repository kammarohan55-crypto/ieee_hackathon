import type { Report } from "./assessment";
import { fieldQuestions, measurementWarnings } from "./field";

export type ObservationSite = {
  /** Exact citizen-entered label; this grouping does not establish site identity. */
  key: string;
  label: string;
  records: Report[];
  reviewed: number;
  synthetic: number;
  media: number;
};

export function observationTimestamp(report: Report): number | undefined {
  const value = Date.parse(report.original.observedAt);
  return Number.isFinite(value) ? value : undefined;
}

/** Newest observations first, unknown observation times last, stable on ties. */
export function groupObservationSites(records: Report[]): ObservationSite[] {
  const groups = new Map<string, Report[]>();
  for (const record of records) {
    const key = record.original.site;
    const group = groups.get(key) ?? [];
    group.push(record);
    groups.set(key, group);
  }
  return [...groups].map(([key, group]) => {
    const sorted = [...group].sort((a, b) => {
      const aTime = observationTimestamp(a);
      const bTime = observationTimestamp(b);
      if (aTime === undefined) return bTime === undefined ? 0 : 1;
      if (bTime === undefined) return -1;
      return bTime - aTime;
    });
    return {
      key,
      label: key.trim() || "Site label not supplied",
      records: sorted,
      reviewed: group.filter((r) => r.status === "reviewed").length,
      synthetic: group.filter((r) => r.original.synthetic || r.field?.media.some((m) => m.origin === "illustration")).length,
      media: group.reduce((sum, r) => sum + (r.field?.media.length ?? 0), 0),
    };
  }).sort((a, b) => {
    const aTime = observationTimestamp(a.records[0]);
    const bTime = observationTimestamp(b.records[0]);
    if (aTime === undefined) return bTime === undefined ? a.label.localeCompare(b.label) : 1;
    if (bTime === undefined) return -1;
    return bTime - aTime || a.label.localeCompare(b.label);
  });
}

export function recordEvidenceGaps(report: Report): string[] {
  const gaps = new Set<string>();
  const field = report.field;
  if (!report.original.site.trim()) gaps.add("Site label is missing");
  if (observationTimestamp(report) === undefined) gaps.add("Observation time is unknown or invalid");
  if (!report.original.note.trim()) gaps.add("Original observation note is missing");
  if (!field?.coordinates) gaps.add("Coordinates were not supplied");
  if (!field?.media.length) gaps.add("No photo or video retained");
  if (!field?.measurements.length) gaps.add("No instrument measurements supplied");
  for (const issue of report.assessment.issues) {
    if (issue.decision === "pending" || issue.decision === "uncertain") gaps.add(issue.title);
  }
  for (const media of field?.media ?? []) {
    for (const warning of media.quality.warnings) gaps.add(warning);
    for (const finding of media.visual?.findings ?? []) {
      const latest = field?.dispositions.filter((d) => d.mediaId === media.id && d.finding === finding.kind).at(-1);
      if (!latest) gaps.add("Visual AI candidate still needs human judgment");
      else if (latest.decision === "uncertain") gaps.add("A visual AI candidate remains uncertain after human judgment");
    }
  }
  for (const measurement of field?.measurements ?? []) {
    for (const warning of measurementWarnings(measurement)) gaps.add(`${measurement.parameter}: ${warning}`);
  }
  if (field && fieldQuestions(field, report.original.appearance).some((question) => !field.followups.some((answer) => answer.question === question && answer.answer.trim()))) {
    gaps.add("An adaptive follow-up has no recorded answer");
  }
  return [...gaps];
}
