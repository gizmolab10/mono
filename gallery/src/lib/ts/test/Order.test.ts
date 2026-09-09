// Tests for the rules in `notes/work/editing the published site.md` — Reorder.
// The order belongs to the folder, in one list; a file's line is its place.

import { describe, it, expect } from 'vitest';
import { inOrder, moved, namesInOrder, orderText } from '../utilities/Order';

describe('reading a list', () => {
  it('takes the names in the order they are written', () => {
    expect(namesInOrder('b.png\na.png\n')).toEqual(['b.png', 'a.png']);
  });

  it('passes over blank lines and lines written for a reader', () => {
    expect(namesInOrder('# the order\n\nb.png\n\na.png\n')).toEqual(['b.png', 'a.png']);
  });

  it('reads back what it writes', () => {
    expect(namesInOrder(orderText(['b.png', 'a.png']))).toEqual(['b.png', 'a.png']);
  });
});

describe('putting a folder in order', () => {
  const photos = [{ name: 'a.png' }, { name: 'b.png' }, { name: 'c.png' }];

  it('follows the list', () => {
    expect(inOrder(photos, ['c.png', 'a.png', 'b.png']).map((one) => one.name))
      .toEqual(['c.png', 'a.png', 'b.png']);
  });

  it('puts a file the list does not name at the end, by file name', () => {
    expect(inOrder(photos, ['c.png']).map((one) => one.name)).toEqual(['c.png', 'a.png', 'b.png']);
  });

  it('leaves out a name the folder no longer holds', () => {
    expect(inOrder(photos, ['gone.png', 'b.png']).map((one) => one.name))
      .toEqual(['b.png', 'a.png', 'c.png']);
  });

  it('keeps file-name order where there is no list at all', () => {
    expect(inOrder(photos, []).map((one) => one.name)).toEqual(['a.png', 'b.png', 'c.png']);
  });

  it('names a file once, however many times the list says it', () => {
    expect(inOrder(photos, ['b.png', 'b.png']).map((one) => one.name))
      .toEqual(['b.png', 'a.png', 'c.png']);
  });
});

describe('moving one file', () => {
  const names = ['a.png', 'b.png', 'c.png'];

  it('swaps it with the one below, and the place follows the file', () => {
    expect(moved(names, 0, 1)).toEqual({ names: ['b.png', 'a.png', 'c.png'], at: 1 });
  });

  it('swaps it with the one above', () => {
    expect(moved(names, 2, -1)).toEqual({ names: ['a.png', 'c.png', 'b.png'], at: 1 });
  });

  it('past either end, goes in at the other end and the rest shift one place', () => {
    expect(moved(names, 2, 1)).toEqual({ names: ['c.png', 'a.png', 'b.png'], at: 0 });
    expect(moved(names, 0, -1)).toEqual({ names: ['b.png', 'c.png', 'a.png'], at: 2 });
  });

  it('swaps, never shifts, between two files', () => {
    expect(moved(['a.png', 'b.png'], 1, 1)).toEqual({ names: ['b.png', 'a.png'], at: 0 });
    expect(moved(['a.png', 'b.png'], 0, -1)).toEqual({ names: ['b.png', 'a.png'], at: 1 });
  });

  it('does nothing to a folder holding one file, or none', () => {
    expect(moved(['a.png'], 0, 1)).toEqual({ names: ['a.png'], at: 0 });
    expect(moved([], 0, 1)).toEqual({ names: [], at: 0 });
  });
});
