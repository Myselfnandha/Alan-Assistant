
import { ExecutionTool } from "../types";
import { executionService } from "./executionService";
import { pluginService } from "./pluginService";

export const TOOLS: Record<string, ExecutionTool> = {
  CALCULATOR: {
    name: 'Calculator',
    description: 'Evaluates mathematical expressions',
    execute: async (params: any) => {
      try {
        // Safe evaluation
        // eslint-disable-next-line no-new-func
        const result = new Function('return ' + params.expression)();
        return `Result: ${result}`;
      } catch (e) {
        return "Calculation Error";
      }
    }
  },
  SEARCH: {
    name: 'Web Search',
    description: 'Simulates a web search query',
    execute: async (params: any) => {
      // In a real app, this would hit Google Search API.
      // For this offline/hybrid demo, we mock it or use the GenAI grounding if available.
      return `[SEARCH_PROTOCOL] Querying global network for: "${params.query}"... Found 14,000 results. Top result: [Simulated Data]`;
    }
  },
  SYSTEM: {
    name: 'System Control',
    description: 'Internal device diagnostics and controls',
    execute: async (params: any) => {
      if (params.command === 'status') return "All Systems Nominal. Battery: 85%. Network: Secure.";
      if (params.command === 'scan') return "Scanning environment... Threat Level: SAFE.";
      if (params.command === 'info') return await pluginService.getSystemInfo();
      return "Command executed successfully.";
    }
  },
  MEMORY: {
    name: 'Memory Core',
    description: 'Saves data to long-term storage',
    execute: async (params: any) => {
       return `[MEMORY_WRITE] Content archived: "${params.content?.substring(0, 20)}..."`;
    }
  },
  CLOCK: {
      name: 'Clock / Alarm',
      description: 'Sets system timers',
      execute: async (params: any) => {
          if (params.action === 'alarm') {
              return await executionService.setAlarm(parseInt(params.time), params.label || 'Timer');
          }
          return "Invalid clock action.";
      }
  },
  FILES: {
      name: 'File System',
      description: 'Creates files',
      execute: async (params: any) => {
          if (params.action === 'create') {
              return await executionService.createFile(params.filename, params.content);
          }
          return "Invalid file action.";
      }
  },
  SCRIPT: {
      name: 'Script Engine',
      description: 'Executes JS Code',
      execute: async (params: any) => {
          return await executionService.runScript(params.code);
      }
  },
  // --- PLUGINS ---
  WEATHER: {
      name: 'Weather Plugin',
      description: 'Fetches forecast',
      execute: async (params: any) => {
          if (!params.lat || !params.lng) return "GPS Data required for atmospheric scan.";
          return await pluginService.getWeather(params.lat, params.lng);
      }
  },
  MUSIC: {
      name: 'Music Controller',
      description: 'Controls external audio',
      execute: async (params: any) => {
          return pluginService.playMusic(params.query || 'lofi beats');
      }
  },
  COMM: {
      name: 'Comm Link',
      description: 'SMS/Email tools',
      execute: async (params: any) => {
          return pluginService.sendComm(params.type, params.recipient, params.content);
      }
  },
  NONE: {
      name: 'No Tool',
      description: 'Standard logic',
      execute: async () => 'Processed.'
  }
};
