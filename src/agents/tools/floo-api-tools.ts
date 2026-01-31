/**
 * Outils gateway → APIs Floo (search, scrape).
 * Env: FLOO_API_BASE_URL, FLOO_GATEWAY_API_KEY.
 * Quand configuré, l’agent peut utiliser floo_search et floo_scrape (Serper/DDG + Cheerio).
 */

import { Type } from "@sinclair/typebox";

import type { AnyAgentTool } from "./common.js";
import { jsonResult, readStringParam } from "./common.js";

const BASE_URL_ENV = "FLOO_API_BASE_URL";
const API_KEY_ENV = "FLOO_GATEWAY_API_KEY";
const DEFAULT_TIMEOUT_MS = 20_000;

const FlooSearchSchema = Type.Object({
  q: Type.String({ description: "Search query (e.g. 'meilleurs restaurants Abidjan')." }),
});

const FlooScrapeSchema = Type.Object({
  url: Type.String({ description: "URL to scrape (e.g. 'https://example.com')." }),
});

const FlooImageGenerateSchema = Type.Object({
  prompt: Type.String({
    description:
      "Description de l'image à générer (ex: 'un coucher de soleil sur la lagune d'Abidjan').",
  }),
});

const FlooReservationSchema = Type.Object({
  query: Type.String({
    description: "Recherche de réservation (ex: 'restaurant Abidjan', 'hôtel Yamoussoukro').",
  }),
  type: Type.Optional(
    Type.String({
      description: "Type: restaurant, hotel, événement.",
    }),
  ),
});

function getBaseUrl(): string | undefined {
  const u = process.env[BASE_URL_ENV]?.trim();
  if (!u) return undefined;
  return u.replace(/\/$/, "");
}

function getApiKey(): string | undefined {
  return process.env[API_KEY_ENV]?.trim();
}

async function flooFetch(
  path: string,
  body: object,
  apiKey: string,
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const base = getBaseUrl();
  if (!base) return { ok: false, error: "FLOO_API_BASE_URL not set" };

  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Floo-Gateway-Key": apiKey,
  };

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(t);
    const data = (await res.json().catch(() => ({}))) as {
      results?: unknown;
      provider?: string;
      success?: boolean;
      title?: string;
      text?: string;
      links?: string[];
      error?: string;
    };
    if (!res.ok) {
      return { ok: false, error: (data as { error?: string }).error || `HTTP ${res.status}` };
    }
    return { ok: true, data };
  } catch (e) {
    clearTimeout(t);
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

let flooToolsSkippedLogged = false;

function logFlooToolsSkippedOnce(reason: string) {
  if (flooToolsSkippedLogged) return;
  flooToolsSkippedLogged = true;
  console.warn(
    `[floo-api-tools] floo_search/floo_scrape not available: ${reason}. Set FLOO_API_BASE_URL and FLOO_GATEWAY_API_KEY on the gateway process (e.g. systemd service).`,
  );
}

/**
 * Exécute une recherche web via l'API Floo (sans passer par le tool).
 * Utilisé pour pré-injecter les résultats quand le modèle ne call pas floo_search.
 */
export async function runFlooSearch(query: string): Promise<{
  ok: boolean;
  results?: Array<{ title?: string; link?: string; snippet?: string }>;
  provider?: string;
  error?: string;
}> {
  const base = getBaseUrl();
  const key = getApiKey();
  if (!base || !key) {
    return { ok: false, error: "FLOO_API_BASE_URL or FLOO_GATEWAY_API_KEY not set" };
  }
  const { ok, data, error } = await flooFetch("/api/tools/search", { q: query }, key);
  if (!ok) return { ok: false, error };
  const d = data as {
    results?: Array<{ title?: string; link?: string; snippet?: string }>;
    provider?: string;
  };
  const results = (d.results ?? []) as Array<{ title?: string; link?: string; snippet?: string }>;
  return { ok: true, results, provider: d.provider };
}

export function createFlooSearchTool(): AnyAgentTool | null {
  const base = getBaseUrl();
  const key = getApiKey();
  if (!base || !key) {
    const reason = !base ? "FLOO_API_BASE_URL not set" : "FLOO_GATEWAY_API_KEY not set";
    logFlooToolsSkippedOnce(reason);
    return null;
  }

  return {
    label: "Floo Search",
    name: "floo_search",
    description:
      "Search the web via Floo (Serper or DuckDuckGo). Use for current info, places, news. Prefer this over web_search when Floo search is available.",
    parameters: FlooSearchSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const q = readStringParam(params, "q", { required: true });
      const { ok, data, error } = await flooFetch("/api/tools/search", { q }, key);
      if (!ok)
        return jsonResult({ error: error || "floo_search failed", results: [], provider: null });
      return jsonResult(data);
    },
  };
}

export function createFlooScrapeTool(): AnyAgentTool | null {
  const base = getBaseUrl();
  const key = getApiKey();
  if (!base || !key) return null; // already logged by createFlooSearchTool

  return {
    label: "Floo Scrape",
    name: "floo_scrape",
    description:
      "Scrape a URL via Floo (fetch + Cheerio). Use to extract title, text, and links from a page. Prefer web_fetch for complex JS pages.",
    parameters: FlooScrapeSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const url = readStringParam(params, "url", { required: true });
      const { ok, data, error } = await flooFetch("/api/tools/scrape", { url }, key);
      if (!ok)
        return jsonResult({
          success: false,
          title: "",
          text: "",
          links: [],
          error: error || "floo_scrape failed",
        });
      return jsonResult(data);
    },
  };
}

export function createFlooImageGenerateTool(): AnyAgentTool | null {
  const base = getBaseUrl();
  const key = getApiKey();
  if (!base || !key) return null;

  return {
    label: "Floo Image Generate",
    name: "floo_image_generate",
    description:
      "Génère une image à partir d'un prompt texte (Flux via OpenRouter). Utilise pour créer des visuels, illustrations, logos. Paramètre: prompt (description en français ou anglais).",
    parameters: FlooImageGenerateSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const prompt = readStringParam(params, "prompt", { required: true });
      const { ok, data, error } = await flooFetch("/api/tools/image", { prompt }, key);
      if (!ok)
        return jsonResult({
          ok: false,
          error: error || "floo_image_generate failed",
          imageUrl: null,
        });
      const d = data as { ok?: boolean; imageUrl?: string; model?: string };
      return jsonResult({
        ok: true,
        imageUrl: d.imageUrl ?? null,
        model: d.model ?? null,
      });
    },
  };
}

export function createFlooReservationTool(): AnyAgentTool | null {
  const base = getBaseUrl();
  const key = getApiKey();
  if (!base || !key) return null;

  return {
    label: "Floo Reservation",
    name: "floo_reservation",
    description:
      "Recherche des options de réservation (restaurants, hôtels). Pour l'instant retourne des résultats de recherche. Paramètre: query (ex: 'restaurant garba Abidjan').",
    parameters: FlooReservationSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const query = readStringParam(params, "query", { required: true });
      const type = (params.type as string) || "restaurant";
      const { ok, data, error } = await flooFetch("/api/tools/reservation", { query, type }, key);
      if (!ok)
        return jsonResult({
          ok: false,
          error: error || "floo_reservation failed",
          results: [],
        });
      return jsonResult(data);
    },
  };
}
