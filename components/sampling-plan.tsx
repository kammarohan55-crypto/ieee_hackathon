"use client";
import { useMemo, useState } from "react";
import { ArrowUpRight, Camera, ChevronDown, CircleHelp, ClipboardCheck, Compass, ShieldCheck } from "lucide-react";
import type { Report } from "@/lib/assessment";
import { missionPriorityLabels, samplingMissions } from "@/lib/sampling-plan";

export function SamplingPlan({ records, onOpen, onFollowup }: { records: Report[]; onOpen: (id: string) => void; onFollowup?: (report: Report) => void }) {
  const missions = useMemo(() => samplingMissions(records), [records]);
  const [filter, setFilter] = useState<"all" | "review" | "followup">("all");
  const [limit, setLimit] = useState(4);
  const filtered = missions.filter((mission) => filter === "all" || mission.action === filter);
  const reviewCount = missions.filter((mission) => mission.action === "review").length;
  const visitCount = missions.length - reviewCount;
  return <section className="sampling-plan" aria-labelledby="sampling-plan-heading">
    <div className="mc-panel-heading"><span><Compass size={15} /> EVIDENCE ACTIONS</span><span className="mc-chip">{missions.length} OPTIONS</span></div>
    <div className="sampling-intro"><div><h2 id="sampling-plan-heading">A useful next step.</h2><p>From your saved evidence, with a reason for every action.</p></div><span className="sampling-method"><ShieldCheck size={13} /> Local rules</span></div>
    <div className="sampling-filters" role="group" aria-label="Evidence action filter">{([{ value: "all", label: "All", count: missions.length }, { value: "review", label: "Review", count: reviewCount }, { value: "followup", label: "Fresh visit", count: visitCount }] as const).map((item) => <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => { setFilter(item.value); setLimit(4); }}>{item.label}<span>{item.count}</span></button>)}</div>
    <div className="sampling-cards">{filtered.slice(0, limit).map((mission) => {
      const report = records.find((record) => record.id === mission.reportId);
      return <article key={mission.id} className={`sampling-card priority-${mission.priority}`}>
        <div className="sampling-card-top"><span>{mission.action === "review" ? <ClipboardCheck size={14} /> : <Camera size={14} />}{missionPriorityLabels[mission.priority]}</span><small>{mission.source === "historical" ? "Historical source" : "Field record"}</small></div>
        <h3>{mission.title}</h3><p className="sampling-site">{mission.site}</p><p>{mission.reason}</p>
        <details><summary>Why this action <ChevronDown size={13} /></summary><ul>{mission.basis.map((reason, index) => <li key={index}>{reason}</li>)}</ul><p>{mission.nextAction}</p></details>
        <button type="button" className="mc-button" onClick={() => { if (mission.action === "followup" && onFollowup && report) onFollowup(report); else onOpen(mission.reportId); }}>{mission.action === "followup" && onFollowup ? "Start linked visit" : "Open evidence & review"}<ArrowUpRight size={14} /></button>
      </article>;
    })}</div>
    {!filtered.length && <div className="sampling-empty"><ShieldCheck size={24} /><div><strong>{missions.length ? "No actions in this filter." : records.length ? "No open evidence actions." : "Your evidence sets the direction."}</strong><p>{missions.length ? "Choose All to see the available actions." : "Save an observation to see grounded review and optional follow-up actions. Unknowns can stay unknown."}</p></div></div>}
    {filtered.length > limit && <button type="button" className="sampling-more" onClick={() => setLimit(limit + 4)}>Show {Math.min(4, filtered.length - limit)} more actions <ChevronDown size={14} /></button>}
    <p className="sampling-limit"><CircleHelp size={13} /> Order reflects evidence-workflow needs, not ecological risk. A fresh visit is optional. Reviewed uncertainty stays in its receipt.</p>
  </section>;
}
