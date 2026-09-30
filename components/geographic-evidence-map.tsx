"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Compass, Crosshair, FileSearch, Globe2, MapPin, MapPinOff, RefreshCw, ShieldCheck } from "lucide-react";
import type { Report } from "@/lib/assessment";
import { isSyntheticRecord } from "@/lib/atlas";
import { geographicBounds, geographicGroups, locationState, syntheticLocation } from "@/lib/geographic";

const methodLabel = { device: "Device position", manual: "Manually entered", synthetic: "Synthetic coordinates" };
const statusLabel = { awaiting_review: "Awaiting human review", needs_information: "More information requested", reviewed: "Human reviewed · local demo" };
const locationLabel = { mapped: "Coordinates recorded", missing: "No coordinates", invalid: "Invalid coordinates", polar: "Outside map projection" };
function observationTime(report: Report) {
  if (!report.original.observedAt) return "Observation time unknown";
  if (!Number.isFinite(Date.parse(report.original.observedAt))) return "Observation time invalid";
  return `${new Date(report.original.observedAt).toLocaleString("en-GB", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} UTC`;
}

export function GeographicEvidenceMap({ records, onOpen }: { records: Report[]; onOpen: (id: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markerButtons = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<"all" | "unplotted">("all");
  const [revision, setRevision] = useState(0);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "limited" | "unavailable">("loading");
  const groups = useMemo(() => geographicGroups(records), [records]);
  const mappedCount = groups.reduce((sum, group) => sum + group.reports.length, 0);
  const unplottedCount = records.length - mappedCount;
  const selected = records.find((r) => r.id === selectedId) ?? records.findLast((r) => locationState(r) === "mapped") ?? records.at(-1);
  const selectedGroup = selected ? groups.find((g) => g.reports.some((r) => r.id === selected.id)) : undefined;
  const selectedKey = selectedGroup?.key;
  const syntheticCount = records.filter(syntheticLocation).length;
  const listRecords = (listFilter === "unplotted" ? records.filter((r) => locationState(r) !== "mapped") : records).toReversed();

  useEffect(() => {
    let disposed = false;
    let map: import("maplibre-gl").Map | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let errored = false;
    const markers: import("maplibre-gl").Marker[] = [];
    const buttons = markerButtons.current;
    import("@/lib/maplibre-client").then((lib) => {
      if (disposed || !container.current) return;
      setMapStatus("loading");
      try {
        map = new lib.Map({
          container: container.current,
          style: "https://tiles.openfreemap.org/styles/liberty",
          center: groups.length === 1 ? [groups[0].lon, groups[0].lat] : [0, 15],
          zoom: groups.length === 1 ? 13 : 1.15,
          pitch: 0,
          attributionControl: { compact: true },
          cooperativeGestures: true,
        });
        mapRef.current = map;
        map.addControl(new lib.NavigationControl({ visualizePitch: false }), "top-right");
        const canvas = map.getCanvas();
        canvas.setAttribute("aria-label", "Geographic basemap. Recorded locations are also available in the location list.");
        const bounds = geographicBounds(groups);
        if (groups.length > 1 && bounds) map.fitBounds(bounds, { padding: 62, maxZoom: 14, duration: 0 });
        map.on("load", () => {
          if (disposed) return;
          if (timeout) clearTimeout(timeout);
          setMapStatus(errored ? "limited" : "ready");
        });
        map.on("error", () => {
          if (!disposed) { errored = true; setMapStatus("limited"); }
        });
        timeout = setTimeout(() => { if (!disposed) setMapStatus("limited"); }, 12000);
        groups.forEach((group) => {
          const button = document.createElement("button");
          const allSynthetic = group.reports.every(syntheticLocation);
          const mixed = !allSynthetic && group.reports.some(syntheticLocation);
          button.type = "button";
          button.className = `geo-marker${allSynthetic ? " geo-marker-synthetic" : ""}${mixed ? " geo-marker-mixed" : ""}`;
          button.setAttribute("aria-label", `${group.reports.length} recorded observation${group.reports.length === 1 ? "" : "s"} at ${group.lat}, ${group.lon}${allSynthetic ? "; synthetic sample location" : mixed ? "; includes synthetic evidence" : ""}`);
          button.setAttribute("aria-pressed", "false");
          button.dataset.location = group.key;
          const inner = document.createElement("span");
          inner.textContent = group.reports.length > 1 ? String(group.reports.length) : "";
          button.appendChild(inner);
          button.onclick = () => setSelectedId(group.reports.at(-1)!.id);
          buttons.set(group.key, button);
          markers.push(new lib.Marker({ element: button }).setLngLat([group.lon, group.lat]).addTo(map!));
        });
        resizeObserver = new ResizeObserver(() => { if (!disposed) map?.resize(); });
        resizeObserver.observe(container.current);
      } catch {
        if (!disposed) setMapStatus("unavailable");
        if (timeout) clearTimeout(timeout);
        mapRef.current = null;
        resizeObserver?.disconnect();
        markers.forEach((marker) => marker.remove());
        buttons.clear();
        map?.remove();
        map = undefined;
      }
    }).catch(() => { if (!disposed) setMapStatus("unavailable"); });
    return () => {
      disposed = true;
      if (timeout) clearTimeout(timeout);
      resizeObserver?.disconnect();
      markers.forEach((marker) => marker.remove());
      buttons.clear();
      map?.remove();
      if (mapRef.current === map) mapRef.current = null;
    };
  }, [groups, revision]);

  useEffect(() => {
    markerButtons.current.forEach((button, key) => button.setAttribute("aria-pressed", String(key === selectedKey)));
  }, [selectedKey, mapStatus]);

  function selectReport(report: Report) {
    setSelectedId(report.id);
    const c = report.field?.coordinates;
    if (c && locationState(report) === "mapped" && mapRef.current) {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      mapRef.current.easeTo({ center: [c.lon, c.lat], zoom: Math.max(mapRef.current.getZoom(), 12), duration: reducedMotion ? 0 : 550 });
    }
  }
  function fitLocations() {
    const map = mapRef.current;
    if (!map) return;
    const bounds = geographicBounds(groups);
    if (bounds) map.fitBounds(bounds, { padding: 62, maxZoom: 14, duration: 0 });
    else map.jumpTo({ center: [0, 15], zoom: 1.15, pitch: 0, bearing: 0 });
  }
  const statusText = {
    loading: "Loading geographic basemap…",
    ready: groups.length ? "Basemap ready · reported positions" : "World view · no plottable coordinates",
    limited: "Basemap data unavailable or incomplete. Use the location list.",
    unavailable: "Mapping unavailable on this device. All records remain accessible.",
  }[mapStatus];
  const coordinates = selected?.field?.coordinates;

  return <section className="geographic-evidence" aria-label="Geographic evidence explorer">
    <header className="geo-heading">
      <div><p className="geo-kicker"><Compass size={14} /> GEOGRAPHIC EVIDENCE</p><h2>A place for every observation.</h2><p>Reported coordinates connect a record to a place. The review stays with the evidence.</p></div>
      <div className="geo-totals"><div><strong>{mappedCount}</strong><span>plotted records</span></div><div><strong>{unplottedCount}</strong><span>not plotted</span></div></div>
    </header>
    <div className="geo-layout">
      <div className="geo-stage">
        <div ref={container} className="geo-map" />
        <div className="geo-map-top"><span><MapPin size={14} /> {groups.length} exact location{groups.length === 1 ? "" : "s"}</span><button type="button" onClick={fitLocations} disabled={mapStatus === "loading" || mapStatus === "unavailable"}><Crosshair size={16} /> {groups.length ? "Fit locations" : "World view"}</button></div>
        {(!groups.length || mapStatus === "unavailable") && <div className="geo-map-message"><Globe2 size={32} /><h3>{mapStatus === "unavailable" ? "Your evidence is still here." : "Coordinates make the connection."}</h3><p>{mapStatus === "unavailable" ? "The map needs WebGL and an available basemap connection. Inspect each record in the location list." : "No records in this view have coordinates that this map can plot. Site names alone are never placed on the map."}</p></div>}
        <div className={`geo-map-status geo-status-${mapStatus}`}><span role="status"><i aria-hidden="true" />{statusText}</span>{(mapStatus === "limited" || mapStatus === "unavailable") && <button type="button" onClick={() => { setMapStatus("loading"); setRevision((value) => value + 1); }}><RefreshCw size={14} /> Retry basemap</button>}</div>
        <div className="geo-legend"><span><i /> Reported evidence</span><span><i className="geo-legend-synthetic" /> Synthetic included</span><p>Marker numbers count records at identical coordinates. No river connections are inferred.</p></div>
      </div>
      <aside className="geo-dossier" aria-label="Selected location record">
        {selected ? <>
          <p className="geo-kicker">LOCATION DOSSIER</p><h3>{selected.original.site || "Unnamed observation site"}</h3>
          <div className="geo-badges">{isSyntheticRecord(selected) && <span className="geo-synthetic">Synthetic record</span>}<span>{statusLabel[selected.status]}</span>{coordinates?.method === "synthetic" && <span className="geo-synthetic">Synthetic coordinates</span>}</div>
          <dl className="geo-metadata"><div><dt>Location</dt><dd>{locationLabel[locationState(selected)]}</dd></div>{coordinates && <><div><dt>Reported latitude / longitude</dt><dd className="geo-coordinate">{String(coordinates.lat)} / {String(coordinates.lon)}</dd></div><div><dt>Coordinate source</dt><dd>{methodLabel[coordinates.method]}</dd></div><div><dt>Reported accuracy</dt><dd>{Number.isFinite(coordinates.accuracy) && coordinates.accuracy! >= 0 ? `± ${coordinates.accuracy} m · unverified` : "Not recorded"}</dd></div></>}<div><dt>Observation time · citizen supplied</dt><dd>{observationTime(selected)}</dd></div><div><dt>Retained media metadata</dt><dd>{selected.field?.media.length ?? 0} item{selected.field?.media.length === 1 ? "" : "s"}</dd></div></dl>
          {locationState(selected) === "polar" && <p className="geo-location-note">Valid polar coordinates lie outside this Mercator map. The original coordinates remain in this record and its export.</p>}
          {locationState(selected) === "invalid" && <p className="geo-location-note">These coordinates fail range or numeric checks. A human needs to clarify them; no corrected position is guessed.</p>}
          <blockquote>{selected.original.note || "No original field note recorded."}</blockquote>
          {selectedGroup && selectedGroup.reports.length > 1 && <div className="geo-same-location"><p>{selectedGroup.reports.length} records at these exact coordinates</p><div>{selectedGroup.reports.toReversed().map((r) => <button type="button" key={r.id} aria-pressed={r.id === selected.id} onClick={() => selectReport(r)}>{observationTime(r)}{syntheticLocation(r) ? " · synthetic" : ""}</button>)}</div></div>}
          <button type="button" className="geo-open-record" onClick={() => onOpen(selected.id)}><FileSearch size={16} /> Open evidence & review <ArrowUpRight size={16} /></button>
        </> : <div className="geo-dossier-empty"><MapPinOff size={28} /><h3>No local records in this view.</h3><p>Save a citizen observation or include clearly labeled samples to explore the evidence trail.</p></div>}
      </aside>
    </div>
    <div className="geo-records-heading"><div><p className="geo-kicker">ACCESSIBLE LOCATION INDEX</p><p>Select a record to inspect its location and provenance.</p></div><div className="geo-list-filter" role="group" aria-label="Location list filter"><button type="button" aria-pressed={listFilter === "all"} onClick={() => setListFilter("all")}>All records ({records.length})</button><button type="button" aria-pressed={listFilter === "unplotted"} onClick={() => setListFilter("unplotted")}>Not plotted ({unplottedCount})</button></div></div>
    <div className="geo-record-list">{listRecords.map((r) => <button type="button" key={r.id} className="geo-record" aria-pressed={r.id === selected?.id} onClick={() => selectReport(r)}><span className={`geo-record-icon${syntheticLocation(r) ? " geo-record-icon-synthetic" : ""}`}>{locationState(r) === "mapped" ? <MapPin size={17} /> : <MapPinOff size={17} />}</span><span><strong>{r.original.site || "Unnamed observation site"}</strong><small>{observationTime(r)}</small></span><span className="geo-record-label">{syntheticLocation(r) ? "Synthetic · " : ""}{locationLabel[locationState(r)]}</span><ArrowUpRight size={15} /></button>)}{!listRecords.length && <p className="geo-list-empty">{listFilter === "unplotted" && records.length ? "Every record in this view has plottable coordinates." : "No records in this view."}</p>}</div>
    <footer className="geo-limits"><ShieldCheck size={16} /><p>Positions are reported metadata, not independently verified locations. A map marker does not establish a shared waterway, water safety or ecological condition. {syntheticCount > 0 && `${syntheticCount} records contain synthetic evidence or synthetic coordinates.`} Basemap © OpenFreeMap / OpenMapTiles / OpenStreetMap contributors.</p></footer>
  </section>;
}
