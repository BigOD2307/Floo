/**
 * Floo Credits Integrator
 * Point d'entrée unique pour l'intégration des crédits dans le flux de messages
 */

import {
  checkCreditsBeforeMessage,
  deductCreditsAfterReply,
  getWelcomeMessage,
  getNoCreditsMessage,
  isCreditsCommand,
  handleBalanceCommand,
  getRechargeMessage,
} from "./middleware.js";

export type CreditsConfig = {
  enabled: boolean;
  showFooter: boolean;
  showWelcome: boolean;
};

// Configuration par défaut
let creditsConfig: CreditsConfig = {
  enabled: true,
  showFooter: true,
  showWelcome: true,
};

/**
 * Configure le système de crédits
 */
export function configureCredits(config: Partial<CreditsConfig>): void {
  creditsConfig = { ...creditsConfig, ...config };
}

/**
 * Vérifie si les crédits sont activés
 */
export function isCreditsEnabled(): boolean {
  return creditsConfig.enabled;
}

export type PreMessageResult = {
  allowed: boolean;
  isNewUser: boolean;
  balance: number;
  welcomeMessage?: string;
  errorMessage?: string;
  commandResponse?: string;
};

/**
 * Appeler AVANT de traiter un message
 * Retourne si le message peut être traité
 */
export function preMessageCheck(
  phoneNumber: string,
  messageBody: string,
  channel: string = "whatsapp",
): PreMessageResult {
  if (!creditsConfig.enabled) {
    return { allowed: true, isNewUser: false, balance: 0 };
  }

  // Vérifier si c'est une commande de crédits
  const command = isCreditsCommand(messageBody);
  if (command === "balance") {
    return {
      allowed: false,
      isNewUser: false,
      balance: 0,
      commandResponse: handleBalanceCommand(phoneNumber, channel),
    };
  }
  if (command === "recharge") {
    return {
      allowed: false,
      isNewUser: false,
      balance: 0,
      commandResponse: getRechargeMessage(),
    };
  }

  // Vérifier les crédits
  const check = checkCreditsBeforeMessage(phoneNumber, channel);

  if (!check.allowed) {
    return {
      allowed: false,
      isNewUser: false,
      balance: check.balance,
      errorMessage: getNoCreditsMessage(check.balance),
    };
  }

  // Si nouvel utilisateur, ajouter le message de bienvenue
  let welcomeMessage: string | undefined;
  if (check.isNewUser && creditsConfig.showWelcome) {
    welcomeMessage = getWelcomeMessage(check.balance);
  }

  return {
    allowed: true,
    isNewUser: check.isNewUser,
    balance: check.balance,
    welcomeMessage,
  };
}

export type PostReplyResult = {
  footer?: string;
  warning?: string;
  newBalance: number;
};

/**
 * Appeler APRÈS avoir envoyé une réponse
 * Retourne le footer à ajouter si configuré
 */
export function postReplyDeduct(
  phoneNumber: string,
  channel: string = "whatsapp",
  tokenInfo?: { inputTokens: number; outputTokens: number },
): PostReplyResult {
  if (!creditsConfig.enabled) {
    return { newBalance: 0 };
  }

  const result = deductCreditsAfterReply(phoneNumber, channel, tokenInfo);

  return {
    footer: creditsConfig.showFooter ? result.footer : undefined,
    warning: result.warning,
    newBalance: result.newBalance,
  };
}

/**
 * Ajoute le footer de crédits à un texte de réponse
 */
export function appendCreditsFooter(
  replyText: string,
  phoneNumber: string,
  channel: string = "whatsapp",
  tokenInfo?: { inputTokens: number; outputTokens: number },
): string {
  if (!creditsConfig.enabled || !creditsConfig.showFooter) {
    return replyText;
  }

  const result = postReplyDeduct(phoneNumber, channel, tokenInfo);

  if (result.footer) {
    return `${replyText}\n\n${result.footer}`;
  }

  if (result.warning) {
    return `${replyText}\n\n${result.warning}`;
  }

  return replyText;
}

// Export des types et fonctions pour utilisation externe
export { isCreditsCommand, handleBalanceCommand, getRechargeMessage };
