
import React from 'react';
import { IngredientAnalysis, RegulatoryInsight } from '../types';
import { CheckCircle, AlertTriangle, ArrowLeft, Info, FileText, ThumbsUp, ThumbsDown, Target, Sparkles, AlertOctagon, TrendingUp, Flame, Droplet, Wheat, Activity, ShieldCheck, BookOpen } from 'lucide-react';

interface ResultDisplayProps {
  data: IngredientAnalysis;
  onBack: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ data, onBack }) => {
  
  const getScoreStatus = (score: number) => {
    if (score >= 70) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100', bar: 'bg-green-500' };
    if (score >= 40) return { label: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100', bar: 'bg-yellow-500' };
    return { label: 'Poor', color: 'text-red-600', bg: 'bg-red-100', bar: 'bg-red-500' };
  };

  const status = getScoreStatus(data.wellnessScore);
  const thresholdDifference = data.wellnessScore - (data.categoryThreshold || 60);
  const isAboveThreshold = thresholdDifference >= 0;

  const renderRegulatoryBadge = (status: RegulatoryInsight['status']) => {
    switch(status) {
      case 'Banned': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wide">Banned</span>;
      case 'Restricted': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 uppercase tracking-wide">Restricted</span>;
      case 'Warning': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700 uppercase tracking-wide">Warning</span>;
      default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wide">Info</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto no-scrollbar pb-10">
      {/* Header */}
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="ml-2 text-xl font-bold text-gray-800">Analysis Result</h2>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Dietary Conflict Banner */}
        {!data.dietaryMatch.isCompliant && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm animate-in slide-in-from-top duration-300">
                <div className="flex items-start">
                    <AlertOctagon className="w-6 h-6 text-red-600 shrink-0 mr-3" />
                    <div>
                        <h3 className="font-bold text-red-700">Dietary Conflict Detected!</h3>
                        <p className="text-sm text-red-600 mt-1">{data.dietaryMatch.conflictReason || "This product matches your restricted ingredients."}</p>
                    </div>
                </div>
            </div>
        )}

        {/* Score Card - VISUAL FIX APPLIED */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${status.bar}`}></div>

          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Wellness Score</span>
          
          <div className="relative w-52 h-52 flex items-center justify-center mb-2">
            <svg className="w-full h-full" viewBox="0 0 160 160">
                {/* Background Circle */}
                <circle cx="80" cy="80" r="70" stroke="#f3f4f6" strokeWidth="12" fill="none" />
                {/* Foreground Circle - Fixed Stroke Color & Rotation */}
                <circle 
                    cx="80" 
                    cy="80" 
                    r="70" 
                    stroke="currentColor" 
                    strokeWidth="12" 
                    fill="none" 
                    strokeDasharray={440} 
                    strokeDashoffset={440 - (440 * data.wellnessScore) / 100} 
                    className={`${status.color} transition-all duration-1000 ease-out`}
                    strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                <span className={`text-6xl font-extrabold ${status.color}`}>{data.wellnessScore}</span>
                <span className={`text-xs font-bold mt-2 px-3 py-1 rounded-full ${status.bg} ${status.color} uppercase tracking-wider shadow-sm`}>
                    {status.label}
                </span>
            </div>
          </div>

          <div className="flex flex-col items-center text-center w-full mt-4">
              <div className="flex items-center gap-2 text-gray-800 font-semibold mb-2">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">{data.productCategory || "Product"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Target className="w-4 h-4" />
                  <span>
                    Goal: <span className="font-semibold text-gray-800">{data.categoryThreshold}</span>
                  </span>
              </div>
          </div>
        </div>

        {/* FSSAI REGULATORY AUDIT */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 overflow-hidden">
            <div className="bg-blue-50 px-5 py-3 border-b border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-700" />
                    <h3 className="font-bold text-blue-900 text-sm">FSSAI Regulatory Audit</h3>
                </div>
                <span className="text-[10px] font-medium text-blue-600 border border-blue-200 px-2 py-0.5 rounded bg-white">Indian Standards</span>
            </div>
            
            <div className="p-4 grid grid-cols-2 gap-4 border-b border-gray-100">
                {/* License Check */}
                <div className="flex items-start gap-3">
                   {data.regulatoryInfo?.fssaiLicenseFound ? (
                       <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                   ) : (
                       <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                   )}
                   <div>
                       <p className="text-xs font-bold text-gray-700">License No.</p>
                       <p className="text-[10px] text-gray-500">
                           {data.regulatoryInfo?.fssaiLicenseFound ? "Verified on label" : "Not detected"}
                       </p>
                   </div>
                </div>

                {/* Veg/Non-Veg Check */}
                <div className="flex items-start gap-3">
                   {data.regulatoryInfo?.vegNonVegLogo !== 'missing' ? (
                       <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                   ) : (
                       <Info className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                   )}
                   <div>
                       <p className="text-xs font-bold text-gray-700">Logo Check</p>
                       <p className="text-[10px] text-gray-500 capitalize">
                           {data.regulatoryInfo?.vegNonVegLogo !== 'missing' ? `${data.regulatoryInfo?.vegNonVegLogo} Dot Found` : "Logo Missing"}
                       </p>
                   </div>
                </div>
            </div>

            {/* Detailed Regulation Clauses */}
            {data.regulatoryInsights && data.regulatoryInsights.length > 0 ? (
                <div className="divide-y divide-gray-100">
                {data.regulatoryInsights.map((insight, idx) => (
                    <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-1">
                            <h4 className="font-bold text-gray-800 text-sm">{insight.ingredient}</h4>
                            {renderRegulatoryBadge(insight.status)}
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed mb-2">{insight.details}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 bg-gray-50 w-fit px-2 py-1 rounded">
                            <BookOpen className="w-3 h-3" />
                            <span>Clause: {insight.clause}</span>
                        </div>
                    </div>
                ))}
                </div>
            ) : (
                <div className="p-5 text-center">
                    <CheckCircle className="w-8 h-8 text-green-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No regulatory violations detected based on scanned text.</p>
                </div>
            )}
        </div>

        {/* Nutrition Facts Grid */}
        {data.nutritionFacts && (data.nutritionFacts.calories > 0 || data.nutritionFacts.protein > 0) && (
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1 mb-1 text-orange-500">
                        <Flame className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Calories</span>
                    </div>
                    <span className="text-xl font-bold text-gray-800">{data.nutritionFacts.calories}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1 mb-1 text-blue-500">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Protein</span>
                    </div>
                    <span className="text-xl font-bold text-gray-800">{data.nutritionFacts.protein}g</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1 mb-1 text-yellow-500">
                        <Wheat className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Carbs</span>
                    </div>
                    <span className="text-xl font-bold text-gray-800">{data.nutritionFacts.totalCarbohydrates}g</span>
                    {data.nutritionFacts.totalSugars > 0 && <span className="text-xs text-red-500">{data.nutritionFacts.totalSugars}g Sugars</span>}
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1 mb-1 text-purple-500">
                        <Droplet className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Fat</span>
                    </div>
                    <span className="text-xl font-bold text-gray-800">{data.nutritionFacts.totalFat}g</span>
                </div>
            </div>
        )}

        {/* Alternatives */}
        {data.alternatives && data.alternatives.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <div>
                        <h3 className="font-bold text-emerald-900 leading-none">Better Swaps</h3>
                        <p className="text-xs text-emerald-600/80 mt-1">Healthier options in this category</p>
                    </div>
                </div>
                <div className="space-y-3">
                    {data.alternatives.map((alt, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-emerald-100/50 flex items-center justify-between">
                            <div className="flex-1 mr-3">
                                <p className="font-bold text-gray-800 text-sm leading-tight">{alt.name}</p>
                                <p className="text-xs text-gray-500 mt-1 leading-snug">{alt.reason}</p>
                            </div>
                            <div className="flex flex-col items-center justify-center bg-emerald-100 w-12 h-12 rounded-full shrink-0 border border-emerald-200">
                                <span className="text-xs font-bold text-emerald-700">{alt.approxScore}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Summary */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-800">Summary</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{data.summary}</p>
        </div>

        {/* Good Stuff */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-gray-800">The Good Stuff</h3>
            </div>
            {data.goodIngredients.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {data.goodIngredients.map((item, idx) => (
                        <span key={idx} className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
                            {item}
                        </span>
                    ))}
                </div>
            ) : (
                <p className="text-gray-400 text-sm italic">No specific beneficial ingredients highlighted.</p>
            )}
        </div>

        {/* Flagged Items */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
             <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-gray-800">Flagged Items</h3>
            </div>
            {data.flaggedIngredients.length > 0 ? (
                <ul className="space-y-2">
                    {data.flaggedIngredients.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>
                            {item}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-400 text-sm italic">No harmful ingredients flagged.</p>
            )}
        </div>

        {/* Extracted Text */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
             <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold text-gray-800">Scanned Text</h3>
            </div>
             <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                {data.extractedText || "No text extracted."}
             </div>
        </div>

        <div className="text-center p-4 space-y-2">
            <p className="text-xs text-gray-400">
                Disclaimer: AI generated. Not medical advice.
            </p>
            <p className="text-[10px] text-gray-300 leading-relaxed uppercase tracking-wider">
                Nutridecode AI treats FSSAI regulations as a reference framework, not as a marketing claim.
            </p>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
    