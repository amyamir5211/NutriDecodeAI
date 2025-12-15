
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { IngredientAnalysis, UserPreferences } from "../types";

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    productCategory: { type: Type.STRING, description: "The general category (e.g. Soda, Cereal)." },
    categoryThreshold: { type: Type.INTEGER, description: "Target score for this category (e.g. 80 for Oatmeal, 40 for Candy)." },
    wellnessScore: { type: Type.INTEGER, description: "0-100 score. Must be consistent based on ingredients." },
    summary: { type: Type.STRING, description: "Concise summary." },
    goodIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
    flaggedIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
    extractedText: { type: Type.STRING },
    scoreReasoning: {
      type: Type.OBJECT,
      properties: {
        positive: { type: Type.ARRAY, items: { type: Type.STRING } },
        negative: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["positive", "negative"]
    },
    dietaryMatch: {
      type: Type.OBJECT,
      properties: {
        isCompliant: { type: Type.BOOLEAN, description: "True if it matches user diet, False if it violates it." },
        conflictReason: { type: Type.STRING, description: "If not compliant, explain why (e.g. 'Contains Whey which is not Vegan'). If compliant, return null." }
      },
      required: ["isCompliant"]
    },
    alternatives: {
      type: Type.ARRAY,
      description: "List of 2-3 specific BRAND NAME products in the exact same category that are significantly healthier and available in the user's selected region.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Specific Brand and Product Name (e.g. 'The Whole Truth Protein Bar')." },
          reason: { type: Type.STRING, description: "Key differentiator (e.g. 'No added sugar, sweetened with dates')." },
          approxScore: { type: Type.INTEGER, description: "Estimated wellness score (0-100) for this alternative." }
        },
        required: ["name", "reason", "approxScore"]
      }
    }
  },
  required: ["productCategory", "categoryThreshold", "wellnessScore", "summary", "goodIngredients", "flaggedIngredients", "extractedText", "scoreReasoning", "dietaryMatch", "alternatives"],
};

const formatUserPrefs = (prefs: UserPreferences) => {
  const restrictions = [];
  if (prefs.isVegan) restrictions.push("VEGAN (No meat, dairy, eggs, honey)");
  if (prefs.isGlutenFree) restrictions.push("GLUTEN-FREE (No wheat, barley, rye)");
  if (prefs.isDairyFree) restrictions.push("DAIRY-FREE (No milk, cheese, whey, casein)");
  if (prefs.isNutFree) restrictions.push("NUT-FREE (No peanuts, tree nuts)");
  if (prefs.lowSugar) restrictions.push("LOW SUGAR (Penalize high added sugar heavily)");

  return restrictions.length > 0
    ? `USER DIETARY RESTRICTIONS: ${restrictions.join(", ")}. If the ingredients violate these, 'dietaryMatch.isCompliant' MUST be false and 'conflictReason' must be specific.`
    : "USER DIETARY RESTRICTIONS: None.";
};

const getSystemPrompt = (country: string = 'India') => {
  const market = country.toUpperCase();
  let specificInstructions = "";

  if (market === 'INDIA') {
    specificInstructions = `
- Prioritize FSSAI compliant analysis. Check for common Indian additives.
- Prioritize Indian health-focused brands (e.g., The Whole Truth, Yoga Bar, Epigamia, Tata Soulfull, Slurrp Farm, Open Secret, Vahdam).
- If user scans "Lays" or "Kurkure", suggest baked options like "Too Yumm!" or "TagZ".
- Avoid recommending products with Palm Oil, Maltodextrin, or High Sugar.
- STRICTLY IGNORE "Health Washing" claims on packages. Look at the ingredient list only.
    `;
  } else if (market === 'USA') {
    specificInstructions = `
- Prioritize US health-focused brands (e.g., RXBAR, Larabar, Simple Mills, Siete, LesserEvil, Olipop, Poppi).
- Suggest widely available alternatives in Whole Foods, Trader Joe's, or standard supermarkets.
    `;
  } else if (market === 'UK') {
    specificInstructions = `
- Prioritize UK health-focused brands (e.g., Graze, Nakd, Deliciously Ella, Huel).
- Suggest alternatives available in Tesco, Sainsbury's, or Waitrose.
    `;
  } else {
    specificInstructions = `
- Suggest brands widely available in ${country}.
- Focus on global health brands if local specifics are unknown.
    `;
  }

  return `
You are an AI-powered food wellness assistant focused on the ${market} MARKET context.
IMPORTANT: You are NOT a doctor or a licensed nutritionist. Your output is for informational purposes only.

CRITICAL CONSISTENCY RULE:
You MUST output the exact same score for the same ingredients every time. 
Use this ALGORITHMIC SCORING method (Mental Calculation) for a 'Proprietary Wellness Score':
1. Start Base Score: 80.
2. DEDUCT:
   - Sugar/Corn Syrup as top 3 ingredients: -20 points.
   - Palm Oil / Hydrogenated Fats: -15 points.
   - Refined Flour (Maida): -10 points.
   - Artificial Colors/Preservatives: -5 points each.
   - Unidentifiable Chemicals: -5 points.
3. ADD:
   - >5g Protein: +5 points.
   - Whole Grains / Fiber: +10 points.
   - Clean Label (No additives): +10 points.
4. CATEGORY ADJUSTMENT:
   - If it's a "Treat" (Candy/Soda), Cap score at 40 unless it's a specific "Zero Sugar" healthy alternative.
   - If it's "Whole Food" (Oats, Nuts), Floor score at 80.

ALTERNATIVES (${market} MARKET FOCUS):
Suggest 2-3 specific BRAND NAME products that are direct competitors in the exact same category, widely available in ${country}, and much healthier.
- STRICTLY DO NOT suggest items with Palm Oil or High Sugar.
${specificInstructions}

Calculate an approximate wellness score for the alternative based on the same strict rules above.
ALWAYS imply uncertainty when making health claims (e.g., "suggests," "may indicate").
`;
};

export const analyzeIngredientImage = async (base64Image: string, prefs: UserPreferences): Promise<IngredientAnalysis> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prefsText = formatUserPrefs(prefs);
    const systemPrompt = getSystemPrompt(prefs.country);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: `${systemPrompt}\n\n${prefsText}\n\nAnalyze this food label.` },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0, // FORCE DETERMINISTIC OUTPUT
        seed: 42 // FIXED SEED FOR CONSISTENCY
      },
    });
    return JSON.parse(response.text || "{}") as IngredientAnalysis;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};

export const analyzeIngredientText = async (text: string, prefs: UserPreferences): Promise<IngredientAnalysis> => {
  try {
    if (!process.env.API_KEY) {
      throw new Error("API Key is undefined. Check vite.config.ts and .env.local");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prefsText = formatUserPrefs(prefs);
    const systemPrompt = getSystemPrompt(prefs.country);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { text: `${systemPrompt}\n\n${prefsText}\n\nAnalyze this ingredient list: "${text}".` },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0, // FORCE DETERMINISTIC OUTPUT
        seed: 42 // FIXED SEED FOR CONSISTENCY
      },
    });
    return { ...JSON.parse(response.text || "{}"), extractedText: text };
  } catch (error) {
    console.error("Error analyzing text:", error);
    throw error;
  }
};
