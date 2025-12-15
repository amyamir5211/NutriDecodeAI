
// src/services/ruleEngine.ts
// DETERMINISTIC ENGINE: No AI/ML. Pure string matching and rule evaluation.

import { FSSAI_DATABASE, FSSAIRule } from "../data/fssaiRules";
import { RegulatoryInsight } from "../types";

/**
 * Normalizes a string for comparison (trim, lowercase, remove punctuation).
 */
const normalize = (str: string): string => {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
};

/**
 * Checks a single ingredient against the FSSAI database.
 */
const evaluateIngredient = (ingredientName: string): RegulatoryInsight | null => {
  const normalizedInput = normalize(ingredientName);

  for (const rule of FSSAI_DATABASE) {
    for (const term of rule.matchTerms) {
      // Exact match or contains match (e.g. "Contains Aspartame")
      // We use a safe includes check. 
      // If the rule term is short (3 chars or less), we require exact match to avoid false positives (like "msg" in "msgstore")
      // Otherwise we allow partial match if the input *contains* the term.
      
      const normalizedTerm = normalize(term);
      
      let isMatch = false;
      if (normalizedTerm.length <= 3) {
        isMatch = normalizedInput === normalizedTerm || normalizedInput.split(' ').includes(normalizedTerm);
      } else {
        isMatch = normalizedInput.includes(normalizedTerm);
      }

      if (isMatch) {
        return {
          ingredient: ingredientName, // Return original name for display
          status: rule.status,
          clause: rule.clause,
          details: rule.details,
          source: "FSSAI Standards"
        };
      }
    }
  }
  return null;
};

/**
 * Main Entry Point: Evaluates a list of ingredients.
 * Returns only unique insights to avoid duplicates.
 */
export const runFSSAIRules = (ingredients: string[]): RegulatoryInsight[] => {
  const insights: RegulatoryInsight[] = [];
  const seenRuleIds = new Set<string>();

  ingredients.forEach(ing => {
    const result = evaluateIngredient(ing);
    if (result) {
      // We map back to the Rule ID (by looking up the database again or attaching ID to result) 
      // to ensure we don't show the same regulation twice for synonyms (e.g. MSG and E621).
      // For simplicity, we filter by the unique 'details' text which is unique per rule.
      if (!seenRuleIds.has(result.details)) {
        insights.push(result);
        seenRuleIds.add(result.details);
      }
    }
  });

  return insights;
};
