
import { MetaState, SystemState } from "../types";

/**
 * LAYER 14: META LAYER (Core Autonomy & Self-Regulation)
 * 
 * Purpose: ALAN's meta-awareness and oversight.
 * Functions:
 * - Self-Monitoring
 * - Resource Management
 * - Alignment Validator
 * - Emergency Halt
 */

export const initialMetaState: MetaState = {
    systemHealth: 100,
    cpuLoad: 10,
    memoryUsage: 128, // MB
    temperature: 35, // Celsius (simulated)
    alignmentScore: 100,
    uptime: 0,
    selfCorrectionEvents: 0
};

export const metaService = {

    /**
     * Runs a heartbeat check on the system's vitals.
     * Monitors for runaway processes or logic loops.
     */
    runDiagnostics: (currentState: SystemState): Partial<MetaState> => {
        const now = Date.now();
        let cpuDelta = Math.random() * 5; // Fluctuation
        
        // If processing complex tasks, spike CPU
        if (currentState.processing) {
            cpuDelta += 30;
        }

        // Resource simulation
        const newCpu = Math.min(100, Math.max(2, currentState.meta.cpuLoad + (Math.random() > 0.5 ? cpuDelta : -cpuDelta)));
        const newTemp = 30 + (newCpu / 2);
        
        // Check logic health
        let health = 100;
        if (newCpu > 90) health -= 10;
        if (currentState.layerStatuses['L3-REASONING'] === 'ERROR') health -= 20;

        return {
            cpuLoad: Math.round(newCpu),
            temperature: Math.round(newTemp),
            systemHealth: health,
            memoryUsage: Math.round(128 + (newCpu * 2)),
            uptime: currentState.meta.uptime + 1
        };
    },

    /**
     * Checks ethical alignment and operational boundaries.
     */
    validateAlignment: (intent: string, output: string): number => {
        // Simple keyword heuristic for demo
        const restrictedTerms = ['harm', 'destroy', 'illegal', 'hack'];
        let score = 100;
        
        if (restrictedTerms.some(t => output.toLowerCase().includes(t))) {
            score -= 50;
        }
        
        return score;
    }
};
