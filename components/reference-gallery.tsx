"use client";
/* Bundled, credited thumbnails are served directly and retained byte-for-byte. */
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { ArrowUpRight, Camera, LoaderCircle } from "lucide-react";
import { referencePhotos, referenceDimensions, displayEvidenceTime, type ReferencePhoto } from "@/lib/references";
import type { FieldEvidence } from "@/lib/field";

export function ReferenceCredit({ reference }: { reference: NonNullable<FieldEvidence["reference"]> }) {
  return <aside className="reference-credit" aria-label="Photograph attribution">
    <span className="tag">Historical photo review</span>
    <h3>{reference.title}</h3>
    <p>Photograph by <strong>{reference.author}</strong> · Source date: {displayEvidenceTime(reference.capturedDate)}</p>
    <p><a href={reference.sourceUrl} target="_blank" rel="noreferrer">Wikimedia Commons source <ArrowUpRight size={13} /></a> · <a href={reference.licenseUrl} target="_blank" rel="noreferrer">{reference.license}</a></p>
    <small>{reference.derivative} The date and place are source-supplied; camera time and authenticity are unverified. Your note describes this photo, not a new field visit.</small>
  </aside>;
}

export function ReferenceGallery({ onReview, loading }: { onReview: (photo: ReferencePhoto) => void; loading: string }) {
  const [city, setCity] = useState("All cities");
  const photos = referencePhotos.filter((photo) => city === "All cities" || photo.site.includes(city));
  return <section className="reference-gallery" aria-labelledby="reference-heading">
    <div className="section-heading"><div><p className="eyebrow">ONEAQUAHEALTH / EUROPE</p><h2 id="reference-heading">Three waterways. One evidence trail.</h2></div><span className="tag"><Camera size={14} /> Real, credited photographs</span></div>
    <p className="reference-intro">Explore Coimbra’s Mondego, Toulouse’s Garonne and Oslo’s Hoffselva through credited historical photographs. Choose a frame, write what you can see, and follow it through checks, human review and an evidence receipt.</p>
    <div className="reference-filters" aria-label="Filter source photographs">{["All cities", "Coimbra", "Toulouse", "Oslo"].map((label) => <button type="button" key={label} aria-pressed={city === label} onClick={() => setCity(label)}>{label}</button>)}</div>
    <div className="reference-grid">{photos.map((photo) => <article className="reference-card" key={photo.id}>
      <a className="reference-photo" href={photo.src} target="_blank" rel="noreferrer" aria-label={`Open full frame: ${photo.title}`}><img src={photo.src} alt={photo.alt} width={referenceDimensions(photo).width} height={referenceDimensions(photo).height} loading="lazy" /><span>Open full frame <ArrowUpRight size={15} /></span></a>
      <div className="reference-body"><p className="eyebrow">{photo.role}</p><h3>{photo.title}</h3><p className="reference-date">{displayEvidenceTime(photo.capturedDate)}</p>
        <p className="reference-attribution">By {photo.author} · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a></p>
        <a className="reference-source" href={photo.sourceUrl} target="_blank" rel="noreferrer">Source & photograph history <ArrowUpRight size={13} /></a>
        <button className="btn primary full" disabled={!!loading} onClick={() => onReview(photo)}>{loading === photo.id ? <LoaderCircle size={16} className="spin" /> : <Camera size={16} />}{loading === photo.id ? "Preparing photograph…" : "Review this photo"}</button>
      </div>
    </article>)}</div>
    <p className="reference-footnote">Historical references, not current monitoring. Different dates and viewpoints do not establish change in the river. Wikimedia 1280px thumbnails; no project pixel edits. Display crops do not change the retained files. Credits travel with saved reviews and field packs.</p>
  </section>;
}
