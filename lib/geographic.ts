import type { Report } from "./assessment";
import { isSyntheticRecord } from "./atlas";

export const MERCATOR_LATITUDE_LIMIT = 85.0511287798066;
export type LocationState = "mapped" | "missing" | "invalid" | "polar";
export function locationState(report: Report): LocationState {
  const c = report.field?.coordinates;
  if (!c) return "missing";
  if (!Number.isFinite(c.lat) || !Number.isFinite(c.lon) || Math.abs(c.lat) > 90 || Math.abs(c.lon) > 180) return "invalid";
  return Math.abs(c.lat) > MERCATOR_LATITUDE_LIMIT ? "polar" : "mapped";
}
export const syntheticLocation = (report: Report) => isSyntheticRecord(report) || report.field?.coordinates?.method === "synthetic";
export type LocationGroup = { key: string; lat: number; lon: number; reports: Report[] };
export function geographicGroups(records: Report[]): LocationGroup[] {
  const groups = new Map<string, LocationGroup>();
  for (const report of records) {
    if (locationState(report) !== "mapped") continue;
    const c = report.field!.coordinates!;
    const key = `${c.lat},${c.lon}`;
    const existing = groups.get(key);
    if (existing) existing.reports.push(report);
    else groups.set(key, { key, lat: c.lat, lon: c.lon, reports: [report] });
  }
  return [...groups.values()];
}

// Fit the shortest longitudinal arc so points on opposite sides of the date
// line remain together. No coordinates, distances or waterways are inferred.
export function geographicBounds(groups: LocationGroup[]): [[number, number], [number, number]] | null {
  if (!groups.length) return null;
  const longitudes = groups.map((g) => (g.lon + 360) % 360).sort((a, b) => a - b);
  let largestGap = -1, startIndex = 0;
  for (let i = 0; i < longitudes.length; i++) {
    const next = i === longitudes.length - 1 ? longitudes[0] + 360 : longitudes[i + 1];
    if (next - longitudes[i] > largestGap) {
      largestGap = next - longitudes[i];
      startIndex = (i + 1) % longitudes.length;
    }
  }
  let west = longitudes[startIndex];
  let east = west + 360 - largestGap;
  if (west > 180) { west -= 360; east -= 360; }
  return [[west, Math.min(...groups.map((g) => g.lat))], [east, Math.max(...groups.map((g) => g.lat))]];
}
