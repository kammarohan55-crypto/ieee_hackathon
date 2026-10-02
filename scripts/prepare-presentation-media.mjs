import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, copyFile, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Reuse the catalogue compiled by npm test; never seed citizen/reviewer records.
const { referencePhotos } = await import(pathToFileURL(path.resolve(".sites-runtime/domain-tests/references.mjs")));
const directory = path.resolve("outputs/presentation-media");
await mkdir(directory, { recursive: true });
for (const retired of ["mutha-river.jpg", "scenic-reflection.jpg", "sambhaji-bank.jpg"]) await rm(path.join(directory, retired), { force: true });
const files = [];
for (const photo of referencePhotos) {
  assert.ok(photo.src.startsWith("/images/references/") && !photo.src.includes(".."));
  const bytes = await readFile(`public${photo.src}`);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  assert.equal(sha256, photo.sha256, "Reference bytes must match the credited catalogue");
  const file = path.basename(photo.src);
  await writeFile(path.join(directory, file), bytes);
  files.push({ file, bytes: bytes.length, sha256, title: photo.title, photographer: photo.author,
    sourceUrl: photo.sourceUrl, sourceSuppliedDate: photo.capturedDate, timePrecision: "date_only",
    license: photo.license, licenseUrl: photo.licenseUrl, derivative: photo.derivative,
    role: "Public historical photograph; no new field observation", humanReview: "Not performed" });
}
await copyFile("public/images/references/CREDITS.md", path.join(directory, "CREDITS.md"));
await writeFile(path.join(directory, "manifest.json"), JSON.stringify({
  format: "aqualens-presentation-media-v1", preparedAt: new Date().toISOString(), files,
  limitations: ["Source metadata is not independent verification of camera time or scene authenticity.",
    "No citizen notes, AI findings, locations, instrument readings, approvals or reviews are seeded.",
    "This folder is presentation media, not an importable AquaLens field pack. Keep the credits with every reused photo."],
}, null, 2) + "\n");
await writeFile(path.join(directory, "START_HERE.md"), `# AquaLens presentation media

Nine real, credited historical photographs of the Mondego in Coimbra, Garonne in Toulouse and Hoffselva in Oslo. These are the same unchanged thumbnail bytes already bundled in the app. They are not current field evidence or photographs taken by your team. Read CREDITS.md and manifest.json; dates and licences differ.

## Show the working demo

For a prepared collection, open http://localhost:5173/showcase and follow docs/DEMO_GUIDE.md. It prepares nine separate, visibly labelled software examples using these photos and real recorded AI candidates. The initial descriptions, confirmations, decisions and pin are AI-authored; they are not expert validation or field visits. Your personal collection is separate. This media folder itself contains only the credited source files, not those records.

1. Start the app using npm run dev in the streamcheck folder when you are ready. Open http://localhost:5173/.
2. Mission control → Photo desk → select a European river photograph → Review this photo. The app retains the historical source date and credits. Use this route rather than uploading the photo as a new field visit.
3. Inspect the frame. Write your own visible observations and uncertainty; do not invent GPS, measurements, time or a scientist's conclusion.
4. To try Gemini, consent to the displayed Google Gemini recipient before visual/text analysis. Candidates remain uncertain until you judge them. An unavailable service must show a real error/local check, never a recorded substitute.
5. Explicitly confirm, then open Review desk. Inspect the source and actual suggestions, record your own reason and any disagreement, and complete your human review. Disclose when you play both citizen and reviewer.
6. Present this evidence → walk through the four chapters → export Readable brief or JSON. Evidence Lab → Decision brief shows retained evidence, checks, approval and human judgment, including gaps.
7. Show pins/comparison/replay and export a field pack with original media if useful. Historical reviews have no invented geographic markers. European city-overview markers are separate sourced context; citizen markers use actual supplied field coordinates.

## Suggested 3–5 minute recording

0:00–0:30: European river/photo credit and the three separate evidence clocks.
0:30–1:45: Your note, real consented AI or local checks, uncertainty and confirmation.
1:45–2:45: Your reasoned human review and retained provenance.
2:45–3:45: Four-chapter presentation, Decision brief, original text and export.
3:45–4:30: European city overview, modeled-weather chart, source/AI regions, limits and next steps.

Browser/device testing and the recording are yours. No video, user review, deployment or competition result is supplied by this kit. Consult docs/DEMO_GUIDE.md in the repository for exact controls and error checks.
`);
console.log(JSON.stringify({ directory: "outputs/presentation-media", photos: files.length,
  photoBytes: files.reduce((total, file) => total + file.bytes, 0), digestsVerified: true,
  creditsIncluded: true, observationsCreated: 0 }));
