
import { WorldState } from "../types";

export const getInitialWorldState = (): WorldState => ({
  timestamp: Date.now(),
  timeString: new Date().toLocaleTimeString(),
  dateString: new Date().toLocaleDateString(),
  location: { lat: null, lng: null, label: "Acquiring..." },
  environmentLabel: "Awaiting Visual Data",
  threatLevel: 'SAFE',
  hardware: {
    batteryLevel: 100,
    charging: false,
    connectionType: 'unknown'
  }
});

export const updateTime = (current: WorldState): WorldState => ({
  ...current,
  timestamp: Date.now(),
  timeString: new Date().toLocaleTimeString(),
  dateString: new Date().toLocaleDateString()
});

export const updateLocation = async (current: WorldState): Promise<WorldState> => {
  if (!navigator.geolocation) {
      return { ...current, location: { ...current.location, label: "GPS Module Missing" } };
  }
  
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          ...current,
          location: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            label: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
          }
        });
      },
      (err) => {
        console.warn("GPS Error", err);
        // Don't overwrite if we already had a fix, unless it's a hard error
        const label = current.location.lat ? current.location.label : "Signal Lost";
        resolve({ ...current, location: { ...current.location, label } });
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    );
  });
};

/**
 * Infers environmental context from visual tags and sensor data.
 */
export const inferEnvironment = (visualDescription: string): Partial<WorldState> => {
   const lower = visualDescription.toLowerCase();
   let threat: 'SAFE' | 'CAUTION' | 'DANGER' = 'SAFE';
   let envLabel = "Scanning...";

   // Threat Detection Logic (Simulated)
   if (lower.match(/weapon|gun|knife|fire|blood|accident|danger/)) {
       threat = 'DANGER';
   } else if (lower.match(/unknown|dark|shadow|warning/)) {
       threat = 'CAUTION';
   }

   // Environment Labeling
   if (lower.match(/outdoor|sky|tree|street|sun|cloud/)) {
       envLabel = "Outdoors";
   } else if (lower.match(/indoor|room|wall|desk|computer/)) {
       envLabel = "Indoors";
   }

   // Append specific context
   envLabel += ` [${visualDescription.substring(0, 30)}...]`;

   return {
     environmentLabel: envLabel,
     threatLevel: threat
   };
};
