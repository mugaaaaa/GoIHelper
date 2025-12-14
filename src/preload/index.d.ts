import { ElectronAPI } from '@electron-toolkit/preload'

export interface Prompt {
  id: number;
  name: string;
  content: string;
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getPrompts: () => Promise<Prompt[]>
      addPrompt: (name: string, content: string) => Promise<number>
      updatePrompt: (id: number, name: string, content: string) => Promise<void>
      deletePrompt: (id: number) => Promise<void>
    }
    electronAPI: {
      minimize: () => void
      maximize: () => void
      close: () => void
    }
  }
}
