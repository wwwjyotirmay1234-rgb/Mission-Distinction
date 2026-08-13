import { GoogleGenAI } from "@google/genai";

// Lazy initialization — server starts without AI keys; routes fail at call time.
let _ai: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!_ai) {
    if (!process.env.AI_INTEGRATIONS_GEMINI_BASE_URL) {
      throw new Error("AI_INTEGRATIONS_GEMINI_BASE_URL must be set. Did you forget to provision the Gemini AI integration?");
    }
    if (!process.env.AI_INTEGRATIONS_GEMINI_API_KEY) {
      throw new Error("AI_INTEGRATIONS_GEMINI_API_KEY must be set. Did you forget to provision the Gemini AI integration?");
    }
    _ai = new GoogleGenAI({
      apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
      httpOptions: {
        apiVersion: "",
        baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
      },
    });
  }
  return _ai;
}

export const ai: GoogleGenAI = new Proxy({} as GoogleGenAI, {
  get(_t, prop, receiver) { return Reflect.get(getClient(), prop, receiver); },
});
