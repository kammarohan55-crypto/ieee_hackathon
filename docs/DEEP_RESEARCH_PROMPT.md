# AquaLens — complete Deep Research prompt

Prepared 2026-10-03. Copy the entire block into ChatGPT Deep Research. Application-code baseline: 202ead3f923802520c031e264b085b1bbe2ee54b; later documentation commits may exist. If GitHub access fails, attach the checked source-only outputs/aqualens-source.zip and this brief. Never upload .dev.vars, .env, credentials or private browser/field data. Research only; no implementation, deployment, account actions or submissions are authorized by this brief.

```text
Act as a critical environmental citizen-science researcher, product designer and software architect reviewing my existing AquaLens / StreamCheck project for the OneAquaHealth IEEE Global Hackathon 2026.

I want the strongest defensible submission we can finish before the deadline: beautiful useful visuals, reliable AI assistance, clear human oversight and convincing real-world value. Do not guarantee a win, invent winning odds or flatter weak ideas. Recommend concrete improvements to the EXISTING application. I will return your research report to my coding agent; do not write/deploy code or take account actions now.

1. SOURCE OF TRUTH

Repository: https://github.com/kammarohan55-crypto/ieee_hackathon
Verified application-code baseline: 202ead3f923802520c031e264b085b1bbe2ee54b, October3,2026 India time. Inspect main and report the revision actually read; newer documentation/implementation may exist.

Start with PROJECT_CONTEXT.md, README.md, docs/FEATURE_AUDIT.md, docs/QA.md, docs/DEMO_GUIDE.md, docs/SOURCES.md, docs/OFFICIAL_PLATFORM_REVIEW.md, docs/REAL_DATA_READINESS.md and docs/DEPENDENCIES.md. Inspect relevant code before declaring a feature working/missing or recommending rebuilding it. Historical doc sections describe earlier states. If repository access fails, say which files you cannot read; use this snapshot provisionally and request a source archive rather than pretending you inspected code.

Key modules: components/streamcheck.tsx orchestrates the flow; lib/assessment.ts preserves originals/text decisions; lib/field.ts contains field/visual/measurement schemas, follow-ups, score and exports; lib/media-store.ts checks/retains media; lib/ai-provider.ts and app/api/assess/route.ts and app/api/visual/route.ts handle AI; lib/workspace.ts handles storage/transfer integrity. lib/presentation-workspace.ts/lib/load-presentation.ts prepare examples. lib/evidence-lab.ts/lib/evidence-trail.ts support inspection/replay/graph. components/evidence-insights.tsx/components/river-portfolio.tsx provide analytics. lib/european-sites.ts/lib/satellite-context.ts/app/api/conditions support geographic/weather context.

Distinguish verified external fact, code-verified feature, project-reported test, user statement, design judgment and unknown. Cite current PRIMARY sources/check dates for decision-critical external claims. Do not invent APIs, licences, free tiers, datasets, ecological thresholds, evaluation results, expert review or deployments. Public visibility is not redistribution permission. Do not use credentials, contact people, create accounts or submit forms.

2. HACKATHON BRIEF — RECHECK CURRENT SOURCES

Overview: https://oneaquahealth-ieee-hackathon.devpost.com/
Rules: https://oneaquahealth-ieee-hackathon.devpost.com/rules
Deadline update: https://oneaquahealth-ieee-hackathon.devpost.com/updates/46660-deadline-extended-to-october-4-keep-innovating-keep-submitting
Learning sessions: https://www.oneaquahealth.eu/project-events/
Research cities: https://www.oneaquahealth.eu/research-cities/
Public platform: https://apps.oneaquahealth.eu/sites
Inspect publicly linked site-list/city-dashboard/EO-imagery/EO-indicator/resilience-map/community/project-solutions/deliverable/terms pages. Do not assume guessed routes or private APIs work.

Mission summarized from organizer material supplied to the project: improve urban freshwater monitoring using citizen science, technology and One Health, connecting ecosystems/biodiversity with human, animal and environmental well-being. Our contribution concerns evidence quality/reviewability; improved ecological outcomes and early warning have not been demonstrated.

Seven published tracks, summarized from supplied organizer material:
1 Citizen Science UX — guided observations, simpler language, participation and data quality.
2 Data-to-Insight — dashboards/maps, patterns and understandable One Health context.
3 AI-Supported Assessment — responsible prompts, validation, explanations and human judgment.
4 Awareness & Storytelling — engaging One Health education and narratives.
5 Community & Gamification — sustained participation/challenges/social features.
6 Resilience Informatics — early warning/predictive decision support.
7 Digital Health Standards — FHIR/interoperability/agents/integration.

Current project decision: lead with Track3; Tracks1/2/4 support the UX/context/storytelling. The latest organizer extension, checked October3, allows solutions to span multiple tracks naturally and allows individuals/teams. Do not assume exclusive entry, separate track prizes, fewer competitors or an easier-to-win track. Change the primary recommendation only with evidence and explain the effect on our current demo.

Rubric supplied by organizer: impact/mission30%, innovation20%, technical implementation20%, usability/accessibility15%, feasibility/scalability15%, each1–10. Weighted score = .30 impact + .20 innovation + .20 technical + .15 usability + .15 feasibility. Your scores can only be diagnostic estimates, never actual judge scores or win probabilities.

Deadline currently displayed, checked October3: October4,2026 at9PM PDT = October5 at09:30 Asia/Kolkata = October5 at04:00 UTC. Recheck date/time before planning. Original rules still list registration May1–August31, development September16–30, judging October1–15, announcement October24 at IEEE iGET. Newer update permits continued registration/refinement. Report stale/conflicting dates instead of silently inventing a schedule.

Supplied rules require legal adulthood in residence country, Devpost registration, original hackathon work, one team per participant, no competing organizers/judges, respect for copyright/licences/IP and a public documented source repository. Overview badges say students only/team required, while rules/update allow individuals. Student restriction and entrant-specific eligibility remain unresolved. Overview excludes companies/professional organizations and lists country exceptions. I stated that I registered and will invite friends; actual invitations/team status/eligibility have not been independently verified.

Current public cash listing: $1500 first, $1000 second, $500 third, two$250 special mentions ($3500 total). An earlier supplied brief said$5000 cash/in-kind TBD. Treat the newer listing as published information, not guaranteed disbursement. Supplied rules describe top3 merit certificates, participation certificates for eligible entrants, possible1year IEEE membership/Senior Member nomination subject to IEEE conditions, certificate issue within60days/expected December31, and differing tie-resolution wording. Verify material conflicts; do not let prizes drive product choices.

Submission requirements supplied to this project: track alignment; problem/solution/users/impact description;3–5minute demo video; public source/docs; prototype/mockup/proof of concept; submission before the current deadline. No video, hosted URL or completed Devpost submission is verified. Learning-session dates in supplied rules: June12 project introduction; June30 nature/innovation; July15 One Digital Health/FAIR; August27 informatics/HL7FHIR sandbox; September16 Hub tools. Recordings were not reviewed by the coding agent; do not infer their detailed requirements without checking them.

3. CURRENT PRODUCT AND LOGIC

Thesis: help a citizen or photo reviewer create a clearer observation that a reviewer can inspect, question and correct while retaining originals. Intended users: citizen observers, volunteer coordinators and researchers/reviewers. Actual usefulness requires user/domain evaluation.

Workflow:
A. Capture/upload photo/video, or review a licensed historical photo. Retain original bytes in IndexedDB plus SHA256/MIME/dimensions/origin. Video poster/frame gets image checks; this is not continuous video analysis. Camera/codecs need device verification.
B. Record site/time, original note and appearance; optional genuine GPS/manual coordinates, instrument readings/calibration and One Health bank/wildlife/human-use context. Historical photo reviews retain source date/credits and reject invented new GPS, instrument or field-visit context.
C. Local canvas checks estimate brightness, horizontal edge detail and resolution. Warnings indicate dark/bright/low-detail/low-resolution frames; they are engineering heuristics, not calibrated river-image quality or contamination detection.
D. Separately consented server-side text/visual AI, strict schemas/grounded quotes and explicit acceptance. Original notes are never silently rewritten. Selected Gemini3.5Flash-Lite returned genuine valid text/photo results in bounded checks. Optional xAI/Groq adapters exist but current successful access is not established. Server-only keys; fallback disabled here. A failure shows an honest error/local rules. Future model/quota availability is not guaranteed.
E. At most5 visual candidates from a limited vocabulary: brown/green/cloudy appearance, surface foam, floating material, bank litter, vegetation, water not visible. Low/medium/high confidence is uncalibrated; whole/upper/lower/left/right/center are coarse regions, not detection boxes/segmentation. No species, pollutant, pathogen, safety or ecological diagnosis.
F. Deterministic English checks flag missing context/invalid time, unsupported causal/safety claims, some note-versus-appearance contradictions, ambiguity/instruction-like text and image references needing context. Follow-ups can address visual-versus-selected-colour disagreement, candidates, image limitations and measurement metadata. Bounded rules are not general scientific reasoning.
G. pH/temperature/conductivity/turbidity inputs check units, instrument, calibration and broad plausibility. These are transcription/metadata checks, not environmental health thresholds; no readings inferred from images.
H. User answers/retains uncertainty/dismisses and explicitly confirms. Local demo reviewer records reviewed/needs-information with reason; visual candidate dispositions supports/disagrees/uncertain retain history. Approval means authorship/review workflow, not scientific truth. Roles are unauthenticated; disagreement is not resolved by majority voting.
I. Decision Receipt preserves original evidence/checks/method/provenance/decisions/history. Hash matching is not authentication or a legal signature. Graph edges show provenance, not ecological causality. Replay reruns deterministic rules/retained events, not old AI models.

Completeness-v1 score0–100: place/time/note presence30; coordinates10; media15; image checks15 (5with warnings); acknowledged clarifications20; valid measurement metadata OR no readings supplied10. Unknowns may remain acknowledged. Historical reviews have no invented coordinates. Score is a transparent completeness checklist, never truth/water health/model confidence. Assess weights/denominators, misleading incentives and labels before recommending changes.

Existing surfaces/features:
- Mission control/photo desk: source search/field-history filters, zoom/grid, manual pins, coarse AI regions, two-image wipe/side-by-side, evidence graph/event replay.
- Review desk/Evidence Lab: originals/gaps/decisions, Decision brief, nonmutating rule replay and optional actual software diagnostics.
- Insights: workflow donut, metadata coverage,14UTCday saving activity, source counts, filterable evidence matrix; workflow counts, not ecological trends.
- Photographic river portfolio: city/status/day/scope filters and source-date chronology opening receipts. Different historical viewpoints are not registered before/after environmental measurements.
- Map: supplied field coordinates separately from sourced city-overview markers; keyless streets, dated coarse NASA Terra/MODIS and historical2021 annual Sentinel2RGB/WorldCover-related landscape context. No calibrated physical digital twin or stream-scale water diagnosis. Open-Meteo is separately timed MODELED weather with units/grid/retrieval/hourly charts/table/explicit refresh, not stream sensors or weather at an old photo time.
- Field kit: guidance, repeat-photo ghost alignment and explicit linked visits. Browser-dependent English voice-to-note needs user review; private/offline speech or complete voice-to-structured automation is not established.
- JSON/CSV/GeoJSON/FAIR-oriented metadata and original-media field packs/conflict checks; no FAIR certification, FHIR conformance or verified official integration.
- Workbox offline shell/local evidence; online AI/maps/weather still require connection; installed offline operation needs device testing.
- Evidence Actions prioritize actual record review/optional fresh visits, not ecological danger. Restricted pH comparison requires same site/named instrument, checked calibration and3non-synthetic distinct-time records. No validated trend/outlier forecasting, shared community consensus or expert backend.

4. REAL DATA, ARCHITECTURE, VERIFICATION

Personal / and separate /showcase reuse components with distinct record/draft keys and dedicated media IDs. Examples cannot be imported into personal records. Existing edits retained; versioned assets avoid stale service-worker context and persistence waits for the correct workspace key.

Nine unchanged licensed Commons1280px photos, three each Mondego/Coimbra, Garonne/Toulouse, Hoffselva/Oslo, dates2010–2021, with author/licence/date/digests. They are not team photos, official sampling-station observations or current conditions. Eight genuine recorded Gemini analyses contain10unverified candidates with provider/model/time/hash; genuine expert review remains pending. People-visible Parque Verde photo stays local-only. Nine initial notes/confirmations/review decisions and one pipe pin are AI-authored software examples, explicitly labelled. Initial distribution:3reviewed examples/3information requests/3awaiting; saving timestamps are preparation times, not fabricated past activity. Historical photos, recorded AI and current modeled weather have separate clocks.

Stack: React19/TypeScript, Next-style app on Vinext/Vite/Cloudflare Worker routes; Zod/idb/localStorage, MapLibre/ReactFlow/Recharts/Radix/Workbox/Lucide/CSS. No new dependency in latest polish. Database/example scaffolding does not establish a deployed authenticated/shared backend. Original-code licence/team attribution still need approved owner facts; media/dependency licences remain separate.

Project-reported verification:362/362 authored software checks, TypeScript/full lint/production build pass. Contract tests use mocks and do not measure AI/ecological accuracy. Agent browser QA exercised principal review/Lab/map/weather/presentation/source-preparation flows and the9record/10candidate preset. Physical capture/mic/GPS, installed offline behavior, other browsers, quota/concurrent tabs, screen readers and native download completion remain checks; an in-app download wait timed out. Mobile body fits tested width but a root/internal-overflow measurement issue remains. Existing chunk/framework notices remain. No independent human/domain evaluation, expert approval, production deployment, submitted video or competition result.

5. RESEARCH TASKS

Audit against the weighted rubric. Identify weaknesses that reduce impact/novelty/reliability/usability/feasibility. Separate unsupported science, bugs, UX defects, missing evaluation/user evidence and optional polish. Do not equate beautiful charts or362tests with environmental value.

Compare fairly with the official platform's ACTUAL public behavior. October2 browser review observed five cities Benevento/Coimbra/Ghent/Oslo/Toulouse,106site rows, historical researcher tables, EO tools/resilience menus. These are dated observations, not freshly reverified facts. Empty HTML is not missing functionality; inspect rendered UI if available. Sign-in features unknown. Do not reuse public frontend tokens, guess private APIs or copy registry/risk labels/EO imagery without explicit applicable rights. Identify complementary value and duplication.

Find legally reusable open data/mature maintained libraries ONLY for an identified gap. For each give primary URL, inspected sample/schema/units, licence/attribution/caching/redistribution, account/key, geographic/time coverage/update lag, native resolution/cloud/missing-data limits, cost/free-tier constraints and fallback. Free underlying data does not imply free rendering service. Explain narrow-stream mixed-pixel limits. No fake live data or health grades fromRGB/NDVI. Check provider/privacy terms relevant to European judge access; account billing is unverified and material unpaid-service disclosure must stay.

Evaluate possible improvements without assuming they are needed: better source-time comparison, guided retake/ROI image quality using proven code, accessible multilingual capture, reviewer triage, explicit proposal diff, clearer uncertainty/abstention, portable interoperable evidence, matched context, or a small genuine human evaluation. Reject duplication, unavailable ground truth and deadline-infeasible features. Do not propose training, FHIR, auth/backend, blockchain or forecasting for spectacle.

Design the smallest credible rules-versus-rules+AI evaluation: missing context/contradictions/unsupported additions, preservation/uncertainty, clarification relevance, reviewer effort/task completion. Specify truth-label provenance, reviewer qualifications, held-out split/baseline, denominators, false flags/abstention, latency/cost and realistic small sample. No fabricated participants/results/power claims. If no suitable licensed dataset exists, propose a disclosed manual study and state what evidence I/reviewer must provide.

6. REQUIRED OUTPUT

A. Executive verdict: strongest product thesis/primary-supporting track framing,3largest gaps; what to keep/fix/simplify/remove/postpone and why it helps the rubric. No win guarantee.
B. Verified hackathon table: deadline/timezone, deliverables, track/eligibility/date/prize conflicts and unknowns, direct sources/check dates.
C. Feature audit: working/partial/missing/broken/unknown, relevant source/evidence, remaining verification and user impact. Clearly distinguish inspected code from this supplied snapshot.
D. At most5ranked improvements; exactly3recommended before submission IF feasible. For each: problem/user, existing component extended, visual interaction/data flow, distinct value beyond current/official tools, data/library/model and rights/access, provenance/uncertainty copy, loading/empty/error/offline states, acceptance checks, effort/dependencies/risk, and20second demo beat. Include an evaluation-first/no-new-feature option if stronger. Separate later ideas.
E. Executable order: immediate1–3hour fixes, bounded6–12hour work IF time remains, freeze/test/record/submit with contingency. Separate coding-agent work from my human evidence/credential/permission. Prefer no-key/browser/open-source and never ask me to paste a secret.
F. Minimal evaluation/evidence plan: truthful claims now, what a small study could establish, and prohibited claims. No invented improvement percentages.
G. Professional visual interaction story, mobile/performance/accessibility priorities, layout descriptions tied to current components,3–5minute demo script and8substantive judge questions with defensible answers/unknowns. Put strongest inspectable value early; examples/recorded AI/context clocks remain clear.
H. Coding-agent handoff with exact target files, data contracts, acceptance tests, blocked integrations and source-register entries (URL/date/verified claim/limits). End with a short copyable implementation message I can return to my agent.

Be detailed where it changes a decision, concise elsewhere. Use primary documentation, original repositories and relevant peer-reviewed research. Report failed access/unknown rights honestly. Preserve working parts/original evidence and human oversight. A small reliable, visually compelling project is better than unfinished breadth. Do not hide material disclosure to improve appearance.
```
