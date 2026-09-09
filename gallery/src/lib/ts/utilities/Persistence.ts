// Remembers small bits of sidebar state across a full page reload, using the
// browser's local storage. Each read takes a fallback so a fresh visitor (or a
// browser with storage turned off) still gets a sensible default.
//
// The way to read and write is core's. What is gallery's: the keys. The prefix every
// one is saved under is the host's, read from its switches the first time anything is
// remembered — after the host has set them, never while this file loads.

import { customizations } from '../common/Customizations';
import { Preferences } from '../common/Core';

let held: Preferences | null = null;

function preferences(): Preferences {
  if (held === null) { held = new Preferences(customizations.prefix); }
  return held;
}

const SIDEBAR_VISIBLE_KEY = 'sidebar.visible';
const TECHNICAL_KEY = 'technical';
const EDITING_KEY = 'editing';
const PASS_KEY = 'pass';
const FOLDER_OPEN_PREFIX = 'folder.open.';

function readFlag(key: string, fallback: boolean): boolean {
  const saved = preferences().read_text(key);
  return saved === null ? fallback : saved === 'true';
}

function writeFlag(key: string, value: boolean): void {
  preferences().write_text(key, String(value));
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
// Set by hand, under the host's prefix: localStorage.setItem('gallery.technical', 'true')
export function loadTechnical(): boolean | null {
  const saved = preferences().read_text(TECHNICAL_KEY);
  return saved === null ? null : saved === 'true';
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
  return preferences().read_text(PASS_KEY) ?? '';
}

export function savePass(pass: string): void {
  preferences().write_text(PASS_KEY, pass);
}

export function loadFolderOpen(folder: string, fallback: boolean): boolean {
  return readFlag(FOLDER_OPEN_PREFIX + folder, fallback);
}

export function saveFolderOpen(folder: string, open: boolean): void {
  writeFlag(FOLDER_OPEN_PREFIX + folder, open);
}
