
import React, { useEffect, useState } from 'react';

// Decorative Corner Brackets
export const CornerBrackets: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} width="100%" height="100%">
    <path d="M10,0 L0,0 L0,10" fill="none" stroke="currentColor" strokeWidth="1" className="text-alan-primary opacity-60" />
    <path d="M100%,0 L100%,10" transform="translate(-10, 0)" fill="none" stroke="currentColor" strokeWidth="1" className="text-alan-primary opacity-60" />
    <path d="M100%,0 L0,0" transform="translate(0, 0) scale(-1, 1)" fill="none" stroke="currentColor" strokeWidth="1" className="text-alan-primary opacity-60" />
    
    <path d="M0,100% L0,100%" transform="translate(0, -10)" fill="none" stroke="currentColor" strokeWidth="1" className="text-alan-primary opacity-60" />
    <path d="M0,100% L10,100%" transform="translate(0, 0)" fill="none" stroke="currentColor" strokeWidth="1" className="text-alan-primary opacity-60" />
    
    <path d="M100%,100% L100%,calc(100% - 10px)" fill="none" stroke="currentColor" strokeWidth="1" className="text-alan-primary opacity-60" />
    <path d="M100%,100% Lcalc(100% - 10px),100%" fill="none" stroke="currentColor" strokeWidth="1" className="text-alan-primary opacity-60" />
  </svg>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = '', title }) => (
  <div className={`relative bg-alan-glass/40 border-l-2 border-alan-primary/30 rounded-r-lg overflow-hidden backdrop-blur-md animate-appear ${className}`}>
    {title && (
      <div className="px-3 py-1 bg-alan-primary/10 text-alan-primary text-[10px] font-display font-bold uppercase tracking-widest border-b border-alan-primary/20 flex justify-between items-center">
        <span>{title}</span>
        <div className="flex gap-1">
            <div className="w-1 h-1 bg-alan-primary rounded-full animate-pulse" />
            <div className="w-1 h-1 bg-alan-primary rounded-full animate-pulse delay-75" />
            <div className="w-1 h-1 bg-alan-primary rounded-full animate-pulse delay-150" />
        </div>
      </div>
    )}
    <div className="p-4 relative z-10 text-alan-secondary/90 font-mono text-sm leading-relaxed">
      {children}
    </div>
  </div>
);

export const Button: React.FC<{ onClick?: () => void; active?: boolean; children: React.ReactNode; className?: string }> = ({ onClick, active, children, className = '' }) => (
  <button
    onClick={onClick}
    className={`
      relative group px-4 py-3 font-display font-bold uppercase tracking-widest text-xs transition-all duration-300
      clip-corners border-l-2
      ${active 
        ? 'bg-alan-primary/20 border-alan-primary text-alan-primary shadow-[0_0_20px_rgba(0,240,255,0.2)]' 
        : 'bg-alan-primary/5 border-alan-primary/30 text-alan-secondary/70 hover:bg-alan-primary/10 hover:text-alan-primary hover:border-alan-primary/80'}
      ${className}
    `}
  >
    <div className="flex items-center justify-center relative z-10">
      {children}
    </div>
    <div className="absolute top-0 right-0 p-[2px]">
        <div className={`w-1 h-1 bg-alan-primary transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
    </div>
  </button>
);

export const TerminalText: React.FC<{ text: string }> = ({ text }) => (
  <div className="font-mono text-[10px] text-alan-primary/80 leading-relaxed break-all flex">
    <span className="mr-2 text-alan-accent opacity-70">⫸</span>
    <span>{text}</span>
  </div>
);

export const RangeSlider: React.FC<{ label: string; value: number; onChange: (val: number) => void; min?: number; max?: number }> = ({ label, value, onChange, min=0, max=100 }) => (
  <div className="w-full group">
    <div className="flex justify-between text-[10px] font-mono text-alan-primary mb-1 tracking-widest">
      <span>{label}</span>
      <span className="text-alan-secondary">{value.toString().padStart(3, '0')}%</span>
    </div>
    <div className="relative h-1 bg-alan-primary/10 w-full">
        <div 
            className="absolute top-0 left-0 h-full bg-alan-primary shadow-[0_0_8px_rgba(0,240,255,0.8)]"
            style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
        {/* Ticks */}
        <div className="absolute inset-0 flex justify-between px-1">
            {[0, 25, 50, 75, 100].map(i => (
                <div key={i} className="w-[1px] h-2 bg-alan-primary/20 -mt-0.5" />
            ))}
        </div>
        <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
    </div>
  </div>
);

export const StatCard: React.FC<{ label: string; value: string; subtext?: string; active?: boolean }> = ({ label, value, subtext, active }) => (
  <div className={`bg-alan-primary/5 border border-alan-primary/20 p-4 relative overflow-hidden group hover:border-alan-primary/50 transition-colors ${active ? 'border-alan-primary/60 bg-alan-primary/10' : ''}`}>
    <CornerBrackets className="scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all" />
    <div className="text-[10px] font-mono text-alan-secondary tracking-widest mb-1 opacity-70">{label}</div>
    <div className="text-2xl font-display font-bold text-alan-primary">{value}</div>
    {subtext && <div className="text-[9px] font-mono text-alan-primary/60 mt-1">{subtext}</div>}
    {active && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-alan-accent rounded-full animate-ping" />}
  </div>
);

export const ProgressBar: React.FC<{ value: number; color?: string }> = ({ value, color = 'bg-alan-primary' }) => (
  <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
    <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
  </div>
);

export const BootSequence: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [lines, setLines] = useState<string[]>([]);
  const logs = [
    "INITIALIZING ALAN KERNEL...",
    "LOADING NEURAL NETWORKS...",
    "CONNECTING TO VISION LAYER... OK",
    "CHECKING AUDIO DRIVERS... OK",
    "ESTABLISHING SECURE PROTOCOL...",
    "LOADING PERSONALITY MATRIX (HYBRID)...",
    "SYSTEM CHECK: NOMINAL",
    "WELCOME, COMMANDER."
  ];

  useEffect(() => {
    let delay = 0;
    logs.forEach((log, index) => {
      delay += Math.random() * 300 + 100;
      setTimeout(() => {
        setLines(prev => [...prev, log]);
        if (index === logs.length - 1) {
          setTimeout(onComplete, 800);
        }
      }, delay);
    });
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center font-mono text-alan-primary p-8">
      <div className="w-full max-w-lg">
        {lines.map((line, i) => (
          <div key={i} className="mb-1 text-sm animate-appear">
            <span className="text-alan-secondary/50 mr-2">[{new Date().toLocaleTimeString()}]</span>
            <span className="typing-effect">{line}</span>
          </div>
        ))}
        <div className="mt-4 animate-pulse">_</div>
      </div>
      {/* Scanline overlay for boot */}
      <div className="scanlines" />
    </div>
  );
};
