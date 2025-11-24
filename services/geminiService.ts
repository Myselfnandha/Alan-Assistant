
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { getSystemInstruction } from "../constants";
import { AlanSettings, Attachment, ProcessingMetadata, UserIntent, ReasoningMode, WorldState } from "../types";

let genAI: GoogleGenAI | null = null;

export const initializeGemini = () => {
  if (process.env.API_KEY) {
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
};

export const generateAlanResponse = async (
  prompt: string, 
  history: { role: 'user' | 'model', parts: Part[] }[],
  settings: AlanSettings,
  attachments: Attachment[] = [],
  metadata?: ProcessingMetadata,
  reasoningMode: ReasoningMode = ReasoningMode.SHALLOW,
  memoryContext: string = "",
  worldState?: WorldState
): Promise<string> => {
  if (!genAI) {
    initializeGemini();
    if (!genAI) return "Error: Neural Interface (API Key) not initialized.";
  }

  try {
    // Select Model based on Task Complexity
    const model = reasoningMode === ReasoningMode.DEEP ? 'gemini-2.5-flash' : 'gemini-2.5-flash'; 
    
    // Construct request
    const contents = history.map(h => ({ role: h.role, parts: h.parts }));
    
    // Build current turn parts
    const currentParts: Part[] = [];

    // Handle Attachments (OCR/Analysis)
    for (const att of attachments) {
      if (att.type === 'image') {
        currentParts.push({
          inlineData: {
            mimeType: att.mimeType || "image/jpeg",
            data: att.data
          }
        });
      } else {
        // Text/Code files
        currentParts.push({
          text: `[FILE_CONTENT: ${att.name}]\n${att.data}\n[END_FILE]`
        });
      }
    }

    // Enhance Prompt with Memory, World Model & Pre-Processing
    let contextBlock = `[CONTEXT_LAYER]
INTENT: ${metadata ? metadata.intent : 'UNKNOWN'}
SENTIMENT: ${metadata ? metadata.sentiment : 'NEUTRAL'}
REASONING_MODE: ${reasoningMode}`;

    if (worldState) {
        contextBlock += `
[WORLD_MODEL]
TIME: ${worldState.timeString}
DATE: ${worldState.dateString}
LOCATION: ${worldState.location.label}
ENVIRONMENT: ${worldState.environmentLabel}
THREAT_LEVEL: ${worldState.threatLevel}`;
    }

    if (memoryContext) {
        contextBlock += `\n[RELEVANT_MEMORY]\n${memoryContext}`;
    }
    
    contextBlock += `\n[/CONTEXT_LAYER]`;

    // Add text prompt
    currentParts.push({ text: `${contextBlock}\n\nUSER QUERY: ${prompt}` });
    
    contents.push({ role: 'user', parts: currentParts });

    const response: GenerateContentResponse = await genAI!.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: getSystemInstruction(settings),
        temperature: reasoningMode === ReasoningMode.DEEP ? 0.7 : 0.4, 
        maxOutputTokens: reasoningMode === ReasoningMode.DEEP ? 2000 : 500,
      }
    });

    return response.text || "My sensors detected no output.";
  } catch (error) {
    console.error("ALAN Core Error:", error);
    return "Critical Failure in Reasoning Engine. Connection unstable.";
  }
};

export const analyzeImage = async (base64Image: string): Promise<string> => {
  if (!genAI) initializeGemini();
  if (!genAI) return "Vision systems offline.";

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { 
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image
              }
            },
            { text: "Identify objects, read visible text, and assess environment context. Be extremely concise, comma separated." }
          ]
        }
      ],
      config: {
        maxOutputTokens: 60,
        temperature: 0.1,
      }
    });
    return response.text || "";
  } catch (e) {
    console.error("Vision Error:", e);
    return "";
  }
};
