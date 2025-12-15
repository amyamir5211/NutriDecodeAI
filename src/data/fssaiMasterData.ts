
export type IngredientStatus = 'permitted' | 'restricted' | 'prohibited' | 'warning';
export type IngredientType = 'ingredient' | 'additive';

export interface MasterIngredient {
  status: IngredientStatus;
  type: IngredientType;
  penalty_score: number;
  clause: string;
  functionalClass?: string; // e.g. "Preservative Class II", "Synthetic Colour"
  ins?: string; // International Numbering System code
}

// 1. SYNONYM MAP: Maps variations to the Canonical Key in FSSAI_MASTER_DATA
// This prevents score fluctuation if AI extracts "Cane Sugar" one time and "Sugar" the next.
export const INGREDIENT_SYNONYMS: Record<string, string> = {
  "cane sugar": "sugar",
  "refined sugar": "sugar",
  "granulated sugar": "sugar",
  "white sugar": "sugar",
  "sucrose": "sugar",
  "corn syrup solids": "liquid glucose",
  "glucose syrup": "liquid glucose",
  "hfcs": "high fructose corn syrup",
  "invert syrup": "invert sugar",
  "vegetable fat": "hydrogenated vegetable oil", // Pessimistic assumption for Indian labels unless specified 'oil'
  "partially hydrogenated oil": "hydrogenated vegetable oil",
  "shortening": "hydrogenated vegetable oil",
  "margarine": "hydrogenated vegetable oil",
  "dalda": "vanaspati",
  "palm kernel oil": "palm oil",
  "palmolein oil": "palmolein",
  "ins 621": "monosodium glutamate",
  "e621": "monosodium glutamate",
  "ajitop": "monosodium glutamate",
  "flavour enhancer 621": "monosodium glutamate",
  "ins 211": "sodium benzoate",
  "e211": "sodium benzoate",
  "ins 202": "potassium sorbate",
  "e202": "potassium sorbate",
  "ins 102": "tartrazine",
  "e102": "tartrazine",
  "yellow 5": "tartrazine",
  "ins 110": "sunset yellow",
  "e110": "sunset yellow",
  "yellow 6": "sunset yellow",
  "ins 951": "aspartame",
  "e951": "aspartame",
  "ins 955": "sucralose",
  "e955": "sucralose",
  "white flour": "maida",
  "refined wheat flour": "maida",
  "all purpose flour": "maida"
};

