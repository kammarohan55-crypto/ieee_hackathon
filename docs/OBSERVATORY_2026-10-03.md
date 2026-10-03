# Visual observatory and reliable provider fallback — 2026-10-03

This scoped expansion preserves the working evidence/reviewer workflow. It supports citizen UX, contextual insight, responsible AI assessment and storytelling; it does not establish a judging score or ecological diagnosis.

| Planned feature | Status | Evidence / boundary |
| --- | --- | --- |
| Separate premium visual page | Working | /visuals, four views; local collections read-only and separate |
| 30 additional real river photographs | Working | 39 total, real published dates2005–2026, per-file hashes/dimensions/credits; no fabricated observations |
| Visual archive analytics | Working | Source-year/city counts, calendar quarters and formats; missing years retained; not ecological trends |
| Playback / filters / export | Working | Optional3.5s playback, reduced-motion disable, city/year/format controls, credited source JSON |
| Readable Evidence constellation | Working | Eight-node example, source cards/list, dark-detail contrast, keyboard, selected path/pause |
| Globe overview without edge cuts | Working in focused Chrome QA | Adaptive desktop/phone framing, city flights/flat reset; physical devices/other GPUs partial |
| Comparison / Atlas / Decision Receipt | Working | Existing tools reused; exact photo binding, wider catalogue, original example/AI/review labels retained |
| Offline observatory | Working in controlled browser QA | Production SW-controlled reload,39 sources/photo/eight-node graph; installed PWA not tested |
| Gemini→Groq fallback | Working software contracts; live Groq capabilities checked | Consent/actual provider preserved;18/25s total budgets; no real outage induced |
| Groq rejected-key recovery | Working authored contracts; credentials reachable | Only401 rotates; no429/403/5xx/invalid-output bypass; four model-list200 checks |
| Source-date weather for new catalogue | Partial data coverage | All39 anchor mappings supported; only original nine seven-day windows recorded; additional windows explicit/keyless |
| Fresh citizen/expert study / live stream sensors | Missing | Real inputs/review required; stock photos/authored judgments cannot substitute |

Source photos are Commons thumbnails: original nine unchanged;15 new Coimbra,14 Toulouse,one Oslo. Oslo Commons category did not offer30 interchangeable stream views; no duplicated/fake balanced city dataset added. Full source labels/dates/licences in public/images/references/CREDITS.md. View titles are curated labels; canonical source titles/hashes stay unchanged.

Architecture: app/visuals/page.tsx → components/visual-observatory.tsx; lib/visual-analytics.ts derives coverage; lib/references.ts exports original/extended/unified registries; lib/river-stories.ts requires exact retained source/media; existing PhotoCompare, GeographicEvidenceMap, EvidenceGraph, DecisionPresentation remain shared. app/observatory.css loads last to resolve legacy contrast/layout rules. No new dependency, backend, record schema, storage keys or source-context revision.

AI configuration: ignored.dev.vars only, Gemini primary/Groq alternative; GROQ_API_KEY plus optional_2/_3/_4, qwen/qwen3.8-27b. Same-provider401 recovery and separate-provider availability fallback share bounded deadlines. Consent scope names providers/models, never secrets. Strict schemas reject unsupported output; deterministic rules survive failure. Live check output is ignored and never seeded as approved evidence.

Meaningful checks:423 authored tests; TypeScript/lint/18CSS parses/build; focused isolated Chrome/image/filter/export/layout/receipt/offline verification. QA.md separates current results, historical checks, harness failures and genuine physical/human/hosting gaps. No winning guarantee.
