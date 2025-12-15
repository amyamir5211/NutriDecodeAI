
export interface UserPreferences {
  isVegan: boolean;
  isGlutenFree: boolean;
  isDairyFree: boolean;
  isNutFree: boolean;
  lowSugar: boolean;
  country: string; // New field for regional context
}

export interface IngredientAnalysis {
  wellnessScore: number;
  summary: string;
  goodIngredients: string[];
  flaggedIngredients: string[];
  extractedText: string;
  scoreReasoning: {
    positive: string[];
    negative: string[];
  };
  productCategory: string;
  categoryThreshold: number;
  // New fields for personalization and actionability
  dietaryMatch: {
    isCompliant: boolean; // True if it matches user diet
    conflictReason: string | null; // e.g. "Contains Milk which is not Vegan"
  };
  alternatives: Array<{
    name: string;
    reason: string;
    approxScore: number; // Estimated score for the better alternative
  }>;
}

export interface ScanHistoryItem {
  id: string;
  timestamp: number;
  result: IngredientAnalysis;
  thumbnail?: string;
}

export enum AppView {
  HOME = 'HOME',
  SCAN = 'SCAN',
  BARCODE_SCAN = 'BARCODE_SCAN',
  TEXT_INPUT = 'TEXT_INPUT',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
  HISTORY = 'HISTORY',
  PROFILE = 'PROFILE' // New view
}
