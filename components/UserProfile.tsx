
import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Check, AlertOctagon, Globe } from 'lucide-react';
import { UserPreferences } from '../types';
import { getUserPreferences, saveUserPreferences } from '../services/storageService';

interface UserProfileProps {
  onBack: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onBack }) => {
  const [prefs, setPrefs] = useState<UserPreferences>({
    isVegan: false,
    isGlutenFree: false,
    isDairyFree: false,
    isNutFree: false,
    lowSugar: false,
    country: 'India'
  });

  useEffect(() => {
    setPrefs(getUserPreferences());
  }, []);

  const togglePref = (key: keyof UserPreferences) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    saveUserPreferences(newPrefs);
  };

  const updateCountry = (country: string) => {
    const newPrefs = { ...prefs, country };
    setPrefs(newPrefs);
    saveUserPreferences(newPrefs);
  };

  const PreferenceToggle = ({ label, pKey, description }: { label: string, pKey: keyof UserPreferences, description: string }) => (
    <button 
      onClick={() => togglePref(pKey)}
      className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
        prefs[pKey] 
          ? 'bg-green-50 border-green-200 shadow-sm' 
          : 'bg-white border-gray-100 hover:bg-gray-50'
      }`}
    >
      <div className="text-left">
        <h3 className={`font-semibold ${prefs[pKey] ? 'text-green-800' : 'text-gray-800'}`}>{label}</h3>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
        prefs[pKey] ? 'bg-green-500 border-green-500' : 'border-gray-300'
      }`}>
        {prefs[pKey] && <Check className="w-4 h-4 text-white" />}
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white p-4 sticky top-0 shadow-sm z-10 flex items-center">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="ml-2 text-xl font-bold text-gray-800">My Diet Profile</h2>
      </div>

      <div className="p-6 space-y-6 pb-12">
        <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3">
          <User className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-800">Personalize Your AI</h3>
            <p className="text-sm text-blue-700 mt-1">
              Select your dietary needs below. The AI will strictly flag ingredients that violate your rules.
            </p>
          </div>
        </div>

        {/* Region Selector */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
             <Globe className="w-5 h-5 text-gray-600" />
             <label className="block font-semibold text-gray-800">Market Region</label>
          </div>
          <select 
            value={prefs.country || 'India'} 
            onChange={(e) => updateCountry(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-green-500 outline-none appearance-none"
            style={{ backgroundImage: 'none' }} // Simple fix to remove default arrow if needed, but standard select is fine
          >
            <option value="India">India</option>
            <option value="USA">United States</option>
            <option value="UK">United Kingdom</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
            <option value="Global">Global / Other</option>
          </select>
          <p className="text-xs text-gray-500 mt-2">
            The AI will suggest alternative brands widely available in this region.
          </p>
        </div>

        <div className="space-y-3">
          <PreferenceToggle 
            label="Vegan" 
            pKey="isVegan" 
            description="No meat, dairy, eggs, or animal byproducts." 
          />
          <PreferenceToggle 
            label="Gluten-Free" 
            pKey="isGlutenFree" 
            description="No wheat, barley, or rye." 
          />
          <PreferenceToggle 
            label="Dairy-Free" 
            pKey="isDairyFree" 
            description="No milk, cheese, or lactose." 
          />
          <PreferenceToggle 
            label="Nut-Free" 
            pKey="isNutFree" 
            description="Strictly no peanuts or tree nuts." 
          />
          <PreferenceToggle 
            label="Low Sugar Monitor" 
            pKey="lowSugar" 
            description="Heavily penalize foods with high added sugars." 
          />
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 mt-8">
            <div className="flex items-center gap-2 mb-2 text-gray-800 font-semibold">
                <AlertOctagon className="w-4 h-4 text-orange-500" />
                <span>Note</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
                The AI analyzes text from the image. It may miss ingredients if the text is blurry or cut off. Always double-check the label yourself if you have severe allergies.
            </p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
