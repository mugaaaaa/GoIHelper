import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getPrompts: () => ipcRenderer.invoke('get-prompts'),
  addPrompt: (name: string, content: string) => ipcRenderer.invoke('add-prompt', name, content),
  updatePrompt: (id: number, name: string, content: string) => ipcRenderer.invoke('update-prompt', id, name, content),
  deletePrompt: (id: number) => ipcRenderer.invoke('delete-prompt', id),
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
