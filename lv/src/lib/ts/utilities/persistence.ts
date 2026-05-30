// Remembers small bits of sidebar state across a full page reload, using the
// browser's local storage. Each read takes a fallback so a fresh visitor (or a
// browser with storage turned off) still gets a sensible default.

const SIDEBAR_VISIBLE_KEY = 'lv.sidebar.visible';
const FOLDER_OPEN_PREFIX = 'lv.folder.open.';

function readFlag(key: string, fallback: boolean): boolean {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : saved === 'true';
  } catch {
    return fallback;
  }
}

function writeFlag(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Storage unavailable — nothing to remember, carry on.
  }
}

export function loadSidebarVisible(fallback: boolean): boolean {
  return readFlag(SIDEBAR_VISIBLE_KEY, fallback);
}

export function saveSidebarVisible(visible: boolean): void {
  writeFlag(SIDEBAR_VISIBLE_KEY, visible);
}

export function loadFolderOpen(folder: string, fallback: boolean): boolean {
  return readFlag(FOLDER_OPEN_PREFIX + folder, fallback);
}

export function saveFolderOpen(folder: string, open: boolean): void {
  writeFlag(FOLDER_OPEN_PREFIX + folder, open);
}
