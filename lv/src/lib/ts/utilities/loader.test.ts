// Tests for the loader rules in `notes/work/bare bone website.md`:
// it grabs every md file and every image at build time, keying md files by
// name without the .md ending and images by name with their extension.

import { describe, it, expect } from 'vitest';
import { loadMdFiles, loadAssets } from './loader';

describe('md file loader', () => {
  const map = loadMdFiles();

  it('finds the home page', () => {
    expect(map.has('Little Cloud Vineyard')).toBe(true);
  });

  it('finds the sidebar file', () => {
    expect(map.has('Sidebar')).toBe(true);
  });

  it('keys files by name without the .md ending', () => {
    for (const key of map.keys()) {
      expect(key.endsWith('.md')).toBe(false);
    }
  });

  it('hands back the actual text of a file', () => {
    expect(map.get('Sidebar')).toContain('under construction');
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
