"use client";
import { ArrowRight, Camera, Check, Fish, Footprints, Leaf, MapPin, ScanLine, Sprout, Waves } from "lucide-react";
import { useState } from "react";
import type { FieldEvidence } from "@/lib/field";

export const contextLabels: Record<string, string> = {
  not_recorded: "Not recorded / unsure", vegetated: "Plants along the bank", bare: "Bare soil or rock",
  built: "Built or concrete bank", mixed: "Mixed bank cover", seen: "Wildlife seen",
  not_seen: "None seen during this visit", walking: "Walking or commuting", recreation: "Recreation near the water",
  water_collection: "Water collection observed", other: "Other use observed",
};
const blankContext: NonNullable<FieldEvidence["oneHealth"]> = { bank: "not_recorded", wildlife: "not_recorded", humanUse: "not_recorded", note: "" };

export function OneHealthNotes({ value, onChange }: { value: FieldEvidence; onChange: (value: FieldEvidence) => void }) {
  const context = value.oneHealth ?? blankContext;
  return <details className="one-health-notes"><summary><Sprout size={18} /><span>Look beyond the water<small>Optional One Health notes</small></span><span className="tag">People · wildlife · habitat</span></summary>
    <p>Record what you directly noticed on this visit. Leaving a field unknown is useful, too.</p>
    <div className="context-grid">
      {([{ key: "bank", label: "Along the bank", icon: Leaf, options: ["not_recorded", "vegetated", "bare", "built", "mixed"] },
        { key: "wildlife", label: "Wildlife", icon: Fish, options: ["not_recorded", "seen", "not_seen"] },
        { key: "humanUse", label: "People & the stream", icon: Footprints, options: ["not_recorded", "walking", "recreation", "water_collection", "other"] }] as const).map(({ key, label, icon: Icon, options }) => <label key={key}><span><Icon size={16} />{label}</span><select value={context[key]} onChange={(event) => onChange({ ...value, oneHealth: { ...context, [key]: event.target.value } })}>{options.map((option) => <option key={option} value={option}>{contextLabels[option]}</option>)}</select></label>)}
    </div>
    <label>More context, in your words<textarea rows={3} maxLength={1000} value={context.note} onChange={(event) => onChange({ ...value, oneHealth: { ...context, note: event.target.value } })} placeholder="Describe any visible plants, animals, or activity nearby. Leave names and causes unknown if you are unsure." /></label>
    <small>Not seeing wildlife does not establish its absence. These citizen notes describe context, not biodiversity or human health outcomes.</small>
  </details>;
}

export function OneHealthSummary({ field }: { field?: FieldEvidence }) {
  if (!field?.oneHealth) return null;
  const context = field.oneHealth;
  return <section className="context-summary"><p className="eyebrow">ONE HEALTH / CITIZEN CONTEXT</p><dl><div><dt>Bank</dt><dd>{contextLabels[context.bank]}</dd></div><div><dt>Wildlife</dt><dd>{contextLabels[context.wildlife]}</dd></div><div><dt>People</dt><dd>{contextLabels[context.humanUse]}</dd></div></dl>{context.note && <blockquote>{context.note}</blockquote>}<small>Directly reported context; no ecological or health conclusion.</small></section>;
}

export function CaptureGuide({ compact = false, historical = false }: { compact?: boolean; historical?: boolean }) {
  return <section className={`capture-guide${compact ? " compact" : ""}`}>
    <div className="section-heading"><div><p className="eyebrow">{historical ? "REVIEW A SOURCE. PRESERVE ITS LIMITS." : "A SMALL FIELD KIT. A USEFUL RECORD."}</p><h2>{historical ? "Read the photograph carefully." : compact ? "Three views tell more." : "Bring the stream into focus."}</h2></div>{!compact && <span className="tag"><Camera size={14} /> Photos are enough</span>}</div>
    <div className="shot-grid">
      {(historical ? [
        { icon: MapPin, label: "01 / THE SOURCE", title: "Keep the attribution", detail: "Retain the photographer, licence and source date. The source location is not camera GPS." },
        { icon: ScanLine, label: "02 / WHAT IS VISIBLE", title: "Describe the frame", detail: "Inspect the whole image. Note visible water, banks or structures; lighting and framing can mislead." },
        { icon: Waves, label: "03 / THE UNKNOWNS", title: "Keep uncertainty", detail: "Leave measurements, species and causes unknown. A historical photograph does not describe conditions today." },
      ] : [
        { icon: Waves, label: "01 / THE SETTING", title: "A wide view", detail: "Show the stream, both banks if visible, and a recognizable landmark. Landscape orientation works well." },
        { icon: ScanLine, label: "02 / THE DETAIL", title: "The water surface", detail: "From the bank, capture what you can see: appearance, floating material, reflections or foam. Avoid filters." },
        { icon: Leaf, label: "03 / THE CONNECTION", title: "The bank & habitat", detail: "Show plants, litter, or nearby activity. Describe what is visible; leave species and causes unknown." },
      ]).map(({ icon: Icon, label, title, detail }) => <article key={title}><div className="shot-graphic" aria-hidden="true"><Icon size={compact ? 25 : 38} strokeWidth={1.2} /></div><span>{label}</span><h3>{title}</h3><p>{detail}</p></article>)}
    </div>
    <p className="guide-note"><MapPin size={16} /> {historical ? "Your note reviews the credited source photo. No new field visit, exact capture time or instrument reading is implied." : "Add the place, actual date and time, and your own note. Stay on a safe, accessible path; a phone is enough."}</p>
  </section>;
}

export function FieldGuide({ onStart }: { onStart: () => void }) {
  const [checked, setChecked] = useState<string[]>([]);
  return <>
    <header className="kit-heading"><div><p className="eyebrow">THE FIELD KIT</p><h1>Real places.<br /><em>Useful evidence.</em></h1><p>Everything you need for a thoughtful stream observation. Start small, keep the originals, and return to the same place.</p></div><button className="btn primary" onClick={onStart}>Start an observation <ArrowRight size={17} /></button></header>
    <CaptureGuide />
    <div className="kit-two-column"><section className="panel visit-checklist"><p className="eyebrow">BEFORE YOU HEAD OUT</p><h2>A quick preparation.</h2>{["Choose a safe, publicly accessible viewpoint.", "Use original images, without color filters or AI edits.", "Note the stream or landmark and actual observation time.", "Repeat one viewpoint on another visit for a comparison."].map((label) => <label key={label}><input type="checkbox" checked={checked.includes(label)} onChange={(event) => setChecked((items) => event.target.checked ? [...items, label] : items.filter((item) => item !== label))} /><span>{label}</span><Check size={15} /></label>)}<small>Personal checklist for this visit. It does not add evidence to your reports.</small></section><section className="kit-note"><Camera size={27} /><h2>Three photos.<br />One honest observation.</h2><p>A short 5–10 second clip is optional. Save up to four files per observation, each up to 25 MB. JPEG, PNG and WebP photos are supported.</p><p>Keep pH and other measurements blank unless you used an instrument. A photo cannot supply those readings.</p><a href="https://archive.epa.gov/water/archive/web/html/vms32.html" target="_blank" rel="noreferrer">Background: EPA visual assessment guidance ↗</a></section></div>
  </>;
}
