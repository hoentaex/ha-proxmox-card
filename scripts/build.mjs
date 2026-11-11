// Bundles src/proxmox-card.js into the single HACS file dist/proxmox-card.js (version stamped in).
// Usage: node scripts/build.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(`${root}package.json`, "utf8"));
const out = readFileSync(`${root}src/proxmox-card.js`, "utf8").replace("__VERSION__", pkg.version);
mkdirSync(`${root}dist`, { recursive: true });
writeFileSync(`${root}dist/proxmox-card.js`, out);
console.log(`Built dist/proxmox-card.js v${pkg.version} (${(out.length / 1024).toFixed(1)} KB)`);
