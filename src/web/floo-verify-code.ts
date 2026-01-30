/**
 * Appel à l’API Floo verify-code (Next.js) pour lier un code au numéro WhatsApp.
 * Env: FLOO_API_BASE_URL (optionnel ; si absent, retourne { success: false }).
 */

const BASE_URL_ENV = "FLOO_API_BASE_URL";
const DEFAULT_TIMEOUT_MS = 10_000;

function getBaseUrl(): string | undefined {
  const u = process.env[BASE_URL_ENV]?.trim();
  if (!u) return undefined;
  return u.replace(/\/$/, "");
}

export type FlooVerifyCodeResult =
  | { success: true; user: { name: string | null } }
  | { success: false };

/**
 * Vérifie un code auprès de l’app Floo et lie le compte WhatsApp si valide.
 */
export async function flooVerifyCode(
  code: string,
  phoneNumber: string,
): Promise<FlooVerifyCodeResult> {
  const base = getBaseUrl();
  if (!base) return { success: false };

  const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
  const url = `${base}/api/whatsapp/verify-code`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim(), phoneNumber: formattedPhone }),
      signal: controller.signal,
    });
    clearTimeout(t);
    const data = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      user?: { name?: string | null };
      error?: string;
    };
    if (!res.ok || !data.success) return { success: false };
    return {
      success: true,
      user: { name: data.user?.name ?? null },
    };
  } catch {
    clearTimeout(t);
    return { success: false };
  }
}
