
import { WorldState } from "../types";

/**
 * LAYER 12: ENVIRONMENT & HARDWARE ABSTRACTION
 * 
 * Purpose: Device, OS, and network abstraction layer.
 * Features:
 * - OS Bridge (Linux/Android/Windows detection)
 * - Hardware Driver Hooks (Battery, Network)
 */

export const environmentService = {
    
    detectEnvironment: (): string => {
        const ua = navigator.userAgent;
        if (/Android/i.test(ua)) return "ANDROID_KERNEL";
        if (/iPhone|iPad/i.test(ua)) return "IOS_DARWIN";
        if (/Windows/i.test(ua)) return "WIN_NT";
        if (/Linux/i.test(ua)) return "LINUX_ELF";
        return "UNKNOWN_ENV";
    },

    getHardwareStatus: async (): Promise<Partial<WorldState['hardware']>> => {
        const nav = navigator as any;
        let battery = { level: 1, charging: true };

        if (nav.getBattery) {
            try {
                const b = await nav.getBattery();
                battery = { level: b.level, charging: b.charging };
            } catch (e) {
                console.warn("Battery API unavailable");
            }
        }

        return {
            batteryLevel: battery.level * 100,
            charging: battery.charging,
            connectionType: nav.connection ? nav.connection.effectiveType : '4g'
        };
    }
};
