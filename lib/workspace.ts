import { z } from "zod";
import { reportSchema, type Report } from "./assessment";
import { assertReferenceRecord } from "./field";
import { isSyntheticRecord } from "./atlas";

export const WORKSPACE_KEY = "streamcheck-workspace-v1";
export const LEGACY_ARCHIVE_KEY = "aqualens-legacy-samples-v1";
export const MAX_REPORTS = 500;
export const MAX_TRANSFER_BYTES = 64 * 1024 * 1024;
const MAX_MEDIA_BYTES = 36 * 1024 * 1024;
const safeMime = /^(image\/(jpeg|png|webp)|video\/(webm|mp4|ogg))(;codecs=[\w., -]+)?$/i;

export function realRecords(records: Report[]) {
  return records.filter((report) => !isSyntheticRecord(report));
}

export function parseWorkspace(value: unknown): Report[] {
  const records = z.array(reportSchema).max(MAX_REPORTS).parse(value);
  records.forEach(assertReferenceRecord);
  return records;
}

// Stable comparison prevents property order from creating false conflicts.
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value)
    .filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  return JSON.stringify(value);
}

export function mergeRecords(existing: Report[], incoming: Report[]) {
  const byId = new Map(existing.map((report) => [report.id, report]));
  const added: Report[] = [], duplicates: string[] = [], conflicts: string[] = [];
  for (const report of incoming) {
    const previous = byId.get(report.id);
    if (previous) {
      (canonical(previous) === canonical(report) ? duplicates : conflicts).push(report.id);
    } else {
      byId.set(report.id, report);
      added.push(report);
    }
  }
  if (byId.size > MAX_REPORTS) throw new Error(`A workspace supports up to ${MAX_REPORTS} records. Keep this file as a separate backup.`);
  mediaIndex([...added, ...existing]);
  return { records: [...added, ...existing], added, duplicates, conflicts };
}

const mediaSchema = z.object({
  id: z.string().min(1).max(200),
  mime: z.string().regex(safeMime),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  data: z.string().max(36 * 1024 * 1024).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
}).strict();
export type PackedMedia = z.infer<typeof mediaSchema>;
export type FieldPack = {
  format: "aqualens-field-pack";
  version: "1.0";
  exportedAt: string;
  records: Report[];
  media: PackedMedia[];
  missingMedia: string[];
};
export type PreparedImport = { records: Report[]; media: { id: string; blob: Blob; sha256: string }[]; missingMedia: number };

export async function digestBlob(blob: Blob) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()))]
    .map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function mediaIndex(records: Report[]) {
  const index = new Map<string, NonNullable<Report["field"]>["media"][number]>();
  for (const report of records) for (const media of report.field?.media ?? []) {
    const previous = index.get(media.id);
    if (previous && (previous.sha256 !== media.sha256 || previous.bytes !== media.bytes || previous.mime !== media.mime || previous.kind !== media.kind))
      throw new Error("Two records disagree about the same media file. No data has been imported.");
    index.set(media.id, media);
  }
  return index;
}

export async function prepareImport(text: string): Promise<PreparedImport> {
  if (new Blob([text]).size > MAX_TRANSFER_BYTES) throw new Error("Use a JSON backup smaller than 64 MB.");
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new Error("This file is not valid JSON. Choose an AquaLens backup or receipt."); }
  const envelope = z.object({ format: z.string() }).passthrough().safeParse(raw);
  if (!envelope.success) throw new Error("Choose an AquaLens field pack, receipt, or observation collection.");
  const value = envelope.data;
  let records: Report[], packed: PackedMedia[] = [];
  if (value.format === "aqualens-field-pack") {
    const pack = z.object({ version: z.literal("1.0"), records: z.array(reportSchema).max(MAX_REPORTS),
      media: z.array(mediaSchema).max(2000), missingMedia: z.array(z.string()).max(2000) }).parse(value);
    records = pack.records; packed = pack.media;
  } else if (["aqualens-decision-receipt", "streamcheck-evidence-record"].includes(value.format)) {
    records = [reportSchema.parse(value.report)];
  } else if (value.format === "aqualens-observation-collection" && Array.isArray(value.records)) {
    records = parseWorkspace(value.records.map((entry: unknown) => z.object({ report: reportSchema }).parse(entry).report));
  } else throw new Error("Unsupported backup format or version.");
  records.forEach(assertReferenceRecord);
  if (!records.length) throw new Error("This file has no observations to import.");
  if (records.some(isSyntheticRecord)) throw new Error("This file contains synthetic records or illustrative evidence. Only real observations can be imported.");
  const recordIds = new Set<string>();
  for (const record of records) {
    if (!record.id.trim() || record.id.length > 200 || recordIds.has(record.id)) throw new Error("The file has missing or duplicate record IDs.");
    recordIds.add(record.id);
  }
  const index = mediaIndex(records), seen = new Set<string>();
  const media: PreparedImport["media"] = [];
  let total = 0;
  for (const item of packed) {
    const metadata = index.get(item.id);
    if (!metadata || seen.has(item.id)) throw new Error("The backup has duplicate or unreferenced media.");
    seen.add(item.id);
    const bytes = Uint8Array.from(atob(item.data), (char) => char.charCodeAt(0));
    total += bytes.length;
    if (total > MAX_MEDIA_BYTES) throw new Error("Embedded media exceeds the 36 MB transfer limit.");
    const blob = new Blob([bytes], { type: item.mime });
    if ((metadata.kind === "photo" ? !item.mime.startsWith("image/") : !item.mime.startsWith("video/")) || metadata.bytes !== bytes.length || metadata.mime !== item.mime || metadata.sha256 !== item.sha256 || await digestBlob(blob) !== item.sha256)
      throw new Error("A media integrity check failed. The file does not match its retained SHA-256 digest.");
    media.push({ id: item.id, blob, sha256: item.sha256 });
  }
  return { records, media, missingMedia: index.size - media.length };
}

export async function createFieldPack(records: Report[], getMedia: (id: string) => Promise<Blob | undefined>, includeMedia: boolean): Promise<FieldPack> {
  const source = realRecords(records);
  source.forEach(assertReferenceRecord);
  const pack: FieldPack = { format: "aqualens-field-pack", version: "1.0", exportedAt: new Date().toISOString(), records: source, media: [], missingMedia: [] };
  let total = 0;
  for (const [id, metadata] of mediaIndex(source)) {
    const blob = includeMedia ? await getMedia(id) : undefined;
    if (!blob) { pack.missingMedia.push(id); continue; }
    total += blob.size;
    if (total > MAX_MEDIA_BYTES) throw new Error("Media exceeds 36 MB. Export records only and download originals from their receipts.");
    if (!safeMime.test(blob.type) || blob.type !== metadata.mime || blob.size !== metadata.bytes || await digestBlob(blob) !== metadata.sha256)
      throw new Error("A stored file does not match its metadata. Export records only, then inspect that record.");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 16384) binary += String.fromCharCode(...bytes.subarray(offset, offset + 16384));
    pack.media.push({ id, mime: blob.type, sha256: metadata.sha256, data: btoa(binary) });
  }
  return pack;
}

export function searchReports(records: Report[], query: string, status: string) {
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return records.filter((record) => (status === "all" || record.status === status) && words.every((word) =>
    `${record.original.site} ${record.original.note} ${record.id}`.toLocaleLowerCase().includes(word)));
}
