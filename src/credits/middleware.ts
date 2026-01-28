/**
 * Floo Credits Middleware
 * Middleware pour intégrer les crédits dans le flux de messages WhatsApp
 */

import { canPerformRequest, deductCreditsForRequest, formatCreditsFooter } from "./deduct.js";
import { getCreditsStore } from "./store.js";

export type CreditCheckResult = {
  allowed: boolean;
  balance: number;
  isNewUser: boolean;
  message?: string;
};

export type CreditDeductionResult = {
  success: boolean;
  creditsDeducted: number;
  newBalance: number;
  footer?: string;
  warning?: string;
};

/**
 * Vérifie si un utilisateur peut envoyer un message
 * Crée automatiquement le compte avec bonus si nouvel utilisateur
 */
export function checkCreditsBeforeMessage(
  phoneNumber: string,
  channel: string = "whatsapp",
): CreditCheckResult {
  const store = getCreditsStore();
  const existingUser = store.getUser(phoneNumber, channel);
  const isNewUser = !existingUser;

  // Si nouvel utilisateur, le créer avec le bonus
  if (isNewUser) {
    store.getOrCreateUser(phoneNumber, channel);
  }

  const check = canPerformRequest(phoneNumber, channel, 1);

  return {
    allowed: check.allowed,
    balance: check.balance,
    isNewUser,
    message: check.message,
  };
}

/**
 * Déduit les crédits après une réponse réussie
 * Retourne le footer à ajouter au message
 */
export function deductCreditsAfterReply(
  phoneNumber: string,
  channel: string = "whatsapp",
  tokenInfo?: { inputTokens: number; outputTokens: number },
): CreditDeductionResult {
  const result = deductCreditsForRequest({
    phoneNumber,
    channel,
    inputTokens: tokenInfo?.inputTokens,
    outputTokens: tokenInfo?.outputTokens,
  });

  return {
    success: result.success,
    creditsDeducted: result.creditsDeducted,
    newBalance: result.newBalance,
    footer: result.success
      ? formatCreditsFooter(result.creditsDeducted, result.newBalance)
      : undefined,
    warning: result.message,
  };
}

/**
 * Message de bienvenue pour les nouveaux utilisateurs
 */
export function getWelcomeMessage(balance: number): string {
  return `Bienvenue sur Floo! Tu as recu ${balance} credits gratuits pour commencer.

Je suis ton assistant IA personnel. Pose-moi n'importe quelle question!

Quelques exemples:
- "Traduis ce texte en anglais"
- "Ecris un email professionnel"
- "Explique-moi comment fonctionne X"

Chaque message utilise 1-3 credits selon la complexite.`;
}

/**
 * Message quand l'utilisateur n'a plus de crédits
 */
export function getNoCreditsMessage(balance: number): string {
  return `Tu n'as plus assez de credits (solde: ${balance}).

Pour recharger:
1. Envoie "recharger" pour voir les options
2. Ou contacte @dickenai sur WhatsApp

Tarifs:
- 100 credits = 500 FCFA
- 500 credits = 2000 FCFA
- 1000 credits = 3500 FCFA`;
}

/**
 * Commande pour voir son solde
 */
export function handleBalanceCommand(phoneNumber: string, channel: string = "whatsapp"): string {
  const store = getCreditsStore();
  const user = store.getOrCreateUser(phoneNumber, channel);

  const transactions = user.transactions.slice(-5);
  const recentActivity =
    transactions.length > 0
      ? transactions
          .map((t) => `  ${t.type === "credit" ? "+" : "-"}${t.amount} (${t.reason})`)
          .join("\n")
      : "  Aucune activite recente";

  return `Ton solde Floo:

Credits: ${user.balance}
Total depense: ${user.totalSpent}
Total credite: ${user.totalCredited}

Derniere activite:
${recentActivity}

Envoie "recharger" pour ajouter des credits.`;
}

/**
 * Vérifie si le message est une commande de crédits
 */
export function isCreditsCommand(message: string): "balance" | "recharge" | null {
  const normalized = message.toLowerCase().trim();

  if (
    normalized === "solde" ||
    normalized === "balance" ||
    normalized === "credits" ||
    normalized === "crédits"
  ) {
    return "balance";
  }

  if (
    normalized === "recharger" ||
    normalized === "recharge" ||
    normalized === "acheter" ||
    normalized === "buy"
  ) {
    return "recharge";
  }

  return null;
}

/**
 * Message pour la recharge
 */
export function getRechargeMessage(): string {
  return `Pour recharger tes credits Floo:

Tarifs:
- 100 credits = 500 FCFA
- 500 credits = 2000 FCFA  (Populaire)
- 1000 credits = 3500 FCFA (Meilleur rapport)

Moyens de paiement:
- Wave: +225 XX XX XX XX
- Orange Money: +225 XX XX XX XX

Apres paiement, envoie-moi une capture d'ecran de la confirmation.

Contact: @dickenai sur WhatsApp pour toute question.`;
}
