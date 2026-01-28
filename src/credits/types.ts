/**
 * Floo Credits System - Types
 * Système de crédits pour le business model pay-as-you-go
 */

export type TransactionType = "credit" | "debit" | "bonus" | "refund";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  reason: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
};

export type UserCredits = {
  userId: string;
  channel: string;
  phoneNumber?: string;
  name?: string;
  balance: number;
  totalSpent: number;
  totalCredited: number;
  createdAt: number;
  lastActivity: number;
  transactions: Transaction[];
};

export type CreditPricing = {
  id: string;
  name: string;
  description: string;
  credits: number;
  category: "simple" | "medium" | "complex";
};

export type DeductionResult = {
  success: boolean;
  newBalance: number;
  creditsDeducted: number;
  insufficientCredits?: boolean;
  message?: string;
};

export type UsersStore = {
  users: Record<string, UserCredits>;
  version: number;
  lastModified: number;
};

// Constants
export const WELCOME_BONUS_CREDITS = 50;
export const MIN_BALANCE_WARNING = 10;
