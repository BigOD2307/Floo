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

const FlooGmailSendSchema = Type.Object({
  to: Type.String({ description: "Adresse email du destinataire." }),
  subject: Type.String({ description: "Sujet de l'email." }),
  body: Type.String({ description: "Corps du message." }),
});

const FlooGmailListSchema = Type.Object({});

const FlooCalendarEventsSchema = Type.Object({
  action: Type.Optional(
    Type.Union([Type.Literal("list"), Type.Literal("create")], {
      description: "list: événements à venir. create: créer un événement.",
    }),
  ),
  summary: Type.Optional(Type.String({ description: "Titre (pour create)." })),
  start: Type.Optional(Type.String({ description: "Date/heure début ISO (pour create)." })),
  end: Type.Optional(Type.String({ description: "Date/heure fin ISO (pour create)." })),
  description: Type.Optional(Type.String({ description: "Description (pour create)." })),
});

const FlooPdfGenerateSchema = Type.Object({
  title: Type.String({ description: "Titre du document PDF." }),
  content: Type.String({
    description: "Contenu du PDF (texte, paragraphes). Peut inclure des sauts de ligne.",
  }),
});

const FlooPresentationSchema = Type.Object({
  title: Type.String({ description: "Titre de la présentation." }),
  slides: Type.Array(
    Type.Object({
      title: Type.Optional(Type.String()),
      content: Type.String(),
    }),
    {
      description: "Liste des slides. Chaque slide: title (optionnel), content (texte).",
    },
  ),
});

const FlooDocumentSchema = Type.Object({
  type: Type.Optional(
    Type.Union(
      [Type.Literal("letter"), Type.Literal("cv"), Type.Literal("email"), Type.Literal("general")],
      {
        description: "Type de document: letter, cv, email, general.",
      },
    ),
  ),
  title: Type.String({ description: "Titre du document." }),
  content: Type.String({ description: "Contenu principal." }),
});

const FlooQrSchema = Type.Object({
  data: Type.String({
    description: "Texte ou URL à encoder dans le QR code.",
  }),
});

const FlooSummarizeSchema = Type.Object({
  content: Type.Optional(Type.String({ description: "Texte à résumer." })),
  url: Type.Optional(Type.String({ description: "URL à résumer (scrape puis résumé)." })),
});

const FlooChartSchema = Type.Object({
  type: Type.Optional(
    Type.Union(
      [Type.Literal("bar"), Type.Literal("line"), Type.Literal("pie"), Type.Literal("doughnut")],
      { description: "Type de graphique." },
    ),
  ),
  title: Type.Optional(Type.String({ description: "Titre du graphique." })),
  labels: Type.Array(Type.String(), {
    description: "Libellés des axes/segments (ex: ['Jan', 'Fév', 'Mar']).",
  }),
  data: Type.Array(Type.Number(), {
    description: "Valeurs (même ordre que labels).",
  }),
});

const FlooTranslateSchema = Type.Object({
  text: Type.String({ description: "Texte à traduire." }),
  targetLang: Type.String({ description: "Langue cible (ex: 'en', 'fr', 'es', 'wolof')." }),
  sourceLang: Type.Optional(
    Type.String({ description: "Langue source (optionnel, auto-détecté)." }),
  ),
});

const FlooWeatherSchema = Type.Object({
  city: Type.String({ description: "Nom de la ville (ex: 'Abidjan', 'Dakar')." }),
  country: Type.Optional(Type.String({ description: "Pays (optionnel)." })),
});

const FlooNewsSchema = Type.Object({
  topic: Type.Optional(
    Type.String({ description: "Sujet des actualités (ex: 'économie', 'sport')." }),
  ),
  country: Type.Optional(Type.String({ description: "Pays (ex: 'ci', 'sn', 'fr')." })),
});

