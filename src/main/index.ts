import { app, shell, BrowserWindow, ipcMain, desktopCapturer, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { DBManager } from './db'
import axios from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'

let win: BrowserWindow | null = null
let db: DBManager | null = null;
let currentProxyPort: string | null = null;

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    frame: false,
    titleBarStyle: 'hidden',
    show: true,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // keep a reference to the window so IPC handlers can control it
  win = mainWindow

  mainWindow.on('closed', () => {
    // clear the reference when the window is closed
    win = null
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')
  
  // Initialize Database
  db = new DBManager();

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('screen-shot', async () => {
    // Hide window if it exists
    if (win) {
      win.hide()
      // Wait a bit for the window to disappear (animation etc)
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    })
    
    // Show window again
    if (win) {
      win.show()
    }

    return sources[0].thumbnail.toDataURL()
  })

  // Prompt IPC Handlers
  ipcMain.handle('get-prompts', () => {
    return db?.getAllPrompts() || [];
  });

  ipcMain.handle('add-prompt', (_, name: string, content: string) => {
    return db?.addPrompt(name, content);
  });

  ipcMain.handle('update-prompt', (_, id: number, name: string, content: string) => {
    return db?.updatePrompt(id, name, content);
  });

  ipcMain.handle('delete-prompt', (_, id: number) => {
    return db?.deletePrompt(id);
  });

  // Vocabulary IPC Handlers
  ipcMain.handle('get-books', () => {
    return db?.getBooks() || [];
  });

  ipcMain.handle('create-book', (_, name: string, description?: string) => {
    return db?.createBook(name, description);
  });

  ipcMain.handle('delete-book', (_, id: number) => {
    return db?.deleteBook(id);
  });

  ipcMain.handle('get-words', (_, bookId: number) => {
    return db?.getWords(bookId) || [];
  });

  ipcMain.handle('add-word', (_, bookId: number, word: string, reading?: string, meaning?: string, note?: string) => {
    return db?.addWord(bookId, word, reading, meaning, note);
  });

  ipcMain.handle('update-word', (_, id: number, word: string, reading?: string, meaning?: string, note?: string) => {
    return db?.updateWord(id, word, reading, meaning, note);
  });

  ipcMain.handle('delete-word', (_, id: number) => {
    return db?.deleteWord(id);
  });

  // Grammar IPC Handlers
  ipcMain.handle('get-grammar-books', () => {
    return db?.getGrammarBooks() || [];
  });

  ipcMain.handle('create-grammar-book', (_, name: string, description?: string) => {
    return db?.createGrammarBook(name, description);
  });

  ipcMain.handle('delete-grammar-book', (_, id: number) => {
    return db?.deleteGrammarBook(id);
  });

  ipcMain.handle('get-grammar-items', (_, bookId: number) => {
    return db?.getGrammarItems(bookId) || [];
  });

  ipcMain.handle('add-grammar-item', (_, bookId: number, grammar: string, reading?: string, structure?: string, meaning?: string, context?: string, examples?: string, note?: string) => {
    return db?.addGrammarItem(bookId, grammar, reading, structure, meaning, context, examples, note);
  });

  ipcMain.handle('update-grammar-item', (_, id: number, grammar: string, reading?: string, structure?: string, meaning?: string, context?: string, examples?: string, note?: string) => {
    return db?.updateGrammarItem(id, grammar, reading, structure, meaning, context, examples, note);
  });

  ipcMain.handle('delete-grammar-item', (_, id: number) => {
    return db?.deleteGrammarItem(id);
  });

  ipcMain.handle('set-proxy', async (_, port: string) => {
    currentProxyPort = port;
    if (win) {
      const proxyRules = port ? `http=127.0.0.1:${port};https=127.0.0.1:${port}` : '';
      await win.webContents.session.setProxy({ proxyRules });
    }
  });

  ipcMain.handle('analyze-image-qwen', async (_, apiKey: string, model: string, prompt: string, imageBase64: string) => {
    try {
      const agent = currentProxyPort ? new HttpsProxyAgent(`http://127.0.0.1:${currentProxyPort}`) : undefined;
      
      let dataUri = imageBase64;
      if (!imageBase64.startsWith('data:')) {
        dataUri = `data:image/png;base64,${imageBase64}`;
      }

      const response = await axios.post(
        'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        {
          model: model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: dataUri } }
              ]
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          httpsAgent: agent,
          proxy: false // Important for axios with custom agent
        }
      );

      return { text: response.data.choices[0].message.content, raw: response.data };
    } catch (error: any) {
      console.error('Qwen Analysis Failed (Main Process):', error.message);
      if (error.response) {
        console.error('Data:', JSON.stringify(error.response.data));
        throw new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  });

  ipcMain.handle('analyze-text-qwen', async (_, apiKey: string, model: string, prompt: string, text: string) => {
    try {
      const agent = currentProxyPort ? new HttpsProxyAgent(`http://127.0.0.1:${currentProxyPort}`) : undefined;
      
      let messages;
      if (model.includes('vl')) {
        messages = [
          {
            role: "system",
            content: prompt
          },
          {
            role: "user",
            content: [
              { type: "text", text: text }
            ]
          }
        ];
      } else {
        messages = [
          {
            role: "system",
            content: prompt
          },
          {
            role: "user",
            content: text
          }
        ];
      }

      const response = await axios.post(
        'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        {
          model: model,
          messages: messages
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          httpsAgent: agent,
          proxy: false
        }
      );

      return { text: response.data.choices[0].message.content, raw: response.data };
    } catch (error: any) {
      console.error('Qwen Text Analysis Failed (Main Process):', error.message);
      if (error.response) {
        console.error('Data:', JSON.stringify(error.response.data));
        throw new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  });

  ipcMain.handle('analyze-text-deepseek', async (_, apiKey: string, model: string, prompt: string, text: string) => {
    try {
      const agent = currentProxyPort ? new HttpsProxyAgent(`http://127.0.0.1:${currentProxyPort}`) : undefined;
      
      const response = await axios.post(
        'https://api.deepseek.com/chat/completions',
        {
          model: model,
          messages: [
            {
              role: "system",
              content: prompt
            },
            {
              role: "user",
              content: text
            }
          ],
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          httpsAgent: agent,
          proxy: false
        }
      );

      return { text: response.data.choices[0].message.content, raw: response.data };
    } catch (error: any) {
      console.error('DeepSeek Analysis Failed (Main Process):', error.message);
      if (error.response) {
        console.error('Data:', JSON.stringify(error.response.data));
        throw new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  });

  // Register global shortcut handler
  ipcMain.handle('set-global-shortcut', (_, shortcut: string) => {
    // Unregister existing shortcuts to avoid conflicts or duplicates
    globalShortcut.unregisterAll();
    
    if (!shortcut) return true; // Just unregister if empty

    try {
      const ret = globalShortcut.register(shortcut, async () => {
        if (win) {
          if (win.isMinimized()) win.restore();
          win.focus();
          
          // Take screenshot
          win.hide(); // Briefly hide to take screenshot
          setTimeout(async () => {
              try {
                  const sources = await desktopCapturer.getSources({
                      types: ['screen'],
                      thumbnailSize: { width: 1920, height: 1080 }
                  });
                  if (win) {
                      win.show();
                      const image = sources[0].thumbnail.toDataURL();
                      win.webContents.send('auto-analyze-screenshot', image);
                  }
              } catch (e) {
                  console.error('Failed to take screenshot via shortcut:', e);
                  if (win) win.show();
              }
          }, 300); // Wait for hide animation
        }
      });

      if (!ret) {
        console.error('Registration failed for shortcut:', shortcut);
        return false;
      }
      console.log('Global shortcut registered:', shortcut);
      return true;
    } catch (error) {
      console.error('Error registering shortcut:', error);
      return false;
    }
  });

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('window-min', () => {
  if (win) win.minimize()
})

ipcMain.on('window-max', () => {
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  }
})

ipcMain.on('window-close', () => {
  if (win) win.close()
})
