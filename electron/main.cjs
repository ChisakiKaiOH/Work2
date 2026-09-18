const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// "npm run prepare:assets" copia backend/src e frontend/dist dentro questa
// cartella prima sia in sviluppo che in fase di packaging (vedi scripts/prepare.mjs),
// cosi' il layout e' identico nei due casi e i moduli del backend risolvono le
// dipendenze da electron/node_modules (compilato per l'ABI di Electron).
const ROOT = __dirname;

let mainWindow;
let backendPort;

// Il sandbox di Chromium richiede privilegi che root non ha: necessario solo
// per test in container/CI eseguiti come root, innocuo per un utente normale.
if (process.platform === 'linux' && process.getuid && process.getuid() === 0) {
  app.commandLine.appendSwitch('no-sandbox');
}

function resolveResourcePath(...segments) {
  return path.join(ROOT, ...segments);
}

async function startBackend() {
  process.env.SHIE_DATA_DIR = path.join(app.getPath('userData'), 'data');
  process.env.PORT = process.env.PORT || '4317';
  process.env.HOST = '127.0.0.1';

  const backendEntry = resolveResourcePath('backend', 'src', 'index.js');
  const { startServer } = await import(pathToFileURL(backendEntry).href);
  const { port } = await startServer();
  backendPort = port;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    title: 'Shie Hassaikai Application',
    icon: resolveResourcePath('frontend', 'public', 'icons', 'icon-512.png'),
    backgroundColor: '#000000',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(`http://127.0.0.1:${backendPort}/`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await startBackend();
    createWindow();
  } catch (err) {
    console.error('Avvio backend fallito:', err);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
