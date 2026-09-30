import { openDB } from "idb";
import type { MediaEvidence } from "./field";
const db = () =>
  openDB("aqualens-evidence", 1, {
    upgrade(store) {
      store.createObjectStore("media");
    },
  });
export async function saveMedia(id: string, blob: Blob) {
  const store = await db();
  await store.put("media", blob, id);
}
export async function readMedia(id: string): Promise<Blob | undefined> {
  return (await db()).get("media", id);
}
export async function inspectImage(
  blob: Blob,
): Promise<{
  quality: MediaEvidence["quality"];
  width: number;
  height: number;
}> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  const scale = 192 / Math.max(bitmap.width, bitmap.height);
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const luminance: number[] = [];
  let total = 0,
    edges = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const l =
      0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
    luminance.push(l);
    total += l;
  }
  for (let i = 0; i < luminance.length; i++)
    if (i % canvas.width) edges += Math.abs(luminance[i] - luminance[i - 1]);
  const brightness = Math.round(total / luminance.length),
    edgeDetail = Math.round((edges / luminance.length) * 10) / 10;
  const warnings: string[] = [];
  if (brightness < 35) warnings.push("Very dark frame");
  if (brightness > 225) warnings.push("Very bright frame; possible glare");
  if (edgeDetail < 3)
    warnings.push("Little edge detail; possible blur or a smooth scene");
  if (Math.min(bitmap.width, bitmap.height) < 480)
    warnings.push("Low image resolution");
  const result = {
    width: bitmap.width,
    height: bitmap.height,
    quality: {
      brightness,
      edgeDetail,
      warnings,
      method: "canvas-luma-v1" as const,
    },
  };
  bitmap.close();
  return result;
}
export async function hashBlob(blob: Blob) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()),
    ),
  ]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
export async function imageForAI(blob: Blob) {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(bitmap.width * scale));
  c.height = Math.max(1, Math.round(bitmap.height * scale));
  c.getContext("2d")!.drawImage(bitmap, 0, 0, c.width, c.height);
  bitmap.close();
  return c.toDataURL("image/jpeg", 0.8).split(",")[1];
}
