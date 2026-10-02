import { FlaskConical } from "lucide-react";
import type { Report } from "@/lib/assessment";
export function DemonstrationNote({ report }: { report: Report }) {
  if (!report.demonstration) return null;
  return <aside className="demonstration-note" aria-label="Example record provenance"><FlaskConical size={17} /><div><strong>Presentation example</strong><p>{report.demonstration.authorship}. Real source photograph; review states demonstrate the software workflow. No field visit or expert validation is claimed.</p></div></aside>;
}
