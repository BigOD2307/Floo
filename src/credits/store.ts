/**
 * Floo Credits System - User Store
 * Gestion du stockage des utilisateurs et de leurs crédits
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { UserCredits, UsersStore, Transaction, TransactionType } from "./types.js";
import { WELCOME_BONUS_CREDITS } from "./types.js";

const STORE_VERSION = 1;

/**
 * Génère une clé utilisateur unique
 */
export function generateUserKey(phoneNumber: string, channel: string): string {
  const normalizedPhone = phoneNumber.replace(/[^0-9+]/g, "");
  return `${normalizedPhone}:${channel}`;
}

/**
 * Génère un ID de transaction unique
 */
function generateTransactionId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Crée un nouvel utilisateur avec le bonus de bienvenue
 */
export function createNewUser(phoneNumber: string, channel: string, name?: string): UserCredits {
  const now = Date.now();
  const welcomeTransaction: Transaction = {
    id: generateTransactionId(),
    type: "bonus",
    amount: WELCOME_BONUS_CREDITS,
    reason: "welcome_bonus",
    timestamp: now,
    metadata: { source: "registration" },
  };

  return {
    userId: generateUserKey(phoneNumber, channel),
    channel,
    phoneNumber,
    name,
    balance: WELCOME_BONUS_CREDITS,
    totalSpent: 0,
    totalCredited: WELCOME_BONUS_CREDITS,
    createdAt: now,
    lastActivity: now,
    transactions: [welcomeTransaction],
  };
}

/**
 * Classe pour gérer le store des utilisateurs
 */
export class UserCreditsStore {
  private storePath: string;
  private cache: UsersStore | null = null;

  constructor(stateDir: string) {
    this.storePath = path.join(stateDir, "users.json");
  }

  /**
   * Charge le store depuis le disque
   */
  private load(): UsersStore {
    if (this.cache) {
      return this.cache;
    }

    try {
      if (fs.existsSync(this.storePath)) {
        const content = fs.readFileSync(this.storePath, "utf-8");
        this.cache = JSON.parse(content) as UsersStore;
        return this.cache;
      }
    } catch {
      console.error(`[Floo Credits] Error loading users store, creating new one`);
    }

    // Créer un nouveau store vide
    const newStore: UsersStore = {
      users: {},
      version: STORE_VERSION,
      lastModified: Date.now(),
    };
    this.cache = newStore;
    this.save();
    return newStore;
  }

  /**
   * Sauvegarde le store sur le disque
   */
  private save(): void {
    if (!this.cache) return;

    this.cache.lastModified = Date.now();

    // Créer le dossier parent si nécessaire
    const dir = path.dirname(this.storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.storePath, JSON.stringify(this.cache, null, 2), "utf-8");
  }

  /**
   * Récupère ou crée un utilisateur
   */
  getOrCreateUser(phoneNumber: string, channel: string, name?: string): UserCredits {
    const store = this.load();
    const userKey = generateUserKey(phoneNumber, channel);

    if (!store.users[userKey]) {
      store.users[userKey] = createNewUser(phoneNumber, channel, name);
      this.save();
    } else if (name && !store.users[userKey].name) {
      // Mettre à jour le nom si fourni et pas encore défini
      store.users[userKey].name = name;
      this.save();
    }

    return store.users[userKey];
  }

  /**
   * Récupère un utilisateur existant
   */
  getUser(phoneNumber: string, channel: string): UserCredits | null {
    const store = this.load();
    const userKey = generateUserKey(phoneNumber, channel);
    return store.users[userKey] || null;
  }

  /**
   * Met à jour le solde d'un utilisateur
   */
  updateBalance(
    phoneNumber: string,
    channel: string,
    amount: number,
    type: TransactionType,
    reason: string,
    metadata?: Record<string, unknown>,
  ): UserCredits {
    const store = this.load();
    const userKey = generateUserKey(phoneNumber, channel);

    if (!store.users[userKey]) {
      throw new Error(`User not found: ${userKey}`);
    }

    const user = store.users[userKey];
    const transaction: Transaction = {
      id: generateTransactionId(),
      type,
      amount,
      reason,
      timestamp: Date.now(),
      metadata,
    };

    // Mettre à jour le solde
    if (type === "debit") {
      user.balance -= Math.abs(amount);
      user.totalSpent += Math.abs(amount);
    } else {
      user.balance += Math.abs(amount);
      user.totalCredited += Math.abs(amount);
    }

    user.transactions.push(transaction);
    user.lastActivity = Date.now();

    // Garder seulement les 100 dernières transactions
    if (user.transactions.length > 100) {
      user.transactions = user.transactions.slice(-100);
    }

    this.save();
    return user;
  }

  /**
   * Ajoute des crédits à un utilisateur
   */
  addCredits(
    phoneNumber: string,
    channel: string,
    amount: number,
    reason: string,
    metadata?: Record<string, unknown>,
  ): UserCredits {
    return this.updateBalance(phoneNumber, channel, amount, "credit", reason, metadata);
  }

  /**
   * Déduit des crédits d'un utilisateur
   */
  deductCredits(
    phoneNumber: string,
    channel: string,
    amount: number,
    reason: string,
    metadata?: Record<string, unknown>,
  ): UserCredits {
    return this.updateBalance(phoneNumber, channel, amount, "debit", reason, metadata);
  }

  /**
   * Vérifie si un utilisateur a assez de crédits
   */
  hasEnoughCredits(phoneNumber: string, channel: string, amount: number): boolean {
    const user = this.getUser(phoneNumber, channel);
    return user !== null && user.balance >= amount;
  }

  /**
   * Récupère le solde d'un utilisateur
   */
  getBalance(phoneNumber: string, channel: string): number {
    const user = this.getUser(phoneNumber, channel);
    return user?.balance ?? 0;
  }

  /**
   * Liste tous les utilisateurs
   */
  listUsers(): UserCredits[] {
    const store = this.load();
    return Object.values(store.users);
  }

  /**
   * Invalide le cache pour forcer un rechargement
   */
  invalidateCache(): void {
    this.cache = null;
  }
}

// Instance singleton
let storeInstance: UserCreditsStore | null = null;

/**
 * Récupère l'instance du store (singleton)
 */
export function getCreditsStore(stateDir?: string): UserCreditsStore {
  if (!storeInstance) {
    const dir = stateDir ?? process.env.CLAWDBOT_STATE_DIR ?? `${process.env.HOME}/.clawdbot`;
    storeInstance = new UserCreditsStore(dir);
  }
  return storeInstance;
}
