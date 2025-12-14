import { app, shell, BrowserWindow, ipcMain, desktopCapturer } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { DBManager } from './db'

let win: BrowserWindow | null = null
let db: DBManager | null = null;

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
