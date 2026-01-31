/**
 * Appels à l'API Floo credits (check + use).
 * Env: FLOO_API_BASE_URL, FLOO_GATEWAY_API_KEY.
 */

const BASE_URL_ENV = "FLOO_API_BASE_URL";
const API_KEY_ENV = "FLOO_GATEWAY_API_KEY";
const DEFAULT_TIMEOUT_MS = 8_000;

function getBaseUrl(): string | undefined {
  const u = process.env[BASE_URL_ENV]?.trim();
  if (!u) return undefined;
  return u.replace(/\/$/, "");
}

function getApiKey(): string | undefined {
  return process.env[API_KEY_ENV]?.trim();
}

function formattedPhone(phone: string): string {
  return phone.startsWith("+") ? phone : `+${phone}`;
}

/**
 * Vérifie le solde de crédits. Retourne -1 si API indisponible ou erreur.
 */
export async function flooCheckCredits(phoneNumber: string): Promise<number> {
  const base = getBaseUrl();
  const key = getApiKey();
  if (!base || !key) return 50; // Pas de blocage si config manquante

  const phone = formattedPhone(phoneNumber);
  const url = `${base}/api/credits/check?phoneNumber=${encodeURIComponent(phone)}`;
  const headers: Record<string, string> = {
    "X-Floo-Gateway-Key": key,
  };
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, { method: "GET", headers, signal: controller.signal });
    clearTimeout(t);
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; credits?: number };
    if (res.ok && data.ok === true) return typeof data.credits === "number" ? data.credits : 0;
    return -1;
  } catch {
    clearTimeout(t);
    return -1;
  }
}

/**
 * Déduit 1 crédit. Retourne { ok, credits } ou { ok: false } en cas d'erreur.
 */
export async function flooUseCredit(
  phoneNumber: string,
): Promise<{ ok: boolean; credits?: number }> {
  const base = getBaseUrl();
  const key = getApiKey();
  if (!base || !key) return { ok: false };

  const phone = formattedPhone(phoneNumber);
  const url = `${base}/api/credits/use`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Floo-Gateway-Key": key,
  };
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ phoneNumber: phone }),
      signal: controller.signal,
    });
    clearTimeout(t);
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; credits?: number };
    return { ok: res.ok && data.ok === true, credits: data.credits };
  } catch {
    clearTimeout(t);
    return { ok: false };
  }
}
