import { assess, createReport, decideIssue, reportSchema, reviewReport, type Report } from "./assessment";
import { addPhotoAnnotation, assertReferenceRecord, createReferenceDraft, fieldQuestions, recordVisualJudgment, type MediaEvidence } from "./field";
import { referencePhotos } from "./references";
import type { EuropeanBundle } from "./european-sites";

// Own namespace: no example is ever merged into the personal collection.
export const PRESENTATION_KEY = "aqualens-presentation-europe-v2";
export const PRESENTATION_DRAFT_KEY = "aqualens-presentation-draft-v2";
export const presentationProvenance: NonNullable<Report["demonstration"]> = {
  packageId: "europe-river-walkthrough-v2",
  authorship: "AI-authored example inputs and initial review decisions",
  purpose: "Software demonstration; no field visit or expert validation",
};
export const presentationDescriptions: Record<string, string> = {
  "mondego-coimbra": "A wide river surface, a bridge and buildings on the hillside are visible. Reflections and distance limit what can be seen in the water. Appearance and composition are unknown; no instruments or field visit are available.",
  "garonne-toulouse": "The panoramic photograph shows river surfaces, a weir, bridges and buildings. Bright patches near the structures may be disturbed water or reflections; the photo alone cannot distinguish foam or establish its cause. A closer original view would be useful.",
  "hoffselva-oslo": "A narrow stream passes between vegetated banks, buildings, a railing and a road bridge. Shadows and reflections limit the surface view. The visible vegetation is not identified to species; water conditions remain unverified.",
  "mondego-bridge": "Two bridges cross a broad river beside wooded banks, with rooftops in the foreground. The distant surface looks reflective. The image does not provide a measured depth or an instrument reading. A closer surface photograph would reduce uncertainty.",
  "mondego-riverbank": "Trees, a pedestrian footbridge and a public riverside space are visible. People appear in the source photograph and its watermark is retained. The water is partly shadowed. No visual AI analysis is included for this frame; the example uses local checks only.",
  "garonne-pont-neuf": "Water, a grassy edge, red-brick retaining walls, steps and trees are visible, with Pont Neuf farther away. Ripples and changing light affect the apparent surface. What the water contains is unknown; no measurements were taken.",
  "garonne-promenade": "A public path, lamps, trees and dense vegetation border the river. Sunlight and reflections affect the apparent colour. These are visible scene details, not a species identification or an ecological assessment.",
  "hoffselva-engebrets": "A narrow stream has ripples, stone edges, moss and leafy branches over the water. Small coloured objects may be visible on the left bank, but their identity is uncertain. A closer photo and in-person check would be needed before classifying them.",
  "hoffselva-nedre": "Water and stones are visible between trees beside a timber retaining wall and pipes. Visible structures do not establish discharge or pollution. Depth, chemistry and the purpose of the pipes are unknown.",
};

/** Builds authored walkthrough states using actual prepared media and real recorded AI only. */
export function buildPresentationRecords(media: MediaEvidence[], bundle: EuropeanBundle, now = new Date()): Report[] {
  const at = now.toISOString();
  return referencePhotos.map((photo, index) => {
    const source = media.find((item) => item.id === `presentation-${photo.id}`);
    if (!source || source.sha256 !== photo.sha256 || source.origin !== "public_reference") throw new Error("Prepare and verify each source photograph before loading examples.");
    const { draft, field } = createReferenceDraft(photo);
    draft.note = `Presentation example — AI-authored photo description. ${presentationDescriptions[photo.id]}`;
    const analysis = bundle.analyses.find((item) => item.photoId === photo.id && item.sha256 === source.sha256);
    field.media = [{ ...source, ...(analysis ? { visual: { provider: analysis.provider, model: analysis.model, at: analysis.at, findings: analysis.findings, recorded: true } } : {}) }];
    let assessment = assess(draft, now);
    for (const issue of assessment.issues) assessment = decideIssue(assessment, issue.id, "uncertain", "Example response: a historical photograph cannot resolve this question; uncertainty is retained for a real reviewer.", now);
    field.followups = fieldQuestions(field, draft.appearance).map((question) => ({ question, answer: "Example response: not verifiable from this historical frame. Keep the candidate uncertain and seek a closer source or in-person evidence." }));
    let report = reportSchema.parse({ ...createReport(draft, assessment, now, `europe-example-${photo.id}`), field, demonstration: presentationProvenance,
      history: [{ at, action: "example_confirmation", detail: "AI-authored walkthrough confirmation; no actual citizen field visit, approval or expert validation is claimed." }] });
    // Existing three overview frames demonstrate completed local workflow decisions.
    // Other frames show a request for information or an open review, not fake expert work.
    if (index < 3) {
      for (const candidate of report.field!.media[0].visual?.findings ?? []) report = recordVisualJudgment(report, { mediaId: source.id, finding: candidate.kind, decision: "uncertain", reason: "Authored example judgment: retain uncertainty. A qualified person has not verified this visual candidate." }, now);
      report = reviewReport(report, "reviewed", "Authored example review: credits and uncertainty inspected for the software walkthrough. Reviewed is a workflow demonstration; no expert or environmental validation has occurred.", now);
    } else if (index < 6) {
      report = reviewReport(report, "needs_information", "Authored example information request: a closer surface view and a real observer's context would help. No instrument readings, GPS or field visit are available.", now);
    }
    if (photo.id === "hoffselva-nedre") report = addPhotoAnnotation(report, { mediaId: source.id, x: .76, y: .67, category: "uncertain", note: "Authored example pin: visible pipe; function, flow and contents unknown. Do not infer a discharge or pollutant." }, now, "example-visible-pipe");
    assertReferenceRecord(report);
    return report;
  });
}
