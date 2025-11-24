import React from 'react';

interface VisualizerProps {
  state: 'idle' | 'listening' | 'speaking' | 'processing';
}

const Visualizer: React.FC<VisualizerProps> = ({ state }) => {
  const isActive = state !== 'idle';
  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking';
  
  return (
    <div className="relative flex flex-col items-center justify-center py-6 w-full">
      {/* Status Indicators (Top Corners) */}
      <div className="absolute top-0 w-full flex justify-between px-4 opacity-60">
        <div className="text-[10px] font-mono text-alan-primary tracking-widest flex items-center gap-2">
           <div className={`w-1 h-1 bg-alan-primary rounded-full ${isActive ? 'animate-ping' : ''}`} />
           SYS_MODE: {state.toUpperCase()}
        </div>
        <div className="text-[10px] font-mono text-alan-primary tracking-widest">
           V.4.0.1
        </div>
      </div>

      {/* Main HUD Container */}
      <div className="relative w-72 h-72 flex items-center justify-center mt-6">
        
        {/* Ring 1: Outer Faint Glow (Static) */}
        <div className="absolute inset-0 rounded-full border border-alan-primary/5 shadow-[0_0_60px_rgba(0,240,255,0.05)]" />

        {/* Ring 2: Segmented Data Ring (Slow Rotate) */}
        <div className={`absolute inset-4 rounded-full border border-alan-primary/10 border-dashed ${isActive ? 'animate-[spin_20s_linear_infinite]' : ''}`} />

        {/* Ring 3: Tech Arc Ring (Medium Rotate) */}
        <svg className={`absolute inset-0 w-full h-full p-2 opacity-40 ${isActive ? 'animate-[spin_10s_linear_infinite]' : ''}`} viewBox="0 0 100 100">
           {/* Outer arcs */}
           <path d="M50,5 A45,45 0 0,1 95,50" fill="none" stroke="currentColor" strokeWidth="1" className="text-alan-primary" />
           <path d="M50,95 A45,45 0 0,1 5,50" fill="none" stroke="currentColor" strokeWidth="1" className="text-alan-primary" />
           
           {/* Inner ticks */}
           <line x1="50" y1="10" x2="50" y2="15" stroke="currentColor" strokeWidth="1" className="text-alan-secondary" />
           <line x1="90" y1="50" x2="85" y2="50" stroke="currentColor" strokeWidth="1" className="text-alan-secondary" />
           <line x1="50" y1="90" x2="50" y2="85" stroke="currentColor" strokeWidth="1" className="text-alan-secondary" />
           <line x1="10" y1="50" x2="15" y2="50" stroke="currentColor" strokeWidth="1" className="text-alan-secondary" />
        </svg>

        {/* Ring 4: Heavy Segmented Ring (Blue - Counter Rotate) */}
        <svg className={`absolute inset-0 w-full h-full p-8 ${isActive ? 'animate-[spin_5s_linear_infinite_reverse]' : ''}`} viewBox="0 0 100 100">
           <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="15 5" strokeOpacity="0.2" className="text-alan-secondary" />
           <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="20 60" className="text-alan-primary drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" />
        </svg>

        {/* Ring 5: Inner Spinner (Fast) */}
        <div className={`absolute inset-20 rounded-full border-t-2 border-b-2 border-alan-primary/60 ${isActive ? 'animate-spin' : ''}`} />

        {/* CENTRAL SPHERE (The Wireframe Globe) */}
        <div className={`
           relative w-32 h-32 rounded-full flex items-center justify-center overflow-hidden
           bg-black/50 backdrop-blur-sm
           border border-alan-primary/30
           transition-all duration-300
           ${isListening ? 'scale-110 shadow-[0_0_50px_rgba(0,240,255,0.5)] border-alan-primary' : ''}
           ${isSpeaking ? 'scale-105 shadow-[0_0_30px_rgba(0,240,255,0.3)] animate-pulse' : ''}
        `}>
           {/* Wireframe Mesh Effect using CSS Gradient */}
           <div 
             className="absolute inset-0 opacity-40"
             style={{ 
               backgroundImage: `
                 repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(0, 240, 255, 0.5) 20px),
                 repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(0, 240, 255, 0.5) 20px)
               `,
               backgroundSize: '20px 20px',
               transform: 'perspective(100px) rotateX(20deg)',
             }} 
           />
           {/* Hexagon Overlay */}
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
           
           {/* Core Glow */}
           <div className={`w-16 h-16 rounded-full bg-radial-gradient from-alan-primary to-transparent opacity-50 blur-xl transition-all duration-200 ${isSpeaking ? 'scale-150 opacity-80' : 'scale-100'}`} />
        </div>
      </div>

      {/* Cinematic Text */}
      <div className="mt-8 flex flex-col items-center animate-appear">
        <h1 className="text-6xl font-display font-bold tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-b from-alan-primary via-alan-primary to-alan-secondary/50 drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">
            ALAN
        </h1>
        <div className="flex items-center gap-4 mt-2 opacity-60">
           <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-alan-primary" />
           <span className="text-[10px] font-mono tracking-[0.5em] text-alan-primary">ADVANCED LOGICAL NETWORK</span>
           <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-alan-primary" />
        </div>
      </div>
      
    </div>
  );
};

export default Visualizer;