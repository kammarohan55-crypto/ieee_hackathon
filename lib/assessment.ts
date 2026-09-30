import { z } from "zod";
import { fieldSchema, type FieldEvidence } from "./field";

export const appearanceValues = [
  "unsure",
  "clear",
  "brown",
  "green",
  "cloudy",
  "other",
] as const;
export const inputSchema = z
  .object({
    site: z.string().max(160),
    observedAt: z.string().max(50),
    note: z.string().max(4000),
    appearance: z.enum(appearanceValues),
    synthetic: z.boolean(),
  })
  .strict();
export type ObservationInput = z.infer<typeof inputSchema>;
export const issueCodes = [
  "missing_context",
  "invalid_time",
  "unsupported_conclusion",
  "conflicting_observation",
  "unavailable_evidence",
  "instruction_in_note",
  "ambiguity",
] as const;
export type IssueCode = (typeof issueCodes)[number];
export type Issue = {
  id: string;
  code: IssueCode;
  field: keyof ObservationInput;
  quote: string;
  title: string;
  detail: string;
  question: string;
  source: "rules" | "ai";
  decision: "pending" | "answered" | "uncertain" | "dismissed";
  answer?: string;
  decidedAt?: string;
};
export type Assessment = {
  issues: Issue[];
  mode: "rules" | "ai";
  notice: string;
  model?: string;
  elapsedMs?: number;
  version: string;
};
export type Report = {
  field?: FieldEvidence;
  schemaVersion: "1.0";
  id: string;
  createdAt: string;
  original: ObservationInput;
  assessment: Assessment;
  confirmedAt: string;
  status: "awaiting_review" | "needs_information" | "reviewed";
  reviewHistory: {
    action: Report["status"];
    note: string;
    at: string;
    actor: "demo_reviewer";
  }[];
  history: { at: string; action: string; detail: string }[];
};
export const guidance: Record<
  IssueCode,
  { title: string; detail: string; question: string }
