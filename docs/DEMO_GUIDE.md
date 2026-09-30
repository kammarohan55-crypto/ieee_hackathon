# AquaLens demonstration and manual checks

Track 3: AI-Supported Assessment. The central story is **citizen evidence → explainable questions → explicit confirmation → human review → portable decision record**.

This guide follows the source, not a claim that every browser, device or provider interaction has been tested. The user performs website checks. Current local changes must be built/published before presenting them as a deployed release.

## Prepare your recording

- Use one browser profile; records and original media stay on that device. Do not clear browser storage during the demonstration.
- Start your local copy yourself if needed: from `streamcheck`, run `npm run dev`, then open the address printed by the terminal. See README for installation and optional Gemini setup.
- Use the visibly labeled synthetic example for a repeatable judge demonstration. Use your own safe, non-identifying photo for a real capture example; keep practice claims marked synthetic.
- Keep a rules-only path ready. Optional Gemini requests need consent and a working server-side key; a provider error is not an AI finding.
- To show a geographic marker, prepare a saved record with explicitly supplied coordinates. Sample site names alone do not create locations.
- To show the comparison divider, retain two distinct photos. Missing local files should show an unavailable-media state, not a replacement image.

## A 3–5 minute judge demonstration

| Time | Actions | What to explain |
| --- | --- | --- |
| 0:00–0:25 | Show **Overview**; choose **Explore a sample**. | “AquaLens helps people improve stream observations while keeping uncertainty and human judgment visible.” State that the example is synthetic. |
| 0:25–1:15 | In **Field notebook**, inspect the brown-water note. Optionally choose **Upload photo** or **Try illustrative image**. Select **Find the questions worth asking**. | The original note contains a visible observation and an unsupported sewage conclusion. Local rules ask for evidence; they do not diagnose contamination. An illustrative image remains labeled synthetic. |
| 1:15–1:50 | Answer a question and select **Confirm clarification**, or choose **Keep as uncertain**. Inspect completeness, confirm the citizen checkbox, then **Save observation for review**. | Answers are appended; the original is retained. Unknown information can remain unknown. The completeness score describes evidence availability, not water health or scientific confidence. |
| 1:50–2:40 | In **Review desk**, open the new record. Turn on **AI Transparency Mode**; show the evidence graph and history. Enter a **Review note** and choose **Request more detail** or **Record review**. | The reviewer records a reasoned workflow decision. The role is a local demo, not authenticated institutional approval. For retained visual AI candidates, record a human judgment with a reason; disagreements preserve both sources. |
| 2:40–3:20 | Open **Evidence lab → Saved evidence**. Select the same observation. Show **Checks**, **Media & readings**, then **Decisions**. Click **Replay rules**, compare **Stored** with **Local replay**. | Source quotes, measurement metadata and human decisions can be inspected together. Replay runs current local rules without changing the saved record. Text AI and rule checks remain distinguishable. |
| 3:20–4:15 | Open **River observatory → River stories**. Select a site and inspect **Story**, **Evidence**, **Method**. Use its older/newer record controls and **Focus view**. Briefly show **Geographic map** if coordinates exist. | The river scene is an illustrative schematic. Site labels do not prove connected waterways. The map places only supplied coordinates; missing coordinates remain missing. Neither display is a sensor feed or environmental forecast. |
| 4:15–4:45 | Select **Open full evidence**, then **Download Decision Receipt**. Alternatively show collection **JSON receipts**, **CSV** or **GeoJSON**. | The portable record contains originals, check provenance, uncertainty and review history. Media downloads separately. Metadata is FAIR-oriented; receipts are local and unsigned. |

For a shorter recording, omit the optional photo and map branch. Preserve the citizen-to-reviewer flow and Evidence Lab inspection.

Useful closing sentence: “The prototype improves the inspectability of an observation; it keeps the decision and its limitations available for the next person.”

## Extra interactions worth showing

