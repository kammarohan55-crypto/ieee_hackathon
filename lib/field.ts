import { z } from "zod";
import type { Report } from "./assessment";
import { referencePhotos, type ReferencePhoto } from "./references";
import { recordedProviderSchema } from "./ai-metadata";

export const findingKinds = [
  "brown_appearance",
  "green_appearance",
  "cloudy_appearance",
  "surface_foam",
  "floating_material",
  "bank_litter",
  "vegetation",
  "water_not_visible",
] as const;
export const findingLabels: Record<string, string> = {
  brown_appearance: "Possible brown appearance",
  green_appearance: "Possible green appearance",
  cloudy_appearance: "Possible cloudy appearance",
  surface_foam: "Possible surface foam",
  floating_material: "Possible floating material",
  bank_litter: "Possible litter on the bank",
  vegetation: "Visually observed vegetation",
  water_not_visible: "Water may not be visible",
};
export const visualSchema = z
  .object({
    findings: z
      .array(
        z
          .object({
            kind: z.enum(findingKinds),
            confidence: z.enum(["low", "medium", "high"]),
            region: z.enum([
              "whole_frame",
              "upper",
              "lower",
              "left",
              "right",
              "center",
            ]),
          })
          .strict(),
      )
      .max(5),
  })
  .strict();
export const referenceSchema = z.object({
  id: z.string(), title: z.string(), site: z.string(), src: z.string(),
  author: z.string(), sourceUrl: z.string().url(), license: z.string(), licenseUrl: z.string().url(),
  capturedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), sha256: z.string().regex(/^[a-f0-9]{64}$/), derivative: z.string(),
}).refine((ref) => referencePhotos.some((photo) => Object.entries(ref).every(([key, value]) => photo[key as keyof ReferencePhoto] === value)),
  "Reference credit must match the bundled source catalogue.");