> = {
  missing_context: {
    title: "Add the observation context",
    detail:
      "A reviewer needs a recognizable place and an observation time. No missing details will be guessed.",
    question: "What is the missing location or observation time?",
  },
  invalid_time: {
    title: "Check the observation time",
    detail:
      "The date is invalid or later than the current time. Keep the time you actually observed the stream.",
    question: "When did you make this observation?",
  },
  unsupported_conclusion: {
    title: "Separate appearance from a conclusion",
    detail:
      "Appearance alone cannot establish a cause, contamination, or water safety. Your original statement remains visible as an unverified claim.",
    question:
      "What did you directly observe that led to this conclusion? It is fine to say the cause or safety is unknown.",
  },
  conflicting_observation: {
    title: "Two descriptions need clarification",
    detail:
      "The appearance field and the note may refer to different conditions. A person needs to clarify the place and time before either is preferred.",
    question:
      "Which appearance describes this place and time, or do the descriptions refer to different observations?",
  },
  unavailable_evidence: {
    title: "Referenced image needs context",
    detail:
      "The text checker cannot establish which image this phrase refers to. Link and inspect the retained evidence before relying on it.",
    question: "What visible details from the photo can you describe in words?",
  },
  instruction_in_note: {
    title: "Keep the note as evidence",
    detail:
      "Instruction-like text is preserved but cannot change the review, reveal secrets, or override the assessment process.",
    question: "Which part of this note describes what you directly observed?",
  },
  ambiguity: {
    title: "Make this observation more specific",
    detail:
      "A short clarification may help the reviewer interpret your note without guessing.",
    question:
      "Can you describe exactly what you noticed and where, or state what you are unsure about?",
  },
};
export function makeIssue(
  code: IssueCode,
  field: keyof ObservationInput,
  quote: string,
  source: "rules" | "ai" = "rules",
): Issue {
  return {
    id: `${source}-${code}-${field}`,
    code,
    field,
    quote,
    ...guidance[code],
    source,
    decision: "pending",
  };
}
export function validObservationTime(value: string, now = new Date()): boolean {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.exec(
      value,
    );
  if (!match) return false;
  const [, ys, ms, ds, hs, mins] = match;
  const [y, m, d, h, min] = [ys, ms, ds, hs, mins].map(Number);
  if (
    m < 1 ||
    m > 12 ||
    d < 1 ||
    d > new Date(Date.UTC(y, m, 0)).getUTCDate() ||
    h > 23 ||
    min > 59
  )
    return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp <= now.getTime();
}
// Deliberately limited English heuristics, not a scientific classifier.
function affirmativeSentences(note: string): string[] {
  return note.split(/(?<=[.!?])\s+/).filter((sentence) => {
    const uncertain =
      /\b(cannot|can't|can’t|could not|don't|do not|not saying|not sure|unsure|unknown|unverified|cannot confirm|can't confirm)\b/i.test(
        sentence,
      );
    const attributed = /\b(said|says|claimed|claims|told|reported)\b/i.test(
      sentence,
    );
    const agrees = /\b(I agree|I confirm|I believe|I know)\b/i.test(sentence);
    return (!uncertain && !attributed) || agrees;
  });
}
export function assess(input: ObservationInput, now = new Date()): Assessment {
  const issues: Issue[] = [];
  for (const field of ["site", "observedAt", "note"] as const)
    if (!input[field].trim())
      issues.push(makeIssue("missing_context", field, ""));
  if (input.observedAt && !validObservationTime(input.observedAt, now))
    issues.push(makeIssue("invalid_time", "observedAt", input.observedAt));
  const sentences = affirmativeSentences(input.note);
  const claim = sentences.find(
    (s) =>
      /\b(?:must be|is|it's|it’s|proves|means|definitely|certainly|water is|stream is)\b.{0,45}\b(?:sewage|polluted|pollution|contaminated|contamination|safe to drink|safe for swimming|unsafe for swimming|safe to swim|toxic|pathogens?)\b/i.test(
        s,
      ) ||
      /\b(?:sewage|pollut(?:ed|ion)|contaminat(?:ed|ion)|toxic)\b.*\bI agree\b/i.test(
        s,
      ),
  );
  if (claim) issues.push(makeIssue("unsupported_conclusion", "note", claim));
  if (input.appearance !== "unsure" && input.appearance !== "other") {
    const first = sentences[0] ?? "";
    const reported =
      /\b(?:water|stream)\b.{0,35}?\b(?:is|was|looked|looks|appeared)\s+(?:very\s+)?(clear|brown|green|cloudy)\b/i.exec(
        first,
      )?.[1];
    if (
      reported &&
      reported !== input.appearance &&
      !/\b(?:upstream|downstream|earlier|yesterday|another)\b/i.test(first)
    )
      issues.push(makeIssue("conflicting_observation", "note", first));
  }
  if (
    /\b(?:attached|the|this)\s+(?:photo|photograph|image)\b/i.test(
      input.note,
    ) &&
    !/\b(?:no|not|without)\s+(?:attached\s+)?(?:photo|photograph|image)\b/i.test(
      input.note,
    )
  )
    issues.push(makeIssue("unavailable_evidence", "note", input.note));
  if (
    /ignore.{0,30}instructions|(?:print|reveal|show).{0,20}(?:api key|secret)|mark.{0,30}(?:verified|approved)|system prompt/i.test(
      input.note,
    )
  )
    issues.push(makeIssue("instruction_in_note", "note", input.note));
  return {
    issues,
    mode: "rules",
    notice: "Rule-based checks · Live AI was not used.",
    version: "rules-1.0",
  };
}
export const aiOutputSchema = z
  .object({
    issues: z
      .array(
        z
          .object({
            code: z.enum([
              "unsupported_conclusion",
              "conflicting_observation",
              "unavailable_evidence",
              "ambiguity",
            ]),
            quote: z.string().min(3).max(4000),
          })
          .strict(),
      )
      .max(3),
  })
  .strict();
