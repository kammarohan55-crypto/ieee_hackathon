# Ready-to-use historical photo demo

The three credited reference photos are included in the repository and production offline cache. You do not need a Google Photos account, a video, or a new field visit for this path. Start the app using the README setup commands.

1. Open **Field kit** and choose **Review this photo** on any of the three Mutha River frames.
2. Show the photographer, source page, licence and historical date. Inspect the full frame. The date cannot be silently turned into today; no new GPS or measurements are attached.
3. Write one or two sentences in your own words about details you can see and anything unclear. Do not read a prepared fake observation. Select **Not observed / unsure** if the water appearance is uncertain.
4. Optionally enable configured visual AI with consent. Otherwise show the local image checks. An unavailable provider remains visibly unavailable.
5. Run the text checks. Answer or retain uncertainty for any clarification and evidence follow-up, then confirm the historical-photo review.
6. Open the full receipt in the **Review desk**. Show the source credit, source date, original note and graph. If visual AI returned candidates, give a reasoned judgment for each. Add your own review note and mark the record reviewed.
7. Open **Evidence lab** to inspect the saved record or replay local rules without changing it.
8. In **Field kit**, download a field pack with media. In a second browser/profile, preview and import the file. Show the retained photo, licence and note. The **River observatory** intentionally contains firsthand field observations only.

This is a photo-review demonstration using real sourced images. It is not current river monitoring or proof of a water condition. No shared backend or authenticated reviewer is claimed. The latest source/build checks pass; the steps above still need the user's browser walkthrough.

---

# AquaLens: real-evidence demonstration

Primary track: **Track 3 — AI-Supported Assessment**. Supporting themes: citizen science UX, inspectable data and One Health awareness. The core journey is citizen evidence → explainable questions → explicit confirmation → human review → portable field pack.

## Prepare

1. Install with `npm ci`, then start `npm run dev`. A fresh workspace is empty.
2. Collect the three original photos described in [MEDIA_CHECKLIST.md](MEDIA_CHECKLIST.md), plus the real place/time and your own note. Do not invent a problem, instrument value, AI result or ecological conclusion for the video.
3. If showing AI, configure your own server-side key in ignored `.dev.vars`. Confirm provider availability before recording. Rules work without a key; call them rules.
4. Keep a second browser/profile ready for an import demonstration. Records are browser-local; there is no cloud team sync.

## A 4–5 minute recording

| Time | Show | Explain |
| --- | --- | --- |
| 0:00–0:30 | Overview and Field kit | A stream observation should remain useful without overstating what it proves. Counts start at zero and grow only from real entries. |
| 0:30–1:20 | Field notebook: upload original photos; add real site/time, note and optional One Health context | The app preserves originals. A bank, wildlife and nearby human activity can be recorded without inventing health outcomes. |
| 1:20–2:00 | Local checks or consented AI, clarification, completeness breakdown, confirmation | Distinguish a visible detail from a cause. Every answer is explicit; unknowns stay unknown. No matched issue is also an honest result. |
| 2:00–2:50 | Review desk: search, original note/media, source graph, visual-candidate judgment if present, review note | Human decisions stay inspectable. Workflow review is not environmental certification or an authenticated institutional approval. |
| 2:50–3:30 | Evidence lab and the supplied-coordinate map | Replay rules without changing the saved record. Only supplied locations appear; weather is current model context, loaded explicitly for those coordinates. |
| 3:30–4:30 | Field kit → Download field pack; choose file in another profile → preview → Import evidence | Reports and original media travel together. Media hashes detect mismatched bytes. Duplicates and conflicting IDs do not overwrite local reports. |
| 4:30–4:50 | Return to the real report and state next steps | Field-user evaluation, expert feedback, authenticated collaboration and durable hosting are next. No ecological accuracy or competition result is claimed. |

If live AI fails, show the error and continue with local checks. Do not substitute recorded responses or synthetic findings. If you have only a single real observation, demonstrate that one well.

## Device checks before recording

- Fresh browser: zero records and a useful onboarding state; no synthetic scenarios or illustrative evidence upload.
- Mobile and keyboard: navigation scrolls within its bar, controls remain reachable, focus remains visible, and no page-wide overflow appears.
- Photo/clip upload: originals and filenames appear; damaged/unsupported/oversized files fail clearly. MP4/WebM clips over 15 seconds are rejected.
- Camera/GPS refusal: note entry remains usable and no location is guessed.
- One Health notes: leave unknowns as unknown; confirm and inspect them in the full receipt and exported JSON.
- AI failure: local evidence is retained; a provider failure never fabricates findings. Review requires a reason for each retained visual candidate.
- Save/reload: report and media persist. Partial clarification resumes from the saved original draft.
- Weather: no request without a chosen saved location and explicit click; switching locations never displays a different site's cached result. Errors hide previous readings.
- Search: combine words from a site and note with the review status filter.
- Field pack: export with media, import in a second profile, inspect actual restored photos; repeat import and confirm no duplicate records. Modify bytes in a disposable copy and confirm import rejection.
- Receipt-only import: reports restore with visible missing-media states. It cannot recreate absent photo bytes.
- Camera/video/voice: check on the actual phone/browser. Feature support varies.
- Offline: use the production build after an online controlled visit. Local rules/records can work offline; providers and uncached map tiles need network.

These device checks have not been performed in this session because the project records the user's preference for manual website testing. Source/type/lint/build and domain/API/transfer tests are separate evidence.

## Report an issue

Include the screen/action, browser/device, exact reproduction steps, expected vs actual behavior, and error text. A redacted screenshot or short recording helps. Never include an API key.