const FlooReminderSchema = Type.Object({
  action: Type.Union([Type.Literal("create"), Type.Literal("list"), Type.Literal("delete")], {
    description: "create: créer un rappel. list: lister les rappels. delete: supprimer.",
  }),
  message: Type.Optional(Type.String({ description: "Message du rappel (pour create)." })),
  remindAt: Type.Optional(Type.String({ description: "Date/heure ISO du rappel (pour create)." })),
  reminderId: Type.Optional(Type.String({ description: "ID du rappel (pour delete)." })),
});

const FlooNotesSchema = Type.Object({
  action: Type.Union(
    [
      Type.Literal("create"),
      Type.Literal("list"),
      Type.Literal("search"),
      Type.Literal("get"),
      Type.Literal("delete"),
    ],
    { description: "Action: create, list, search, get, delete." },
  ),
  title: Type.Optional(Type.String({ description: "Titre de la note (pour create)." })),
  content: Type.Optional(Type.String({ description: "Contenu de la note (pour create)." })),
  tags: Type.Optional(Type.Array(Type.String(), { description: "Tags (pour create)." })),
  query: Type.Optional(Type.String({ description: "Recherche (pour search)." })),
  noteId: Type.Optional(Type.String({ description: "ID de la note (pour get/delete)." })),
});

const FlooTranscribeSchema = Type.Object({
  audioUrl: Type.Optional(Type.String({ description: "URL du fichier audio à transcrire." })),
  audioBase64: Type.Optional(Type.String({ description: "Audio encodé en base64." })),
  format: Type.Optional(Type.String({ description: "Format audio (ogg, mp3, wav). Défaut: ogg." })),
});

const FlooLogInteractionSchema = Type.Object({
  messageType: Type.String({ description: "Type: user, assistant, tool_call, tool_result." }),
  content: Type.Optional(Type.String({ description: "Contenu du message." })),
  toolName: Type.Optional(Type.String({ description: "Nom de l'outil." })),
  toolInput: Type.Optional(Type.Unknown({ description: "Entrée de l'outil (JSON)." })),
  toolOutput: Type.Optional(Type.Unknown({ description: "Sortie de l'outil (JSON)." })),
  success: Type.Optional(Type.Boolean({ description: "Succès de l'opération." })),
  metadata: Type.Optional(Type.Unknown({ description: "Métadonnées additionnelles." })),
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

export function createFlooGmailSendTool(
  senderE164: string | null | undefined,
): AnyAgentTool | null {
  const base = getBaseUrl();
  const key = getApiKey();
  const phone = senderE164?.trim();
  if (!base || !key || !phone) return null;

  return {
    label: "Floo Gmail Send",
    name: "floo_gmail_send",
    description:
      "Envoie un email via Gmail (utilisateur doit avoir connecté Google sur le dashboard). Paramètres: to, subject, body.",
    parameters: FlooGmailSendSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const to = readStringParam(params, "to", { required: true });
      const subject = readStringParam(params, "subject", { required: true });
      const body = readStringParam(params, "body", { required: true });
      const { ok, data, error } = await flooFetch(
        "/api/tools/gmail/send",
        { phoneNumber: phone, to, subject, body },
        key,
      );
      if (!ok) return jsonResult({ ok: false, error: error || "floo_gmail_send failed" });
      return jsonResult(data);
    },
  };
}

export function createFlooGmailListTool(
  senderE164: string | null | undefined,
): AnyAgentTool | null {
  const base = getBaseUrl();
  const key = getApiKey();
  const phone = senderE164?.trim();
  if (!base || !key || !phone) return null;

  return {
    label: "Floo Gmail List",
    name: "floo_gmail_list",
    description: "Liste les derniers emails Gmail (utilisateur doit avoir connecté Google).",
    parameters: FlooGmailListSchema,
    execute: async () => {
      const { ok, data, error } = await flooFetch(
        "/api/tools/gmail/list",
        { phoneNumber: phone },
        key,
      );
      if (!ok)
        return jsonResult({ ok: false, error: error || "floo_gmail_list failed", emails: [] });
      return jsonResult(data);
    },
  };
}

export function createFlooCalendarEventsTool(
  senderE164: string | null | undefined,
): AnyAgentTool | null {
  const base = getBaseUrl();
  const key = getApiKey();
  const phone = senderE164?.trim();
  if (!base || !key || !phone) return null;

  return {
    label: "Floo Calendar",
    name: "floo_calendar_events",
    description:
      "Liste les événements à venir ou crée un événement Google Calendar. Action: list (défaut) ou create. Pour create: summary, start, end requis.",
    parameters: FlooCalendarEventsSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const body: Record<string, unknown> = { phoneNumber: phone };
      if (params.action) body.action = params.action;
      if (params.summary) body.summary = params.summary;
      if (params.start) body.start = params.start;
      if (params.end) body.end = params.end;
      if (params.description) body.description = params.description;
      const { ok, data, error } = await flooFetch("/api/tools/calendar/events", body, key);
      if (!ok) return jsonResult({ ok: false, error: error || "floo_calendar_events failed" });
      return jsonResult(data);
    },
  };
}

