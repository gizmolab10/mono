// Tests for the borrowed icon shapes: each returns drawing instructions for a
// closed shape, starting with a move and ending with a close.

import { describe, it, expect } from 'vitest';
import { hamburger, fatTriangle } from '../utilities/icons';

describe('menu mark', () => {
  const d = hamburger(32);

  it('returns a non-empty path', () => {
    expect(d.length).toBeGreaterThan(0);
    expect(d.startsWith('M')).toBe(true);
  });

  it('draws three separate bars', () => {
    expect((d.match(/M/g) ?? []).length).toBe(3);
    expect((d.match(/Z/g) ?? []).length).toBe(3);
  });
});

describe('fat triangle', () => {
  const d = fatTriangle(24);

  it('returns one closed shape', () => {
    expect(d.startsWith('M')).toBe(true);
    expect(d.trimEnd().endsWith('Z')).toBe(true);
    expect((d.match(/Z/g) ?? []).length).toBe(1);
  });

  it('has three rounded corners', () => {
    expect((d.match(/C/g) ?? []).length).toBe(3);
  });
});
