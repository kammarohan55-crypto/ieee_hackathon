# AquaLens — final completion checklist

Updated 2026-10-03. This is a readiness checklist, not a completed field study, device test, deployment or submission. Current primary decision: Track3, supporting1/2/4. Use FEATURE_AUDIT for implementation boundaries and QA for measured software checks.

## What the user needs to provide

| Item | Exact input | Why / status |
| --- | --- | --- |
| AI access | No additional key is currently needed. The supplied Gemini key is saved in ignored `.dev.vars`, with `AI_PROVIDER="gemini"` and Gemini 3.5 Flash-Lite. | Actual text/image source-route checks returnedHTTP200 and passed strict validation. Fresh production-browser text/photo calls also succeeded; future quota remains uncertain; local rules/review survive provider failure. No map/weather key is needed. |
| Firsthand evidence | Suggested three original photos: wide site, surface detail, bank context; actual site/landmark, date/local time/time zone, file mapping, direct note and photographer/use permission. Fill VISIT_NOTES_TEMPLATE.txt. | Recommended for a real field demo. Three bundled European historical images and the checked presentation-media ZIP already support a credited photo-review demo; use Photo desk → Review this photo. Unknown time/context must not be invented. |
| Map location, if demonstrated | Actual WGS84 latitude/longitude and source/uncertainty, or device GPS when safely available. | Optional observation metadata. Enables your real site on the map; no fabricated marker. No water instruments or hardware required. |
| Actual human review | A person inspects the source, records agreement/disagreement/uncertainty and their own reason. A separate reviewer can provide approved name/role/method/date/feedback. | Same-person citizen/reviewer demo is permitted by this app and must be disclosed. No authenticated reviewer or expert-validation claim. |
| Device walkthrough | Desktop + intended phone/browser, steps and actual results using the checks below. | Agent exercised production-browser workflow/maps/Lab/presentation/320–1440px layouts; see QA.md. Physical capture/voice/GPS, native download completion and installed offline behavior remain device checks. |
| Team and credit facts | Approved member names/pseudonyms, Devpost profiles/invitations, actual contributions and permission to credit. | Do not invent membership, qualifications or completed invitations. |
| Original-code licence choice | Confirm the intended licence and copyright holder(s). MIT is an available option, not an activated licence in this repository. | Existing dependency/media licences remain separate. Public source alone is not an open-source licence; see GitHub's licensing documentation and DEPENDENCIES. |
| Video and delivery | Actual3–5minute video link; tested judge-access URL/access instructions if hosted, otherwise describe the source/video proof-of-concept route accurately. | No live hosted demo or recorded video is verified. A live hosted URL needs authorized hosting-account access; no hosting secret should be pasted into chat. |
| Final Devpost entry | Fill SUBMISSION_KIT with actual facts/links and retain submission confirmation. | No account/submission has been inspected. Recheck official deadline/eligibility; source register records conflicting older wording. |

## Minimum user walkthrough

Do not clear an existing collection without an exported backup. Use an empty separate browser profile if testing a clean start. Follow DEMO_GUIDE for exact controls.

1. The requested app is currently running at http://localhost:5173/. Empty Mission control contains no invented visits; historical sources remain labeled.
2. Upload one original photo, enter actual context and note, inspect image-usability warnings and local clarification. If live AI is available, explicitly consent and show the actual response/error and provider.
3. Answer only what is known; confirm. Save/reload must retain original words/media and current decisions. Unknowns must survive.
4. Review the original and any actual visual candidates, record a reason, then inspect the Decision Brief, graph and four-chapter presentation. Missing/inconsistent imported history must remain incomplete.
5. Test photo note pins, comparisonA/B, timeline and an optional linked fresh visit. Old note/time/media/readings/GPS must not silently become new evidence.
6. For a genuinely located record, test street/NASA/2021 landscape views and fallbacks. The annual imagery is historical context; Observation Quality is evidence completeness, never river health.
7. Download JSON/CSV/GeoJSON/readable brief and a pack with originals. Preview/import the pack into a second profile; verify actual record/file counts and original notes. Hashes do not authenticate the scene.
8. Test320–390px layout, keyboard navigation/focus, loading/error/empty states. Test camera/video/voice/GPS only if shown in the video. Reduced-motion setting should suppress nonessential motion.
9. Test offline behavior only with a production build after a controlled online visit. Uncached maps/weather/AI require network; local capture/review/export should stay understandable.

Report: device/browser/version → exact steps → expected/actual result → record/source involved → redacted error text. Never include credentials or private unrelated media.

## What is intentionally outside this release

Shared accounts/community voting, authenticated reviewers, a calibrated physical twin, forecasting, custom model training, numerical NDWI/ERA5 processing, FHIR compliance and independent ecological validation are not pending fixes to this narrow demo. They are unimplemented future scope. No fake substitute will be added to fill them.

## Source handoff

European-explorer implementation d64cce6 is published: push/origin SHA match and anonymous commit API verified. Final handoff follows separately; use the current Git revision. The local source ZIP uses mature `git archive` from final HEAD, with exact commit/digests in outputs/aqualens-source-manifest.json. It excludes ignored credentials/runtime/media kits. The ZIP is source, not a deployed application or media field pack. PROJECT_CONTEXT records actual verification, publication state and the next step for another AI.


Current European source examples are Coimbra/Mondego, Toulouse/Garonne and Oslo/Hoffselva, with photographer/licence/source date retained. City overview coordinates are sourced context, not camera/GPS/station metadata. Real recorded Gemini candidates and Open-Meteo weather snapshots remain separate from citizen notes/confirmation/human reviews. Test the map selectors/focus/dossier, source regions, Three clocks, weather refresh/metric/window/table/export and fallback. No extra key is needed; no current field visit is fabricated.
