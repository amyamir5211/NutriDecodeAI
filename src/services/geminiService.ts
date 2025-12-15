
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { IngredientAnalysis, UserPreferences, NutritionFacts } from "../types";
import { calculateProductScore } from "./scoringEngine";

const extractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    rawText: { type: Type.STRING },
    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
    nutrition: {
      type: Type.OBJECT,
      properties: {
        calories: { type: Type.NUMBER },
        protein: { type: Type.NUMBER },
        totalCarbohydrates: { type: Type.NUMBER },
        totalSugars: { type: Type.NUMBER },
        totalFat: { type: Type.NUMBER },
        sodium: { type: Type.NUMBER },
        servingSize: { type: Type.STRING }
      },
      required: ["calories", "protein", "totalSugars", "totalFat"]
    },
    claims: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Marketing claims on package e.g. 'Immunity', 'Fresh', 'Natural'" },
    productCategory: { type: Type.STRING },
    regulatoryInfo: {
      type: Type.OBJECT,
      properties: {
        fssaiLicenseFound: { type: Type.BOOLEAN, description: "True if 'Lic. No' or 'FSSAI' logo is visible ANYWHERE on the package." },
        vegNonVegLogo: { type: Type.STRING, enum: ["green", "brown", "missing"], description: "The color of the dot inside a square (Green/Brown). Return 'missing' only if absolutely not visible." }
      },
      required: ["fssaiLicenseFound", "vegNonVegLogo"]
    }
  },
  required: ["rawText", "ingredients", "nutrition", "claims", "productCategory", "regulatoryInfo"]
};

const explanationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "Explain the calculated score to the user." },
    alternatives: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          reason: { type: Type.STRING },
          approxScore: { type: Type.INTEGER }
        },
        required: ["name", "reason", "approxScore"]
      }
    }
  },
  required: ["summary", "alternatives"]
};

export const analyzeIngredientImage = async (base64Image: string, prefs: UserPreferences): Promise<IngredientAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-flash";

  // STEP 1: OCR & EXTRACTION (AI)
  const extractionResp = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
        { text: "Extract ingredient list (keep specific chemical names), nutrition facts (normalize to per 100g if possible), marketing claims. CRITICAL: Scan the ENTIRE image for 'FSSAI Lic. No' and the Green/Brown dot symbol." },
      ],
    },
    config: { 
      responseMimeType: "application/json", 
      responseSchema: extractionSchema,
      temperature: 0 
    },
  });

  const extractedData = JSON.parse(extractionResp.text || "{}");
  const ingredients = extractedData.ingredients || [];
  const nutrition: NutritionFacts = extractedData.nutrition || { calories: 0, protein: 0, totalSugars: 0, totalFat: 0, totalCarbohydrates: 0, sodium: 0 };
  const claims = extractedData.claims || [];

  // STEP 2: HARD RULE ENGINE (Deterministic)
  const scoringResult = calculateProductScore(
    ingredients, 
    nutrition, 
    claims, 
    extractedData.regulatoryInfo || { fssaiLicenseFound: false, vegNonVegLogo: 'missing' }
  );

  // STEP 3: EXPLANATION LAYER (AI)
  const summaryPrompt = `
    The user scanned a ${extractedData.productCategory}.
    
    HARD RULE ENGINE FINDINGS:
    - Final Score: ${scoringResult.score}/100
    - Regulatory Status: ${extractedData.regulatoryInfo?.fssaiLicenseFound ? "Licensed" : "License Missing"}
    - Flagged Ingredients: ${scoringResult.flaggedIngredients.join(', ')}
    
    User Preferences: ${prefs.isVegan ? "Vegan" : "None"}.

    Task:
    1. Write a 2 sentence summary explaining WHY the score is ${scoringResult.score}. Mention FSSAI concerns if score is low.
    2. Suggest 2 healthier alternatives available in ${prefs.country}.
  `;

  const explanationResp = await ai.models.generateContent({
    model,
    contents: { parts: [{ text: summaryPrompt }] },
    config: { 
      responseMimeType: "application/json", 
      responseSchema: explanationSchema,
      temperature: 0.2 
    },
  });

  const explanation = JSON.parse(explanationResp.text || "{}");

  // COMPOSITE RESULT
  return {
    wellnessScore: scoringResult.score,
    summary: explanation.summary,
    goodIngredients: ingredients.filter((i: string) => !scoringResult.flaggedIngredients.includes(i)),
    flaggedIngredients: scoringResult.flaggedIngredients,
    extractedText: extractedData.rawText,
    nutritionFacts: nutrition,
    regulatoryInsights: scoringResult.insights,
    scoreReasoning: {
      positive: ["FSSAI-aligned Algorithm"],
      negative: scoringResult.flaggedIngredients.map((i: string) => `Restricted: ${i}`)
    },
    productCategory: extractedData.productCategory,
    categoryThreshold: 60,
    dietaryMatch: {
      isCompliant: true,
      conflictReason: null
    },
    alternatives: explanation.alternatives,
    regulatoryInfo: extractedData.regulatoryInfo
  };
};

export const analyzeIngredientText = async (text: string, prefs: UserPreferences): Promise<IngredientAnalysis> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const extractionResp = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [{ text: `Extract ingredients and identify product category from: "${text}". Output JSON with keys: ingredients (array), productCategory (string).` }] },
        config: { responseMimeType: "application/json" }
    });
    
    const extractedData = JSON.parse(extractionResp.text || "{}");
    const ingredients = extractedData.ingredients || text.split(',').map(s => s.trim());
    
    // Text mode cannot verify license/logo, so we default to TRUE/FOUND to avoid penalizing copy-paste text
    const scoringResult = calculateProductScore(
        ingredients, 
        { calories: 0, protein: 0, totalSugars: 0, totalFat: 0, totalCarbohydrates: 0, sodium: 0 },
        [],
        { fssaiLicenseFound: true, vegNonVegLogo: 'green' } // Assume compliant for text check
    );
    
    return {
        wellnessScore: scoringResult.score,
        summary: `Calculated Score: ${scoringResult.score}. Based on ingredient analysis.`,
        goodIngredients: ingredients.filter((i: string) => !scoringResult.flaggedIngredients.includes(i)),
        flaggedIngredients: scoringResult.flaggedIngredients,
        extractedText: text,
        regulatoryInsights: scoringResult.insights,
        scoreReasoning: { positive: [], negative: scoringResult.flaggedIngredients },
        productCategory: extractedData.productCategory || "Unknown",
        categoryThreshold: 60,
        dietaryMatch: { isCompliant: true, conflictReason: null },
        alternatives: [],
        regulatoryInfo: { fssaiLicenseFound: true, vegNonVegLogo: 'green' } 
    };
};
