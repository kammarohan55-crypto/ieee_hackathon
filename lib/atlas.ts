import type { Report } from "./assessment";
import { measurementWarnings, type MediaEvidence } from "./field";

// Prefix site values so a real site called "all" is still selectable.
export const siteFilterValue = (site: string) => `site:${site}`;
export const isSyntheticRecord = (report: Report) => report.original.synthetic || !!report.field?.media.some((m) => m.origin === "illustration");
export function filterAtlasRecords(reports: Report[], filter: string, includeSynthetic = true) {
  const site = filter.startsWith("site:") ? filter.slice(5) : null;
  const validSite = site !== null && reports.some((r) => r.original.site === site) ? site : null;
  const time = (r: Report) => Number.isFinite(Date.parse(r.original.observedAt)) ? Date.parse(r.original.observedAt) : Infinity;
  return reports.filter((r) => (validSite === null || r.original.site === validSite) && (includeSynthetic || !isSyntheticRecord(r)))
    .sort((a, b) => time(a) - time(b) || a.id.localeCompare(b.id));
}
export type AtlasPhoto = { report: Report; media: MediaEvidence };
export function atlasPhotos(reports: Report[]): AtlasPhoto[] {
  const unique = new Map<string, AtlasPhoto>();
  for (const report of reports) for (const media of report.field?.media ?? []) {
    if (media.kind === "photo" && !unique.has(media.id)) unique.set(media.id, { report, media });
  }
  return [...unique.values()];
}
export function comparisonPair(photos: AtlasPhoto[], pair: string[]) {
  const before = photos.find((p) => p.media.id === pair[0]) ?? photos[0];
  const selectedAfter = photos.find((p) => p.media.id === pair[1]);
  const after = selectedAfter && selectedAfter.media.id !== before?.media.id ? selectedAfter : photos.findLast((p) => p.media.id !== before?.media.id);
  return { before, after };
}
export function collectionCoverage(reports: Report[]) {
  return [
    { key: "media", label: "Media retained", count: reports.filter((r) => r.field?.media.length).length, detail: "Records with photo or video metadata" },
    { key: "location", label: "Location recorded", count: reports.filter((r) => r.field?.coordinates).length, detail: "Records with explicit coordinates" },
    { key: "readings", label: "Reading metadata", count: reports.filter((r) => r.field?.measurements.some((m) => !measurementWarnings(m).length)).length, detail: "At least one reading passes metadata checks" },
    { key: "review", label: "Human reviewed", count: reports.filter((r) => r.status === "reviewed").length, detail: "Local demo review workflow completed" },
  ];
}

export function comparablePH(reports: Report[], filter: string) {
  if (!filter.startsWith("site:") || !reports.some((r) => siteFilterValue(r.original.site) === filter)) return [];
  return filterAtlasRecords(reports, filter, false).flatMap((report) => {
    const timestamp = Date.parse(report.original.observedAt);
    if (!Number.isFinite(timestamp)) return [];
    return (report.field?.measurements ?? []).filter((m) => m.parameter === "pH" && !measurementWarnings(m).length).slice(0, 1)
      .map((m) => ({ timestamp, value: m.value, instrument: m.instrument }));
  });
}

export function hasComparablePH(readings: ReturnType<typeof comparablePH>) {
  return readings.length >= 3 && new Set(readings.map((m) => m.timestamp)).size >= 3 && new Set(readings.map((m) => m.instrument)).size === 1;
}
