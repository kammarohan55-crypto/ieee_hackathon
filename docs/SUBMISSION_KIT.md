# AquaLens — submission working copy

Prepared 2026-09-29. This is a draft, not a submitted entry. Fill in team details and real repository/demo/video URLs before submission. Recheck the organizer's current rules and deadline in SOURCES.md.

## Project description

**Tagline:** A stream observation is a starting point. Keep the evidence and the uncertainty together.

AquaLens helps citizens describe what they observed without turning appearance into an unsupported diagnosis. It brings original photos, field notes and instrument readings into a guided assessment, asks focused questions, and makes every AI suggestion and human judgment inspectable.

The prototype supports OneAquaHealth Track 3 through AI-assisted clarification and human oversight. A citizen can retain a photo or short silent video, inspect local image-quality warnings, optionally request visual AI candidates, record instrument metadata, resolve questions and explicitly confirm a report. A reviewer then inspects the original evidence, records agreement, disagreement or uncertainty, and exports a Decision Receipt. An attributed map and timeline connect located observations to their evidence; follow-up missions preserve the source relationship.

## What distinguishes it

- **A decision trail:** original notes and AI candidates survive human disagreement. A new visual judgment reopens a completed review while preserving earlier decisions.
- **Uncertainty is usable:** “unknown” remains a legitimate answer. Visual confidence is explicitly uncalibrated; the quality score measures evidence completeness only.
- **Useful during service failure:** local capture, checks, review and exports work independently of live AI. Failed AI requests do not produce invented findings.
- **Traceable follow-ups:** a new mission links to its source report and preserves practice-data labeling. Old readings and coordinates are not silently reused as new evidence.

## Implementation and verified evidence

React/TypeScript with Vinext, Cloudflare Worker routes, Zod validation, Gemini text/visual adapters, idb for local original-media storage, MapLibre/OpenFreeMap, React Flow, Recharts and Workbox. No shared database or custom model training is required for the prototype.

Engineering checks: 60 authored domain assertions and 19 mocked route-contract tests pass, with TypeScript and lint checks. These cover evidence preservation, review gates, malformed provider responses, opt-in boundaries, errors, rate limits, exports and provenance. They are development tests, not independent scientific validation.

The latest recorded real Gemini text smoke run completed 3/3 synthetic scenarios; earlier failures are retained. Successful live visual analysis has not yet been verified because tested requests received provider 503 responses. Keep that distinction in the presentation.

## Four-minute demonstration

| Time | Show | Say |
|---|---|---|
| 0:00–0:25 | Overview and the visibly synthetic brown-water scenario | “A color is an observation. A cause needs evidence. AquaLens helps preserve that distinction.” |
| 0:25–1:05 | Field notebook, retained illustration or consented test photo, image checks | “The original stays local with a digest. Exposure and detail checks are basic heuristics, not environmental measurements.” |
| 1:05–1:40 | Unsupported-cause question; optional measurement warning | “The original claim is retained. The citizen can explain, disagree or remain uncertain. A synthetic pH 19 input is flagged, never silently corrected.” |
| 1:40–2:10 | Completeness breakdown and explicit confirmation | “Every point is explainable. This score describes the record, not the water.” |
| 2:10–2:55 | Review desk, original evidence, graph and transparency | “A human must judge each visual candidate before completing review. Disagreements remain visible. The reviewer role here is local and unauthenticated.” |
| 2:55–3:30 | Decision Receipt and atlas | “The receipt carries the sources and limitations. Coordinates are supplied by the observer. No monitoring stations or environmental conditions are invented.” |
| 3:30–4:00 | Follow-up mission and limitations | “A follow-up links to the prior observation. Next validation needs field users and domain reviewers, followed by authenticated shared storage.” |

If live visual AI is unavailable, show the honest error and continue with the local workflow. Do not substitute a scripted result labeled as live. If illustrating the successful visual contract, use the explicitly labeled mocked test report, and state that it tests software behavior only. Do not claim physical camera, voice or offline device verification that has not been performed.

## Rubric evidence

| Criterion | Concrete evidence to show |
|---|---|
| Impact and alignment | Citizen-to-reviewer example that prevents an appearance claim becoming an unsupported conclusion |
| Innovation | Preserved disagreements, explicit uncertainty and source-linked follow-ups |
| Technical implementation | Running workflow, API contracts, immutable decisions, retained media and portable exports |
| Usability | Mobile field interface, accessible controls, focused questions and visible error states |
| Feasibility | Browser-first prototype, documented API boundaries, open-source dependencies and a clear path to authenticated collaboration |

## Before submission

- Create and verify the public source repository; include dependency notices and select a license for original project code.
- Complete team invitations and credits using actual contributor names and roles.
- Provide a verified deployment URL with the intended judge-access settings; no successful deployment is recorded yet.
- Record the actual 3–5 minute video. The script above is not a video deliverable.
- Complete physical camera/video/voice and offline walkthroughs on intended devices; update QA.md with observed results.
- Keep the latest provider availability limitations in the submission. No prediction of winning or invented evaluation score is justified.
