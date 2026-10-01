# AquaLens — submission working copy

Updated 2026-09-30. This is a draft, not a submitted entry. Public source: https://github.com/kammarohan55-crypto/ieee_hackathon (verified Sept30). Fill in team details and real demo/video URLs before submission. Recheck the organizer's current rules and deadline in SOURCES.md.

## Project description

**Tagline:** A stream observation is a starting point. Keep the evidence and the uncertainty together.

AquaLens helps citizens describe what they observed without turning appearance into an unsupported diagnosis. It brings original photos, field notes and instrument readings into a guided assessment, asks focused questions, and makes every AI suggestion and human judgment inspectable.

The prototype supports OneAquaHealth Track 3 through AI-assisted clarification and human oversight. A citizen can retain a photo or short silent video, inspect local image-quality warnings, optionally request visual AI candidates, record instrument metadata, resolve questions and explicitly confirm a report. A reviewer then inspects the original evidence, records agreement, disagreement or uncertainty, and exports a Decision Receipt or a portable field pack with the original media. River stories offer an explicitly illustrative evidence narrative; the geographic map plots supplied coordinates only. Evidence Lab exposes saved source quotes, local rule replay and human decisions without mutating the record. Follow-up missions preserve the source relationship. A field kit guides three useful photo views, optional One Health notes retain bank/wildlife/community context, and a checked import workflow enables file-based handoff between browsers. Fresh workspaces contain no seeded observations.

## What distinguishes it

- **A decision trail:** original notes and AI candidates survive human disagreement. A new visual judgment reopens a completed review while preserving earlier decisions.
- **Uncertainty is usable:** “unknown” remains a legitimate answer. Visual confidence is explicitly uncalibrated; the quality score measures evidence completeness only.
- **Useful during service failure:** local capture, checks, review and exports work independently of live AI. Failed AI requests do not produce invented findings.
- **Portable originals:** field packs preserve actual photo/video bytes with SHA-256 checks, explicit import previews and conflict protection. No shared backend is required to hand evidence to another reviewer.
- **Traceable follow-ups:** a new mission links to its source report and retains the original record relationship. Old readings and coordinates are not silently reused as new evidence.

## Implementation and verified evidence

React/TypeScript with Vinext, Cloudflare Worker routes, Zod validation, Gemini text/visual adapters, idb for local original-media storage, MapLibre/OpenFreeMap, React Flow, Recharts and Workbox. No shared database or custom model training is required for the prototype.

Engineering checks: 86 authored domain assertions, 28 field-pack integrity checks and 21 mocked route-contract tests pass, with TypeScript and lint checks. These cover evidence preservation, review gates, malformed provider responses, opt-in boundaries, errors, rate limits, exports and provenance. They are development tests, not independent scientific validation.

The latest recorded real Gemini text smoke run completed 3/3 synthetic scenarios; earlier failures are retained. Successful live visual analysis has not yet been verified because tested requests received provider 503 responses. Keep that distinction in the presentation.

## Four-minute demonstration

Use the real-photo workflow in [DEMO_GUIDE.md](DEMO_GUIDE.md). The three licensed historical photos are bundled for the photo-review path. For a firsthand field demo, prepare your original stream photos with actual place/time and your own note; [MEDIA_CHECKLIST.md](MEDIA_CHECKLIST.md) gives the exact shot list. Start with the Field kit, create and confirm the observation, inspect its sources and human decisions, then export and restore the field pack in another browser.

The app does not contain synthetic sample buttons or a generated evidence image. If the real note produces no clarification, show that result honestly. If optional AI is unavailable, retain the original evidence and continue with local rules. A provider error cannot become an invented AI result.

## Rubric evidence

| Criterion | Concrete evidence to show |
|---|---|
| Impact and alignment | Citizen-to-reviewer example that prevents an appearance claim becoming an unsupported conclusion |
| Innovation | Preserved disagreements, explicit uncertainty and source-linked follow-ups |
| Technical implementation | Running workflow, API contracts, immutable decisions, retained media and portable exports |
| Usability | Mobile field interface, accessible controls, focused questions and visible error states |
| Feasibility | Browser-first prototype, documented API boundaries, open-source dependencies and a clear path to authenticated collaboration |

See DEMO_GUIDE.md for exact buttons, manual checks and a problem-report template. The user-supplied brief focused this pass on Track 3 oversight; it is not fresh verification of eligibility or prizes. Latest interface and browser storage/import flows have code/build verification only; device checks remain manual.

## Before submission

- Public source repository verified on Sept30; dependency notices included. Select a license for original project code before submission.
- Complete team invitations and credits using actual contributor names and roles.
- Provide a verified deployment URL with the intended judge-access settings; no successful deployment is recorded yet.
- Record the actual 3–5 minute video. The script above is not a video deliverable.
- Complete physical camera/video/voice and offline walkthroughs on intended devices; update QA.md with observed results.
- Keep the latest provider availability limitations in the submission. No prediction of winning or invented evaluation score is justified.
