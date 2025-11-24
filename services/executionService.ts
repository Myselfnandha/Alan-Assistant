
/**
 * Layer 8: Execution Engine
 * Interfaces with the "Operating System" (Browser Environment)
 */

export const executionService = {
  
  /**
   * Sets a system alarm/timer
   */
  setAlarm: async (timeMs: number, label: string): Promise<string> => {
    return new Promise((resolve) => {
        if (!("Notification" in window)) {
            resolve("Notifications not supported on this device.");
            return;
        }

        Notification.requestPermission().then(() => {
            setTimeout(() => {
                new Notification("ALAN SYSTEM ALERT", {
                    body: label,
                    icon: '/favicon.ico' // Assuming standard favicon
                });
                // Play sound
                const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
                audio.play().catch(e => console.warn("Audio blocked", e));
            }, timeMs);
            
            resolve(`Timer set for ${timeMs / 1000} seconds.`);
        });
    });
  },

  /**
   * Creates a file and triggers a browser download
   */
  createFile: async (filename: string, content: string): Promise<string> => {
      try {
          const blob = new Blob([content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          return `File "${filename}" created and downloaded.`;
      } catch (e) {
          return "File creation failed: Security restriction.";
      }
  },

  /**
   * Executes a JavaScript snippet in a sandbox
   */
  runScript: async (code: string): Promise<string> => {
      try {
          // Basic sandbox using Function constructor
          // Warning: This effectively runs eval(). In a real secure app, use WebWorkers.
          // eslint-disable-next-line no-new-func
          const safeFunc = new Function('console', `
            try {
                ${code}
                return "Script executed successfully.";
            } catch (e) {
                return "Runtime Error: " + e.message;
            }
          `);
          
          // Capture console logs if possible, or just return result
          const result = safeFunc(console);
          return result || "Executed.";
      } catch (e: any) {
          return `Script Syntax Error: ${e.message}`;
      }
  },

  openUrl: async (url: string): Promise<string> => {
      window.open(url, '_blank');
      return `Opening uplink to: ${url}`;
  }
};
