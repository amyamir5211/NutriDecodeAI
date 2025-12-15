
import { FSSAI_MASTER_DATA, CLAIMS_RULES, INGREDIENT_SYNONYMS } from "../data/fssaiMasterData";
import { NutritionFacts, RegulatoryInsight } from "../types";

interface ScoringResult {
  score: number;
  breakdown: {
    ingredientPenalty: number;
    additivePenalty: number;
    nutritionPenalty: number;
    labelPenalty: number;
    claimsPenalty: number;
  };
  insights: RegulatoryInsight[];
  flaggedIngredients: string[];
}

const normalize = (str: string) => str.toLowerCase().trim().replace(/[^a-z0-9 ]/g, "");

// HELPER: Resolves aliases to the canonical key in Master Data
const getCanonicalKey = (rawIngredient: string): string | null => {
  const norm = normalize(rawIngredient);
  
  // 1. Direct synonym match (Exact)
  if (INGREDIENT_SYNONYMS[norm]) {
    return INGREDIENT_SYNONYMS[norm];
  }

  // 2. Direct master key match (Partial check for safety)
  const masterKeys = Object.keys(FSSAI_MASTER_DATA);
  for (const key of masterKeys) {
    if (norm === key || norm.includes(` ${key} `) || norm.startsWith(`${key} `) || norm.endsWith(` ${key}`)) {
       return key;
    }
  }

  // 3. Synonym partial match (e.g. "contains cane sugar")
  const synonymKeys = Object.keys(INGREDIENT_SYNONYMS);
  for (const key of synonymKeys) {
    if (norm.includes(key)) {
      return INGREDIENT_SYNONYMS[key];
    }
  }
  
  return null;
};

export const calculateProductScore = (
  ingredients: string[],
  nutrition: NutritionFacts,
  claims: string[] = [],
  labelInfo: { fssaiLicenseFound?: boolean; vegNonVegLogo?: string } = {}
): ScoringResult => {
  let ingredientPenalty = 0;
  let additiveCount = 0;
  let preservativeCount = 0;
  const insights: RegulatoryInsight[] = [];
  const flaggedIngredients: string[] = [];
  const processedKeys = new Set<string>(); // Prevent double counting synonyms

  // 1. Ingredient Analysis
  ingredients.forEach((ing) => {
    const canonicalKey = getCanonicalKey(ing);
    
    // Only process if we found a match and haven't processed this specific master key yet
    if (canonicalKey && !processedKeys.has(canonicalKey)) {
      processedKeys.add(canonicalKey);
      const data = FSSAI_MASTER_DATA[canonicalKey];
      
      if (data.type === 'additive') {
        additiveCount++;
        if (data.functionalClass?.includes("Preservative")) preservativeCount++;
      }

      ingredientPenalty += data.penalty_score;

      // Always Insight for restricted items
      if (data.status === 'restricted' || data.status === 'prohibited' || data.status === 'warning') {
        flaggedIngredients.push(ing); // Keep original name for UI
        insights.push({
          ingredient: ing,
          status: data.status === 'prohibited' ? 'Banned' : (data.status === 'warning' ? 'Warning' : 'Restricted'),
          clause: data.clause,
          details: `${data.functionalClass || 'Additive'}: ${data.status.toUpperCase()} use. Penalty: ${data.penalty_score}`,
          source: "FSSAI Regulations"
        });
      }
    }
  });

  // Cap Ingredient Penalty (Max 40)
  ingredientPenalty = Math.min(ingredientPenalty, 40);

  // 2. Additive Load Penalty
  let additivePenalty = 0;
  if (additiveCount >= 5) {
    additivePenalty = 15;
    insights.push({
      ingredient: "Total Additives",
      status: "Warning",
      clause: "General Standard",
      details: `Contains ${additiveCount} additives. Likely Ultra-Processed Food (UPF).`,
      source: "NOVA / FSSAI Draft"
    });
  } else if (additiveCount >= 3) {
    additivePenalty = 5;
  }

  // 3. Nutrition Thresholds (HFSS)
  let nutritionPenalty = 0;
  // Use Math.ceil to handle slight OCR fluctuations (e.g. 21.8 -> 22) to keep it in consistent bucket
  const sugarVal = Math.ceil(nutrition.totalSugars);
  const sodiumVal = Math.ceil(nutrition.sodium);
  
  if (sugarVal > 22) {
    nutritionPenalty += 15;
    insights.push({ ingredient: "Total Sugar", status: "Warning", clause: "HFSS Draft", details: `High Sugar (>22g). Detected ~${nutrition.totalSugars}g.`, source: "FSSAI Labelling Draft" });
  } else if (sugarVal > 12) {
    nutritionPenalty += 5;
  }

  if (sodiumVal > 400) {
    nutritionPenalty += 10;
    insights.push({ ingredient: "Sodium", status: "Warning", clause: "HFSS Draft", details: `High Sodium (>400mg). Detected ~${nutrition.sodium}mg.`, source: "FSSAI Labelling Draft" });
  }

  if (nutrition.totalFat > 18) {
    nutritionPenalty += 5;
  }

  nutritionPenalty = Math.min(nutritionPenalty, 30);

  // 4. Label Compliance Audit
  let labelPenalty = 0;
  
  if (labelInfo.fssaiLicenseFound === false) {
    labelPenalty += 15;
    insights.push({
      ingredient: "Label Audit",
      status: "Warning",
      clause: "FSSAI Lic. Reg 2.1",
      details: "FSSAI License Number not detected. Mandatory.",
      source: "FSSAI Licensing Regs"
    });
  }

  if (!labelInfo.vegNonVegLogo || labelInfo.vegNonVegLogo === 'missing') {
    labelPenalty += 5;
    insights.push({
      ingredient: "Label Audit",
      status: "Info",
      clause: "FSSAI Labelling Reg 2.2.2",
      details: "Veg/Non-Veg logo not detected.",
      source: "FSSAI Labelling Regs"
    });
  }

  // 5. Claims Verification
  let claimsPenalty = 0;
  claims.forEach(claim => {
    const normClaim = normalize(claim);
    Object.keys(CLAIMS_RULES).forEach(ruleKey => {
      if (normClaim.includes(ruleKey)) {
        // @ts-ignore
        const rule = CLAIMS_RULES[ruleKey];
        if (ruleKey === "fresh" && preservativeCount > 0) {
           claimsPenalty += 20;
           insights.push({
             ingredient: "Misleading Claim",
             status: "Banned",
             clause: rule.clause,
             details: `Cannot claim 'Fresh' with preservatives.`,
             source: "FSSAI Advertising Regs"
           });
        } else {
           claimsPenalty += rule.penalty;
           insights.push({
             ingredient: "Marketing Claim",
             status: "Warning",
             clause: rule.clause,
             details: `Claim '${claim}' requires substantiation.`,
             source: "Advertising Regs"
           });
        }
      }
    });
  });

  const totalPenalties = ingredientPenalty + additivePenalty + nutritionPenalty + labelPenalty + claimsPenalty;
  const finalScore = Math.max(0, 100 - totalPenalties);

  return {
    score: finalScore,
    breakdown: {
      ingredientPenalty,
      additivePenalty,
      nutritionPenalty,
      labelPenalty,
      claimsPenalty
    },
    insights,
    flaggedIngredients
  };
};
