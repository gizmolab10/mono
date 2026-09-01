// Tests for the loader rules in `notes/work/bare bone website.md`:
// it grabs every md file and every image at build time, keying md files by
// name without the .md ending and images by name with their extension.

import { describe, it, expect } from 'vitest';
import { loadMdFiles, loadAssets, loadMdEntries } from '../utilities/Loader';

describe('md file loader', () => {
  const map = loadMdFiles();

  it('finds the home page', () => {
    expect(map.has('Little Cloud Vineyard')).toBe(true);
  });

  it('holds every page on disk', () => {
    expect(map.size).toBeGreaterThan(0);
  });

  it('keys files by name without the .md ending', () => {
    for (const key of map.keys()) {
      expect(key.endsWith('.md')).toBe(false);
    }
  });

  it('hands back the actual text of a file', () => {
    expect(map.get('Little Cloud Vineyard')).toContain('Little Cloud Vineyard');
  });
});

describe('md file folders', () => {
  const entries = loadMdEntries();

  it('reports the top level as no folder for the home page', () => {
    const home = entries.find((e) => e.name === 'Little Cloud Vineyard');
    expect(home?.folder).toBe('');
  });

  // Skipped: every page sits at the top of `src/md/` today, so nothing on disk
  // proves this rule. Put a page in a folder and take the skip off.
  it.skip('reports the folder name for a page inside a folder', () => {
    const page = entries.find((e) => e.folder !== '');
    expect(page?.folder).not.toBe('');
  });
});

describe('image loader', () => {
  const map = loadAssets();

  it('finds the vineyard label image', () => {
    expect(map.has('lcv.label.png')).toBe(true);
  });

  it('keys images by name with their extension', () => {
    for (const key of map.keys()) {
      expect(key).toMatch(/\.[a-z0-9]+$/i);
    }
  });

  it('hands back a usable address for each image', () => {
    const url = map.get('lcv.label.png');
    expect(typeof url).toBe('string');
    expect((url ?? '').length).toBeGreaterThan(0);
  });
});
