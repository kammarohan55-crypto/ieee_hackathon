import { generateSW } from "workbox-build";
const result = await generateSW({
  globDirectory: "dist/client", globPatterns: ["_next/**/*.{js,css,woff2}", "vendor/maplibre/*.mjs", "favicon.svg", "manifest.webmanifest", "evaluation.json", "api-evaluation.json", "workspace-evaluation.json", "mission-evaluation.json", "european-context*.json", "source-weather*.json", "images/references/*.jpg", "images/references/CREDITS.md"],
  maximumFileSizeToCacheInBytes: 5000000, swDest: "dist/client/sw.js", cleanupOutdatedCaches: true,
  // New workers activate after old tabs close, preventing a half-updated app.
  skipWaiting: false, clientsClaim: true,
  runtimeCaching: [{ urlPattern: ({ request, url }) => request.mode === "navigate" && url.origin === self.location.origin && ["/", "/showcase"].includes(url.pathname), handler: "NetworkFirst", options: { cacheName: "aqualens-navigation-v1", networkTimeoutSeconds: 4, cacheableResponse: { statuses: [200] } } }],
});
console.log(`Offline worker: ${result.count} assets, ${result.size} bytes. Navigation is available offline after a controlled online visit.`);
for (const warning of result.warnings) console.warn(warning);
