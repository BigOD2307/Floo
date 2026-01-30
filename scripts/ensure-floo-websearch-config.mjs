#!/usr/bin/env node
/**
 * Ensure floo.json allows web search (group:web) in sandbox tool policy.
 * Adds tools.sandbox.tools.allow with default list + "group:web" if missing.
 * Usage: node ensure-floo-websearch-config.mjs <floo.json>
 */
import fs from "node:fs";
import path from "node:path";

const flooPath = process.argv[2];
if (!flooPath) {
  console.error("Usage: node ensure-floo-websearch-config.mjs <floo.json>");
  process.exit(1);
}

const DEFAULT_ALLOW = [
  "exec",
  "process",
  "read",
  "write",
  "edit",
  "apply_patch",
  "image",
  "sessions_list",
  "sessions_history",
  "sessions_send",
  "sessions_spawn",
  "session_status",
];
const WEB_GROUP = "group:web";

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

cfg.tools = cfg.tools || {};
cfg.tools.sandbox = cfg.tools.sandbox || {};
cfg.tools.sandbox.tools = cfg.tools.sandbox.tools || {};
let allow = Array.isArray(cfg.tools.sandbox.tools.allow)
  ? [...cfg.tools.sandbox.tools.allow]
  : [...DEFAULT_ALLOW];

const hasWeb =
  allow.some((e) => e === WEB_GROUP || e === "floo_search" || e === "floo_scrape" || e === "web_search");
if (!hasWeb) {
  allow.push(WEB_GROUP);
  cfg.tools.sandbox.tools.allow = allow;
}

// alsoAllow ensures group:web even when a restrictive profile (e.g. messaging) is used
const alsoAllow = Array.isArray(cfg.tools.alsoAllow) ? [...cfg.tools.alsoAllow] : [];
const hasAlsoWeb = alsoAllow.some((e) => e === WEB_GROUP || e === "floo_search" || e === "floo_scrape");
if (!hasAlsoWeb) {
  alsoAllow.push(WEB_GROUP);
  cfg.tools.alsoAllow = alsoAllow;
}

fs.mkdirSync(path.dirname(flooPath), { recursive: true });
fs.writeFileSync(flooPath, JSON.stringify(cfg, null, 2));
console.log("tools.sandbox.tools.allow includes group:web:", hasWeb ? "already" : "added");
console.log("tools.alsoAllow includes group:web:", hasAlsoWeb ? "already" : "added");
