import { GoogleGenAI, Modality } from "@google/genai";

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

export async function generateImage(
  prompt: string
): Promise<{ b64_json: string; mimeType: string }> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find(
    (part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("No image data in response");
  }

  return {
    b64_json: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType || "image/png",
  };
}