// Mapped against FSSAI Food Safety and Standards (Food Products Standards and Food Additives) Regulations, 2011
export const FSSAI_MASTER_DATA: Record<string, MasterIngredient> = {
  // --- SWEETENERS & SUGARS ---
  "sugar": { status: "permitted", type: "ingredient", penalty_score: 2, clause: "FSSAI 2.1 (Sweetener)", functionalClass: "Added Sugar" },
  "liquid glucose": { status: "permitted", type: "ingredient", penalty_score: 4, clause: "FSSAI 2.1 (Sweetener)", functionalClass: "Added Sugar" },
  "invert sugar": { status: "permitted", type: "ingredient", penalty_score: 4, clause: "FSSAI 2.1 (Sweetener)", functionalClass: "Added Sugar" },
  "maltodextrin": { status: "permitted", type: "ingredient", penalty_score: 3, clause: "General Standard", functionalClass: "Thickener/Filler" },
  "high fructose corn syrup": { status: "permitted", type: "ingredient", penalty_score: 8, clause: "FSSAI 2.1", functionalClass: "Added Sugar" },
  "aspartame": { status: "restricted", type: "additive", penalty_score: 8, clause: "FSSAI 2.4.5 (24) - Warning Required", functionalClass: "Artificial Sweetener", ins: "951" },
  "sucralose": { status: "restricted", type: "additive", penalty_score: 5, clause: "FSSAI 2.4.5 (43)", functionalClass: "Artificial Sweetener", ins: "955" },
  "acesulfame potassium": { status: "restricted", type: "additive", penalty_score: 6, clause: "FSSAI 2.4.5 (28)", functionalClass: "Artificial Sweetener", ins: "950" },

  // --- FATS & OILS ---
  "palm oil": { status: "permitted", type: "ingredient", penalty_score: 6, clause: "Labelling Regs 2020", functionalClass: "Saturated Fat Source" },
  "palmolein": { status: "permitted", type: "ingredient", penalty_score: 6, clause: "Labelling Regs 2020", functionalClass: "Saturated Fat Source" },
  "hydrogenated vegetable oil": { status: "restricted", type: "ingredient", penalty_score: 15, clause: "FSSAI Trans Fat Regs (Limit <2%)", functionalClass: "Trans Fat Source" },
  "vanaspati": { status: "restricted", type: "ingredient", penalty_score: 15, clause: "FSSAI Trans Fat Regs", functionalClass: "Trans Fat Source" },
  "interesterified vegetable fat": { status: "permitted", type: "ingredient", penalty_score: 5, clause: "General Standard", functionalClass: "Modified Fat" },

  // --- PRESERVATIVES (CLASS II) ---
  "sodium benzoate": { status: "restricted", type: "additive", penalty_score: 5, clause: "FSSAI 2.3.2 (Class II Preservative)", functionalClass: "Preservative", ins: "211" },
  "potassium sorbate": { status: "restricted", type: "additive", penalty_score: 4, clause: "FSSAI 2.3.2 (Class II Preservative)", functionalClass: "Preservative", ins: "202" },
  "sulphur dioxide": { status: "restricted", type: "additive", penalty_score: 6, clause: "FSSAI 2.3.2 (Allergen)", functionalClass: "Preservative", ins: "220" },

  // --- FLAVOUR ENHANCERS ---
  "monosodium glutamate": { status: "warning", type: "additive", penalty_score: 8, clause: "FSSAI 2.2.1:1 (Msg Declaration)", functionalClass: "Flavour Enhancer", ins: "621" },
  "ins 627": { status: "permitted", type: "additive", penalty_score: 3, clause: "GMP", functionalClass: "Flavour Enhancer" },
  "ins 631": { status: "permitted", type: "additive", penalty_score: 3, clause: "GMP", functionalClass: "Flavour Enhancer" },

  // --- SYNTHETIC COLOURS ---
  "tartrazine": { status: "restricted", type: "additive", penalty_score: 10, clause: "FSSAI 2.3.1 (Synthetic Colour)", functionalClass: "Colour", ins: "102" },
  "sunset yellow": { status: "restricted", type: "additive", penalty_score: 10, clause: "FSSAI 2.3.1 (Synthetic Colour)", functionalClass: "Colour", ins: "110" },
  "ponceau 4r": { status: "restricted", type: "additive", penalty_score: 10, clause: "FSSAI 2.3.1 (Synthetic Colour)", functionalClass: "Colour", ins: "124" },
  "allura red": { status: "restricted", type: "additive", penalty_score: 10, clause: "FSSAI 2.3.1 (Synthetic Colour)", functionalClass: "Colour", ins: "129" },

  // --- OTHERS ---
  "caffeine": { status: "restricted", type: "ingredient", penalty_score: 8, clause: "FSSAI 2.4.5 (34) - Limit 320mg/L", functionalClass: "Stimulant" },
  "potassium bromate": { status: "prohibited", type: "additive", penalty_score: 50, clause: "FSSAI Notification 2016 (BANNED)", functionalClass: "Improver" },
  "maida": { status: "permitted", type: "ingredient", penalty_score: 5, clause: "General Standard", functionalClass: "Refined Carbohydrate" },
};

// Based on FSSAI Advertising and Claims Regulations, 2018
export const CLAIMS_RULES = {
  "immunity": { type: "unsupported_functional", penalty: 10, clause: "FSSAI Adv. Reg 4.0 (No unsubstantiated immunity claims)" },
  "cures": { type: "prohibited_medical", penalty: 25, clause: "FSSAI Adv. Reg 7.1 (Food cannot claim to cure disease)" },
  "fresh": { type: "misleading_fresh", penalty: 10, clause: "FSSAI Adv. Reg (Cannot claim 'Fresh' if processed/preserved)" },
  "natural": { type: "misleading_natural", penalty: 5, clause: "FSSAI Adv. Reg (Strict composite food rules)" },
  "healthiest": { type: "subjective_superlative", penalty: 5, clause: "FSSAI Adv. Reg 4.0 (Ambiguous)" },
  "grow tall": { type: "unsupported_nutrient", penalty: 10, clause: "FSSAI Adv. Reg 5.2" }
};