- **Evidence lab → Synthetic practice**: choose **Two descriptions, one report**, then **Run transparent checks**. The note says brown while appearance says clear; show the contradiction check. Editing practice text clears the old output; **Restore** reloads the scenario. Nothing is saved and no live AI request is made here.
- **Repeat-photo guide**: upload a reference, open the camera, adjust **Reference opacity**, then **Remove guide**. This is manual framing assistance, not automatic image registration.
- **Start a follow-up**: creates a fresh linked draft. Previous measurements, photographs and coordinates are not carried forward as new observations.
- Expand **Explore the timeline, follow-up missions and photo comparison** only when needed. The comparison uses distinct retained images and exposes viewpoint/lighting limitations.
- **Include synthetic samples**: switch off to show citizen records only. An empty collection is a valid state, not a reason to invent observations.
- **Geographic map**: select a marker or location-list record, inspect coordinate source/accuracy and use **Fit locations**. **Not plotted** exposes missing/invalid/out-of-projection records. Coincident marker counts mean identical coordinates, not community agreement; **Retry basemap** retries map access only.

## Manual checks and expected behavior

Run these yourself on your normal browser and phone. Report observed behavior rather than assuming a failure from an unsupported device feature.

| Check | Expected behavior |
| --- | --- |
| Navigate with keyboard and a narrow viewport | Controls stay reachable, focus is visible, tabs and dialogs work; no clipped primary actions or sideways page scrolling. |
| Decline camera/GPS permission | A readable error or unavailable state appears; note entry and photo upload remain usable. No invented coordinates. |
| Capture photo / **10s clip** | Your captured evidence appears with provenance. Video is silent; image heuristics use its first frame. Closing/resetting stops capture. Device support varies. |
| Upload an unsupported/damaged file | An explanatory error appears; a previous image must not masquerade as the failed upload. |
| Optional **Ask visual AI** | Requires consent; success shows candidate findings with method/limitations. Failure shows the real error and preserves local evidence. No fabricated fallback AI results. |
| Add an implausible instrument value | The entered value remains visible with validation questions/warnings. The app does not invent a corrected reading or infer water safety. |
| Save without citizen confirmation | Saving stays unavailable until explicit confirmation. Uncertainty remains in the saved record. |
| Review a visual AI candidate | Human judgments require reasons. A new judgment reopens the record for review while retaining earlier decisions. |
| Evidence Lab replay | Stored originals, answers and history stay unchanged. Replay is visibly separate and identifies its time reference. |
| Evidence Lab practice edits | Previous results clear when inputs change; practice never adds a saved observation. |
| Map with no supplied coordinates | Missing locations are explicit; no marker is guessed from a site name. Records remain accessible without WebGL or basemap access. |
| River site/record selection | Note, media, score and review status all follow the selected observation; schematic labels remain visible. |
| Photo comparison | Two distinct retained photos are selected; divider works. Missing files show an honest unavailable state. No automatic change measurement. |
| Export and reload | Inspect downloaded JSON/CSV/GeoJSON. Confirm source/provenance and synthetic labels; reload retains local saved records. Media files are separate. |
| Offline behavior | Test a production build after an online visit has installed its service worker. Cached app/local rules may work; AI, maps and uncached resources need network. Development mode is not an offline-install proof. |

Browser dictation is optional and device-dependent. Inspect the transcript before explicitly adopting it; it is not an independently verified structured observation.

## Send a useful problem report

```text
Screen and action:
Browser / device / viewport:
Synthetic or citizen record; site and approximate date:
Exact steps (including permission choices):
Expected result:
Actual result / exact error text:
Does it repeat after reload?
Screenshot or short recording (remove private information and keys):
```

Do not include API keys, faces, private GPS coordinates or unrelated personal data. If the problem concerns an export, share a redacted copy that preserves the failing fields.

## Presentation boundaries

This prototype has browser-local storage and a demo reviewer role. It does not provide authenticated team consensus, live stream sensors, a physical digital twin, ecological classification, forecasting, FHIR integration or independent scientific validation. Show these as limitations, not delivered features. Engineering test totals measure implemented checks; they are not model accuracy or competition results.
