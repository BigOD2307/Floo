#!/usr/bin/env npx ts-node
/**
 * Floo Credits Demo
 * Script de démonstration du système de crédits
 *
 * Usage: npx ts-node src/credits/demo.ts
 */

import { getCreditsStore } from "./store.js";
import { preMessageCheck, postReplyDeduct, configureCredits } from "./integrator.js";

// Simuler un numéro de téléphone
const TEST_PHONE = "+225XXXXXXXXXX";
const CHANNEL = "whatsapp";

console.log("=== Floo Credits Demo ===\n");

// 1. Initialiser le store
console.log("1. Initialisation du store de credits...");
const store = getCreditsStore();

// 2. Vérifier si l'utilisateur existe
console.log("\n2. Verification de l'utilisateur...");
let user = store.getUser(TEST_PHONE, CHANNEL);
if (user) {
  console.log(`   Utilisateur existant: ${user.balance} credits`);
} else {
  console.log("   Nouvel utilisateur - sera cree avec bonus");
}

// 3. Simuler l'arrivée d'un message
console.log("\n3. Simulation d'un message entrant...");
const preCheck = preMessageCheck(TEST_PHONE, "Bonjour, comment vas-tu?", CHANNEL);

if (preCheck.isNewUser && preCheck.welcomeMessage) {
  console.log("   Message de bienvenue:");
  console.log(`   "${preCheck.welcomeMessage.slice(0, 100)}..."`);
}

if (preCheck.allowed) {
  console.log(`   Message autorise (solde: ${preCheck.balance} credits)`);
} else {
  console.log(`   Message refuse: ${preCheck.errorMessage}`);
}

// 4. Simuler une réponse
if (preCheck.allowed) {
  console.log("\n4. Simulation d'une reponse...");
  const postResult = postReplyDeduct(TEST_PHONE, CHANNEL, {
    inputTokens: 50,
    outputTokens: 150,
  });

  console.log(`   Credits deduits: ${postResult.footer}`);
  if (postResult.warning) {
    console.log(`   Avertissement: ${postResult.warning}`);
  }
}

// 5. Afficher le solde final
console.log("\n5. Solde final...");
user = store.getUser(TEST_PHONE, CHANNEL);
if (user) {
  console.log(`   Balance: ${user.balance} credits`);
  console.log(`   Total depense: ${user.totalSpent} credits`);
  console.log(`   Transactions: ${user.transactions.length}`);
}

// 6. Tester les commandes
console.log("\n6. Test des commandes...");

// Test commande solde
const soldeCheck = preMessageCheck(TEST_PHONE, "solde", CHANNEL);
if (soldeCheck.commandResponse) {
  console.log('   Commande "solde":');
  console.log(`   "${soldeCheck.commandResponse.slice(0, 100)}..."`);
}

// Test commande recharger
const rechargeCheck = preMessageCheck(TEST_PHONE, "recharger", CHANNEL);
if (rechargeCheck.commandResponse) {
  console.log('   Commande "recharger":');
  console.log(`   "${rechargeCheck.commandResponse.slice(0, 100)}..."`);
}

console.log("\n=== Demo terminee ===");
console.log("\nPour tester manuellement:");
console.log("1. Connecte WhatsApp avec: npm run floo -- channels login --channel whatsapp");
console.log("2. Lance le gateway: npm run floo -- gateway run");
console.log("3. Envoie un message WhatsApp pour tester!");