export function createFlooPdfGenerateTool(): AnyAgentTool | null {
  const base = getBaseUrl();
  const key = getApiKey();
  if (!base || !key) return null;

  return {
    label: "Floo PDF Generate",
    name: "floo_pdf_generate",
    description:
      "Génère un PDF à partir d'un titre et d'un contenu. Utilise pour rapports, CV, fiches, factures. Paramètres: title, content.",
    parameters: FlooPdfGenerateSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const title = readStringParam(params, "title", { required: true });
      const content = readStringParam(params, "content", { required: true });
      const { ok, data, error } = await flooFetch("/api/tools/pdf", { title, content }, key);
      if (!ok)
        return jsonResult({
          ok: false,
          error: error || "floo_pdf_generate failed",
          pdfUrl: null,
        });
      const d = data as { pdfUrl?: string };
      return jsonResult({ ok: true, pdfUrl: d.pdfUrl ?? null });
    },
  };
}

export function createFlooPresentationTool(): AnyAgentTool | null {
  const base = getBaseUrl();
  const key = getApiKey();
  if (!base || !key) return null;

  return {
    label: "Floo Presentation",
    name: "floo_presentation",
    description:
      "Génère une présentation PowerPoint (.pptx) à partir d'un titre et d'une liste de slides. Paramètres: title, slides (array de { title?, content }).",
    parameters: FlooPresentationSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const title = readStringParam(params, "title", { required: true });
      const slidesRaw = params.slides;
      const slides = Array.isArray(slidesRaw)
        ? (slidesRaw as Array<{ title?: string; content?: string }>).map((s) => ({
            title: typeof s?.title === "string" ? s.title : "",
            content: typeof s?.content === "string" ? s.content : String(s ?? ""),
          }))
        : [];
      if (slides.length === 0) {
        return jsonResult({
          ok: false,
          error: "slides requis (array non vide)",
          pptxUrl: null,
        });
      }
      const { ok, data, error } = await flooFetch(
        "/api/tools/presentation",
        { title, slides },
        key,
      );
      if (!ok)
        return jsonResult({
          ok: false,
          error: error || "floo_presentation failed",
          pptxUrl: null,
        });
      const d = data as { pptxUrl?: string };
      return jsonResult({ ok: true, pptxUrl: d.pptxUrl ?? null });
    },
  };
}

