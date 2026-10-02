import type { Report } from "./assessment";
import { isSyntheticRecord } from "./atlas";
import { validRecordedTimestamp } from "./references";

function orderTime(report: Report): number {
  // Unknown zones must not acquire an instant from the viewer's device.
  const time = validRecordedTimestamp(report.original.observedAt) ? report.original.observedAt
    : validRecordedTimestamp(report.createdAt) ? report.createdAt : undefined;
  return time ? Date.parse(time) : 0;
}

/** Explicit record links only; matching site labels never assert the same location. */
export function visitLinks(current: Report, records: Report[]) {
  const eligible = records.filter((record) => !isSyntheticRecord(record) && !record.field?.reference);
  if (isSyntheticRecord(current) || current.field?.reference) return { parent: undefined, missingParent: false, children: [] as Report[] };
  const parentId = current.field?.followupOf;
  const parent = parentId && parentId !== current.id ? eligible.find((record) => record.id === parentId) : undefined;
  const children = eligible.filter((record) => record.id !== current.id && record.field?.followupOf === current.id)
    .sort((a, b) => orderTime(a) - orderTime(b) || a.id.localeCompare(b.id));
  return { parent, missingParent: !!parentId && !parent, children };
}
