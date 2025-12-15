
import React from 'react';
import { IngredientAnalysis } from '../types';
import { CheckCircle, AlertTriangle, ArrowLeft, Info, FileText, ThumbsUp, ThumbsDown, Target, Sparkles, AlertOctagon, TrendingUp } from 'lucide-react';

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

        {/* Dietary Conflict Banner (Personalization Feature) */}
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

        {/* Score Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-1.5 ${status.bar}`}></div>

          <span className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Wellness Score</span>

          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * data.wellnessScore) / 100}
                className={`${status.bar} transition-all duration-1000 ease-out`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={`text-5xl font-extrabold ${status.color}`}>{data.wellnessScore}</span>
              <span className={`text-sm font-bold mt-1 ${status.color} uppercase tracking-wider`}>{status.label}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center text-center w-full">
            <div className="flex items-center gap-2 text-gray-800 font-semibold mb-2">
              <span className="px-2 py-1 bg-gray-100 rounded text-sm">{data.productCategory || "Product"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">
                Category Goal: <span className="font-semibold text-gray-800">{data.categoryThreshold}</span>
              </span>
            </div>
            <div className={`mt-2 text-xs font-medium px-3 py-1 rounded-full ${isAboveThreshold ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {isAboveThreshold ? 'Above category average' : 'Below category average'}
            </div>
          </div>
        </div>

        {/* Smart Brand Alternatives (Updated Actionable Feature) */}
        {data.alternatives && data.alternatives.length > 0 && (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-emerald-900 leading-none">Better Brand Swaps</h3>
                <p className="text-xs text-emerald-600/80 mt-1">Upgrade your choice to these healthier brands</p>
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
                    <span className="text-xs font-bold text-emerald-700">{alt.approxScore || "?"}</span>
                    <span className="text-[9px] text-emerald-600 uppercase font-bold">Score</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Value Proposition */}
            <div className="mt-3 flex items-center justify-center gap-1 text-xs text-emerald-700 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>Swapping could improve your wellness by ~{Math.max(0, (data.alternatives[0]?.approxScore || 0) - data.wellnessScore)} points</span>
            </div>
          </div>
        )}

        {/* Score Breakdown */}
        {data.scoreReasoning && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-semibold text-gray-800 text-sm">Why this Score?</h3>
            </div>
            <div className="p-5 grid gap-4">
              {data.scoreReasoning.positive.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsUp className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-bold uppercase text-green-700 tracking-wide">Positives</span>
                  </div>
                  <ul className="space-y-1">
                    {data.scoreReasoning.positive.map((reason, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span> {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.scoreReasoning.negative.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsDown className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-bold uppercase text-red-700 tracking-wide">Negatives</span>
                  </div>
                  <ul className="space-y-1">
                    {data.scoreReasoning.negative.map((reason, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span> {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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

        <div className="text-center p-4">
          <p className="text-xs text-gray-400">
            <span className="font-bold">DISCLAIMER:</span> NutriDecode AI supports informed food choices aligned with the principles of the Eat Right India movement, an initiative of FSSAI. Ingredient analysis is for informational purposes only and does not constitute medical or regulatory advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
