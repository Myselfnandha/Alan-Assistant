
import { AlanPlugin } from "../types";

/**
 * LAYER 11: EXTENSIONS & PLUGINS
 * Manages external integrations and OS-level simulations.
 */

export const AVAILABLE_PLUGINS: AlanPlugin[] = [
    {
        id: 'weather_core',
        name: 'Atmospheric Sensors',
        description: 'Real-time weather data via OpenMeteo API',
        version: '2.1.0',
        icon: 'CloudRain',
        capabilities: ['Forecast', 'Temperature', 'Wind Speed']
    },
    {
        id: 'system_ops',
        name: 'SysOps Diagnostic',
        description: 'Hardware monitoring and device info',
        version: '1.0.4',
        icon: 'Cpu',
        capabilities: ['Battery', 'Memory', 'Threads']
    },
    {
        id: 'music_ctrl',
        name: 'Audio Interface',
        description: 'External media player control',
        version: '1.2.0',
        icon: 'Music',
        capabilities: ['Spotify Link', 'YouTube Search']
    },
    {
        id: 'comm_link',
        name: 'Comms Uplink',
        description: 'SMS and Email simulation protocol',
        version: '0.9.5',
        icon: 'MessageSquare',
        capabilities: ['SMS Simulation', 'Email Draft']
    }
];

export const pluginService = {

    getWeather: async (lat: number, lng: number): Promise<string> => {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (!data.current_weather) return "Weather data unavailable.";

            const w = data.current_weather;
            return `Temperature: ${w.temperature}°C, Wind: ${w.windspeed}km/h, Code: ${w.weathercode}`;
        } catch (e) {
            return "Atmospheric sensor malfunction (API Error).";
        }
    },

    getSystemInfo: async (): Promise<string> => {
        const nav = navigator as any;
        let batteryInfo = "Unknown";
        
        if (nav.getBattery) {
            try {
                const bat = await nav.getBattery();
                batteryInfo = `${Math.round(bat.level * 100)}% (${bat.charging ? 'Charging' : 'Discharging'})`;
            } catch (e) {}
        }

        const info = [
            `User Agent: ${nav.userAgent.substring(0, 50)}...`,
            `Cores: ${nav.hardwareConcurrency || 'Unknown'}`,
            `Memory: ${nav.deviceMemory ? `~${nav.deviceMemory}GB` : 'Unknown'}`,
            `Battery: ${batteryInfo}`,
            `Platform: ${nav.platform}`
        ];

        return info.join('\n');
    },

    playMusic: (query: string): string => {
        // Deep linking simulation
        const encoded = encodeURIComponent(query);
        // Try to open Spotify web search
        const url = `https://open.spotify.com/search/${encoded}`;
        window.open(url, '_blank');
        return `Audio routing to external player: "${query}"`;
    },

    sendComm: (type: 'sms' | 'email', recipient: string, content: string): string => {
        // In a real Android WebView (Tauri/Capacitor), this would call a native bridge.
        // For web, we simulate the action.
        console.log(`[COMM_LINK] Sending ${type.toUpperCase()} to ${recipient}: ${content}`);
        
        return `[SIMULATION] ${type.toUpperCase()} queued for ${recipient}. Content payload size: ${content.length} bytes.`;
    }
};