export function createFlooDocumentTool(): AnyAgentTool | null {
  const base = getBaseUrl();
  const key = getApiKey();
  if (!base || !key) return null;

  return {
    label: "Floo Document",
    name: "floo_document",
    description:
      "Génère un document formaté (lettre, CV, email, general) en PDF. Paramètres: type (letter|cv|email|general), title, content.",
    parameters: FlooDocumentSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const type = (params.type as string) || "general";
      const title = readStringParam(params, "title", { required: true });
      const content = readStringParam(params, "content", { required: true });
      const { ok, data, error } = await flooFetch(
        "/api/tools/document",
        { type, title, content },
        key,
      );
      if (!ok)
        return jsonResult({
          ok: false,
          error: error || "floo_document failed",
          pdfUrl: null,
        });
      const d = data as { pdfUrl?: string };
      return jsonResult({ ok: true, pdfUrl: d.pdfUrl ?? null });
    },
  };
}

export function createFlooQrTool(): AnyAgentTool | null {
  const base = getBaseUrl();
  const key = getApiKey();
  if (!base || !key) return null;

  return {
    label: "Floo QR",
    name: "floo_qr",
    description:
      "Génère un QR code à partir d'un texte ou URL. Paramètre: data (texte ou URL à encoder).",
    parameters: FlooQrSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const data = readStringParam(params, "data", { required: true });
      const { ok, data: resData, error } = await flooFetch("/api/tools/qr", { data }, key);
      if (!ok) return jsonResult({ ok: false, error: error || "floo_qr failed", qrUrl: null });
      const d = resData as { qrUrl?: string };
      return jsonResult({ ok: true, qrUrl: d.qrUrl ?? null });
    },
  };
}

export function createFlooSummarizeTool(): AnyAgentTool | null {
  const base = getBaseUrl();
  const key = getApiKey();
  if (!base || !key) return null;

  return {
    label: "Floo Summarize",
    name: "floo_summarize",
    description:
      "Résume un texte ou le contenu d'une page web. Paramètres: content (texte) ou url (page à scraper puis résumer).",
    parameters: FlooSummarizeSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const body: Record<string, unknown> = {};
      if (params.content) body.content = params.content;
      if (params.url) body.url = params.url;
      if (!body.content && !body.url) {
        return jsonResult({ ok: false, error: "content ou url requis", summary: null });
      }
      const { ok, data, error } = await flooFetch("/api/tools/summarize", body, key);
      if (!ok)
        return jsonResult({ ok: false, error: error || "floo_summarize failed", summary: null });
      const d = data as { summary?: string };
      return jsonResult({ ok: true, summary: d.summary ?? null });
    },
  };
}

export function createFlooChartTool(): AnyAgentTool | null {
  const base = getBaseUrl();
  const key = getApiKey();
  if (!base || !key) return null;

  return {
    label: "Floo Chart",
    name: "floo_chart",
    description:
      "Génère un graphique (bar, line, pie, doughnut). Paramètres: type, title?, labels (array), data (array de nombres).",
    parameters: FlooChartSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const labels = Array.isArray(params.labels) ? params.labels.map(String) : [];
      const data = Array.isArray(params.data)
        ? (params.data as unknown[]).map((x) => Number(x)).filter((n) => !Number.isNaN(n))
        : [];
      const type = (params.type as string) || "bar";
      const title = (params.title as string) || "";
      const {
        ok,
        data: resData,
        error,
      } = await flooFetch("/api/tools/chart", { type, title, labels, data }, key);
      if (!ok)
        return jsonResult({ ok: false, error: error || "floo_chart failed", chartUrl: null });
      const d = resData as { chartUrl?: string };
      return jsonResult({ ok: true, chartUrl: d.chartUrl ?? null });
    },
  };
}

export function createFlooTranslateTool(): AnyAgentTool | null {
  const base = getBaseUrl();
  const key = getApiKey();
  if (!base || !key) return null;

  return {
    label: "Floo Translate",
    name: "floo_translate",
    description:
      "Traduit un texte vers une autre langue. Paramètres: text, targetLang (ex: 'en', 'fr', 'wolof'), sourceLang (optionnel).",
    parameters: FlooTranslateSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const text = readStringParam(params, "text", { required: true });
      const targetLang = readStringParam(params, "targetLang", { required: true });
      const sourceLang = (params.sourceLang as string) || undefined;
      const { ok, data, error } = await flooFetch(
        "/api/tools/translate",
        { text, targetLang, sourceLang },
        key,
      );
      if (!ok)
        return jsonResult({
          ok: false,
          error: error || "floo_translate failed",
          translation: null,
        });
      const d = data as { translation?: string };
      return jsonResult({ ok: true, translation: d.translation ?? null });
    },
  };
}

