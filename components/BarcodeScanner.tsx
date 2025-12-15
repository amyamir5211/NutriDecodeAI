import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onClose }) => {
    const [error, setError] = useState<string>('');
    const [manualMode, setManualMode] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const scannerRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        if (manualMode) {
            // Stop scanner if switching to manual mode
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
            return;
        }

        // Unique ID for the container
        const elementId = "reader-custom";

        // Initialize with formats
        const html5QrCode = new Html5Qrcode(elementId, {
            formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.QR_CODE
            ],
            verbose: false
        });
        scannerRef.current = html5QrCode;

        const startScanning = async () => {
            try {
                await html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 15, // Higher FPS
                        qrbox: { width: 300, height: 150 }, // Rectangular box for barcodes
                        aspectRatio: 1.0
                    },
                    (decodedText) => {
                        // Success callback
                        if (navigator.vibrate) navigator.vibrate(200);

                        html5QrCode.stop().then(() => {
                            onScanSuccess(decodedText);
                            html5QrCode.clear();
                        }).catch(console.error);
                    },
                    (errorMessage) => {
                        // Ignore frame parse errors (noise)
                    }
                );
            } catch (err: any) {
                console.error("Camera start failed", err);
                setError("Could not access camera. Try entering code manually.");
            }
        };

        const timer = setTimeout(startScanning, 500); // Small delay to ensure render

        return () => {
            clearTimeout(timer);
            if (scannerRef.current) {
                if (scannerRef.current.isScanning) {
                    scannerRef.current.stop().catch(console.error).finally(() => {
                        scannerRef.current?.clear();
                    });
                } else {
                    scannerRef.current.clear();
                }
            }
        };
    }, [onScanSuccess, manualMode]);

    const handleManualSubmit = () => {
        if (manualCode.trim()) {
            onScanSuccess(manualCode.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm absolute top-0 w-full z-10">
                <h2 className="text-white font-semibold flex items-center gap-2">
                    <Camera className="w-5 h-5" /> {manualMode ? "Enter Barcode" : "Scan Barcode"}
                </h2>
                <button
                    onClick={onClose}
                    className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
                {manualMode ? (
                    <div className="w-full max-w-sm px-6">
                        <label className="text-gray-400 text-sm mb-2 block">Barcode Number</label>
                        <input
                            type="text"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            placeholder="e.g. 8901..."
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white text-lg focus:ring-2 focus:ring-green-500 outline-none mb-4"
                            autoFocus
                        />
                        <button
                            onClick={handleManualSubmit}
                            disabled={!manualCode.trim()}
                            className="w-full bg-green-600 text-white rounded-xl py-4 font-bold text-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            Analyze Product
                        </button>
                        <button
                            onClick={() => setManualMode(false)}
                            className="w-full mt-4 text-gray-500 text-sm hover:text-gray-300"
                        >
                            Switch back to Camera
                        </button>
                    </div>
                ) : (
                    <>
                        {error ? (
                            <div className="text-center p-6 bg-gray-900 rounded-xl m-4">
                                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                                <p className="text-white">{error}</p>
                            </div>
                        ) : (
                            <div id="reader-custom" className="w-full h-full"></div>
                        )}

                        {/* Overlay */}
                        {!error && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className="w-[300px] h-[150px] border-2 border-green-500/50 rounded-xl relative">
                                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-500 rounded-tl-sm"></div>
                                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-500 rounded-tr-sm"></div>
                                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-500 rounded-bl-sm"></div>
                                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-500 rounded-br-sm"></div>
                                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500/50 animate-pulse"></div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-black text-center">
                {!manualMode && (
                    <>
                        <p className="text-gray-400 text-sm mb-4">Align the barcode within the frame</p>
                        <button
                            onClick={() => setManualMode(true)}
                            className="px-4 py-2 bg-white/10 text-white rounded-full text-sm font-medium hover:bg-white/20 transition-colors border border-white/20"
                        >
                            Can't scan? Enter manually
                        </button>
                    </>
                )}
                <div className="mt-4 px-4">
                    <p className="text-[10px] text-gray-500 border-t border-gray-800 pt-2">
                        NutriDecode AI supports informed food choices aligned with the principles of the Eat Right India movement, an initiative of FSSAI. Ingredient analysis is for informational purposes only and does not constitute medical or regulatory advice.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BarcodeScanner;
