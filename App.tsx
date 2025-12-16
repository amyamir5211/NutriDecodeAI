
import React, { useState, useEffect } from 'react';
import { Scan, Type, History as HistoryIcon, ChevronRight, Leaf, Loader2, UserCircle, Download, AlertCircle, Barcode } from 'lucide-react';
import CameraCapture from './components/CameraCapture';
import ResultDisplay from './components/ResultDisplay';
import UserProfile from './components/UserProfile';
import BarcodeScanner from './components/BarcodeScanner';
import { analyzeIngredientImage, analyzeIngredientText } from './services/geminiService';
import { getHistory, saveToHistory, getUserPreferences } from './services/storageService';
import { getProductByBarcode, adaptOFFData } from './services/openFoodFactsService';
import { IngredientAnalysis, ScanHistoryItem, AppView } from './types';

// Moved SafeAreaWrapper outside of App component to avoid TypeScript errors and recreation on render
const SafeAreaWrapper = ({ children }: { children?: React.ReactNode }) => (
  <div className="min-h-screen bg-[#F9F5EB] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
    {children}
  </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [analysisResult, setAnalysisResult] = useState<IngredientAnalysis | null>(null);
  const [inputText, setInputText] = useState('');
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (currentView === AppView.HISTORY) {
      setHistory(getHistory());
    }
  }, [currentView]);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleScan = async (base64Image: string) => {
    setCurrentView(AppView.PROCESSING);
    setProcessingStatus('Scanning image and analyzing ingredients...');
    setIsLoading(true);
    try {
      const prefs = getUserPreferences();
      const result = await analyzeIngredientImage(base64Image, prefs);
      setAnalysisResult(result);

      saveToHistory({
        id: Date.now().toString(),
        timestamp: Date.now(),
        result: result,
        thumbnail: base64Image
      });

      setCurrentView(AppView.RESULT);
    } catch (error: any) {
      console.error(error);
      alert(`Failed to analyze image: ${error.message || "Unknown error"}`);
      setCurrentView(AppView.HOME);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!inputText.trim()) return;

    setCurrentView(AppView.PROCESSING);
    setProcessingStatus('Analyzing ingredient list...');
    setIsLoading(true);
    try {
      const prefs = getUserPreferences();
      const result = await analyzeIngredientText(inputText, prefs);
      setAnalysisResult(result);

      saveToHistory({
        id: Date.now().toString(),
        timestamp: Date.now(),
        result: result
      });

      setCurrentView(AppView.RESULT);
    } catch (error: any) {
      console.error(error);
      setProcessingStatus(`ERROR: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarcodeScan = async (decodedText: string) => {
    setCurrentView(AppView.PROCESSING);
    setProcessingStatus(`Fetching product data for ${decodedText}...`);
    setIsLoading(true);

    try {
      const productData = await getProductByBarcode(decodedText);
      const prefs = getUserPreferences();
      const adaptedResult = adaptOFFData(productData, prefs);

      if (adaptedResult) {
        setAnalysisResult(adaptedResult);
        saveToHistory({
          id: Date.now().toString(),
          timestamp: Date.now(),
          result: adaptedResult
        });
        setCurrentView(AppView.RESULT);
      } else {
        // Fallback if product not found or API fails
        alert("Product not found in database. Please scan the ingredient list instead.");
        setCurrentView(AppView.HOME);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to fetch product data.");
      setCurrentView(AppView.HOME);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistoryItem = (item: ScanHistoryItem) => {
    setAnalysisResult(item.result);
    setCurrentView(AppView.RESULT);
  };

  // ---------------- Views ----------------

  if (currentView === AppView.SCAN) {
    return (
      <CameraCapture
        onCapture={handleScan}
        onClose={() => setCurrentView(AppView.HOME)}
      />
    );
  }

  if (currentView === AppView.BARCODE_SCAN) {
    return (
      <BarcodeScanner
        onScanSuccess={handleBarcodeScan}
        onClose={() => setCurrentView(AppView.HOME)}
      />
    );
  }

  if (currentView === AppView.RESULT && analysisResult) {
    return (
      <SafeAreaWrapper>
        <ResultDisplay
          data={analysisResult}
          onBack={() => setCurrentView(AppView.HOME)}
        />
      </SafeAreaWrapper>
    );
  }

  if (currentView === AppView.PROFILE) {
    return (
      <SafeAreaWrapper>
        <UserProfile onBack={() => setCurrentView(AppView.HOME)} />
      </SafeAreaWrapper>
    );
  }

  if (currentView === AppView.PROCESSING) {
    return (
      <SafeAreaWrapper>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-env(safe-area-inset-top))] bg-gray-50 px-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-green-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <Loader2 className="w-16 h-16 text-green-600 animate-spin relative z-10" />
          </div>
          <h2 className="mt-8 text-xl font-semibold text-gray-800">Processing</h2>
          <p className="mt-2 text-gray-500">{processingStatus}</p>
        </div>
      </SafeAreaWrapper>
    );
  }

  if (currentView === AppView.TEXT_INPUT) {
    return (
      <SafeAreaWrapper>
        <div className="h-[calc(100vh-env(safe-area-inset-top))] bg-white flex flex-col">
          <div className="p-4 flex items-center border-b">
            <button onClick={() => setCurrentView(AppView.HOME)} className="text-gray-600">Back</button>
            <h2 className="ml-4 font-bold text-lg">Check Ingredients</h2>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <p className="text-gray-600 mb-4 text-sm">Paste the ingredient list or product description below.</p>
            <textarea
              className="flex-1 w-full border border-gray-200 rounded-xl p-4 text-base focus:ring-2 focus:ring-green-500 focus:outline-none resize-none bg-gray-50"
              placeholder="e.g. Sugar, Palm Oil, Wheat Flour..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button
              onClick={handleTextSubmit}
              disabled={!inputText.trim() || isLoading}
              className="mt-6 w-full py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Analyze
            </button>
            <div className="mt-auto pt-6 text-center">
              <p className="text-[10px] text-gray-400">
                <span className="font-bold">DISCLAIMER:</span> NutriDecode AI supports informed food choices aligned with the principles of the Eat Right India movement, an initiative of FSSAI. Ingredient analysis is for informational purposes only and does not constitute medical or regulatory advice.
              </p>
            </div>
          </div>
        </div>
      </SafeAreaWrapper>
    );
  }

  if (currentView === AppView.HISTORY) {
    return (
      <SafeAreaWrapper>
        <div className="h-full flex flex-col">
          <div className="bg-white p-4 sticky top-0 shadow-sm z-10 flex items-center">
            <button onClick={() => setCurrentView(AppView.HOME)} className="text-gray-600">Back</button>
            <h2 className="ml-4 font-bold text-lg">Scan History</h2>
          </div>
          <div className="p-4 space-y-3">
            {history.length === 0 ? (
              <div className="text-center text-gray-400 mt-20">
                <HistoryIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>No scans yet.</p>
              </div>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => loadHistoryItem(item)}
                  className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center text-left hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${item.result.wellnessScore >= 80 ? 'bg-green-100 text-green-600' :
                    item.result.wellnessScore >= 50 ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                    <span className="font-bold">{item.result.wellnessScore}</span>
                  </div>
                  <div className="ml-4 flex-1 overflow-hidden">
                    <p className="font-medium text-gray-800 truncate">
                      {item.result.extractedText.slice(0, 30) || "Scanned Product"}...
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </button>
              ))
            )}
          </div>
        </div>
      </SafeAreaWrapper>
    );
  }

  // Home View
  return (
    <div className="min-h-screen bg-[#F9F5EB] flex flex-col max-w-md mx-auto relative overflow-hidden pt-[env(safe-area-inset-top)]">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-100px] right-[-50px] w-64 h-64 bg-green-200 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
      <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 bg-blue-200 rounded-full blur-3xl opacity-30 pointer-events-none"></div>

      <div className="absolute top-4 right-4 z-10 pt-[env(safe-area-inset-top)] flex gap-2">
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="px-3 py-2 bg-green-600 text-white rounded-full shadow-sm hover:bg-green-700 flex items-center gap-1 text-sm font-medium animate-pulse"
          >
            <Download className="w-4 h-4" />
            <span>Install App</span>
          </button>
        )}
        <button
          onClick={() => setCurrentView(AppView.PROFILE)}
          className="p-2 bg-white/80 backdrop-blur rounded-full shadow-sm text-gray-700 hover:bg-white"
        >
          <UserCircle className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col p-8 pt-28">
        <div className="flex items-center justify-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200 rotate-3">
            <Leaf className="w-8 h-8 text-white" />
          </div>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">NutriDecode<span className="text-green-500">AI</span></h1>
          <p className="text-gray-500 mt-3 text-lg">Your pocket food wellness assistant.</p>
        </div>

        <div className="space-y-4 w-full">
          <button
            onClick={() => setCurrentView(AppView.BARCODE_SCAN)}
            className="w-full py-5 bg-blue-600 text-white rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:bg-blue-700 transition-all active:scale-95 group"
          >
            <Barcode className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-lg">Scan Barcode</span>
          </button>

          <button
            onClick={() => setCurrentView(AppView.SCAN)}
            className="w-full py-5 bg-gray-900 text-white rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:bg-gray-800 transition-all active:scale-95 group"
          >
            <Scan className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-lg">Scan Ingredients</span>
          </button>

          <button
            onClick={() => setCurrentView(AppView.TEXT_INPUT)}
            className="w-full py-5 bg-white text-gray-800 border border-gray-200 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 transition-all active:scale-95"
          >
            <Type className="w-6 h-6 text-gray-600" />
            <span className="font-semibold text-lg">Check Ingredients</span>
          </button>
        </div>

        <div className="mt-auto pt-8 flex flex-col items-center">
          <button
            onClick={() => setCurrentView(AppView.HISTORY)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors mb-4"
          >
            <HistoryIcon className="w-4 h-4" />
            <span className="text-sm font-medium">View Scan History</span>
          </button>
          <div className="mt-3 mb-2">
            <img
              src="/know_what_you_eat.jpg"
              alt="Know What You Eat"
              className="h-20 w-auto object-contain rounded-[15%] shadow-lg shadow-gray-400 mx-auto"
            />
          </div>
          <div className="text-[10px] text-gray-400 text-center max-w-xs px-2 opacity-80">
            <span className="font-bold flex items-center justify-center gap-1"><AlertCircle className="w-3 h-3" /> DISCLAIMER:</span>
            NutriDecode AI supports informed food choices aligned with the principles of the Eat Right India movement, an initiative of FSSAI. Ingredient analysis is for informational purposes only and does not constitute medical or regulatory advice.
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
