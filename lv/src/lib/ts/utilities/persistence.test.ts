// @vitest-environment jsdom
//
// Tests for the persistence rules in `notes/work/code debt.md`:
// the sidebar remembers, across a full page reload, whether it is shown and
// which folders are open. Both are kept in the browser's local storage, and a
// fresh visitor falls back to a sensible default.

import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadSidebarVisible,
  saveSidebarVisible,
  loadFolderOpen,
  saveFolderOpen,
} from './persistence';

describe('sidebar shown state', () => {
  beforeEach(() => localStorage.clear());

  it('uses the fallback when nothing is saved', () => {
    expect(loadSidebarVisible(true)).toBe(true);
    expect(loadSidebarVisible(false)).toBe(false);
  });

  it('saves and reads back the shown state', () => {
    saveSidebarVisible(false);
    expect(loadSidebarVisible(true)).toBe(false);
    saveSidebarVisible(true);
    expect(loadSidebarVisible(false)).toBe(true);
  });
});

describe('folder open state', () => {
  beforeEach(() => localStorage.clear());

  it('uses the fallback when nothing is saved', () => {
    expect(loadFolderOpen('The Vineyard', true)).toBe(true);
    expect(loadFolderOpen('The Vineyard', false)).toBe(false);
  });

  it('remembers each folder by its own name', () => {
    saveFolderOpen('The Vineyard', false);
    saveFolderOpen('Photos', true);
    expect(loadFolderOpen('The Vineyard', true)).toBe(false);
    expect(loadFolderOpen('Photos', false)).toBe(true);
  });
});
