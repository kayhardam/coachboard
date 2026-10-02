// Cloudflare Web Analytics, loaded on the board pages only (Beacon.astro).
// e2e/security.spec.ts and scripts/check-budget.mjs allow this script and
// nothing else from another origin.

/** Public: it names the site in the Cloudflare dashboard and grants no access. */
export const analyticsToken = "3e9e661ae139466f8bfceb0a730b530c";

export const beaconSrc = "https://static.cloudflareinsights.com/beacon.min.js";
/** Where the beacon sends its data (navigator.sendBeacon to /cdn-cgi/rum). */
export const beaconEndpoint = "https://cloudflareinsights.com";
