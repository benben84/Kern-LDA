import { app, BrowserWindow, Menu, ipcMain, shell } from "electron";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TEMPLATES, isAllowedReference, matterFolderName, resolveInside, safeFileName } from "../js/paths.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stateName = "matters.json";

let dataDir = "";

function desktopDataDir() {
  if (process.env.KERN_LDA_DIR) return path.resolve(process.env.KERN_LDA_DIR);
  return path.join(app.getPath("documents"), "Kern-LDA");
}

function readState() {
  try {
    const raw = readFileSync(resolveInside(dataDir, stateName), "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    if (error && error.code === "ENOENT") return {};
    throw error;
  }
}

function writeState(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw new Error("The matter file on this computer could not be saved.");
  }
  mkdirSync(dataDir, { recursive: true });
  const dest = resolveInside(dataDir, stateName);
  const tmp = `${dest}.tmp`;
  writeFileSync(tmp, JSON.stringify(state));
  renameSync(tmp, dest);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1180,
    height: 860,
    minWidth: 800,
    minHeight: 640,
    title: "Kern LDA",
    backgroundColor: "#f3efe6",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(root, "desktop", "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedReference(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("file:")) return;
    event.preventDefault();
    if (isAllowedReference(url)) shell.openExternal(url);
  });

  win.webContents.session.webRequest.onBeforeRequest({ urls: ["http://*/*", "https://*/*"] }, (_details, callback) => {
    callback({ cancel: true });
  });

  win.loadFile(path.join(root, "index.html"));
  return win;
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const open = BrowserWindow.getAllWindows()[0];
    if (!open) return;
    if (open.isMinimized()) open.restore();
    open.focus();
  });

  app.whenReady().then(() => {
  dataDir = desktopDataDir();
  mkdirSync(dataDir, { recursive: true });
  Menu.setApplicationMenu(null);

  ipcMain.handle("app:data-dir", () => dataDir);
  ipcMain.handle("state:load", () => readState());
  ipcMain.on("state:save-sync", (event, state) => {
    try {
      writeState(state);
      event.returnValue = true;
    } catch (error) {
      console.error(error);
      event.returnValue = false;
    }
  });
  ipcMain.handle("template:read", (_event, name) => {
    if (!TEMPLATES.has(name)) throw new Error("That form is not stored with this app.");
    return readFileSync(resolveInside(root, name));
  });
  ipcMain.handle("file:save", (_event, folder, filename, bytes) => {
    const dir = resolveInside(dataDir, matterFolderName(folder));
    const dest = resolveInside(dir, safeFileName(filename));
    mkdirSync(dir, { recursive: true });
    writeFileSync(dest, Buffer.from(bytes));
    return dest;
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
