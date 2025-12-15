
export interface UserPreferences {
  isVegan: boolean;
  isGlutenFree: boolean;
  isDairyFree: boolean;
  isNutFree: boolean;
  lowSugar: boolean;
  country: string; 
}

export interface NutritionFacts {
  calories: number;
  protein: number;
  totalCarbohydrates: number;
  totalSugars: number;
  totalFat: number;
  sodium: number; // in mg
  servingSize?: string;
}

export interface RegulatoryInsight {
  ingredient: string;
  status: 'Permitted' | 'Restricted' | 'Banned' | 'Warning' | 'Info';
  clause: string;
  details: string;
  source: string;
}

export interface RegulatoryInfo {
  fssaiLicenseFound: boolean;
  vegNonVegLogo: 'green' | 'brown' | 'missing';
}

export interface IngredientAnalysis {
  wellnessScore: number;
  summary: string;
  goodIngredients: string[];
  flaggedIngredients: string[];
  extractedText: string;
  nutritionFacts?: NutritionFacts; 
  regulatoryInsights?: RegulatoryInsight[]; 
  regulatoryInfo?: RegulatoryInfo; // NEW FIELD
  scoreReasoning: {
    positive: string[];
    negative: string[];
  };
  productCategory: string;
  categoryThreshold: number;
  dietaryMatch: {
    isCompliant: boolean;
    conflictReason: string | null; 
  };
  alternatives: Array<{
    name: string;
    reason: string;
    approxScore: number; 
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
  TEXT_INPUT = 'TEXT_INPUT',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
  HISTORY = 'HISTORY',
  PROFILE = 'PROFILE'
}
