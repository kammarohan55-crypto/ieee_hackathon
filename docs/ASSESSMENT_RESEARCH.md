# Evidence-informed observation vocabulary

Checked 2026-09-28. Three primary public sources; these inform prototype wording, not an official OneAquaHealth schema or validated classifier.

## Vocabulary for the prototype
- **Context:** stream/site name, location description or landmark, observation date/time, optional coordinates, optional photograph.
- **Appearance:** observed color; clear/cloudy; visible foam; surface sheen. Record these separately from a suspected cause.
- **Surroundings:** visible litter, leaves/twigs, bank vegetation, exposed/eroded banks, visible wildlife.
- **Movement:** still/slow/fast-looking flow, explicitly a visual description rather than a measured velocity.
- **Optional odor already noticed:** observer's own words; do not prompt users to approach or deliberately smell water.
- Every field permits **not observed / unsure**. These are distinct from **observed absent**.

The contextual and visual categories are adapted from EPA's visual assessment and habitat-walk guidance [S6, S7]. The selectable wording above is our product decision.

## Four clarification rules (engineering decisions)
1. **Separate observation from cause.** If a note asserts sewage, oil, toxins, or another cause based only on appearance, retain the original words and label the cause unverified. Ask: “What did you directly notice: color, cloudiness, foam, or a surface sheen?” EPA describes multiple possible origins for foam and sheens [S7]; USGS describes both dissolved and suspended sources of color [S8].
2. **Make the place and time identifiable.** Ask for a missing date/time or a recognizable site landmark. Do not manufacture coordinates or timestamps. EPA stresses precise location and identifiable photographs and notes [S6, S7].
3. **Resolve conflicts without guessing.** If structured fields and the note disagree, display both and ask which description the observer intends. Never overwrite the original. This confirmation workflow is a project safeguard, not an EPA protocol.
4. **Allow uncertainty to remain.** Ask one useful clarification, then allow “not sure” or “not observed.” Do not change that to “absent.” EPA allows unanswered fields when a volunteer cannot determine the answer [S7]. Human acceptance confirms the report wording, not environmental truth.

## Sources and limits
- **S6:** https://archive.epa.gov/water/archive/web/html/vms32.html — EPA, *3.2 The Visual Assessment*. Directly opened. Archived guidance (page updated 2012); useful for observation context and coordinator review, not current regional requirements.
- **S7:** https://archive.epa.gov/water/archive/web/html/vms41.html — EPA, *4.1 Stream Habitat Walk*. Directly opened. Archived method explicitly describes limited scientific rigor; use only vocabulary and uncertainty principles, not its diagnostic suggestions or numerical cutoffs.
- **S8:** https://www.usgs.gov/water-science-school/science/water-color — USGS, *Water Color*. Directly opened. Educational explanation of color mechanisms; does not identify the cause of any submitted observation.

No water-safety, pathogen, disease-risk, pollutant-identification, or ecological-status conclusion follows from these prototype fields. No scientific validation or organizer compatibility has been demonstrated.
