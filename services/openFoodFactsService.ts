
import axios from 'axios';
import { IngredientAnalysis, UserPreferences } from "../types";

const OFF_API_URL = "https://world.openfoodfacts.org/api/v0/product";

export const getProductByBarcode = async (barcode: string): Promise<any> => {
    try {
        const response = await axios.get(`${OFF_API_URL}/${barcode}.json`);
        return response.data;
    } catch (error) {
        console.error("Error fetching from OpenFoodFacts:", error);
        return null;
    }
};

export const adaptOFFData = (offData: any, prefs: UserPreferences): IngredientAnalysis | null => {
    if (!offData || offData.status !== 1) return null;

    const product = offData.product;
    const ingredientsText = product.ingredients_text_en || product.ingredients_text || "No ingredients found";
    const productName = product.product_name || "Unknown Product";
    const brand = product.brands || "Unknown Brand";

    // Simple heuristic mapping since OFF doesn't give us the exact AI-style analysis
    // In a real product, we might pass this text to Gemini for "Interpretation"

    // Nutri-Score mapping to Wellness Score (Approximation)
    const nutriscore = product.nutriscore_grade?.toLowerCase();
    let wellnessScore = 50;
    if (nutriscore === 'a') wellnessScore = 90;
    if (nutriscore === 'b') wellnessScore = 80;
    if (nutriscore === 'c') wellnessScore = 60;
    if (nutriscore === 'd') wellnessScore = 40;
    if (nutriscore === 'e') wellnessScore = 20;

    return {
        productCategory: product.categories_tags?.[0]?.replace("en:", "") || "General Food",
        categoryThreshold: 60, // Generic threshold
        wellnessScore: wellnessScore,
        summary: `Product "${productName}" found in OpenFoodFacts database. Nutri-Score: ${nutriscore?.toUpperCase() || 'N/A'}.`,
        goodIngredients: [], // OFF tags are messy, would need cleaning
        flaggedIngredients: [], // Would need mapping
        extractedText: `${brand} - ${productName}. Ingredients: ${ingredientsText}`,
        scoreReasoning: {
            positive: ["Data sourced from OpenFoodFacts database (Real World Data)."],
            negative: ["Nutritional value based on global Nutri-Score standard."]
        },
        dietaryMatch: {
            isCompliant: true, // Optimistic default, real logic needs complex checking
            conflictReason: null
        },
        alternatives: [] // OFF doesn't easily provide competitors yet
    };
};
