import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { getSystemInstruction } from "../constants";
import { AlanSettings } from "../types";

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
  imageBase64?: string
): Promise<string> => {
  if (!genAI) {
    initializeGemini();
    if (!genAI) return "Error: Neural Interface (API Key) not initialized.";
  }

  try {
    const model = 'gemini-2.5-flash';
    
    // Construct request
    const contents = history.map(h => ({ role: h.role, parts: h.parts }));
    
    // Add current prompt
    const currentParts: Part[] = [{ text: prompt }];
    if (imageBase64) {
      currentParts.unshift({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64
        }
      });
    }
    
    contents.push({ role: 'user', parts: currentParts });

    const response: GenerateContentResponse = await genAI!.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: getSystemInstruction(settings),
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    });

    return response.text || "My sensors detected no output.";
  } catch (error) {
    console.error("ALAN Core Error:", error);
    return "Critical Failure in Reasoning Engine. Connection unstable.";
  }
};

// Specialized function for continuous background analysis
// This avoids carrying heavy context and just returns raw perception data
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
            { text: "Identify objects and context in this image. Be extremely concise, comma separated. No conversational text." }
          ]
        }
      ],
      config: {
        maxOutputTokens: 50,
        temperature: 0.1, // Low temperature for factual observation
      }
    });
    return response.text || "";
  } catch (e) {
    console.error("Vision Error:", e);
    return "";
  }
};