"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Compass, Crosshair, FileSearch, Globe2, MapPin, MapPinOff, RefreshCw, Satellite, ShieldCheck } from "lucide-react";
import type { Report } from "@/lib/assessment";
import { displayEvidenceTime, evidenceTimePrecision } from "@/lib/references";
import { isSyntheticRecord } from "@/lib/atlas";
import { geographicBounds, geographicGroups, locationState, syntheticLocation } from "@/lib/geographic";
import { defaultSatelliteDate, SATELLITE_CONTEXT, LANDSCAPE_CONTEXT, landscapeMapStyle, satelliteMapStyle, satelliteObservationDate, shiftSatelliteDate, utcDate, validSatelliteDate, type GeographicBasemap } from "@/lib/satellite-context";

const methodLabel = { device: "Device position", manual: "Manually entered", synthetic: "Synthetic coordinates" };
const statusLabel = { awaiting_review: "Awaiting human review", needs_information: "More information requested", reviewed: "Human reviewed · local demo" };
const locationLabel = { mapped: "Coordinates recorded", missing: "No coordinates", invalid: "Invalid coordinates", polar: "Outside map projection" };
const researchCitySources = [
  { slug: "benevento", name: "Benevento", country: "Italy" },
  { slug: "coimbra", name: "Coimbra", country: "Portugal" },
  { slug: "ghent", name: "Ghent", country: "Belgium" },
  { slug: "oslo", name: "Oslo", country: "Norway" },
  { slug: "toulouse", name: "Toulouse", country: "France" },
] as const;
function observationTime(report: Report) {
  const value = report.original.observedAt;
  const precision = evidenceTimePrecision(value);
  if (precision === "missing") return "Observation time unknown";
  if (precision === "zone_unknown") return "Observation time zone not supplied";
  if (precision === "invalid") return /^\d{4}-\d{2}-\d{2}$/.test(value) ? "Observation date invalid" : "Observation time invalid";
  return displayEvidenceTime(value);
}

