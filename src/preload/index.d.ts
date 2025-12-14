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
      deleteWord: (id: number) => Promise<void>
    }
    electronAPI: {
      minimize: () => void
      maximize: () => void
      close: () => void
    }
  }
}
