#!/usr/bin/env node
/**
 * Merge skills.load.extraDirs into floo.json.
 * Usage: node update-floo-config-extra-dirs.mjs <floo.json> <dir1> [dir2 ...]
 */
import fs from "node:fs";
import path from "node:path";

const flooPath = process.argv[2];
const addDirs = process.argv.slice(3).filter(Boolean);
if (!flooPath || addDirs.length === 0) {
  console.error("Usage: node update-floo-config-extra-dirs.mjs <floo.json> <dir1> [dir2 ...]");
  process.exit(1);
}

let cfg = {};
if (fs.existsSync(flooPath)) {
  cfg = JSON.parse(fs.readFileSync(flooPath, "utf8"));
} else {
  cfg = {
    gateway: { mode: "local", port: 18789, bind: "lan" },
    plugins: { entries: { whatsapp: { enabled: true } } },
    channels: { whatsapp: { enabled: true, dmPolicy: "open" } },
    identity: { name: "Floo", timezone: "Africa/Abidjan" },
  };
}
cfg.skills = cfg.skills || {};
cfg.skills.load = cfg.skills.load || {};
const existing = cfg.skills.load.extraDirs || [];
const combined = [...existing];
for (const d of addDirs) {
  if (!combined.includes(d)) combined.push(d);
}
cfg.skills.load.extraDirs = combined;

fs.mkdirSync(path.dirname(flooPath), { recursive: true });
fs.writeFileSync(flooPath, JSON.stringify(cfg, null, 2));
console.log("extraDirs:", combined.length);
