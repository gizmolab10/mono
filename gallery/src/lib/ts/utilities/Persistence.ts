// Remembers small bits of sidebar state across a full page reload, using the
// browser's local storage. Each read takes a fallback so a fresh visitor (or a
// browser with storage turned off) still gets a sensible default.

const SIDEBAR_VISIBLE_KEY = 'gallery.sidebar.visible';
const TECHNICAL_KEY = 'gallery.technical';
const EDITING_KEY = 'gallery.editing';
const PASS_KEY = 'gallery.pass';
const FOLDER_OPEN_PREFIX = 'gallery.folder.open.';

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

// What this browser says about editing, in three answers:
//   nothing   the preference was never set — this browser only reads
//   false     the files and their captions can be seen and typed into
//   true      a file may also be added
// Set by hand: localStorage.setItem('gallery.technical', 'true')
export function loadTechnical(): boolean | null {
  try {
    const saved = localStorage.getItem(TECHNICAL_KEY);
    return saved === null ? null : saved === 'true';
  } catch {
    return null;
  }
}

export function saveTechnical(technical: boolean): void {
  writeFlag(TECHNICAL_KEY, technical);
}

// Whether editing was on when the page last went around. Writing a caption
// sends the page around again, and dropping out of editing each time would make
// a run of captions unworkable.
export function loadEditing(fallback = false): boolean {
  return readFlag(EDITING_KEY, fallback);
}

export function saveEditing(editing: boolean): void {
  writeFlag(EDITING_KEY, editing);
}

// The word the published site asks for before it writes anything. Typed once,
// remembered in this browser, and never in the code.
export function loadPass(): string {
  try {
    return localStorage.getItem(PASS_KEY) ?? '';
  } catch {
    return '';
  }
}

export function savePass(pass: string): void {
  try {
    localStorage.setItem(PASS_KEY, pass);
  } catch {
    // Storage unavailable — the word is asked for again next time.
  }
}

export function loadFolderOpen(folder: string, fallback: boolean): boolean {
  return readFlag(FOLDER_OPEN_PREFIX + folder, fallback);
}

export function saveFolderOpen(folder: string, open: boolean): void {
  writeFlag(FOLDER_OPEN_PREFIX + folder, open);
}
