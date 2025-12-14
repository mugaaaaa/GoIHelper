import { AIService, AIAnalysisResult } from './types';

export class QwenService implements AIService {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'qwen3-vl-flash') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async analyzeImage(imageBase64: string, prompt?: string): Promise<AIAnalysisResult> {
    try {
      const defaultPrompt = `
        Please analyze this image. 
        If it contains Japanese text, please:
        1. Transcribe the Japanese text.
        2. Provide a translation.
        3. Break down the sentence structure and explain key vocabulary.
      `;

      const promptText = prompt || defaultPrompt;

      console.log('Qwen Request via Main Process:', this.model);

      // Call Main process to avoid CORS and handle Proxy
      const result = await window.api.analyzeImageQwen(this.apiKey, this.model, promptText, imageBase64);
      
      return result;

    } catch (error) {
      console.error('Qwen Analysis Failed:', error);
      throw error;
    }
  }
}
