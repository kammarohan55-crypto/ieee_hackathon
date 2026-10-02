import { z } from "zod";

// Browser-safe metadata only. Credentials and provider request code stay server-side.
export const recordedProviderSchema = z.enum(["xai", "groq", "gemini"]);
export function recordedProviderLabel(provider?: z.infer<typeof recordedProviderSchema>) {
  return provider === "xai" ? "xAI (Grok)" : provider === "groq" ? "Groq" : provider === "gemini" ? "Google Gemini" : "Provider not retained";
}
const publicProvider = z.enum(["xAI (Grok)", "Groq", "Unconfigured AI provider"]);
export const aiStatusSchema = z.object({
  liveAI: z.boolean(), provider: publicProvider, model: z.string().max(160),
  visualProvider: publicProvider, visualModel: z.string().max(160),
  fallbackProvider: publicProvider.optional(), fallbackModel: z.string().max(160).optional(),
  fallbackVisualModel: z.string().max(160).optional(), defaultMode: z.literal("rules"),
  consentScope: z.string().max(768).nullable(),
});
export type AIStatus = z.infer<typeof aiStatusSchema>;
export function aiRecipients(status: AIStatus | null, visual = false) {
  if (!status?.liveAI) return "the configured AI provider";
  return `${visual ? status.visualProvider : status.provider}${status.fallbackProvider ? `, with ${status.fallbackProvider} as an optional fallback` : ""}`;
}
