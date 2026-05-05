import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (!text || targetLanguage.toLowerCase() === 'english') return text;

  // Simple local cache check
  const cacheKey = `trans_${targetLanguage}_${text.substring(0, 50)}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following text into ${targetLanguage}. Maintain the original tone, emotion, and formatting. Only return the translated text without any explanation.\n\nText: ${text}`,
    });

    const translatedText = response.text?.trim() || text;
    localStorage.setItem(cacheKey, translatedText);
    return translatedText;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Fallback to original
  }
}
