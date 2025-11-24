
import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, Aperture, Eye } from 'lucide-react';

interface CameraInputProps {
  onCapture: (base64: string) => void;
  active: boolean;
  autoMode?: boolean;
}

const CameraInput: React.FC<CameraInputProps> = ({ onCapture, active, autoMode = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      if (active && !stream) {
        setError(null);
        try {
          // Attempt 1: Try specific rear camera (mobile)
          const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setStream(s);
          if (videoRef.current) videoRef.current.srcObject = s;
        } catch (err) {
          console.warn("Environment camera not found, trying fallback...", err);
          try {
            // Attempt 2: Fallback to any available video source (laptop/webcam)
            const s = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(s);
            if (videoRef.current) videoRef.current.srcObject = s;
          } catch (fatalErr) {
            console.error("Camera access denied or unavailable", fatalErr);
            setError("CAMERA_OFFLINE");
          }
        }
      } else if (!active && stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
        if (videoRef.current) videoRef.current.srcObject = null;
      }
    };

    startCamera();
    
    // Cleanup on unmount
    return () => {
       if (stream) stream.getTracks().forEach(t => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Auto capture loop
  useEffect(() => {
    if (active && autoMode && stream) {
      intervalRef.current = window.setInterval(() => {
        handleCapture();
      }, 5000); // Capture every 5 seconds to avoid rate limits
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, autoMode, stream]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && !error) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        // Draw smaller frame for performance/bandwidth
        context.drawImage(videoRef.current, 0, 0, 300, 200);
        const data = canvasRef.current.toDataURL('image/jpeg', 0.6); // 60% quality
        onCapture(data.split(',')[1]); // Remove prefix
      }
    }
  };

  if (!active) return null;

  return (
    <div className="relative w-full h-48 bg-black rounded-lg overflow-hidden border border-alan-primary/30 mb-4 group transition-all duration-500">
      {error ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-alan-accent animate-pulse">
           <CameraOff size={32} />
           <span className="text-xs font-mono mt-2 tracking-widest">SIGNAL LOST</span>
        </div>
      ) : (
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-60" />
      )}
      
      <canvas ref={canvasRef} width="300" height="200" className="hidden" />
      
      {/* HUD Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-2 left-2 text-xs font-mono text-alan-primary flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${error ? 'bg-alan-accent' : 'bg-alan-success animate-pulse'}`}></span>
            LIVE FEED // {autoMode ? 'AUTO_ANALYSIS' : 'MANUAL'}
        </div>
        <div className="absolute inset-0 border-[1px] border-alan-primary/20 clip-corners-lg" />
        
        {/* Reticle */}
        {!error && (
            <div className="absolute center w-16 h-16 border border-alan-primary/30 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                <div className="w-1 h-1 bg-alan-primary/50"></div>
            </div>
        )}
        
        {/* Scanning Line */}
        {!error && autoMode && (
             <div className="absolute top-0 left-0 w-full h-1 bg-alan-primary/30 animate-scan opacity-50 shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
        )}
      </div>

      {!autoMode && !error && (
        <button 
            onClick={handleCapture}
            className="absolute bottom-2 right-2 p-2 bg-alan-primary/20 text-alan-primary rounded-full hover:bg-alan-primary hover:text-black transition-colors pointer-events-auto"
        >
            <Aperture size={20} />
        </button>
      )}
    </div>
  );
};

export default CameraInput;
