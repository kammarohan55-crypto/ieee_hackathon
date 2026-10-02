import { z } from "zod";
import { referencePhotos } from "./references";
import { visualSchema } from "./field";
import { weatherContextSchema } from "./weather-context";
// Change the revision when changing this recorded dataset, so an older offline
// worker cannot substitute earlier analysis for a newly shipped presentation kit.
export const EUROPEAN_CONTEXT_ASSET = "/european-context-v2.json";

// Wikidata CC0 city overview coordinates, not camera positions or research stations.
export const europeanPlaces = [
  { id: "coimbra", photoId: "mondego-coimbra", city: "Coimbra", country: "Portugal", river: "Mondego", wikidata: "Q45412", lat: 40.211111, lon: -8.428889, accent: "#78e4d1", description: "River, city and urban tributaries", official: "https://www.oneaquahealth.eu/research-cities/coimbra/" },
  { id: "toulouse", photoId: "garonne-toulouse", city: "Toulouse", country: "France", river: "Garonne", wikidata: "Q7880", lat: 43.604444, lon: 1.443333, accent: "#e7b983", description: "River surfaces and engineered banks", official: "https://www.oneaquahealth.eu/research-cities/toulouse/" },
  { id: "oslo", photoId: "hoffselva-oslo", city: "Oslo", country: "Norway", river: "Hoffselva", wikidata: "Q585", lat: 59.913333, lon: 10.738889, accent: "#b3acf3", description: "A small stream in an urban landscape", official: "https://www.oneaquahealth.eu/research-cities/oslo/" },
] as const;
export type EuropeanPlace = (typeof europeanPlaces)[number];
export const sourceAnalysisSchema = visualSchema.extend({
  provider: z.literal("gemini"), model: z.string().min(1).max(160), at: z.string().datetime(),
  recorded: z.literal(true), photoId: z.string(), sha256: z.string().regex(/^[a-f0-9]{64}$/),
  humanReview: z.literal("not_performed"), method: z.literal("Resized JPEG · enumerated visual candidates"),
}).refine((value) => referencePhotos.some((photo) => photo.id === value.photoId && photo.sha256 === value.sha256), "Source analysis must match the retained photo bytes");
export const europeanBundleSchema = z.object({
  kind: z.literal("recorded_public_context"), generatedAt: z.string().datetime(),
  analyses: z.array(sourceAnalysisSchema).max(referencePhotos.length),
  weather: z.array(z.object({ placeId: z.string(), snapshot: weatherContextSchema }).refine((entry) => {
    const place = europeanPlaces.find((p) => p.id === entry.placeId);
    return !!place && Math.abs(entry.snapshot.requestedCoordinates.lat - place.lat) < .0001 && Math.abs(entry.snapshot.requestedCoordinates.lon - place.lon) < .0001;
  }, "Weather snapshot must match the named city overview")).max(3),
}).strict();
export type EuropeanBundle = z.infer<typeof europeanBundleSchema>;
