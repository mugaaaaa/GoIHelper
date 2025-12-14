import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

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

// Custom APIs for renderer
const api = {
  getPrompts: () => ipcRenderer.invoke('get-prompts'),
  addPrompt: (name: string, content: string) => ipcRenderer.invoke('add-prompt', name, content),
  updatePrompt: (id: number, name: string, content: string) => ipcRenderer.invoke('update-prompt', id, name, content),
  deletePrompt: (id: number) => ipcRenderer.invoke('delete-prompt', id),

  // Vocabulary APIs
  getBooks: () => ipcRenderer.invoke('get-books'),
  createBook: (name: string, description?: string) => ipcRenderer.invoke('create-book', name, description),
  deleteBook: (id: number) => ipcRenderer.invoke('delete-book', id),
  getWords: (bookId: number) => ipcRenderer.invoke('get-words', bookId),
  addWord: (bookId: number, word: string, reading?: string, meaning?: string, note?: string) => ipcRenderer.invoke('add-word', bookId, word, reading, meaning, note),
  updateWord: (id: number, word: string, reading?: string, meaning?: string, note?: string) => ipcRenderer.invoke('update-word', id, word, reading, meaning, note),
  deleteWord: (id: number) => ipcRenderer.invoke('delete-word', id),
  setProxy: (port: string) => ipcRenderer.invoke('set-proxy', port),
  analyzeImageQwen: (apiKey: string, model: string, prompt: string, imageBase64: string) => ipcRenderer.invoke('analyze-image-qwen', apiKey, model, prompt, imageBase64),
  setGlobalShortcut: (shortcut: string) => ipcRenderer.invoke('set-global-shortcut', shortcut),
  onAutoAnalyzeScreenshot: (callback: (image: string) => void) => {
    const listener = (_event: any, image: string) => callback(image);
    ipcRenderer.on('auto-analyze-screenshot', listener);
    return () => ipcRenderer.removeListener('auto-analyze-screenshot', listener);
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('electronAPI', {
      minimize: () => ipcRenderer.send('window-min'),
      maximize: () => ipcRenderer.send('window-max'),
      close: () => ipcRenderer.send('window-close')
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
