import { z } from "zod";

/** Generated software-test summaries; these never establish environmental or live-AI accuracy. */
export const validationReportSchema = z.object({
  passed: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  liveAI: z.literal(false),
  generatedAt: z.string().refine((value) => Number.isFinite(Date.parse(value))),
}).refine((value) => value.passed <= value.total);

export type ValidationReportSummary = z.infer<typeof validationReportSchema>;
