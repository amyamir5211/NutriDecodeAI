
import { ScanHistoryItem, UserPreferences } from "../types";

const STORAGE_KEY = 'nutridecode_history';
const PREFS_KEY = 'nutridecode_prefs';

const defaultPrefs: UserPreferences = {
  isVegan: false,
  isGlutenFree: false,
  isDairyFree: false,
  isNutFree: false,
  lowSugar: false,
  country: 'India' // Default to India
};

export const getHistory = (): ScanHistoryItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const saveToHistory = (item: ScanHistoryItem) => {
  try {
    const history = getHistory();
    const newHistory = [item, ...history].slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  } catch (e) {
    console.error("Failed to save history", e);
  }
};

export const clearHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getUserPreferences = (): UserPreferences => {
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaultPrefs to ensure new fields (like country) are present for old users
      return { ...defaultPrefs, ...parsed };
    }
    return defaultPrefs;
  } catch (e) {
    return defaultPrefs;
  }
};

export const saveUserPreferences = (prefs: UserPreferences) => {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
};