export function mergeAI(
  base: Assessment,
  input: ObservationInput,
  value: unknown,
  model: string,
): Assessment {
  const parsed = aiOutputSchema.parse(value);
  const additions: Issue[] = [];
  for (const item of parsed.issues) {
    if (!input.note.includes(item.quote))
      throw new Error("AI evidence did not match the original note");
    if (
      !base.issues.some((i) => i.code === item.code) &&
      !additions.some((i) => i.code === item.code)
    )
      additions.push(makeIssue(item.code, "note", item.quote, "ai"));
  }
  return {
    ...base,
    issues: [...base.issues, ...additions],
    mode: "ai",
    model,
    notice:
      "Rule-based checks + live AI suggestions. Confirm suggestions yourself.",
  };
}
export function decideIssue(
  assessment: Assessment,
  id: string,
  decision: Issue["decision"],
  answer = "",
  now = new Date(),
): Assessment {
  if (decision === "pending") throw new Error("A decision is required");
  if (decision === "answered" && !answer.trim())
    throw new Error("Add a clarification first");
  if (answer.length > 2000) throw new Error("Clarification is too long");
  if (!assessment.issues.some((i) => i.id === id))
    throw new Error("Unknown issue");
  return {
    ...assessment,
    issues: assessment.issues.map((i) =>
      i.id === id
        ? {
            ...i,
            decision,
            answer: answer.trim(),
            decidedAt: now.toISOString(),
          }
        : i,
    ),
  };
}
export function createReport(
  original: ObservationInput,
  assessment: Assessment,
  now = new Date(),
  id = crypto.randomUUID(),
): Report {
  inputSchema.parse(original);
  if (assessment.issues.some((i) => i.decision === "pending"))
    throw new Error("Acknowledge each clarification before submitting");
  if (
    !original.site.trim() ||
    !original.note.trim() ||
    !validObservationTime(original.observedAt, now)
  )
    throw new Error("A valid location, time and note are required");
  const at = now.toISOString();
  return {
    schemaVersion: "1.0",
    id,
    createdAt: at,
    original: structuredClone(original),
    assessment: structuredClone(assessment),
    confirmedAt: at,
    status: "awaiting_review",
    reviewHistory: [],
    history: [
      {
        at,
        action: "citizen_confirmation",
        detail:
          "Citizen explicitly confirmed the report; original evidence and uncertainty preserved.",
      },
    ],
  };
}
export function reviewReport(
  report: Report,
  status: "reviewed" | "needs_information",
  note: string,
  now = new Date(),
): Report {
  if (!note.trim() || note.length > 2000)
    throw new Error("A review note of 1–2000 characters is required");
  if (status === "reviewed" && report.field?.media.some((m) =>
    m.visual?.findings.some((f) => !report.field!.dispositions.some(
      (d) => d.mediaId === m.id && d.finding === f.kind,
    )),
  )) throw new Error("Record a human judgment for each visual AI candidate first. Uncertain is a valid judgment.");
  const at = now.toISOString();
  return {
    ...report,
    status,
    reviewHistory: [
      ...report.reviewHistory,
      { action: status, note: note.trim(), at, actor: "demo_reviewer" },
    ],
    history: [...report.history, { at, action: status, detail: note.trim() }],
  };
}
const issueSchema = z.object({
  id: z.string(),
  code: z.enum(issueCodes),
  field: z.enum(["site", "observedAt", "note", "appearance", "synthetic"]),
  quote: z.string(),
  title: z.string(),
  detail: z.string(),
  question: z.string(),
  source: z.enum(["rules", "ai"]),
  decision: z.enum(["pending", "answered", "uncertain", "dismissed"]),
  answer: z.string().optional(),
  decidedAt: z.string().optional(),
});
export const reportSchema = z.object({
  field: fieldSchema.optional(),
  schemaVersion: z.literal("1.0"),
  id: z.string(),
  createdAt: z.string(),
  original: inputSchema,
  assessment: z.object({
    issues: z.array(issueSchema),
    mode: z.enum(["rules", "ai"]),
    notice: z.string(),
    model: z.string().optional(),
    elapsedMs: z.number().optional(),
    version: z.string(),
  }),
  confirmedAt: z.string(),
  status: z.enum(["awaiting_review", "needs_information", "reviewed"]),
  reviewHistory: z.array(
    z.object({
      action: z.enum(["awaiting_review", "needs_information", "reviewed"]),
      note: z.string(),
      at: z.string(),
      actor: z.literal("demo_reviewer"),
    }),
  ),
  history: z.array(
    z.object({ at: z.string(), action: z.string(), detail: z.string() }),
  ),
});
export function exportReport(report: Report) {
  return JSON.stringify(
    {
      format: "streamcheck-evidence-record",
      exportedAt: new Date().toISOString(),
      limitations: [
        "Citizen observations are unverified environmental evidence.",
        "Reviewed is a workflow state, not scientific validation.",
        "This format is not an official OneAquaHealth or FHIR schema.",
      ],
      report: reportSchema.parse(report),
    },
    null,
    2,
  );
}