export const photoAnnotationSchema = z.object({
  id: z.string().min(1).max(100), mediaId: z.string().min(1),
  x: z.number().finite().min(0).max(1), y: z.number().finite().min(0).max(1),
  category: z.enum(["detail", "uncertain", "followup"]),
  note: z.string().trim().min(1).max(500), at: z.string().datetime(), actor: z.literal("demo_reviewer"),
});
export const fieldSchema = z.object({
  annotations: z.array(photoAnnotationSchema).max(60).optional(),
  reference: referenceSchema.optional(),
  oneHealth: z.object({
    bank: z.enum(["not_recorded", "vegetated", "bare", "built", "mixed"]),
    wildlife: z.enum(["not_recorded", "seen", "not_seen"]),
    humanUse: z.enum(["not_recorded", "walking", "recreation", "water_collection", "other"]),
    note: z.string().max(1000),
  }).optional(),
  followupOf: z.string().min(1).max(100).optional(),
  coordinates: z
    .object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
      method: z.enum(["device", "manual", "synthetic"]),
      accuracy: z.number().nonnegative().optional(),
    })
    .optional(),
  media: z
    .array(
      z.object({
        id: z.string(),
        kind: z.enum(["photo", "video"]),
        mime: z.string(),
        bytes: z.number().nonnegative(),
        sha256: z.string(),
        createdAt: z.string(),
        width: z.number(),
        height: z.number(),
        origin: z.enum(["camera", "upload", "illustration", "public_reference"]),
        filename: z.string().max(255).optional(),
        quality: z.object({
          brightness: z.number(),
          edgeDetail: z.number(),
          warnings: z.array(z.string()),
          method: z.literal("canvas-luma-v1"),
        }),
        visual: z
          .object({
            model: z.string(),
            provider: recordedProviderSchema.optional(),
            at: z.string(),
            findings: visualSchema.shape.findings,
          })
          .optional(),
      }),
    )
    .max(4),
  measurements: z
    .array(
      z.object({
        parameter: z.enum(["pH", "temperature", "conductivity", "turbidity"]),
        value: z.number().finite(),
        unit: z.string().max(20),
        instrument: z.string().max(100),
        calibration: z.enum(["checked", "unknown"]),
        method: z.literal("citizen_instrument"),
      }),
    )
    .max(8),
  followups: z
    .array(z.object({ question: z.string(), answer: z.string().max(1000) }))
    .max(20),
  dispositions: z
    .array(
      z.object({
        mediaId: z.string(),
        finding: z.enum(findingKinds),
        decision: z.enum(["supports", "disagrees", "uncertain"]),
        reason: z.string().min(1).max(1000),
        at: z.string(),
        actor: z.literal("demo_reviewer"),
      }),
    )
    .max(100),
});
export type FieldEvidence = z.infer<typeof fieldSchema>;
export type MediaEvidence = FieldEvidence["media"][number];
export const newField = (): FieldEvidence => ({
  media: [],
  measurements: [],
  followups: [],
  dispositions: [],
});
export function createReferenceDraft(photo: ReferencePhoto) {
  return {
    draft: { site: photo.site, observedAt: photo.capturedDate, note: "", appearance: "unsure" as const, synthetic: false },
    field: { ...newField(), reference: referenceSchema.parse(photo) },
  };
}
// Cross-field integrity is checked for restored drafts, saved records and every transfer.
export function assertReferenceRecord(report: Pick<Report, "original" | "field">) {
  const f = report.field, ref = f?.reference;
  if (!ref) {
    if (f?.media.some((m) => m.origin === "public_reference" || referencePhotos.some((p) => p.sha256 === m.sha256)))
      throw new Error("A public reference photo must retain its source attribution.");
    return;
  }
  referenceSchema.parse(ref);
  if (report.original.observedAt !== ref.capturedDate || report.original.site !== ref.site)
    throw new Error("Keep the historical photo's source date and location unchanged.");
  if (f.coordinates || f.measurements.length || f.oneHealth || f.followupOf)
    throw new Error("A historical photo review cannot contain new field measurements or visit context.");
  if (f.media.length !== 1 || f.media[0].origin !== "public_reference" || f.media[0].kind !== "photo" || f.media[0].sha256 !== ref.sha256)
    throw new Error("A historical photo review must retain its credited source image.");
}
export type PhotoAnnotation = z.infer<typeof photoAnnotationSchema>;
export type PhotoAnnotationInput = Pick<PhotoAnnotation, "mediaId" | "x" | "y" | "category" | "note">;
export function assertPhotoAnnotations(report: Pick<Report, "field">) {
  const ids = new Set<string>();
  for (const annotation of report.field?.annotations ?? []) {
    photoAnnotationSchema.parse(annotation);
    if (ids.has(annotation.id)) throw new Error("Photo notes must have unique IDs.");
    ids.add(annotation.id);
    if (!report.field?.media.some((m) => m.id === annotation.mediaId && m.kind === "photo"))
      throw new Error("A photo note must refer to a photograph in this record.");
  }
}
export function addPhotoAnnotation(report: Report, input: PhotoAnnotationInput, now = new Date(), id = crypto.randomUUID()): Report {
  const field = report.field;
  if (!field?.media.some((m) => m.id === input.mediaId && m.kind === "photo")) throw new Error("Choose a retained photograph before adding a visual note.");
  if ((field.annotations?.length ?? 0) >= 60) throw new Error("This record has reached its 60-note limit. Export its receipt to continue elsewhere.");
  const annotation = photoAnnotationSchema.parse({ ...input, id, at: now.toISOString(), actor: "demo_reviewer" });
  const next: Report = { ...report, status: "awaiting_review", field: { ...field, annotations: [...(field.annotations ?? []), annotation] },
    history: [...report.history, { at: annotation.at, action: "photo_annotation", detail: `Visual note (${annotation.category}): ${annotation.note} Review reopened. These are human notes, not AI detections or geographic coordinates.` }] };
  assertPhotoAnnotations(next);
  return next;
}
export function createFollowupDraft(source: Report) {
  return {
    draft: {
      site: source.original.site, observedAt: "", note: "", appearance: "unsure" as const,
      synthetic: source.original.synthetic || !!source.field?.media.some((m) => m.origin === "illustration"),
    },
    field: { ...newField(), followupOf: source.id },
  };
}
export function recordVisualJudgment(
  report: Report,
  judgment: Pick<FieldEvidence["dispositions"][number], "mediaId" | "finding" | "decision" | "reason">,
  now = new Date(),
): Report {
  const field = report.field;
  const candidate = field?.media.find((m) => m.id === judgment.mediaId)
    ?.visual?.findings.some((f) => f.kind === judgment.finding);
  if (!field || !candidate) throw new Error("This judgment must refer to a retained AI candidate.");
  if (field.dispositions.length >= 100) throw new Error("This record has reached its judgment history limit. Export it before continuing elsewhere.");
  const entry = fieldSchema.shape.dispositions.element.parse({
    ...judgment, reason: judgment.reason.trim(), at: now.toISOString(), actor: "demo_reviewer",
  });
  return {
    ...report,
    // A later judgment requires a fresh review; previous decisions remain in history.
    status: "awaiting_review",
    field: { ...field, dispositions: [...field.dispositions, entry] },
    history: [...report.history, {
      at: entry.at, action: "visual_human_judgment",
      detail: `${findingLabels[entry.finding]}: ${entry.decision}. ${entry.reason} Review reopened.`,
    }],
  };
}
export const units = {
  pH: "pH",
  temperature: "°C",
  conductivity: "µS/cm",
  turbidity: "NTU",
};
export function measurementWarnings(
  m: FieldEvidence["measurements"][number],
): string[] {
  const flags: string[] = [];
  if (m.unit !== units[m.parameter])
    flags.push(
      `Expected ${units[m.parameter]}; check the unit before comparison.`,
    );
  if (!m.instrument.trim()) flags.push("Instrument or method is missing.");
  if (m.calibration !== "checked") flags.push("Calibration is unconfirmed.");
  // Broad input plausibility bounds, not environmental/ecological thresholds.
  if (
    (m.parameter === "pH" && (m.value < 0 || m.value > 14)) ||
    (m.parameter === "temperature" && (m.value < -5 || m.value > 60)) ||
    (["conductivity", "turbidity"].includes(m.parameter) && m.value < 0)
  )
    flags.push(
      "Outside this prototype’s input plausibility range; verify transcription and instrument range.",
    );
  return flags;
}
export function fieldQuestions(
  field: FieldEvidence,
  appearance: string,
): string[] {
  const questions = new Set<string>();
  for (const media of field.media) {
    if (media.quality.warnings.length)
      questions.add(
        field.reference ? "Image limitations were flagged. What can you see in this historical photo, and what remains unclear?" : "Image limitations were flagged. What could not be seen clearly, and can you retake from a safe position?",
      );
    for (const finding of media.visual?.findings ?? []) {
      const color = finding.kind.replace("_appearance", "");
      if (
        ["brown", "green", "cloudy"].includes(color) &&
        appearance !== "unsure" &&
        appearance !== "other" &&
        color !== appearance
      )
        questions.add(
          `The visual AI suggests possible ${color} appearance while you selected ${appearance}. Could lighting, a different part of the frame, or an AI error explain this?`,
        );
      if (
        ["surface_foam", "floating_material", "bank_litter"].includes(
          finding.kind,
        )
      )
        questions.add(
          `For “${findingLabels[finding.kind]}”, what can you personally confirm, and what remains uncertain? Do not infer a cause.`,
        );
      if (finding.kind === "water_not_visible")
        questions.add(
          "The AI may not see water in this frame. Which part is the stream, or is it obscured?",
        );
    }
  }
  if (field.measurements.some((m) => measurementWarnings(m).length))
    questions.add(
      "Measurement checks need attention. Explain the unit, instrument or calibration uncertainty; do not replace a measured value with a guess.",
    );
  return [...questions].slice(0, 8);
}
export function observationQuality(
  report: Pick<Report, "original" | "assessment"> & { field?: FieldEvidence },
) {
  const f = report.field;
  const checks = [
    {
      label: "Place, time and original note",
      max: 30,
      earned:
        report.original.site.trim() &&
        report.original.note.trim() &&
        report.original.observedAt
          ? 30
          : 0,
    },
    { label: "Located evidence", max: 10, earned: f?.coordinates ? 10 : 0 },
    {
      label: "Retained photo or video",
      max: 15,
      earned: f?.media.length ? 15 : 0,
    },
    {
      label: "Image usability checks",
      max: 15,
      earned: f?.media.length
        ? f.media.some((m) => m.quality.warnings.length === 0)
          ? 15
          : 5
        : 0,
    },
    {
      label: "Clarifications acknowledged",
      max: 20,
      earned:
        report.assessment.issues.every((i) => i.decision !== "pending") &&
        (!f ||
          fieldQuestions(f, report.original.appearance).every((q) =>
            f.followups.some((a) => a.question === q && a.answer.trim()),
          ))
          ? 20
          : 0,
    },
    {
      label: "Measurement metadata / no readings supplied",
      max: 10,
      earned:
        !f?.measurements.length ||
        f.measurements.every((m) => !measurementWarnings(m).length)
          ? 10
          : 0,
    },
  ];
  return {
    value: checks.reduce((n, c) => n + c.earned, 0),
    checks,
    method: "completeness-v1",
    limitation:
      "Evidence completeness only. Not water health, accuracy, scientific confidence or a reason to enter water.",
  };
}
export function decisionReceipt(report: Report) {
  return {
    format: "aqualens-decision-receipt",
    version: "1.1",
    exportedAt: new Date().toISOString(),
    identifier: `aqualens:local:${report.id}`,
    quality: observationQuality(report),
    metadata: {
      title: `${report.field?.reference ? "Historical photo review" : "Stream observation"}: ${report.original.site}`,
      creator: report.field?.reference ? "Local photo-review author (identity unverified); photographer credited separately" : "Local citizen (identity unverified)",
      evidenceBasis: report.field?.reference ? "historical_photo_review" : "firsthand_observation",
      photoAttribution: report.field?.reference,
      license: "Unspecified; author permission required for reuse",
      accessRights: "Browser-local; export controlled by the user",
      spatialReference: "WGS84 / EPSG:4326",
      provenance:
        "Citizen input, labeled rule/AI suggestions, explicit local demo reviewer decisions",
      conformsTo:
        "AquaLens prototype schema 1.1; not an official OneAquaHealth or FHIR profile",
      fairStatus:
        "FAIR-oriented metadata; no persistent repository registration or certification",
    },
    report,
    mediaNote:
      "Media bytes remain in this browser. Download originals separately and match SHA-256 digests. Local records are editable, not cryptographically signed.",
  };
}
function csvCell(value: unknown) {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replaceAll('"', '""')}"`;
}
export function exportCSV(reports: Report[]) {
  const rows = [
    [
      "id",
      "site",
      "observed_at",
      "note",
      "appearance",
      "synthetic",
      "review_status",
      "quality_completeness",
      "latitude",
      "longitude",
      "evidence_basis", "photo_source", "photo_author", "photo_license", "photo_source_date",
    ],
    ...reports.map((r) => [
      r.id,
      r.original.site,
      r.original.observedAt,
      r.original.note,
      r.original.appearance,
      r.original.synthetic,
      r.status,
      observationQuality(r).value,
      r.field?.coordinates?.lat,
      r.field?.coordinates?.lon,
      r.field?.reference ? "historical_photo_review" : "firsthand_observation",
      r.field?.reference?.sourceUrl, r.field?.reference?.author, r.field?.reference?.license, r.field?.reference?.capturedDate,
    ]),
  ];
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}
export function exportGeoJSON(reports: Report[]) {
  return {
    type: "FeatureCollection",
    features: reports
      .filter((r) => r.field?.coordinates)
      .map((r) => ({
        type: "Feature",
        id: r.id,
        geometry: {
          type: "Point",
          coordinates: [r.field!.coordinates!.lon, r.field!.coordinates!.lat],
        },
        properties: {
          site: r.original.site,
          observedAt: r.original.observedAt,
          synthetic: r.original.synthetic,
          status: r.status,
          appearance: r.original.appearance,
          coordinateMethod: r.field!.coordinates!.method,
        },
      })),
    omittedWithoutCoordinates: reports.filter((r) => !r.field?.coordinates)
      .length,
  };
}
export function downloadFile(
  content: string | Blob,
  filename: string,
  mime = "application/json",
) {
  const url = URL.createObjectURL(
    content instanceof Blob ? content : new Blob([content], { type: mime }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.hidden = true;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