export function GeographicEvidenceMap({ records, onOpen }: { records: Report[]; onOpen: (id: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const cameraRef = useRef<{ center: [number, number]; zoom: number; bearing: number; locationSignature: string } | null>(null);
  const markerButtons = useRef<Map<string, HTMLButtonElement>>(new Map());
  const selectedKeyRef = useRef<string | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<"all" | "unplotted">("all");
  const [revision, setRevision] = useState(0);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "limited" | "unavailable">("loading");
  const [basemap, setBasemap] = useState<GeographicBasemap>("satellite");
  const [satelliteDate, setSatelliteDate] = useState(defaultSatelliteDate);
  const [dateDraft, setDateDraft] = useState(defaultSatelliteDate);
  const [dateError, setDateError] = useState<string | null>(null);
  const groups = useMemo(() => geographicGroups(records), [records]);
  const mappedCount = groups.reduce((sum, group) => sum + group.reports.length, 0);
  const unplottedCount = records.length - mappedCount;
  const selected = records.find((r) => r.id === selectedId) ?? records.findLast((r) => locationState(r) === "mapped") ?? records.at(-1);
  const selectedGroup = selected ? groups.find((g) => g.reports.some((r) => r.id === selected.id)) : undefined;
  const selectedKey = selectedGroup?.key;
  const locationSignature = groups.map((group) => group.key).sort().join("|");
  const syntheticCount = records.filter(syntheticLocation).length;
  const listRecords = (listFilter === "unplotted" ? records.filter((r) => locationState(r) !== "mapped") : records).toReversed();
  const observationDate = satelliteObservationDate(selected?.original.observedAt);
  const previousDate = shiftSatelliteDate(satelliteDate, -1);
  const nextDate = shiftSatelliteDate(satelliteDate, 1);
  const maxZoom = basemap === "satellite" ? SATELLITE_CONTEXT.maxZoom : basemap === "landscape" ? LANDSCAPE_CONTEXT.maxZoom : 22;
  const landscapeOutsideCoverage = basemap === "landscape" && selected?.field?.coordinates && (selected.field.coordinates.lat < LANDSCAPE_CONTEXT.bounds[1] || selected.field.coordinates.lat > LANDSCAPE_CONTEXT.bounds[3]);

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
        const camera = cameraRef.current?.locationSignature === locationSignature ? cameraRef.current : null;
        map = new lib.Map({
          container: container.current,
          style: basemap === "satellite" ? satelliteMapStyle(satelliteDate) : basemap === "landscape" ? landscapeMapStyle() : "https://tiles.openfreemap.org/styles/liberty",
          center: camera?.center ?? (groups.length === 1 ? [groups[0].lon, groups[0].lat] : [0, 15]),
          zoom: Math.min(camera?.zoom ?? (groups.length === 1 ? 13 : 1.15), maxZoom),
          bearing: camera?.bearing ?? 0,
          maxZoom,
          pitch: 0,
          attributionControl: { compact: true },
          cooperativeGestures: true,
        });
        mapRef.current = map;
        map.addControl(new lib.NavigationControl({ visualizePitch: false }), "top-right");
        const canvas = map.getCanvas();
        canvas.setAttribute("aria-label", `${basemap === "satellite" ? `NASA satellite context requested for ${satelliteDate} UTC` : basemap === "landscape" ? "Historical 2021 annual Sentinel-2 landscape composite; detail available at zoom 6–14" : "Geographic street basemap"}. Recorded locations are also available in the location list.`);
        const bounds = geographicBounds(groups);
        if (!camera && groups.length > 1 && bounds) map.fitBounds(bounds, { padding: 62, maxZoom: Math.min(14, maxZoom), duration: 0 });
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
          button.setAttribute("aria-pressed", String(group.key === selectedKeyRef.current));
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
      if (map) {
        const center = map.getCenter();
        cameraRef.current = { center: [center.lng, center.lat], zoom: map.getZoom(), bearing: map.getBearing(), locationSignature };
      }
      map?.remove();
      if (mapRef.current === map) mapRef.current = null;
    };
  }, [groups, revision, basemap, satelliteDate, maxZoom, locationSignature]);

  useEffect(() => {
    selectedKeyRef.current = selectedKey;
    markerButtons.current.forEach((button, key) => button.setAttribute("aria-pressed", String(key === selectedKey)));
  }, [selectedKey, mapStatus]);

  function selectReport(report: Report) {
    setSelectedId(report.id);
    const c = report.field?.coordinates;
    if (c && locationState(report) === "mapped" && mapRef.current) {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      mapRef.current.easeTo({ center: [c.lon, c.lat], zoom: Math.min(Math.max(mapRef.current.getZoom(), 12), maxZoom), duration: reducedMotion ? 0 : 550 });
    }
  }
  function fitLocations() {
    const map = mapRef.current;
    if (!map) return;
    const bounds = geographicBounds(groups);
    if (bounds) map.fitBounds(bounds, { padding: 62, maxZoom: Math.min(14, maxZoom), duration: 0 });
    else map.jumpTo({ center: [0, 15], zoom: 1.15, pitch: 0, bearing: 0 });
  }
  function chooseDate(value: string) {
    if (!validSatelliteDate(value)) {
      setDateError(`Choose a real UTC date from ${SATELLITE_CONTEXT.firstDate} through ${utcDate()}.`);
      return;
    }
    setDateError(null);
    setDateDraft(value);
    setSatelliteDate(value);
  }
  const statusText = {
    loading: basemap === "satellite" ? `Requesting NASA imagery for ${satelliteDate} UTC…` : basemap === "landscape" ? "Requesting 2021 annual landscape context…" : "Loading geographic basemap…",
    ready: basemap === "satellite" ? `Tile requests complete · ${satelliteDate} UTC · coverage may be blank or obscured` : basemap === "landscape" ? "2021 annual composite · historical context · detail at zoom 6–14" : groups.length ? "Basemap ready · reported positions" : "World view · no plottable coordinates",
    limited: basemap === "satellite" ? "Satellite tiles unavailable or incomplete. Try another date or use the street map." : basemap === "landscape" ? "Historical imagery unavailable or incomplete. Retry or use the street map." : "Basemap data unavailable or incomplete. Use the location list.",
    unavailable: "Mapping unavailable on this device. All records remain accessible.",
  }[mapStatus];
  const coordinates = selected?.field?.coordinates;

  return <section className="geographic-evidence" aria-label="Geographic evidence explorer">
    <header className="geo-heading">
      <div><p className="geo-kicker"><Compass size={14} /> GEOGRAPHIC EVIDENCE</p><h2>A place for every observation.</h2><p>Reported coordinates connect a record to a place. The review stays with the evidence.</p></div>
      <div className="geo-totals"><div><strong>{mappedCount}</strong><span>plotted records</span></div><div><strong>{unplottedCount}</strong><span>not plotted</span></div></div>
    </header>
    <div className="geo-context-controls">
      <div className="geo-basemap-switch" role="group" aria-label="Map background"><button type="button" aria-pressed={basemap === "street"} onClick={() => setBasemap("street")}><MapPin size={15} /> Street map</button><button type="button" aria-pressed={basemap === "satellite"} onClick={() => setBasemap("satellite")}><Satellite size={16} /> NASA satellite</button><button type="button" aria-pressed={basemap === "landscape"} onClick={() => setBasemap("landscape")}><Globe2 size={16} /> Landscape · 2021</button></div>
      {basemap === "satellite" ? <form className="geo-date-controls" onSubmit={(event) => { event.preventDefault(); chooseDate(dateDraft); }}>
        <button type="button" aria-label="Request previous UTC day" disabled={!previousDate} onClick={() => previousDate && chooseDate(previousDate)}><ChevronLeft size={17} /></button>
        <label><CalendarDays size={15} /><span>Requested day · UTC</span><input type="date" aria-label="Requested satellite day in UTC" aria-invalid={Boolean(dateError)} aria-describedby={dateError ? "geo-date-error" : "geo-satellite-limit"} min={SATELLITE_CONTEXT.firstDate} max={utcDate()} value={dateDraft} onChange={(event) => { setDateDraft(event.target.value); setDateError(null); }} required /></label>
        <button type="submit">Apply day</button><button type="button" aria-label="Request next UTC day" disabled={!nextDate} onClick={() => nextDate && chooseDate(nextDate)}><ChevronRight size={17} /></button>
      </form> : basemap === "landscape" ? <div className="geo-landscape-hint"><p>2021 annual Sentinel-2 composite · historical landscape, not a current scene. Detail at zoom 6–14 from 10 m source bands.</p><button type="button" disabled={mapStatus === "loading" || mapStatus === "unavailable"} onClick={() => mapRef.current?.easeTo({ zoom: Math.max(6, mapRef.current.getZoom()), duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 500 })}>Zoom to landscape detail</button></div> : <p>Choose satellite for dated regional context around reported locations.</p>}
    </div>
    {dateError && basemap === "satellite" && <p id="geo-date-error" className="geo-date-error" role="alert">{dateError} The map still requests {satelliteDate}.</p>}
    {landscapeOutsideCoverage && <p className="geo-date-error" role="status">The selected location is outside this historical layer’s latitude coverage (60°S–83°N). Its position and evidence remain available. <button type="button" onClick={() => setBasemap("street")}>Use street map</button></p>}
    <div className="geo-layout">
      <div className="geo-stage">
        <div ref={container} className="geo-map" />
        <div className="geo-map-top"><span><MapPin size={14} /> {groups.length} exact location{groups.length === 1 ? "" : "s"}</span><button type="button" onClick={fitLocations} disabled={mapStatus === "loading" || mapStatus === "unavailable"}><Crosshair size={16} /> {groups.length ? "Fit locations" : "World view"}</button></div>
        {(!groups.length || mapStatus === "unavailable") && <div className="geo-map-message"><Globe2 size={32} /><h3>{mapStatus === "unavailable" ? "Your evidence is still here." : basemap === "street" ? "Coordinates make the connection." : "Explore Earth. Add evidence later."}</h3><p>{mapStatus === "unavailable" ? "The map needs WebGL and an available basemap connection. Inspect each record in the location list." : basemap === "landscape" ? "Historical 2021 landscape context. No observation positions are plotted. Pan and zoom to 6–14 for imagery; no site or visit is invented." : basemap === "satellite" ? "This is world satellite context. No observation positions are plotted. Pan and choose a date; supplied coordinates can connect your own records later." : "No records in this view have coordinates that this map can plot. Site names alone are never placed on the map."}</p></div>}
        <div className={`geo-map-status geo-status-${mapStatus}`}><span role="status"><i aria-hidden="true" />{statusText}</span>{(mapStatus === "limited" || mapStatus === "unavailable") && <div className="geo-map-recovery"><button type="button" onClick={() => { setMapStatus("loading"); setRevision((value) => value + 1); }}><RefreshCw size={14} /> Retry map</button>{basemap !== "street" && <button type="button" onClick={() => setBasemap("street")}>Use street map</button>}</div>}</div>
        <div className="geo-legend"><span><i /> Reported evidence</span><span><i className="geo-legend-synthetic" /> Synthetic included</span><p>Marker numbers count records at identical coordinates. No river connections are inferred.</p></div>
      </div>
      <aside className="geo-dossier" aria-label="Selected location record">
        {selected ? <>
          <p className="geo-kicker">LOCATION DOSSIER</p><h3>{selected.original.site || "Unnamed observation site"}</h3>
          <div className="geo-badges">{isSyntheticRecord(selected) && <span className="geo-synthetic">Synthetic record</span>}<span>{statusLabel[selected.status]}</span>{coordinates?.method === "synthetic" && <span className="geo-synthetic">Synthetic coordinates</span>}</div>
          <dl className="geo-metadata"><div><dt>Location</dt><dd>{locationLabel[locationState(selected)]}</dd></div>{coordinates && <><div><dt>Reported latitude / longitude</dt><dd className="geo-coordinate">{String(coordinates.lat)} / {String(coordinates.lon)}</dd></div><div><dt>Coordinate source</dt><dd>{methodLabel[coordinates.method]}</dd></div><div><dt>Reported accuracy</dt><dd>{Number.isFinite(coordinates.accuracy) && coordinates.accuracy! >= 0 ? `± ${coordinates.accuracy} m · unverified` : "Not recorded"}</dd></div></>}<div><dt>Observation time · citizen supplied</dt><dd>{observationTime(selected)}</dd></div><div><dt>Retained media metadata</dt><dd>{selected.field?.media.length ?? 0} item{selected.field?.media.length === 1 ? "" : "s"}</dd></div></dl>
          {basemap === "satellite" && <div className="geo-observation-day"><p>{observationDate ? `Citizen time falls on ${observationDate} UTC. A same-day satellite composite may have a different acquisition time.` : "No valid observation day is available for a satellite date comparison."}</p>{observationDate && <button type="button" onClick={() => chooseDate(observationDate)} disabled={satelliteDate === observationDate}><CalendarDays size={14} /> Request observation day</button>}</div>}
          {locationState(selected) === "polar" && <p className="geo-location-note">Valid polar coordinates lie outside this Mercator map. The original coordinates remain in this record and its export.</p>}
          {locationState(selected) === "invalid" && <p className="geo-location-note">These coordinates fail range or numeric checks. A human needs to clarify them; no corrected position is guessed.</p>}
          <blockquote>{selected.original.note || "No original field note recorded."}</blockquote>
          {selectedGroup && selectedGroup.reports.length > 1 && <div className="geo-same-location"><p>{selectedGroup.reports.length} records at these exact coordinates</p><div>{selectedGroup.reports.toReversed().map((r) => <button type="button" key={r.id} aria-pressed={r.id === selected.id} onClick={() => selectReport(r)}>{observationTime(r)}{syntheticLocation(r) ? " · synthetic" : ""}</button>)}</div></div>}
          <button type="button" className="geo-open-record" onClick={() => onOpen(selected.id)}><FileSearch size={16} /> Open evidence & review <ArrowUpRight size={16} /></button>
        </> : <div className="geo-dossier-empty"><MapPinOff size={28} /><h3>No local records in this view.</h3><p>Save an observation with coordinates to explore its location and evidence trail.</p></div>}
      </aside>
    </div>
    <section className="geo-research-context" aria-label="Official OneAquaHealth research context">
      <div><p className="geo-kicker">ONEAQUAHEALTH · ORGANIZER CONTEXT</p><h3>Five research areas. Evidence stays local.</h3><p>Explore the organizers’ published city research. These links do not import monitoring results; the historical Pune photo case study is separate.</p></div>
      <div className="geo-research-links">{researchCitySources.map((city) => <a key={city.slug} href={`https://www.oneaquahealth.eu/research-cities/${city.slug}/`} target="_blank" rel="noreferrer"><span><strong>{city.name}</strong><small>{city.country}</small></span><ArrowUpRight size={16} aria-hidden="true" /><span className="sr-only"> · organizer page, opens in a new tab</span></a>)}</div>
    </section>
    {basemap === "landscape" && <section className="geo-satellite-source" aria-label="Historical landscape source and limits">
      <div className="geo-satellite-title"><Globe2 size={19} /><div><p className="geo-kicker">HISTORICAL LANDSCAPE · 2021</p><h3>Sentinel-2 annual color composite</h3></div><a href={LANDSCAPE_CONTEXT.sourceUrl} target="_blank" rel="noreferrer">Source & data access <ArrowUpRight size={14} /></a></div>
      <dl><div><dt>Period</dt><dd>Annual median · 2021</dd></div><div><dt>Display</dt><dd>True color · B04 / B03 / B02</dd></div><div><dt>Source detail</dt><dd>10 m bands · zoom 6–14 tiles</dd></div><div><dt>Available latitude</dt><dd>60°S–83°N</dd></div></dl>
      <p>A historical landscape mosaic, not a single-date photo or current stream condition. Median compositing, clouds, snow, shadows and missing inputs can create artifacts. Narrow streams may mix with bank pixels. This display supplies no NDWI, measurements or environmental grades.</p>
      <p className="geo-satellite-credit">© ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium. Served by Terrascope/VITO · <a href={LANDSCAPE_CONTEXT.licenseUrl} target="_blank" rel="noreferrer">CC BY 4.0</a>. Context tiles need network and are not retained as citizen evidence.</p>
    </section>}
    {basemap === "satellite" && <section className="geo-satellite-source" aria-label="Satellite source and limits">
      <div className="geo-satellite-title"><Satellite size={19} /><div><p className="geo-kicker">REAL SATELLITE CONTEXT</p><h3>{SATELLITE_CONTEXT.sourceName}</h3></div><a href={SATELLITE_CONTEXT.documentationUrl} target="_blank" rel="noreferrer">Source documentation <ArrowUpRight size={14} /></a></div>
      <dl><div><dt>Requested date</dt><dd>{satelliteDate} UTC · daily composite</dd></div><div><dt>Product</dt><dd>Corrected reflectance · true color</dd></div><div><dt>Regional detail</dt><dd>MODIS source bands 250–500 m</dd></div><div><dt>Map grid</dt><dd>Zoom 0–9 · ≈306 m/pixel at equator at zoom 9</dd></div></dl>
      <p id="geo-satellite-limit">Clouds, haze, gaps and processing delays can hide the surface. The requested day is not an exact acquisition time for every pixel. Small streams and details in field photos may be unresolved. These browse images cannot establish water quality, pollutants, pathogens or safety.</p>
      <p className="geo-satellite-credit">Imagery provided by NASA Global Imagery Browse Services (GIBS), part of ESDIS. Tiles need internet; imagery is context and is not retained as citizen evidence or used in assessment grades.</p>
    </section>}
    <div className="geo-records-heading"><div><p className="geo-kicker">ACCESSIBLE LOCATION INDEX</p><p>Select a record to inspect its location and provenance.</p></div><div className="geo-list-filter" role="group" aria-label="Location list filter"><button type="button" aria-pressed={listFilter === "all"} onClick={() => setListFilter("all")}>All records ({records.length})</button><button type="button" aria-pressed={listFilter === "unplotted"} onClick={() => setListFilter("unplotted")}>Not plotted ({unplottedCount})</button></div></div>
    <div className="geo-record-list">{listRecords.map((r) => <button type="button" key={r.id} className="geo-record" aria-pressed={r.id === selected?.id} onClick={() => selectReport(r)}><span className={`geo-record-icon${syntheticLocation(r) ? " geo-record-icon-synthetic" : ""}`}>{locationState(r) === "mapped" ? <MapPin size={17} /> : <MapPinOff size={17} />}</span><span><strong>{r.original.site || "Unnamed observation site"}</strong><small>{observationTime(r)}</small></span><span className="geo-record-label">{syntheticLocation(r) ? "Synthetic · " : ""}{locationLabel[locationState(r)]}</span><ArrowUpRight size={15} /></button>)}{!listRecords.length && <p className="geo-list-empty">{listFilter === "unplotted" && records.length ? "Every record in this view has plottable coordinates." : "No records in this view."}</p>}</div>
    <footer className="geo-limits"><ShieldCheck size={16} /><p>Positions are reported metadata, not independently verified locations. A map marker does not establish a shared waterway, water safety or ecological condition. {syntheticCount > 0 && `${syntheticCount} records contain synthetic evidence or synthetic coordinates.`} {basemap === "satellite" ? "Satellite context: NASA GIBS / ESDIS · Terra MODIS." : basemap === "landscape" ? "Historical 2021 landscape: ESA WorldCover / Copernicus Sentinel data / Terrascope / VITO · CC BY 4.0." : "Basemap © OpenFreeMap / OpenMapTiles / OpenStreetMap contributors."}</p></footer>
  </section>;
}
