import { ElectronAPI } from '@electron-toolkit/preload'

export interface Prompt {
  id: number;
  name: string;
  content: string;
}

export interface VocabularyBook {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface VocabularyWord {
  id: number;
  book_id: number;
  word: string;
  reading?: string;
  meaning?: string;
  note?: string;
  created_at: string;
}

export interface GrammarBook {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface GrammarItem {
  id: number;
  book_id: number;
  grammar: string;
  reading?: string;
  structure?: string;
  meaning?: string;
  context?: string;
  examples?: string;
  note?: string;
  created_at: string;
}

export interface AnalysisSet {
  id: number;
  name: string;
  type: 'image' | 'text';
  created_at: string;
}

export interface AnalysisRecord {
  id: number;
  set_id: number;
  title: string;
  original_content: string;
  ai_result: string;
  created_at: string;
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getPrompts: () => Promise<Prompt[]>
      addPrompt: (name: string, content: string) => Promise<number>
      updatePrompt: (id: number, name: string, content: string) => Promise<void>
      deletePrompt: (id: number) => Promise<void>

      getBooks: () => Promise<VocabularyBook[]>
      createBook: (name: string, description?: string) => Promise<number>
      deleteBook: (id: number) => Promise<void>
      getWords: (bookId: number) => Promise<VocabularyWord[]>
      addWord: (bookId: number, word: string, reading?: string, meaning?: string, note?: string) => Promise<number>
      updateWord: (id: number, word: string, reading?: string, meaning?: string, note?: string) => Promise<void>
      deleteWord: (id: number) => Promise<void>
      
      getGrammarBooks: () => Promise<GrammarBook[]>
      createGrammarBook: (name: string, description?: string) => Promise<number>
      deleteGrammarBook: (id: number) => Promise<void>
      getGrammarItems: (bookId: number) => Promise<GrammarItem[]>
      addGrammarItem: (bookId: number, grammar: string, reading?: string, structure?: string, meaning?: string, context?: string, examples?: string, note?: string) => Promise<number>
      updateGrammarItem: (id: number, grammar: string, reading?: string, structure?: string, meaning?: string, context?: string, examples?: string, note?: string) => Promise<void>
      deleteGrammarItem: (id: number) => Promise<void>

      getAnalysisSets: (type: 'image' | 'text') => Promise<AnalysisSet[]>
      createAnalysisSet: (name: string, type: 'image' | 'text') => Promise<number>
      deleteAnalysisSet: (id: number) => Promise<void>
      getAnalysisRecords: (setId: number) => Promise<AnalysisRecord[]>
      addAnalysisRecord: (setId: number, title: string, originalContent: string, aiResult: string) => Promise<number>
      deleteAnalysisRecord: (id: number) => Promise<void>

      setProxy: (port: string) => Promise<void>
      analyzeImageQwen: (apiKey: string, model: string, prompt: string, imageBase64: string) => Promise<{ text: string, raw: any }>
      analyzeTextQwen: (apiKey: string, model: string, prompt: string, text: string) => Promise<{ text: string, raw: any }>
      analyzeTextDeepSeek: (apiKey: string, model: string, prompt: string, text: string) => Promise<{ text: string, raw: any }>
      setGlobalShortcut: (shortcut: string) => Promise<boolean>
      onAutoAnalyzeScreenshot: (callback: (image: string) => void) => () => void
    }
    electronAPI: {
      minimize: () => void
      maximize: () => void
      close: () => void
    }
  }
}
