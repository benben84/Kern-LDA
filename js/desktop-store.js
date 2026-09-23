export function createMemoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial).map(([key, value]) => [key, String(value)]));
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    dump() {
      return Object.fromEntries(data);
    },
  };
}

export async function openDesktopStore() {
  const api = globalThis.kernDesktop;
  if (!api) return null;
  const saved = await api.loadState();
  const storage = createMemoryStorage(saved && typeof saved === "object" ? saved : {});
  const write = storage.setItem.bind(storage);
  storage.setItem = (key, value) => {
    write(key, value);
    api.saveState(storage.dump());
  };
  storage.dataDir = await api.dataDir();
  storage.saveFile = (folder, filename, bytes) => api.saveFile(folder, filename, bytes);
  storage.readTemplate = (name) => api.readTemplate(name);
  return storage;
}
