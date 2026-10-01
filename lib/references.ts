// Public historical photographs, never seeded citizen observations.
// Source metadata was checked against the Wikimedia Commons file pages.
export const referencePhotos = [
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
export type ReferencePhoto = (typeof referencePhotos)[number];

// Source dates have day precision; never invent midnight or apply local offsets.
export function displayEvidenceTime(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value))
    return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "UTC" }) + " · date only";
  const time = Date.parse(value);
  return Number.isFinite(time)
    ? new Date(time).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC"
    : "Time not available";
}
