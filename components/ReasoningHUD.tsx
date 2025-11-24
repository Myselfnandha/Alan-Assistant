
import React from 'react';
import { ThoughtProcess, ReasoningMode } from '../types';
import { CornerBrackets } from './HolographicComponents';

interface ReasoningHUDProps {
  thoughts: ThoughtProcess | null;
  mode: ReasoningMode;
  active: boolean;
}

const ReasoningHUD: React.FC<ReasoningHUDProps> = ({ thoughts, mode, active }) => {
  if (!active && !thoughts) return null;

  return (
    <div className={`
        absolute top-10 left-10 z-30 w-80 pointer-events-none transition-all duration-500
        ${active || thoughts ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
    `}>
        <div className="relative bg-alan-glass/80 backdrop-blur-md p-4 border-l-2 border-alan-primary/50 overflow-hidden">
            <CornerBrackets />
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b border-alan-primary/20 pb-2">
                <span className="text-[10px] font-mono tracking-widest text-alan-primary flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${active ? 'bg-alan-warning animate-pulse' : 'bg-alan-secondary'}`} />
                    REASONING_CORE_V.3.1
                </span>
                <span className="text-[9px] font-mono text-alan-secondary">{mode}</span>
            </div>

            {/* Active Thinking State */}
            {active && !thoughts && (
                <div className="space-y-2">
                    <div className="text-xs font-mono text-alan-primary animate-pulse">Running HRM Protocol...</div>
                    <div className="h-1 bg-alan-primary/10 w-full overflow-hidden">
                        <div className="h-full bg-alan-primary w-1/3 animate-scan" />
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-2">
                         <div className="h-8 bg-alan-primary/10 border border-alan-primary/20" />
                         <div className="h-8 bg-alan-primary/5 border border-alan-primary/10" />
                         <div className="h-8 bg-alan-primary/5 border border-alan-primary/10" />
                    </div>
                </div>
            )}

            {/* Display Thoughts (After Processing) */}
            {thoughts && thoughts.steps.map((step, idx) => (
                <div key={idx} className="mb-3 animate-appear">
                    <div className="text-[9px] font-mono text-alan-secondary/60 uppercase mb-1">
                        {step.layer} // NODE_{step.id.split('_')[1]}
                    </div>
                    <div className="text-xs font-mono text-alan-primary leading-relaxed border-l border-alan-primary/30 pl-2">
                        {step.content}
                    </div>
                </div>
            ))}

             {/* Footer */}
             <div className="mt-4 flex justify-between text-[8px] font-mono text-alan-secondary/40">
                <span>MEM_ADDR: 0x4F2A</span>
                <span>THREADS: 12</span>
             </div>
        </div>
    </div>
  );
};

export default ReasoningHUD;
