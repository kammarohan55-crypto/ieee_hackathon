"use client";
import { ArrowRight, Clock3, GitBranch, Plus } from "lucide-react";
import type { Report } from "@/lib/assessment";
import { isSyntheticRecord } from "@/lib/atlas";
import { displayEvidenceTime } from "@/lib/references";
import { visitLinks } from "@/lib/visit-links";

export function LinkedVisits({ report, records, onOpen, onFollowup }: { report: Report; records: Report[]; onOpen: (id: string) => void; onFollowup: (source: Report) => void }) {
  if (report.field?.reference || isSyntheticRecord(report)) return null;
  const { parent, missingParent, children } = visitLinks(report, records);
  const card = (record: Report, label: string) => <button type="button" className="lv-record" key={record.id} onClick={() => onOpen(record.id)}><span>{label}</span><strong>{record.original.site}</strong><time><Clock3 size={12} /> {displayEvidenceTime(record.original.observedAt)}</time><small>{record.field?.media.length ?? 0} retained files · {record.status.replaceAll("_", " ")}</small><ArrowRight size={15} aria-hidden="true" /></button>;
  return <section className="linked-visits" aria-label="Explicit visit connections"><header><div><p><GitBranch size={14} /> VISIT CONNECTIONS</p><h3>Follow the evidence over visits.</h3></div><button type="button" className="btn small secondary" onClick={() => onFollowup(report)}><Plus size={14} /> Fresh follow-up</button></header><div className="lv-trail">{parent && card(parent, "SOURCE VISIT")}{missingParent && <p className="lv-missing">Linked source record is not available in this browser. The recorded link is preserved.</p>}<div className="lv-current"><span>CURRENT RECORD</span><strong>{report.original.site}</strong><time>{displayEvidenceTime(report.original.observedAt)}</time></div>{children.slice(0, 6).map((child) => card(child, "LINKED FOLLOW-UP"))}</div>{children.length > 6 && <p className="lv-limit">Showing six of {children.length} linked follow-ups; inspect the complete collection in Insights.</p>}<p className="lv-limit">{children.length ? "These connections come from explicit follow-up record IDs." : "No subsequent linked visit is saved yet."} Fresh visits begin with an empty note, media and readings. A link does not prove matching viewpoints or environmental change.</p></section>;
}
