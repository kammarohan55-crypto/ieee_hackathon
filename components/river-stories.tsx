"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { Dialog } from "radix-ui";
import { ArrowUpRight, Camera, ChevronLeft, ChevronRight, Expand, Eye, Fingerprint, Globe2, ScanEye, ShieldCheck, Sparkles, X } from "lucide-react";
import type { Report } from "@/lib/assessment";
import type { ReferencePhoto } from "@/lib/references";
import { europeanPlaces } from "@/lib/european-sites";
import { displayEvidenceTime, photoViewingTitle } from "@/lib/references";
import { riverStory } from "@/lib/river-stories";
import { labDecisionBrief } from "@/lib/evidence-lab";
import { findingLabels } from "@/lib/field";
import { recordedProviderLabel } from "@/lib/ai-metadata";

const chapters = [{ id: "look", label: "Look", icon: Eye }, { id: "question", label: "Question", icon: ScanEye }, { id: "decide", label: "Decide", icon: ShieldCheck }] as const;
type Chapter = typeof chapters[number]["id"];

export function RiverStories({ records, onOpen, onReview, initialCity = "coimbra" }: {
  records: Report[]; onOpen: (id: string) => void; onReview?: (photo: ReferencePhoto) => void; initialCity?: string;
}) {
  const [open, setOpen] = useState(false), [city, setCity] = useState(initialCity), [photoId, setPhotoId] = useState("");
  const [chapter, setChapter] = useState<Chapter>("look"), [fullFrame, setFullFrame] = useState(true), [imageFailed, setImageFailed] = useState("");
  const { place, photos, photo, report, media, index } = riverStory(records, city, photoId);
  const brief = report ? labDecisionBrief(report) : undefined;
  const findings = media?.visual?.findings ?? [];
  const go = (step: number) => { const next = photos[index + step]; if (next) setPhotoId(next.id); };
  const inspect = () => { setOpen(false); if (report) onOpen(report.id); else onReview?.(photo); };
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger asChild><button type="button" className="rs-trigger"><Globe2 size={17} /> Open River Atlas <ArrowUpRight size={15} /></button></Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="rs-overlay" /><Dialog.Content className="rs-dialog">
      <header className="rs-header"><div><span className="mc-kicker">AQUA / RIVER ATLAS</span><Dialog.Title>Three places. Look closer.</Dialog.Title><Dialog.Description>Real historical photographs. Retained questions and human decisions.</Dialog.Description></div><Dialog.Close asChild><button type="button" className="rs-close" aria-label="Close River Atlas"><X size={21} /></button></Dialog.Close></header>
      <div className="rs-city-nav" role="group" aria-label="Choose a river story">{europeanPlaces.map((item) => <button type="button" key={item.id} aria-pressed={place.id === item.id} onClick={() => { setCity(item.id); setPhotoId(""); }}><span>{item.country}</span><strong>{item.river}</strong><small>{item.city}</small></button>)}</div>
      <div className="rs-scroll"><div className="rs-stage">
        <section className="rs-photo-column" aria-label="Historical source photograph">
          <div className={`rs-frame${fullFrame ? " is-full" : ""}`}>
            {imageFailed === photo.id ? <div className="rs-image-error"><Camera size={30} /><strong>Photo unavailable</strong><p>Source metadata and retained decisions remain accessible.</p><button type="button" onClick={() => setImageFailed("")}>Retry photograph</button></div> : <img key={photo.id} src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} onError={() => setImageFailed(photo.id)} />}
            <span className="rs-photo-kind">HISTORICAL SOURCE / {place.country.toUpperCase()}</span>
            <button type="button" className="rs-framing" aria-pressed={fullFrame} onClick={() => setFullFrame(!fullFrame)}><Expand size={14} />{fullFrame ? "Full frame" : "Display crop"}</button>
          </div>
          <div className="rs-photo-caption"><div><h3 title={photo.title}>{photoViewingTitle(photo)}</h3><time dateTime={photo.capturedDate}>{displayEvidenceTime(photo.capturedDate)}</time></div><p><a href={photo.sourceUrl} target="_blank" rel="noreferrer">{photo.author} <ArrowUpRight size={12} /></a> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a></p><small>{fullFrame ? "Complete source frame" : "Display crop only"} · source pixels unchanged · no current field visit</small></div>
          <div className="rs-filmstrip" role="group" aria-label="Source-photo chronology">{photos.map((item) => <button type="button" key={item.id} aria-label={`View ${item.title}, ${item.capturedDate}`} aria-pressed={item.id === photo.id} onClick={() => setPhotoId(item.id)}><img src={item.src} alt="" width={item.width} height={item.height} /><time dateTime={item.capturedDate}>{item.capturedDate}</time></button>)}</div>
          <p className="rs-chronology-limit">Different viewpoints and dates, not aligned repeat photographs or proof of environmental change.</p>
        </section>
        <section className="rs-story-column" aria-label="Source-aware story">
          <div className="rs-record-kind"><Fingerprint size={14} />{report?.demonstration ? "Authored software example · no expert validation" : report ? "Saved historical photo review · local browser" : "Source catalogue · no saved review"}</div>
          <div className="rs-chapters" role="group" aria-label="River story chapters">{chapters.map((item, i) => { const Icon = item.icon; return <button type="button" key={item.id} aria-pressed={chapter === item.id} onClick={() => setChapter(item.id)}><Icon size={15} /><span>0{i + 1} / {item.label}</span></button>; })}</div>
          <div className="rs-chapter" key={`${photo.id}-${chapter}`} aria-live="polite">
            {chapter === "look" && <><span className="mc-kicker">01 / START WITH THE SOURCE</span><h2>A photograph opens a question.</h2><p>Look at the surface, banks and built surroundings. Describe what is visible; keep identity and cause unknown.</p><blockquote>{report ? report.original.note || "No original note retained." : photo.alt}</blockquote><small>{report ? report.original.note ? "Literal retained original note" : "Original note unavailable · source image retained" : "Catalogue description · not a citizen observation"}</small><div className="rs-fact"><span>Source date</span><strong>{photo.capturedDate} · time unknown</strong></div><div className="rs-fact"><span>Camera coordinates</span><strong>{report?.field?.coordinates ? "Supplied · inspect the receipt for method" : "Not supplied"}</strong></div></>}
            {chapter === "question" && <><span className="mc-kicker">02 / OBSERVATION BEFORE INFERENCE</span><h2>Possible is not proven.</h2><p>Only candidates retained for this exact photograph are shown. No AI runs when a chapter opens.</p>{media?.visual ? <><div className="rs-method"><Sparkles size={15} /><span>{recordedProviderLabel(media.visual.provider)} · {media.visual.model}<small>{displayEvidenceTime(media.visual.at)} · retained response</small></span></div>{findings.map((finding, i) => { const judgment = report?.field?.dispositions.filter((entry) => entry.mediaId === media.id && entry.finding === finding.kind).at(-1); return <article className="rs-candidate" key={`${finding.kind}-${i}`}><strong>{findingLabels[finding.kind]}</strong><small>{finding.confidence} confidence · uncalibrated · {finding.region.replaceAll("_", " ")}</small><span>Human: {judgment?.decision || "pending"}</span>{judgment && <p>{judgment.reason}</p>}</article>; })}{!findings.length && <div className="rs-empty">No enumerated candidate retained. This does not establish absence or healthy water.</div>}</> : <div className="rs-empty">No visual AI response retained for this photo. Local checks and human inspection remain available.</div>}<p className="rs-limit">Appearance cannot establish pollutants, pathogens, species, water safety or ecological status.</p></>}
            {chapter === "decide" && <><span className="mc-kicker">03 / PEOPLE KEEP THE LAST WORD</span><h2>A reason travels with the evidence.</h2><div className="rs-workflow"><ShieldCheck size={22} /><strong>{brief?.label || "A review has not started."}</strong></div>{brief?.latestReview ? <><blockquote>{brief.latestReview.note}</blockquote><small>Latest retained local review · {displayEvidenceTime(brief.latestReview.at)}</small></> : <p>No human review event retained. Browsing this story does not approve anything.</p>}{brief && <div className="rs-fact"><span>Citizen confirmation</span><strong>{brief.confirmed ? displayEvidenceTime(report!.confirmedAt) : "Not retained / unusable"}</strong></div>}<p className="rs-limit">Confirmation establishes approval, not scientific truth. Local reviewer roles are unauthenticated.{report?.demonstration ? " Initial judgments here are software examples." : ""}</p></>}
          </div>
          {(report || onReview) && <button type="button" className="rs-inspect" onClick={inspect}>{report ? "Inspect complete evidence" : "Start a credited photo review"}<ArrowUpRight size={17} /></button>}
          <a className="rs-official" href={place.official} target="_blank" rel="noreferrer">Explore the research city <ArrowUpRight size={13} /></a>
        </section>
      </div></div>
      <footer className="rs-footer"><button type="button" aria-label="Previous source photograph" disabled={index === 0} onClick={() => go(-1)}><ChevronLeft size={17} /><span>Previous</span></button><p><b>{String(index + 1).padStart(2, "0")}</b> / {photos.length} photographs · {place.city}</p><button type="button" aria-label="Next source photograph" disabled={index === photos.length - 1} onClick={() => go(1)}><span>Next</span><ChevronRight size={17} /></button></footer>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
