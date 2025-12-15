
// src/data/fssaiRules.ts
// AUDITABLE DATA LAYER: Mapped to FSSAI Regulations (Food Safety and Standards Authority of India)

export interface FSSAIRule {
  id: string;
  matchTerms: string[]; // Variations of the name to match
  status: 'Permitted' | 'Restricted' | 'Banned' | 'Warning' | 'Info';
  clause: string;
  details: string;
}

export const FSSAI_DATABASE: FSSAIRule[] = [
  {
    id: "MSG",
    matchTerms: ["monosodium glutamate", "msg", "e621", "flavour enhancer 621"],
    status: "Warning",
    clause: "FSSAI Regulation 2.2.1:1",
    details: "Shall not be added to food for infants below 12 months. Must carry declaration 'CONTAINS MONOSODIUM GLUTAMATE'."
  },
  {
    id: "Aspartame",
    matchTerms: ["aspartame", "e951", "methyl ester"],
    status: "Restricted",
    clause: "FSSAI Regulation 2.4.5 (24)",
    details: "Not recommended for children. Not for Phenylketonurics. Max limit varies by category (e.g., 700ppm in carbonated water)."
  },
  {
    id: "Tartrazine",
    matchTerms: ["tartrazine", "e102", "yellow 5", "fd&c yellow 5"],
    status: "Restricted",
    clause: "FSSAI Regulation 2.3.1",
    details: "Synthetic food colour. Permitted in specific categories with strict limits (usually 100ppm). Must be declared."
  },
  {
    id: "Potassium Bromate",
    matchTerms: ["potassium bromate", "e924a", "bromate"],
    status: "Banned",
    clause: "FSSAI Notification 2016",
    details: "Prohibited for use in bread and bakery products due to potential carcinogenicity."
  },
  {
    id: "Trans Fat",
    matchTerms: ["partially hydrogenated vegetable oil", "phvo", "trans fat", "vegetable shortening", "vanaspati"],
    status: "Restricted",
    clause: "FSSAI Amendment 2021",
    details: "Limit reduced to not more than 2% by weight of the total oils/fats in the product."
  },
  {
    id: "Caffeine",
    matchTerms: ["caffeine"],
    status: "Restricted",
    clause: "FSSAI Regulation 2.4.5 (34)",
    details: "In energy drinks: Not to exceed 320mg/L. Must display 'High Caffeine' warning if >145mg/L."
  },
  {
    id: "Maida",
    matchTerms: ["refined wheat flour", "maida", "white flour"],
    status: "Info",
    clause: "General Food Standards",
    details: "Refined flour lacks fiber and essential nutrients found in whole wheat. No specific ban, but creates high glycemic load."
  },
  {
    id: "Palm Oil",
    matchTerms: ["palm oil", "palmolein", "palm kernel oil"],
    status: "Info",
    clause: "Labelling & Display Regs 2020",
    details: "High in saturated fats. FSSAI requires specific declaration of vegetable oil source."
  },
  {
    id: "Sorbitol",
    matchTerms: ["sorbitol", "e420"],
    status: "Warning",
    clause: "FSSAI Regulation 2.4.5",
    details: "Polyol. May have laxative effect if consumed in excess (>50g/day)."
  },
  {
    id: "Sodium Benzoate",
    matchTerms: ["sodium benzoate", "e211"],
    status: "Permitted",
    clause: "FSSAI Regulation 2.3.2",
    details: "Class II Preservative. Permitted in squashes, syrups, and crushes up to specific limits."
  }
];