export function createFlooWeatherTool(): AnyAgentTool | null {
  const base = getBaseUrl();
  const key = getApiKey();
  if (!base || !key) return null;

  return {
    label: "Floo Weather",
    name: "floo_weather",
    description:
      "Obtient la météo actuelle et les prévisions pour une ville. Paramètres: city, country (optionnel).",
    parameters: FlooWeatherSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const city = readStringParam(params, "city", { required: true });
      const country = (params.country as string) || undefined;
      const { ok, data, error } = await flooFetch("/api/tools/weather", { city, country }, key);
      if (!ok)
        return jsonResult({ ok: false, error: error || "floo_weather failed", weather: null });
      const d = data as Record<string, unknown>;
      return jsonResult({ ok: true, ...d });
    },
  };
}

export function createFlooNewsTool(): AnyAgentTool | null {
  const base = getBaseUrl();
  const key = getApiKey();
  if (!base || !key) return null;

  return {
    label: "Floo News",
    name: "floo_news",
    description:
      "Récupère les actualités récentes. Paramètres: topic (optionnel), country (ex: 'ci', 'sn').",
    parameters: FlooNewsSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const topic = (params.topic as string) || undefined;
      const country = (params.country as string) || undefined;
      const { ok, data, error } = await flooFetch("/api/tools/news", { topic, country }, key);
      if (!ok) return jsonResult({ ok: false, error: error || "floo_news failed", articles: [] });
      const d = data as Record<string, unknown>;
      return jsonResult({ ok: true, ...d });
    },
  };
}

export function createFlooReminderTool(senderE164: string | null | undefined): AnyAgentTool | null {
  const base = getBaseUrl();
  const key = getApiKey();
  const phone = senderE164?.trim();
  if (!base || !key || !phone) return null;

  return {
    label: "Floo Reminder",
    name: "floo_reminder",
    description:
      "Gère les rappels. Actions: create (message + remindAt), list, delete (reminderId).",
    parameters: FlooReminderSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const body: Record<string, unknown> = { phoneNumber: phone };
      body.action = params.action;
      if (params.message) body.message = params.message;
      if (params.remindAt) body.remindAt = params.remindAt;
      if (params.reminderId) body.reminderId = params.reminderId;
      const { ok, data, error } = await flooFetch("/api/tools/reminder", body, key);
      if (!ok) return jsonResult({ ok: false, error: error || "floo_reminder failed" });
      const d = data as Record<string, unknown>;
      return jsonResult({ ok: true, ...d });
    },
  };
}

export function createFlooNotesTool(senderE164: string | null | undefined): AnyAgentTool | null {
  const base = getBaseUrl();
  const key = getApiKey();
  const phone = senderE164?.trim();
  if (!base || !key || !phone) return null;

  return {
    label: "Floo Notes",
    name: "floo_notes",
    description:
      "Gère les notes (mémoire persistante). Actions: create, list, search, get, delete.",
    parameters: FlooNotesSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const body: Record<string, unknown> = { phoneNumber: phone };
      body.action = params.action;
      if (params.title) body.title = params.title;
      if (params.content) body.content = params.content;
      if (params.tags) body.tags = params.tags;
      if (params.query) body.query = params.query;
      if (params.noteId) body.noteId = params.noteId;
      const { ok, data, error } = await flooFetch("/api/tools/notes", body, key);
      if (!ok) return jsonResult({ ok: false, error: error || "floo_notes failed" });
      const d = data as Record<string, unknown>;
      return jsonResult({ ok: true, ...d });
    },
  };
}

