
import { ProcessingMetadata, UserIntent, Sentiment, Attachment } from "../types";

/**
 * Layer 2: Pre-Processing & Context Normalization
 * 
 * Functions:
 * - Noise Reduction (Text Cleaning)
 * - Language Normalization
 * - Intent Classification
 * - Emotion/Tone Detection
 * - Safety Filtering
 */

const COMMAND_PATTERNS = [
  /^(turn|switch|set|change|enable|disable|toggle|activate|deactivate|open|close|start|stop)/i,
  /system|mode|settings|config/i,
  /volume|brightness|wifi|bluetooth/i
];

const QUERY_PATTERNS = [
  /^(what|who|where|when|why|how|define|explain|search|find)/i,
  /\?$/
];

const URGENT_PATTERNS = [
  /alert|emergency|critical|error|fail|immediately|now|quick/i,
  /!{2,}/ 
];

const POSITIVE_PATTERNS = [
  /good|great|awesome|thanks|thank you|excellent|perfect|love|like/i
];

const NEGATIVE_PATTERNS = [
  /bad|terrible|hate|suck|stupid|wrong|fail|error|bug/i,
  /not working/i
];

export const normalizeText = (text: string): string => {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Remove excess whitespace
    .replace(/[^\w\s?.,!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g, ''); // Basic sanitization
};

export const detectIntent = (text: string, attachments: Attachment[]): UserIntent => {
  if (attachments.length > 0) return UserIntent.ANALYSIS;

  if (COMMAND_PATTERNS.some(p => p.test(text))) return UserIntent.COMMAND;
  if (QUERY_PATTERNS.some(p => p.test(text))) return UserIntent.QUERY;
  
  // Default to CHAT if no strong signals
  return UserIntent.CHAT;
};

export const analyzeSentiment = (text: string): Sentiment => {
  if (URGENT_PATTERNS.some(p => p.test(text))) return Sentiment.URGENT;
  if (POSITIVE_PATTERNS.some(p => p.test(text))) return Sentiment.POSITIVE;
  if (NEGATIVE_PATTERNS.some(p => p.test(text))) return Sentiment.NEGATIVE;
  
  return Sentiment.NEUTRAL;
};

export const checkSafety = (text: string): boolean => {
  // Basic non-restrictive filter for malformed input or obvious script injection attempts
  // We keep this loose as requested ("not restrictive")
  const scriptTag = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
  if (scriptTag.test(text)) return false;
  
  return true;
};

export const processInputContext = (rawText: string, attachments: Attachment[] = []): ProcessingMetadata => {
  const normalized = normalizeText(rawText);
  const intent = detectIntent(normalized, attachments);
  const sentiment = analyzeSentiment(normalized);
  const safe = checkSafety(normalized);

  return {
    originalInput: rawText,
    normalizedText: safe ? normalized : "[REDACTED_MALICIOUS_CONTENT]",
    intent: intent,
    sentiment: sentiment,
    confidence: 0.95, // Placeholder for future ML model confidence
    safetyFlag: safe
  };
};
