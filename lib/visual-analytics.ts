import type { Report } from "./assessment";
import { europeanPhotoLibrary, referenceDimensions } from "./references";
import { europeanPlaces } from "./european-sites";
import { riverStory } from "./river-stories";

export function archiveCity(id: string) {
  return id.startsWith("mondego-") ? "coimbra" : id.startsWith("garonne-") ? "toulouse" : id.startsWith("hoffselva-") ? "oslo" : undefined;
}
export function frameFormat(photo: (typeof europeanPhotoLibrary)[number]) {
  const size = referenceDimensions(photo), ratio = size.width / size.height;
  return ratio > 2 ? "panorama" : ratio < .9 ? "portrait" : "landscape";
}
/** Catalogue coverage, not ecological trends. All counts derive from retained sources. */
export function archiveAnalytics(records: Report[], city = "all", year = "all") {
  const cityPhotos = europeanPhotoLibrary.filter((photo) => city === "all" || archiveCity(photo.id) === city);
  const photos = cityPhotos.filter((photo) => year === "all" || photo.capturedDate.startsWith(year))
    .sort((a, b) => a.capturedDate.localeCompare(b.capturedDate) || a.id.localeCompare(b.id));
  const first = Math.min(...europeanPhotoLibrary.map((photo) => Number(photo.capturedDate.slice(0, 4))));
  const last = Math.max(...europeanPhotoLibrary.map((photo) => Number(photo.capturedDate.slice(0, 4))));
  const years = Array.from({ length: last - first + 1 }, (_, index) => {
    const value = String(first + index), sources = cityPhotos.filter((photo) => photo.capturedDate.startsWith(value));
    return { year: value, count: sources.length, ...Object.fromEntries(europeanPlaces.map((place) => [place.id, sources.filter((photo) => archiveCity(photo.id) === place.id).length])) };
  });
  const matched = photos.map((photo) => riverStory(records, archiveCity(photo.id)!, photo.id));
  const reviewed = matched.filter((story) => !!story.report);
  const withAI = matched.filter((story) => !!story.media?.visual);
  return {
    photos, years, first, last, sourceDates: new Set(photos.map((photo) => photo.capturedDate)).size,
    reviews: reviewed.length, aiResponses: withAI.length,
    candidates: withAI.reduce((sum, story) => sum + (story.media!.visual?.findings.length ?? 0), 0),
    examples: reviewed.filter((story) => !!story.report?.demonstration).length,
    quarters: ["Jan–Mar", "Apr–Jun", "Jul–Sep", "Oct–Dec"].map((label, index) => ({ label, count: photos.filter((photo) => Math.floor((Number(photo.capturedDate.slice(5, 7)) - 1) / 3) === index).length })),
    formats: ["landscape", "portrait", "panorama"].map((label) => ({ label, count: photos.filter((photo) => frameFormat(photo) === label).length })),
    cities: europeanPlaces.map((place) => ({ ...place, count: photos.filter((photo) => archiveCity(photo.id) === place.id).length })),
  };
}
