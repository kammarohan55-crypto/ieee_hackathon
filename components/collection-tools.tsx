"use client";
import { useRef, useState } from "react";
import { ArrowDownToLine, ArrowRight, CheckCircle2, FileJson, FolderOpen, LoaderCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import type { Report } from "@/lib/assessment";
import { downloadFile, exportCSV, exportGeoJSON } from "@/lib/field";
import { addMediaBatch, readMedia } from "@/lib/media-store";
import { createFieldPack, digestBlob, MAX_TRANSFER_BYTES, mergeRecords, prepareImport, type PreparedImport } from "@/lib/workspace";

export function CollectionTools({ records, onImport, disabled = false }: { records: Report[]; onImport: (records: Report[]) => void; disabled?: boolean }) {
  const [includeMedia, setIncludeMedia] = useState(true), [busy, setBusy] = useState("");
  const [error, setError] = useState(""), [message, setMessage] = useState("");
  const [preview, setPreview] = useState<PreparedImport | null>(null);
  const lock = useRef(false);
  const merged = preview ? mergeRecordsPreview(records, preview.records) : null;
  async function backup() {
    if (lock.current) return;
    lock.current = true; setBusy("export"); setError(""); setMessage("");
    try {
      const pack = await createFieldPack(records, readMedia, includeMedia);
      const data = JSON.stringify(pack);
      if (new Blob([data]).size > MAX_TRANSFER_BYTES) throw new Error("Backup exceeds 64 MB. Export without media or download individual receipts.");
      downloadFile(data, `aqualens-field-pack-${new Date().toISOString().slice(0, 10)}.json`);
      setMessage(`Backup download requested: ${pack.records.length} records, ${pack.media.length} original files included${pack.missingMedia.length ? `, ${pack.missingMedia.length} media files not included` : ""}.`);
    } catch (error) { setError(friendlyError(error)); }
    finally { setBusy(""); lock.current = false; }
  }
  async function inspect(file: File) {
    if (lock.current) return;
    lock.current = true; setBusy("inspect"); setError(""); setMessage(""); setPreview(null);
    try {
      if (file.size > MAX_TRANSFER_BYTES) throw new Error("Choose a JSON file smaller than 64 MB.");
      setPreview(await prepareImport(await file.text()));
    } catch (error) { setError(friendlyError(error)); }
    finally { setBusy(""); lock.current = false; }
  }
  async function restore() {
    if (!preview || lock.current || disabled) return;
    lock.current = true; setBusy("import"); setError("");
    try {
      const result = mergeRecords(records, preview.records);
      // Only restore media used by an added or byte-for-byte identical record.
      const permitted = new Set([...result.added, ...records.filter((record) => result.duplicates.includes(record.id))]
        .flatMap((record) => record.field?.media.map((media) => media.id) ?? []));
      const additions: { id: string; blob: Blob }[] = [];
      for (const media of preview.media) {
        if (!permitted.has(media.id)) continue;
        const previous = await readMedia(media.id);
        if (previous && await digestBlob(previous) !== media.sha256) throw new Error("An existing local media file has the same ID but different bytes. Import stopped; existing evidence is unchanged.");
        if (!previous) additions.push(media);
      }
      await addMediaBatch(additions);
      onImport(result.records);
      setPreview(null);
      setMessage(`${result.added.length} observations imported; ${additions.length} original files restored. ${result.duplicates.length} identical records skipped; ${result.conflicts.length} conflicting records kept unchanged.`);
      toast.success("Field pack imported");
    } catch (error) { setError(friendlyError(error)); }
    finally { setBusy(""); lock.current = false; }
  }
  return <section className="collection-tools" aria-labelledby="collection-tools-title">
    <div className="section-heading"><div><p className="eyebrow">YOUR EVIDENCE, TO GO</p><h2 id="collection-tools-title">A field pack that travels.</h2></div><span className="tag"><FolderOpen size={14} /> {records.length} local records</span></div>
    <div className="transfer-grid"><article><span className="transfer-icon"><ArrowDownToLine size={25} /></span><h3>Take your work with you.</h3><p>Back up original notes, decisions and photos in one file. Restore it in another browser or hand it to a teammate.</p><label className="transfer-checkbox"><input type="checkbox" checked={includeMedia} onChange={(event) => setIncludeMedia(event.target.checked)} disabled={!!busy} />Include available original photos & clips</label><button className="btn primary" onClick={() => void backup()} disabled={!records.length || !!busy}>{busy === "export" ? <LoaderCircle size={16} className="spin" /> : <ArrowDownToLine size={16} />}Download field pack</button><small>Up to 36 MB embedded media. Precise locations and notes are included; share only with your intended reviewers.</small><div className="transfer-formats"><button disabled={!records.length || !!busy} onClick={() => downloadFile(exportCSV(records), "aqualens-observations.csv", "text/csv")}>Export CSV</button><button disabled={!records.length || !!busy} onClick={() => downloadFile(JSON.stringify(exportGeoJSON(records), null, 2), "aqualens-observations.geojson", "application/geo+json")}>Export GeoJSON</button></div></article>
    <article className="import-card"><span className="transfer-icon"><Upload size={25} /></span><h3>Pick up where you left off.</h3><p>Import an AquaLens field pack or a JSON receipt. Inspect the contents before adding them to this workspace.</p><label className={`import-drop${busy || disabled ? " is-disabled" : ""}`}><FileJson size={28} /><strong>{busy === "inspect" ? "Checking file & media…" : "Choose a JSON file"}</strong><span>Field pack, receipt or receipt collection · up to 64 MB</span><input type="file" accept="application/json,.json" disabled={!!busy || disabled} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void inspect(file); }} /></label><small>Media hashes are checked. Existing records are never overwritten. Import does not authenticate the observer.</small></article></div>
    {preview && merged && <div className="import-preview" aria-live="polite"><div><p className="eyebrow">IMPORT PREVIEW</p><h3>{preview.records.length} observations · {preview.media.length} verified file hashes</h3><p>{merged.error || `${merged.added} new · ${merged.duplicates} already here · ${merged.conflicts} conflicts to skip`}</p>{preview.missingMedia > 0 && <p>{preview.missingMedia} referenced files are not in this backup. Their metadata remains available.</p>}</div><div className="button-row"><button className="btn secondary" disabled={!!busy} onClick={() => setPreview(null)}>Cancel</button><button className="btn primary" disabled={!!busy || !!merged.error || disabled} onClick={() => void restore()}>{busy === "import" ? <LoaderCircle size={16} className="spin" /> : <ArrowRight size={16} />}Import evidence</button></div></div>}
    {message && <p className="transfer-result" role="status"><CheckCircle2 size={19} />{message}</p>}{error && <p className="notice error" role="alert">{error}</p>}
  </section>;
}
function mergeRecordsPreview(existing: Report[], incoming: Report[]) {
  try { const result = mergeRecords(existing, incoming); return { added: result.added.length, duplicates: result.duplicates.length, conflicts: result.conflicts.length, error: "" }; }
  catch (error) { return { added: 0, duplicates: 0, conflicts: 0, error: friendlyError(error) }; }
}
function friendlyError(error: unknown) {
  if (error instanceof Error && error.name === "ZodError") return "The file does not match the AquaLens record schema. Nothing was imported.";
  return error instanceof Error ? error.message : "The file could not be processed. Your existing records are unchanged.";
}
