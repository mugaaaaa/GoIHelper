import { AIService, AIAnalysisResult } from './types';

export class DeepSeekService implements AIService {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'deepseek-chat') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async analyzeImage(_imageBase64: string, _prompt?: string): Promise<AIAnalysisResult> {
    throw new Error('DeepSeek does not support image analysis directly yet.');
  }

  async analyzeText(text: string, prompt?: string): Promise<AIAnalysisResult> {
    try {
      const defaultPrompt = `
        Please analyze this text. 
        If it contains Japanese text, please:
        1. Transcribe the Japanese text (if needed).
        2. Provide a translation.
        3. Break down the sentence structure and explain key vocabulary.
      `;

      const promptText = prompt || defaultPrompt;
      console.log('DeepSeek Analysis via Main Process:', this.model);

      const result = await window.api.analyzeTextDeepSeek(this.apiKey, this.model, promptText, text);

      return result;
    } catch (error) {
      console.error('DeepSeek Analysis Failed:', error);
      throw error;
    }
  }
}
