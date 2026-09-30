import { setWorkerUrl } from "maplibre-gl";
// Serve the worker from this origin; works under CSP without a blob worker.
// Static vendor assets avoid Vinext's window-based dev overlay in WorkerGlobalScope.
setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");
export { Map, Marker, NavigationControl, LngLatBounds } from "maplibre-gl";
