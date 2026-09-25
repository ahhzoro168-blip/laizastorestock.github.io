import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, Image as ImageIcon } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setIsLoading(true);
    setError(null);
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsLoading(false);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please verify device camera permissions or use file upload.');
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
  };

  const retake = () => {
    setCapturedImage(null);
    if (!stream) {
      startCamera();
    }
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-white text-sm tracking-wide">
              {capturedImage ? 'Review Shoe Photo' : 'Capture Shoe Photo'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview */}
        <div className="relative flex-1 min-h-[360px] bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-6 text-center text-slate-300">
              <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-rose-400 mb-2">{error}</p>
              <p className="text-xs text-slate-400">You can also upload high-resolution shoe photos directly from your device storage.</p>
            </div>
          ) : capturedImage ? (
            <img 
              src={capturedImage} 
              alt="Captured shoe" 
              className="w-full h-full object-contain max-h-[460px]"
            />
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10 text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2 text-amber-400" />
                  Initializing Camera Sensor...
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover max-h-[460px]"
              />
              {/* Overlay Grid lines for framing shoes */}
              <div className="absolute inset-6 border border-white/20 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between text-[10px] text-white/50 tracking-wider font-mono">
                  <span>SOLETRACK CAM</span>
                  <span>CENTER SHOE</span>
                </div>
                <div className="flex justify-between text-[10px] text-white/50 tracking-wider font-mono">
                  <span>HD READY</span>
                  <span>{facingMode.toUpperCase()} SENSOR</span>
                </div>
              </div>
            </>
          )}

          {/* Hidden Canvas for capture processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={retake}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retake Photo
              </button>
              <button
                type="button"
                onClick={confirmPhoto}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-amber-500/10"
              >
                <Check className="w-4 h-4" />
                Use Photo
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleFacingMode}
                className="py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-2 transition-colors"
                title="Switch Front / Back Camera"
              >
                <RefreshCw className="w-4 h-4 text-slate-400" />
                Flip Sensor
              </button>
              
              <button
                type="button"
                onClick={takeSnapshot}
                disabled={isLoading || !!error}
                className="flex-1 py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
              >
                <Camera className="w-4 h-4" />
                Snap High-Res Photo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
