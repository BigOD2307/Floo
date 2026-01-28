/**
 * Floo Credits System - Deduction Logic
 * Logique de déduction des crédits après chaque message
 */

import type { DeductionResult } from "./types.js";
import { MIN_BALANCE_WARNING } from "./types.js";
import { getCreditsStore } from "./store.js";
import { calculateCreditsFromTokens } from "./pricing.js";

export type DeductionContext = {
  phoneNumber: string;
  channel: string;
  inputTokens?: number;
  outputTokens?: number;
  taskId?: string;
  customCredits?: number;
};

/**
 * Déduit les crédits après une requête
 */
export function deductCreditsForRequest(context: DeductionContext): DeductionResult {
  const store = getCreditsStore();
  const { phoneNumber, channel, inputTokens, outputTokens, taskId, customCredits } = context;

  // S'assurer que l'utilisateur existe
  const user = store.getOrCreateUser(phoneNumber, channel);

  // Calculer le coût
  let creditsToDeduct: number;

  if (customCredits !== undefined) {
    creditsToDeduct = customCredits;
  } else if (inputTokens !== undefined && outputTokens !== undefined) {
    creditsToDeduct = calculateCreditsFromTokens(inputTokens, outputTokens);
  } else {
    // Coût par défaut si pas de tokens fournis
    creditsToDeduct = 1;
  }

  // Vérifier si l'utilisateur a assez de crédits
  if (user.balance < creditsToDeduct) {
    return {
      success: false,
      newBalance: user.balance,
      creditsDeducted: 0,
      insufficientCredits: true,
      message: formatInsufficientCreditsMessage(user.balance, creditsToDeduct),
    };
  }

  // Déduire les crédits
  const reason = taskId ?? "message";
  const updatedUser = store.deductCredits(phoneNumber, channel, creditsToDeduct, reason, {
    inputTokens,
    outputTokens,
    taskId,
  });

  // Préparer le message de solde
  let message: string | undefined;
  if (updatedUser.balance <= MIN_BALANCE_WARNING) {
    message = formatLowBalanceWarning(updatedUser.balance);
  }

  return {
    success: true,
    newBalance: updatedUser.balance,
    creditsDeducted: creditsToDeduct,
    message,
  };
}

/**
 * Vérifie si un utilisateur peut effectuer une requête
 */
export function canPerformRequest(
  phoneNumber: string,
  channel: string,
  estimatedCredits: number = 1,
): { allowed: boolean; balance: number; message?: string } {
  const store = getCreditsStore();
  const user = store.getUser(phoneNumber, channel);

  if (!user) {
    // Nouvel utilisateur, aura le bonus de bienvenue
    return { allowed: true, balance: 50 };
  }

  if (user.balance < estimatedCredits) {
    return {
      allowed: false,
      balance: user.balance,
      message: formatInsufficientCreditsMessage(user.balance, estimatedCredits),
    };
  }

  return { allowed: true, balance: user.balance };
}

/**
 * Formate le message pour crédits insuffisants
 */
function formatInsufficientCreditsMessage(balance: number, required: number): string {
  return `Oups ! Tu n'as plus assez de crédits.

Solde actuel: ${balance} crédits
Requis: ${required} crédits

Pour recharger, envoie "recharger" ou contacte @dickenai sur WhatsApp.`;
}

/**
 * Formate l'avertissement de solde bas
 */
function formatLowBalanceWarning(balance: number): string {
  if (balance <= 0) {
    return `Tu n'as plus de crédits. Envoie "recharger" pour continuer.`;
  }
  return `Attention: il te reste seulement ${balance} crédit${balance > 1 ? "s" : ""}.`;
}

/**
 * Formate le footer avec le solde après déduction
 */
export function formatCreditsFooter(creditsDeducted: number, newBalance: number): string {
  return `[-${creditsDeducted} crédit${creditsDeducted > 1 ? "s" : ""} | Solde: ${newBalance}]`;
}

/**
 * Récupère le solde formaté d'un utilisateur
 */
export function getFormattedBalance(phoneNumber: string, channel: string): string {
  const store = getCreditsStore();
  const user = store.getOrCreateUser(phoneNumber, channel);

  return `Tu as ${user.balance} crédit${user.balance > 1 ? "s" : ""}.`;
}
