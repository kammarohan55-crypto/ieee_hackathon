import type { StyleSpecification } from "maplibre-gl";
import { validRecordedTimestamp } from "./references";

// Verified against the public GIBS EPSG:3857 WMTS capabilities on 2026-10-02.
// A valid request date is not a guarantee of available or cloud-free pixels.
export const SATELLITE_CONTEXT = {
  layerId: "MODIS_Terra_CorrectedReflectance_TrueColor",
  sourceId: "nasa-terra-true-color",
  matrixSet: "GoogleMapsCompatible_Level9",
  firstDate: "2000-02-24",
  maxZoom: 9,
  tileSize: 256,
  sourceName: "NASA GIBS · Terra / MODIS",
  capabilitiesUrl: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml",
  documentationUrl: "https://nasa-gibs.github.io/gibs-api-docs/access-basics/",
  attribution: 'Imagery: <a href="https://nasa-gibs.github.io/gibs-api-docs/">NASA GIBS / ESDIS · Terra MODIS</a>',
} as const;

export const LANDSCAPE_CONTEXT = {
  layerId: "esa-worldcover-s2rgbnir-10m-2021-v2_tcc",
  sourceId: "worldcover-sentinel-2021",
  minZoom: 6, maxZoom: 14, tileSize: 256,
  bounds: [-180, -60, 180, 83] as [number, number, number, number],
  sourceUrl: "https://esa-worldcover.org/en/data-access",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  attribution: '© <a href="https://esa-worldcover.org/en/data-access">ESA WorldCover project 2021</a> / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>',
} as const;
export type GeographicBasemap = "street" | "satellite" | "landscape";

// Verified anonymous KVP endpoint. The advertised REST template returned400.
// TIME is a service dimension for an annual median, not a January1 capture.
export function landscapeTileUrl(): string {
  return `https://wmts.terrascope.be/?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${LANDSCAPE_CONTEXT.layerId}&STYLE=default&FORMAT=image%2Fpng&TILEMATRIXSET=EPSG%3A3857&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}&TIME=2021-01-01`;
}
export function landscapeMapStyle(): StyleSpecification {
  return {
    version: 8,
    sources: { [LANDSCAPE_CONTEXT.sourceId]: { type: "raster", tiles: [landscapeTileUrl()], tileSize: LANDSCAPE_CONTEXT.tileSize, minzoom: LANDSCAPE_CONTEXT.minZoom, maxzoom: LANDSCAPE_CONTEXT.maxZoom, bounds: LANDSCAPE_CONTEXT.bounds, attribution: LANDSCAPE_CONTEXT.attribution } },
    layers: [
      { id: "historical-no-coverage", type: "background", paint: { "background-color": "#102935" } },
      { id: "historical-landscape", type: "raster", source: LANDSCAPE_CONTEXT.sourceId, paint: { "raster-fade-duration": 0 } },
    ],
  };
}

export function utcDate(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function defaultSatelliteDate(now = new Date()): string {
  // Yesterday is an explicit request choice, not a claim of latest coverage.
  return utcDate(new Date(now.getTime() - 86_400_000));
}

export function validSatelliteDate(value: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && utcDate(parsed) === value
    && value >= SATELLITE_CONTEXT.firstDate && value <= utcDate(now);
}

export function shiftSatelliteDate(value: string, days: -1 | 1, now = new Date()): string | null {
  if (!validSatelliteDate(value, now)) return null;
  const next = utcDate(new Date(Date.parse(`${value}T00:00:00.000Z`) + days * 86_400_000));
  return validSatelliteDate(next, now) ? next : null;
}

export function satelliteObservationDate(observedAt: string | undefined, now = new Date()): string | null {
  // Calendar, clock and zone must be supplied; never infer or normalize an observation instant.
  if (!observedAt || !validRecordedTimestamp(observedAt)) return null;
  const parsed = new Date(observedAt);
  const value = utcDate(parsed);
  return validSatelliteDate(value, now) ? value : null;
}

export function satelliteTileUrl(date: string, now = new Date()): string {
  if (!validSatelliteDate(date, now)) throw new Error("Choose a valid UTC date within the Terra imagery request range.");
  // WMTS addresses row before column; MapLibre's XYZ tokens must use y then x.
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${SATELLITE_CONTEXT.layerId}/default/${date}/${SATELLITE_CONTEXT.matrixSet}/{z}/{y}/{x}.jpeg`;
}

export function satelliteMapStyle(date: string, now = new Date()): StyleSpecification {
  return {
    version: 8,
    sources: {
      [SATELLITE_CONTEXT.sourceId]: {
        type: "raster",
        tiles: [satelliteTileUrl(date, now)],
        tileSize: SATELLITE_CONTEXT.tileSize,
        minzoom: 0,
        maxzoom: SATELLITE_CONTEXT.maxZoom,
        attribution: SATELLITE_CONTEXT.attribution,
      },
    },
    layers: [
      { id: "satellite-no-coverage", type: "background", paint: { "background-color": "#102935" } },
      { id: "satellite-context", type: "raster", source: SATELLITE_CONTEXT.sourceId, paint: { "raster-fade-duration": 0 } },
    ],
  };
}
