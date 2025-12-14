import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIService, AIAnalysisResult } from './types';

export class GeminiService implements AIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async analyzeImage(imageBase64: string, prompt?: string): Promise<AIAnalysisResult> {
    try {
      // Clean base64 string if it contains data URI prefix
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: 'image/png', // Assuming PNG from desktopCapturer
        },
      };

      const defaultPrompt = `
        Please analyze this image. 
        If it contains Japanese text, please:
        1. Transcribe the Japanese text.
        2. Provide a translation.
        3. Break down the sentence structure and explain key vocabulary.
      `;

      const result = await this.model.generateContent([
        prompt || defaultPrompt,
        imagePart
      ]);
      const response = await result.response;
      const text = response.text();

      return { text, raw: response };
    } catch (error) {
      console.error('Gemini Analysis Failed:', error);
      throw error;
    }
  }
}
