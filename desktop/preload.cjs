const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("kernDesktop", {
  loadState() {
    return ipcRenderer.invoke("state:load");
  },
  saveState(state) {
    return ipcRenderer.sendSync("state:save-sync", state);
  },
  readTemplate(name) {
    return ipcRenderer.invoke("template:read", name);
  },
  saveFile(folder, filename, bytes) {
    return ipcRenderer.invoke("file:save", folder, filename, bytes);
  },
  dataDir() {
    return ipcRenderer.invoke("app:data-dir");
  },
});
