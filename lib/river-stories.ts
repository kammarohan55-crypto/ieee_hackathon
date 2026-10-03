import type { Report } from "./assessment";
import { europeanPlaces } from "./european-sites";
import { referencePhotos, validRecordedTimestamp } from "./references";
import { scopedRecords } from "./mission-control";

/** A read-only source tour. Never manufacture a review or attach another photo's candidates. */
export function riverStory(records: Report[], cityId: string, photoId?: string) {
  const place = europeanPlaces.find((city) => city.id === cityId) ?? europeanPlaces[0];
  const prefix = place.id === "coimbra" ? "mondego-" : place.id === "toulouse" ? "garonne-" : "hoffselva-";
  const photos = referencePhotos.filter((photo) => photo.id.startsWith(prefix))
    .sort((a, b) => a.capturedDate.localeCompare(b.capturedDate));
  const photo = photos.find((item) => item.id === photoId) ?? photos[0];
  const matches = scopedRecords(records, "reference").filter((record) =>
    record.field?.reference?.id === photo.id && record.field.media.some((media) =>
      media.kind === "photo" && media.sha256 === photo.sha256 && media.origin === "public_reference"));
  const time = (record: Report) => validRecordedTimestamp(record.createdAt) ? Date.parse(record.createdAt) : 0;
  const report = matches.sort((a, b) => time(b) - time(a))[0];
  const media = report?.field?.media.find((item) => item.kind === "photo" && item.sha256 === photo.sha256 && item.origin === "public_reference");
  return { place, photos, photo, report, media, index: photos.indexOf(photo) };
}
