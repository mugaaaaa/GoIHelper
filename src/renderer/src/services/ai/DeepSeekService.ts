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
        请翻译并分析这段文本
        然后输出如下内容作为分隔符:

        ---GRAMMAR-JSON-START---

        请以JSON数组格式输出提取的语法点 (Grammar Items):
        [
          {
            "grammar": "语法点 (e.g. ～ようとしている)",
            "reading": "读音 (e.g. ～ようとしている)",
            "structure": "接续/结构 (e.g. 动词意志形 + としている)",
            "meaning": "意义 (e.g. 表示正试图做某事...)",
            "context": "上下文分析 (e.g. 这里表示...)",
            "examples": "例句 (e.g. 必死に...)",
            "note": "笔记 (Optional)"
          }
        ]

        然后输出如下内容作为分隔符:

        ---VOCAB-JSON-START---
        请以JSON数组格式输出提取的生词 (Vocabulary Words):
        [
          {
            "word": "单词 (e.g. 呟く)",
            "reading": "读音 (e.g. つぶやく)",
            "meaning": "意义 (e.g. 一个人喃喃自语...)",
            "note": "笔记/例句 (e.g. 自らの事情を...)"
          }
        ]
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
