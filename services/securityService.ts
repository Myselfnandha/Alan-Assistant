
import { SecurityState } from "../types";

/**
 * LAYER 10: SECURITY & PRIVACY FRAMEWORK
 * 
 * Purpose: Protect data, ensure ethical operations, and manage access.
 * Features:
 * - Access Control
 * - Data Encryption (Simulated for Web)
 * - Privacy Gating
 * - Lockdown Mode
 */

const SALT = "ALAN_QUANTUM_SALT_V1";

export const initialSecurityState: SecurityState = {
    isLocked: true, // Default to locked on boot
    encryptionLevel: 'AES-256',
    privacyMode: false,
    biometricsRequired: false, // In a real app, this would check device hardware
    accessLevel: 'GUEST'
};

export const securityService = {
    
    authenticate: async (pin: string): Promise<boolean> => {
        // Simulated authentication
        // In production: Compare hash with stored hash
        if (pin === "0000" || pin === "1234") { 
            return true;
        }
        return false;
    },

    encryptData: (data: string): string => {
        // Simple XOR obfuscation for demo purposes
        // Real implementation would use Web Crypto API (AES-GCM)
        let result = "";
        for (let i = 0; i < data.length; i++) {
            result += String.fromCharCode(data.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length));
        }
        return btoa(result);
    },

    decryptData: (encoded: string): string => {
        try {
            const data = atob(encoded);
            let result = "";
            for (let i = 0; i < data.length; i++) {
                result += String.fromCharCode(data.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length));
            }
            return result;
        } catch (e) {
            return "[CORRUPTED_DATA]";
        }
    },

    togglePrivacyMode: (current: SecurityState): SecurityState => {
        return {
            ...current,
            privacyMode: !current.privacyMode,
            // When privacy is on, we downgrade access to prevent deep memory reads
            accessLevel: !current.privacyMode ? 'GUEST' : 'ADMIN'
        };
    },

    emergencyLockdown: (): SecurityState => {
        return {
            ...initialSecurityState,
            isLocked: true,
            accessLevel: 'GUEST',
            encryptionLevel: 'QUANTUM_SIM'
        };
    }
};
