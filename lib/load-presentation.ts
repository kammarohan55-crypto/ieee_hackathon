import { buildPresentationRecords } from "./presentation-workspace";
import { europeanBundleSchema, EUROPEAN_CONTEXT_ASSET } from "./european-sites";
import { referencePhotos, referenceDimensions } from "./references";
import { hashBlob, inspectImage, readMedia, addMediaBatch } from "./media-store";
import { withImportLock } from "./workspace";
import type { MediaEvidence } from "./field";

// Uses the exact same byte retention and canvas checks as a user's upload.
// No provider request, fabricated measurement, private file or personal store access.
export async function preparePresentation(signal: AbortSignal) {
  const response = await fetch(EUROPEAN_CONTEXT_ASSET, { signal });
  if (!response.ok) throw new Error("Recorded source context is unavailable. Reload when the source kit is accessible.");
  const bundle = europeanBundleSchema.parse(await response.json());
  const prepared: { id: string; blob: Blob }[] = [], media: MediaEvidence[] = [];
  for (const photo of referencePhotos) {
    signal.throwIfAborted();
    const id = `presentation-${photo.id}`, stored = await readMedia(id);
    let blob = stored;
    if (!blob) {
      const image = await fetch(photo.src, { signal });
      if (!image.ok) throw new Error(`Could not prepare ${photo.title}. Reload to retry; your personal records are unchanged.`);
      blob = await image.blob(); prepared.push({ id, blob });
    }
    if (await hashBlob(blob) !== photo.sha256) throw new Error(`Source bytes differ for ${photo.title}; presentation preparation stopped.`);
    const checks = await inspectImage(blob), dimensions = referenceDimensions(photo);
    if (checks.width !== dimensions.width || checks.height !== dimensions.height) throw new Error(`Source dimensions differ for ${photo.title}.`);
    media.push({ id, kind: "photo", mime: blob.type || "image/jpeg", bytes: blob.size, sha256: photo.sha256,
      createdAt: photo.capturedDate, origin: "public_reference", filename: `${photo.id}.jpg`, ...checks });
  }
  return withImportLock(async () => {
    signal.throwIfAborted();
    // Recheck within the lock: a second presentation tab may have finished first.
    const missing = [];
    for (const file of prepared) {
      const existing = await readMedia(file.id);
      if (!existing) missing.push(file);
      else if (await hashBlob(existing) !== referencePhotos.find((p) => `presentation-${p.id}` === file.id)!.sha256) throw new Error("Conflicting source media; no bytes were overwritten.");
    }
    if (missing.length) await addMediaBatch(missing);
    return buildPresentationRecords(media, bundle);
  });
}
