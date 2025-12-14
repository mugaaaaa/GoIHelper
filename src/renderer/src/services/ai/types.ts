export interface AIAnalysisResult {
  text: string;
  raw?: any;
}

export interface AIService {
  analyzeImage(imageBase64: string, prompt?: string): Promise<AIAnalysisResult>;
}
