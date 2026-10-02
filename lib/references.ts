import { z } from "zod";

// Public historical photographs, never seeded citizen observations.
// Source metadata was checked against the Wikimedia Commons file pages.
export const archivedReferencePhotos = [
  {
    id: "mutha-river",
    title: "Mutha River, Pune",
    site: "Mutha River, Pune",
    role: "01 / A wider view",
    alt: "River with a bridge, buildings, banks and patches of vegetation visible in the water.",
    src: "/images/references/mutha-river.jpg",
    author: "Ak2431989",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Mutha_River,_Pune.jpg",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    capturedDate: "2010-08-03",
    sha256: "f35a0b97e68755920de1a5df0fcc9325f4ec939fa93142d6061256ad4b9f132f",
    derivative: "Wikimedia 1280px thumbnail; no project pixel edits. Display may crop to fit.",
  },
  {
    id: "scenic-reflection",
    title: "Scenic Reflection",
    site: "Mutha River, Pune",
    role: "02 / Surface & surroundings",
    alt: "Trees and buildings reflected in the river, with vegetation and scattered objects in the foreground.",
    src: "/images/references/scenic-reflection.jpg",
    author: "Sharvarism",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Scenic_Reflection.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    capturedDate: "2023-06-06",
    sha256: "0d991a31833a907e4815c253f2d83907550b99115bfe1135d2d439385e1fe8cd",
    derivative: "Wikimedia 1280px thumbnail; no project pixel edits. Display may crop to fit.",
  },
  {
    id: "sambhaji-bank",
    title: "Sambhaji Bridge through the trees",
    site: "Mutha River, Sambhaji Bridge, Pune",
    role: "03 / The riverbank",
    alt: "Sambhaji Bridge viewed from a grassy riverbank through overhanging branches.",
    src: "/images/references/sambhaji-bank.jpg",
    author: "DesiBoy101",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Sambhaji_Bridge_as_seen_through_the_trees_on_the_banks_of_Mutha_River_in_Pune.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    capturedDate: "2023-06-12",
    sha256: "518ef0b89fb2bdd1f972e21c83c2b7c01c7a9d5b35d6025582a9c3f70a782bda",
    derivative: "Wikimedia 1280px thumbnail; no project pixel edits. Display may crop to fit.",
  },
] as const;
// Active European source gallery. Old sources remain valid for existing receipts only.
export const referencePhotos = [
  { id: "mondego-coimbra", title: "Mondego · Coimbra", site: "Mondego River, Coimbra, Portugal", role: "01 / River & city",
    alt: "Wide river foreground, a bridge and buildings climbing the Coimbra hillside beneath a blue sky.", src: "/images/references/mondego-coimbra.jpg",
    author: "Leandro Neumann Ciuffo", sourceUrl: "https://commons.wikimedia.org/wiki/File:Coimbra_e_o_rio_Mondego_(6167200429).jpg",
    license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/", capturedDate: "2011-09-20",
    sha256: "11fd35e5308a706ab533e84e249f3f51fd8f57d664858c0b3a836f43ee7e851d", width: 1280, height: 859,
    derivative: "Wikimedia 1280px thumbnail; no project pixel edits. Display may crop to fit." },
  { id: "garonne-toulouse", title: "Garonne · Toulouse", site: "Garonne River, Toulouse, France", role: "02 / Surface & structures",
    alt: "Panoramic river scene with a weir, exposed textured surfaces, reflections, bridges and buildings on the opposite bank.", src: "/images/references/garonne-toulouse.jpg",
    author: "Tiia Monto", sourceUrl: "https://commons.wikimedia.org/wiki/File:Toulouse_-_Garonne.jpg",
    license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", capturedDate: "2012-08-28",
    sha256: "34c11fa89a03c1aa0dbf43de16c1f2732a3e046c0055c869c96bad447eb794de", width: 1280, height: 481,
    derivative: "Wikimedia 1280px thumbnail; source photograph is panoramic. No project pixel edits. Display may crop to fit." },
  { id: "hoffselva-oslo", title: "Hoffselva · Oslo", site: "Hoffselva at Skøyen, Oslo, Norway", role: "03 / An urban stream",
    alt: "Narrow stream between vegetated banks, a modern building and a railing, running beneath a road bridge.", src: "/images/references/hoffselva-oslo.jpg",
    author: "Jan-Tore Egge", sourceUrl: "https://commons.wikimedia.org/wiki/File:Hoffselva_ved_Sk%C3%B8yen_I.jpg",
    license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", capturedDate: "2014-05-12",
    sha256: "8d5217786fdf35351f94c8ba3e105225046766eeb50d75e4da93be770c573053", width: 1280, height: 960,
    derivative: "Wikimedia 1280px thumbnail; no project pixel edits. Display may crop to fit." },
] as const;
export const allReferencePhotos = [...referencePhotos, ...archivedReferencePhotos];
export type ReferencePhoto = (typeof allReferencePhotos)[number];
export function referenceDimensions(photo: ReferencePhoto) {
  return "width" in photo ? { width: photo.width, height: photo.height } : { width: 1280, height: photo.id === "scenic-reflection" ? 853 : 960 };
}

const evidenceDateSchema = z.string().date();
const recordedTimestampSchema = z.string().datetime({ offset: true });
const localTimestampSchema = z.string().datetime({ local: true });
const recordedTimestampFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;
const localTimestampFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;
export type EvidenceTimePrecision = "date_only" | "timestamp" | "zone_unknown" | "missing" | "invalid";

/** Require an actual ISO calendar/clock and supplied zone; Date.parse alone normalizes impossible days. */
export function validRecordedTimestamp(value: string) {
  return recordedTimestampFormat.test(value) && recordedTimestampSchema.safeParse(value).success
    && Number.isFinite(Date.parse(value));
}
export function evidenceTimePrecision(value: string): EvidenceTimePrecision {
  if (!value.trim()) return "missing";
  if (evidenceDateSchema.safeParse(value).success) return "date_only";
  if (validRecordedTimestamp(value)) return "timestamp";
  if (localTimestampFormat.test(value) && localTimestampSchema.safeParse(value).success) return "zone_unknown";
  return "invalid";
}

// Source dates have day precision. Unknown zones and invalid inputs never acquire a device-local instant.
export function displayEvidenceTime(value: string) {
  const precision = evidenceTimePrecision(value);
  if (precision === "date_only")
    return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "UTC" }) + " · date only";
  if (precision === "zone_unknown") return `${value.replace("T", " ")} · time zone unknown`;
  if (precision === "invalid") return "Time not available · invalid date or time";
  return precision === "timestamp"
    ? new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC"
    : "Time not available";
}