export function createFlooTranscribeTool(): AnyAgentTool | null {
  const base = getBaseUrl();
  const key = getApiKey();
  if (!base || !key) return null;

  return {
    label: "Floo Transcribe",
    name: "floo_transcribe",
    description:
      "Transcrit un fichier audio en texte (Whisper). Paramètres: audioUrl ou audioBase64, format (ogg|mp3|wav).",
    parameters: FlooTranscribeSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const body: Record<string, unknown> = {};
      if (params.audioUrl) body.audioUrl = params.audioUrl;
      if (params.audioBase64) body.audioBase64 = params.audioBase64;
      if (params.format) body.format = params.format;
      if (!body.audioUrl && !body.audioBase64) {
        return jsonResult({
          ok: false,
          error: "audioUrl ou audioBase64 requis",
          transcription: null,
        });
      }
      const { ok, data, error } = await flooFetch("/api/tools/transcribe", body, key);
      if (!ok)
        return jsonResult({
          ok: false,
          error: error || "floo_transcribe failed",
          transcription: null,
        });
      const d = data as { transcription?: string };
      return jsonResult({ ok: true, transcription: d.transcription ?? null });
    },
  };
}

export function createFlooLogInteractionTool(
  senderE164: string | null | undefined,
  sessionId: string | null | undefined,
): AnyAgentTool | null {
  const base = getBaseUrl();
  const key = getApiKey();
  if (!base || !key) return null;

  return {
    label: "Floo Log Interaction",
    name: "floo_log_interaction",
    description: "Enregistre une interaction pour l'analyse et l'entraînement. Usage interne.",
    parameters: FlooLogInteractionSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const body: Record<string, unknown> = {
        phoneNumber: senderE164,
        sessionId,
        messageType: params.messageType,
      };
      if (params.content) body.content = params.content;
      if (params.toolName) body.toolName = params.toolName;
      if (params.toolInput) body.toolInput = params.toolInput;
      if (params.toolOutput) body.toolOutput = params.toolOutput;
      if (params.success !== undefined) body.success = params.success;
      if (params.metadata) body.metadata = params.metadata;
      const { ok, error } = await flooFetch("/api/data/log-interaction", body, key);
      if (!ok) return jsonResult({ ok: false, error: error || "floo_log_interaction failed" });
      return jsonResult({ ok: true, logged: true });
    },
  };
}

/**
 * Transcrit un audio via l'API Floo (fonction utilitaire).
 */
export async function transcribeAudio(
  audioUrl: string,
): Promise<{ ok: boolean; transcription?: string; error?: string }> {
  const base = getBaseUrl();
  const key = getApiKey();
  if (!base || !key) {
    return { ok: false, error: "FLOO_API_BASE_URL or FLOO_GATEWAY_API_KEY not set" };
  }
  const { ok, data, error } = await flooFetch("/api/tools/transcribe", { audioUrl }, key);
  if (!ok) return { ok: false, error };
  const d = data as { transcription?: string };
  return { ok: true, transcription: d.transcription };
}

/**
 * Log une interaction via l'API Floo (fonction utilitaire).
 */
export async function logInteraction(interaction: {
  userId?: string;
  phoneNumber?: string;
  sessionId?: string;
  messageType: string;
  content?: string;
  toolName?: string;
  toolInput?: unknown;
  toolOutput?: unknown;
  model?: string;
  tokensUsed?: number;
  latencyMs?: number;
  success?: boolean;
  errorMessage?: string;
  metadata?: unknown;
}): Promise<{ ok: boolean; error?: string }> {
  const base = getBaseUrl();
  const key = getApiKey();
  if (!base || !key) {
    return { ok: false, error: "FLOO_API_BASE_URL or FLOO_GATEWAY_API_KEY not set" };
  }
  const { ok, error } = await flooFetch("/api/data/log-interaction", interaction, key);
  return { ok, error };
}
