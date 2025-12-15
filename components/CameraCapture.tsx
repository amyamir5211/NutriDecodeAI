import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Prefer back camera
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64, remove prefix for API consumption usually, but here we might keep it or strip it depending on service
        // Gemini allows base64 data directly. We usually strip the prefix for the API call in the service wrapper if needed.
        // The service implementation expects raw base64 data or handles the mime type.
        // Let's pass the raw base64 string without the data URL prefix for the service.
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64Data = dataUrl.split(',')[1]; 
        
        stopCamera();
        onCapture(base64Data);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        stopCamera(); // Ensure camera is off
        onCapture(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {error ? (
           <div className="text-white text-center p-6">
             <p className="mb-4">{error}</p>
             <button onClick={onClose} className="px-4 py-2 bg-gray-800 rounded-lg">Close</button>
           </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Overlay Guides */}
        {!error && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
             <div className="w-64 h-64 border-2 border-green-500 rounded-lg opacity-70"></div>
          </div>
        )}

        <button 
          onClick={() => { stopCamera(); onClose(); }}
          className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 z-10"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="h-32 bg-gray-900 flex items-center justify-between px-8 pb-4">
        {/* Upload Button */}
        <div className="relative">
            <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <button className="flex flex-col items-center justify-center text-white/80 hover:text-white">
                <ImageIcon className="w-8 h-8 mb-1" />
                <span className="text-xs">Upload</span>
            </button>
        </div>

        {/* Capture Button */}
        <button 
          onClick={captureImage}
          disabled={!isStreaming}
          className="w-16 h-16 rounded-full border-4 border-white bg-green-500 hover:bg-green-400 flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
           <Camera className="w-8 h-8 text-white" />
        </button>

        {/* Spacer for symmetry */}
        <div className="w-8"></div>
      </div>
    </div>
  );
};

export default CameraCapture;
