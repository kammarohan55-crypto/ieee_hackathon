# StreamCheck build plan

Historical plan. Current implementation and remaining work are recorded in PROJECT_CONTEXT.md, FEATURE_AUDIT.md and streamcheck/docs/QA.md. Do not interpret this original plan as an unbuilt checklist.

## Minimum complete product
1. Mobile-friendly observation form: site label, observation time, original note, a small verified vocabulary, and an explicit “not observed / unsure” option. An attached photo may be retained as evidence; image interpretation is outside the initial scope.
2. Transparent checks: required context, invalid dates, contradictions, and unsupported causal language. Distinguish deterministic form checks from AI suggestions and domain guidance. Each check explains its basis; app completeness is never an ecological health score.
3. Focused clarification: AI proposes at most one follow-up per round, with a small maximum number of rounds and an option to continue with uncertainty. Responses use a validated schema and reference submitted evidence. Reject invalid or unsupported outputs. A server-side provider adapter must handle timeout and failure.
4. Explicit confirmation: show original and proposed values before acceptance. Keep source spans/field IDs, actor, time, rejected suggestions, and unresolved issues. Never silently overwrite an observation.
5. Reviewer view and export: inspect original evidence and changes, then mark “needs more information” or “reviewed,” with a note. These are workflow states, not scientific certification. Export a versioned JSON record with provenance. Role switching in a demo must be labeled; it is not production authentication.

## Engineering defaults to resolve at implementation
- Prefer a small TypeScript web application and shared schemas; choose exact framework and versions after inspecting installed tools and applicable website skills.
- Begin with synthetic fixtures and local persistence, clearly labeled. Do not imply multi-user durability. Add hosted storage/auth only if necessary for the chosen demonstration.
- Keep check logic independently testable. Use standard validation for dates and required fields; use AI for language ambiguity and clarification.
- Use a small curated reference set with provenance for domain guidance. No unrestricted retrieval or open-ended environmental advice in the first build.
- No OneAquaHealth API access, data license, field mapping, or FHIR compatibility is established. JSON export is our own documented format until a verified adapter is implemented.
- A deterministic fallback may keep the form usable during an API outage, but the interface must accurately identify which capability ran. Recorded examples must say they are recorded.

## Evidence of value
Create a small, fixed held-out evaluation set before tuning prompts: valid observations, missing details, contradictions, unsupported causal assertions, unknowns, and adversarial instructions embedded in notes. Keep development examples separate.

Compare deterministic validation alone against the same validation plus AI. Report issue detection with denominators, false flags, unsupported facts introduced, correct abstentions, and response latency. Disclose fixture authorship, sample size, model/configuration, and whether a domain expert reviewed labels. These measure prototype behavior, not ecological diagnostic accuracy. Record real user walkthrough findings only when actually conducted.

Required behavioral checks: original evidence survives edits; acceptance/rejection is explicit; unknowns stay unknown; export round-trips correctly; malformed model output and timeout fail safely; text in a citizen note cannot override system instructions. Check mobile layout, keyboard navigation, labels, and readable errors.

## Sequence and time budget
- September 28–29: verify vocabulary; build and test the complete basic workflow.
- September 30: integrate structured AI clarification and evidence validation.
- October 1: run the held-out comparison; fix failures; conduct available user walkthroughs.
- October 2: polish accessibility, error handling, export, deployment, and documentation.
- October 3: freeze the MVP; prepare the public repository, record a 3–5 minute demo, and complete submission fields.
- October 4: buffer for final verification and submission, well before the official deadline.

If time slips, cut photo handling, maps, accounts, additional languages, and external integrations first. Preserve the evidence trail, measured results, working demo, repository, and video.

## Rubric strategy
| Criterion | What judges can inspect |
|---|---|
| Impact, 30% | A citizen report made clearer for a reviewer; explicit One Health relevance and limits |
| Innovation, 20% | Targeted clarification tied to evidence, retained uncertainty, and human approval |
| Implementation, 20% | Working full workflow, reliable schema handling, exports, failure behavior, measured evaluation |
| Usability, 15% | Plain-language mobile form, accessible controls, understandable review differences |
| Feasibility, 15% | Documented data contract, realistic integration path, operating limits and costs |

These are planned evidence, not scores or achieved outcomes. The main competitive risk is appearing to be a generic form validator: demonstrate domain-specific clarification and a useful reviewer workflow, then measure the improvement over form validation alone.

