"use client";
/* Unmodified credited photo bytes; display crops are identified in attribution. */
/* eslint-disable @next/next/no-img-element */
import { ArrowUpRight, Camera, Fingerprint, ScanEye } from "lucide-react";
import type { CSSProperties } from "react";
import type { Report } from "@/lib/assessment";
import { europeanPlaces } from "@/lib/european-sites";
import { referencePhotos, displayEvidenceTime } from "@/lib/references";
import { RiverStories } from "./river-stories";

export function photoCity(photoId?: string) {
  return photoId?.startsWith("mondego-") ? "coimbra" : photoId?.startsWith("garonne-") ? "toulouse" : photoId?.startsWith("hoffselva-") ? "oslo" : null;
}
const covers = ["mondego-bridge", "garonne-promenade", "hoffselva-nedre"];
export function RiverPortfolio({ records, city, onCity, onOpen }: { records: Report[]; city: string; onCity: (id: string) => void; onOpen: (id: string) => void }) {
  const historical = records.filter((record) => !!record.field?.reference && photoCity(record.field.reference.id));
  if (!historical.length) return null;
  const timeline = historical.filter((record) => city === "all" || photoCity(record.field?.reference?.id) === city).sort((a, b) => a.original.observedAt.localeCompare(b.original.observedAt));
  return <section className="river-portfolio" aria-labelledby="river-portfolio-title">
    <div className="portfolio-heading"><div><p className="mc-kicker"><Camera size={14} /> EUROPEAN RIVER PORTFOLIO</p><h2 id="river-portfolio-title">Different rivers. Visible evidence.</h2></div><div className="portfolio-heading-actions"><RiverStories key={city} records={records} onOpen={onOpen} initialCity={city} /><button type="button" aria-pressed={city === "all"} onClick={() => onCity("all")}>All cities <ArrowUpRight size={15} /></button></div></div>
    <div className="portfolio-cities">{europeanPlaces.map((place, index) => {
      const saved = historical.filter((record) => photoCity(record.field?.reference?.id) === place.id), cover = referencePhotos.find((photo) => photo.id === covers[index])!;
      const candidates = saved.reduce((count, record) => count + record.field!.media.reduce((n, media) => n + (media.visual?.findings.length ?? 0), 0), 0);
      return <button type="button" key={place.id} className={`portfolio-city${city === place.id ? " is-selected" : ""}`} aria-label={`Filter evidence to ${place.city} (${saved.length} reviews)`} aria-pressed={city === place.id} onClick={() => onCity(city === place.id ? "all" : place.id)} style={{ "--river-accent": place.accent } as CSSProperties}>
        <img src={cover.src} alt={cover.alt} width={cover.width} height={cover.height} loading="lazy" /><span className="portfolio-country">{place.country}<ArrowUpRight size={16} /></span>
        <span className="portfolio-city-copy"><span>{place.city}</span><strong>{place.river}</strong><span className="portfolio-city-stats"><span><b>{saved.length}</b> saved reviews</span><span><b>{candidates}</b> AI {candidates === 1 ? "candidate" : "candidates"}</span></span><small>Cover: {cover.author} · {cover.license} · {cover.capturedDate}</small></span>
      </button>;
    })}</div>
    <div className="portfolio-timeline-heading"><span><Fingerprint size={14} /> SOURCE PHOTO CHRONOLOGY</span><small>{timeline.length} retained reviews · dates supplied by photographers</small></div>
    <div className="portfolio-timeline">{timeline.map((record) => {
      const photo = referencePhotos.find((item) => item.id === record.field!.reference!.id)!;
      const candidates = record.field!.media.reduce((sum, media) => sum + (media.visual?.findings.length ?? 0), 0);
      return <button key={record.id} type="button" onClick={() => onOpen(record.id)} aria-label={`Open ${photo.title}, source date ${photo.capturedDate}`}><span className="portfolio-thumb"><img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" /><span><ScanEye size={12} /> {candidates}</span></span><time dateTime={photo.capturedDate}>{displayEvidenceTime(photo.capturedDate).replace(" · date only", "")}</time><strong>{photo.title}</strong><small>{record.status === "reviewed" ? "Review recorded" : record.status === "needs_information" ? "Information requested" : "Awaiting review"}{record.demonstration ? " · example" : ""}</small></button>;
    })}</div>
    <p className="mc-footnote">Choose a city to filter the charts and matrix, or a photograph to inspect its receipt. Different viewpoints and source dates do not establish environmental change. AI counts describe unverified candidate findings. <a href="/images/references/CREDITS.md" target="_blank" rel="noreferrer">Photograph credits &amp; licences ↗</a></p>
  </section>;
}
