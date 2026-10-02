# AquaLens — submission working copy

Updated 2026-10-02. Draft only: no submission, deployment or video is established. Repository: https://github.com/kammarohan55-crypto/ieee_hackathon . Current local work is uncommitted/unpushed; do not assume public source matches it. Fill in actual team credits, tested judge-access URL and video link.

## Positioning

**Primary project decision: Track 1 — Citizen Science UX.** Track 3 assessment, Track 2 context and Track 4 storytelling support this workflow. The official overview asks for one chosen track; this framing is not evidence of winning odds or eligibility in several categories. The user authorized reconsidering the original Track 3 focus. See SOURCES S30.

**Tagline:** Keep stream evidence and uncertainty together, from the first photograph to the next visit.

AquaLens guides a citizen from original photographs, notes and optional instruments to an inspectable human-reviewed record. Local checks flag missing context, contradictions and unsupported claims. Optional consented AI can suggest possible visual observations and focused questions; suggestions never replace the citizen's words or become environmental diagnoses. Explicit citizen confirmation and reasoned local reviewer decisions preserve disagreement and uncertainty.

The complete guided local workflow remains useful during provider failure. Its strongest contribution alongside OneAquaHealth's published geographic tools is a portable, understandable evidence handoff rather than an invented ecological grade.

## Demonstrable capabilities

- Field notebook: camera/photo/short silent-video capture and upload; local image-usability checks; manual repeat-photo guide; explicit adoption of voice transcript; optional instrument and One Health context. Device support and permissions apply.
- Assessment: transparent rule checks, bounded optional text/image AI, measurement metadata/input checks, contradictions, adaptive clarification and explicit citizen confirmation. Observation Quality is an app evidence-completeness rubric, never river health.
- Human oversight: original source/AI/human labels, agreement/disagreement/uncertainty with reasons, review history and reopening when judgments change. Local demo identities are not authenticated users.
- Evidence Lab: saved-record Decision Brief, exact source quotes, retained limits and current review completeness. Local rule replay and authored engineering reports are optional diagnostics, not another live AI evaluation.
- Presentation: four read-only chapters — original evidence, checks/clarification, human judgment, receipt — and a readable Markdown brief. Missing or inconsistent stages remain visible.
- Repeat engagement: Evidence Actions uses actual records to explain review/fresh-evidence tasks; linked visits use explicit IDs. A fresh draft copies no old photo, reading, note, GPS or time as new evidence.
- Geographic context: supplied-coordinate markers, dated NASA Terra/MODIS imagery, historical 2021 Sentinel-2 annual RGB landscape context and street fallback. Source/year/scale/coverage limits travel visibly; no NDWI, current scene claim or satellite water grade.
- Evidence exploration: source-photo pins, retained event timeline, manual before/after comparison, provenance graph and saved-record Insights. Schematic river visualization is secondary under Field kit and is not a physical digital twin.
- Portable handoff: JSON/CSV/GeoJSON, FAIR-oriented metadata and checked original-media field packs. Browser-first local storage and a production offline shell; network maps/weather/AI require connectivity.

Three licensed historical Wikimedia photographs support a clearly labeled review demonstration. Fresh workspaces have zero seeded visits. Historical photographs and authored software fixtures are never current environmental measurements.

## Architecture and verification

React/TypeScript, Vinext, Cloudflare Worker API routes and Zod; ignored server-only xAI/Groq credentials; idb/IndexedDB for original bytes and localStorage for records; existing Radix, MapLibre, React Flow, Recharts and Workbox. No new package or custom model training for this pass. Dependency/data notices are in DEPENDENCIES and SATELLITE_CONTEXT.

Read QA.md and PROJECT_CONTEXT.md for final current software check/build/release counts. These are authored development tests with explicit mocks, not independent model accuracy or ecological validation. The October2 synthetic xAI smoke returned HTTP403 categorized as billing/credits-related; rule fallback worked. Successful current xAI/Groq text/image responses remain unverified. Earlier Gemini smoke results are historical and do not establish current availability.

The app stayed stopped during this implementation. Browser/device responsiveness, camera/video/voice, WebGL, downloads/import, keyboard/assistive use and installed offline behavior still need the user's walkthrough. No successful deployment is recorded.

## Four-minute demo

Use DEMO_GUIDE.md: show one actual or clearly labeled historical observation, original words, any real question, explicit confirmation and a reasoned review. Open Present this evidence, show the retained stages, inspect the Decision Brief and export a receipt. Show linked follow-up actions and map context if genuine coordinates exist; otherwise demonstrate the truthful empty map/optional metadata. Do not manufacture AI findings, measurements or a completed review to fill the script.

A role-switching demo must disclose that one person is acting as citizen and local reviewer. Explain the historical imagery year and manual comparison limits. Finish with portable original-media handoff and remaining uncertainty.

## Rubric evidence

| Criterion | Concrete evidence to show |
| --- | --- |
| Impact/alignment | Clearer citizen evidence handed to a reviewer without an appearance-based diagnosis |
| Innovation | Preserved disagreements, actionable uncertainty and explicitly linked repeat visits |
| Implementation | Full local workflow, schema/provider failure handling, retained originals and checked exports |
| Usability | Guided field entry, focused presentation, transparent labels and truthful empty/error states |
| Feasibility | Browser-first architecture, open-source reuse, provenance and documented integration limits |

These are presentation choices, not awarded scores.

## Remaining submission gates

Real original field evidence and permission; actual team invitations/contributor credits and licence choice for original code; user device QA; usable AI access if presenting live AI; final source commit/push; tested judge-access delivery; actual 3–5 minute video and Devpost submission confirmation. REAL_DATA_READINESS.md provides the exact evidence package. No secret should be pasted into chat or public files. Recheck the official deadline/eligibility before submission; the October2 source check found an October4 9PM PDT extension, with older rule text still conflicting.
