/**
 * Floo Credits System - Pricing
 * Grille tarifaire pour les différentes tâches
 */

import type { CreditPricing } from "./types.js";

// Grille de tarification par type de tâche
export const PRICING_GRID: CreditPricing[] = [
  // SIMPLE (1-2 crédits)
  {
    id: "question_simple",
    name: "Question simple",
    description: "Question/réponse courte",
    credits: 1,
    category: "simple",
  },
  {
    id: "reminder_set",
    name: "Rappel",
    description: "Créer un rappel",
    credits: 1,
    category: "simple",
  },
  {
    id: "web_search_basic",
    name: "Recherche web",
    description: "Recherche web simple",
    credits: 1,
    category: "simple",
  },
  {
    id: "translation_short",
    name: "Traduction courte",
    description: "Traduire un texte court",
    credits: 1,
    category: "simple",
  },
  {
    id: "calculation",
    name: "Calcul",
    description: "Calcul mathématique",
    credits: 1,
    category: "simple",
  },
  {
    id: "weather",
    name: "Météo",
    description: "Consulter la météo",
    credits: 1,
    category: "simple",
  },
  {
    id: "time_timezone",
    name: "Heure/Fuseau",
    description: "Heure dans différents fuseaux",
    credits: 1,
    category: "simple",
  },
  {
    id: "unit_conversion",
    name: "Conversion",
    description: "Conversion d'unités",
    credits: 1,
    category: "simple",
  },

  // MEDIUM (3-5 crédits)
  {
    id: "email_send",
    name: "Email",
    description: "Rédiger et envoyer un email",
    credits: 3,
    category: "medium",
  },
  {
    id: "calendar_add",
    name: "Calendrier",
    description: "Ajouter un événement",
    credits: 2,
    category: "medium",
  },
  {
    id: "summary_short",
    name: "Résumé court",
    description: "Résumer un texte court",
    credits: 3,
    category: "medium",
  },
  {
    id: "web_search_deep",
    name: "Recherche approfondie",
    description: "Recherche web avec analyse",
    credits: 4,
    category: "medium",
  },
  {
    id: "translation_long",
    name: "Traduction longue",
    description: "Traduire un document",
    credits: 4,
    category: "medium",
  },
  {
    id: "note_create",
    name: "Note",
    description: "Créer une note structurée",
    credits: 2,
    category: "medium",
  },
  {
    id: "contact_lookup",
    name: "Contact",
    description: "Recherche de contact",
    credits: 2,
    category: "medium",
  },
  {
    id: "task_create",
    name: "Tâche",
    description: "Créer une tâche",
    credits: 2,
    category: "medium",
  },
  {
    id: "image_analysis",
    name: "Analyse image",
    description: "Analyser une image",
    credits: 4,
    category: "medium",
  },
  {
    id: "voice_transcription",
    name: "Transcription",
    description: "Transcrire un audio",
    credits: 5,
    category: "medium",
  },

  // COMPLEX (10-20 crédits)
  {
    id: "pdf_summary",
    name: "Résumé PDF",
    description: "Résumer un PDF complet",
    credits: 10,
    category: "complex",
  },
  {
    id: "document_create",
    name: "Document",
    description: "Créer un document complet",
    credits: 15,
    category: "complex",
  },
  {
    id: "presentation_create",
    name: "Présentation",
    description: "Créer un PowerPoint",
    credits: 20,
    category: "complex",
  },
  {
    id: "research_report",
    name: "Rapport recherche",
    description: "Recherche approfondie + rapport",
    credits: 15,
    category: "complex",
  },
  {
    id: "email_campaign",
    name: "Campagne email",
    description: "Créer plusieurs emails",
    credits: 12,
    category: "complex",
  },
  {
    id: "data_analysis",
    name: "Analyse données",
    description: "Analyser des données",
    credits: 15,
    category: "complex",
  },
  {
    id: "content_long",
    name: "Contenu long",
    description: "Créer du contenu long",
    credits: 12,
    category: "complex",
  },
  {
    id: "invoice_quote",
    name: "Facture/Devis",
    description: "Créer facture ou devis",
    credits: 10,
    category: "complex",
  },
];

// Tarif par défaut basé sur les tokens utilisés
export const TOKEN_PRICING = {
  // Prix par 1000 tokens (approximatif)
  inputTokensPer1k: 0.5, // 0.5 crédit par 1000 tokens input
  outputTokensPer1k: 1.5, // 1.5 crédit par 1000 tokens output
  minimum: 1, // Minimum 1 crédit par requête
  maximum: 50, // Maximum 50 crédits par requête
};

/**
 * Calcule le coût en crédits basé sur les tokens utilisés
 */
export function calculateCreditsFromTokens(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1000) * TOKEN_PRICING.inputTokensPer1k;
  const outputCost = (outputTokens / 1000) * TOKEN_PRICING.outputTokensPer1k;
  const totalCost = Math.ceil(inputCost + outputCost);

  return Math.max(TOKEN_PRICING.minimum, Math.min(TOKEN_PRICING.maximum, totalCost));
}

/**
 * Trouve le pricing pour une tâche spécifique
 */
export function getPricingForTask(taskId: string): CreditPricing | undefined {
  return PRICING_GRID.find((p) => p.id === taskId);
}

/**
 * Retourne le coût par défaut pour une catégorie
 */
export function getDefaultCostForCategory(category: "simple" | "medium" | "complex"): number {
  switch (category) {
    case "simple":
      return 1;
    case "medium":
      return 3;
    case "complex":
      return 10;
    default:
      return 2;
  }
}
