import {
  assess,
  createReport,
  decideIssue,
  reviewReport,
  type ObservationInput,
  type Report,
} from "./assessment";
export const scenarios: {
  title: string;
  description: string;
  input: ObservationInput;
}[] = [
  {
    title: "Brown water, uncertain cause",
    description: "An appearance observation becomes a claim about sewage.",
    input: {
      site: "Brookside footbridge",
      observedAt: "2026-09-26T08:30:00Z",
      note: "The water is brown, so it must be sewage. I saw leaves collecting beside the footbridge.",
      appearance: "brown",
      synthetic: true,
    },
  },
  {
    title: "Two descriptions, one report",
    description: "The selected appearance and the field note disagree.",
    input: {
      site: "Willow Park stream",
      observedAt: "2026-09-26T10:15:00Z",
      note: "The water looked brown by the stepping stones. There were a few floating leaves.",
      appearance: "clear",
      synthetic: true,
    },
  },
  {
    title: "A useful unknown",
    description: "An honest observation keeps what we do not know visible.",
    input: {
      site: "Eastbank walking path",
      observedAt: "2026-09-26T11:00:00Z",
      note: "I could not see the water clearly from the path, so I do not know its appearance. I saw litter on the bank.",
      appearance: "unsure",
      synthetic: true,
    },
  },
];
export function sampleReports(): Report[] {
  return scenarios.map((s, index) => {
    const at = new Date("2026-09-26T12:00:00Z");
    let a = assess(s.input, at);
    for (const issue of a.issues)
      a = decideIssue(a, issue.id, "uncertain", "", at);
    let r = createReport(s.input, a, at, `sample-${index + 1}`);
    if (index === 2)
      r = reviewReport(
        r,
        "reviewed",
        "The observer explicitly retained uncertainty. This is a workflow review only; no environmental condition has been verified.",
        at,
      );
    return r;
  });
}
