// Tests for a caption inside a movie, per `notes/work/photo gallery.md`: it is
// written into a `©nam` block inside the movie's description, and only where
// that description is the last block in the file.
//
// The made-up movies here are real in shape — the same blocks, in the same
// order — so the walk is proved without a fifty-megabyte file.

import { describe, it, expect } from 'vitest';
import { blocksIn, isMovieFile, movieTakesACaption, movieTitle, stampMovie } from '../../../../plugins/movie-title';

// One block: four bytes of length, four letters of name, then its body.
function block(kind: string, body: Buffer): Buffer {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length + 8, 0);
  head.write(kind, 4, 'latin1');
  return Buffer.concat([head, body]);
}

// A movie shaped the way an iPhone writes one: the picture data first, the
// description last.
function movieDescriptionLast(): Buffer {
  return Buffer.concat([
    block('ftyp', Buffer.from('qt  ', 'latin1')),
    block('mdat', Buffer.alloc(64, 7)),
    block('moov', Buffer.concat([block('mvhd', Buffer.alloc(100)), block('trak', Buffer.alloc(40))])),
  ]);
}

// A movie arranged to start playing before it has all arrived: the description
// first, the picture data after it.
function movieDescriptionFirst(): Buffer {
  return Buffer.concat([
    block('ftyp', Buffer.from('mp42', 'latin1')),
    block('moov', block('mvhd', Buffer.alloc(100))),
    block('mdat', Buffer.alloc(64, 7)),
  ]);
}

describe('reading a movie', () => {
  it('knows a movie by its ending', () => {
    expect(isMovieFile('yo bro.mov')).toBe(true);
    expect(isMovieFile('yo bro.MP4')).toBe(true);
    expect(isMovieFile('rows.png')).toBe(false);
  });

  it('finds the blocks lying side by side', () => {
    expect(blocksIn(movieDescriptionLast()).map((one) => one.kind)).toEqual(['ftyp', 'mdat', 'moov']);
  });

  it('says nothing where the movie carries no title', () => {
    expect(movieTitle(movieDescriptionLast())).toBeNull();
  });
});

describe('which movies take a caption', () => {
  it('takes one where the description is last', () => {
    expect(movieTakesACaption(movieDescriptionLast())).toBe(true);
  });

  it('refuses one where the description comes first', () => {
    expect(movieTakesACaption(movieDescriptionFirst())).toBe(false);
    expect(() => stampMovie(movieDescriptionFirst(), 'x')).toThrow(/before its picture data/);
  });
});

describe('writing a caption into a movie', () => {
  const stamped = stampMovie(movieDescriptionLast(), 'Yo bro, in the rows');

  it('reads the caption back', () => {
    expect(movieTitle(stamped)).toBe('Yo bro, in the rows');
  });

  it('leaves the picture data exactly where it was', () => {
    const was = blocksIn(movieDescriptionLast()).find((one) => one.kind === 'mdat')!;
    const now = blocksIn(stamped).find((one) => one.kind === 'mdat')!;
    expect(now.at).toBe(was.at);
    expect(now.length).toBe(was.length);
  });

  it('keeps every other block inside the description', () => {
    const moov = blocksIn(stamped).find((one) => one.kind === 'moov')!;
    const inside = blocksIn(stamped, moov.body, moov.at + moov.length).map((one) => one.kind);
    expect(inside).toEqual(['mvhd', 'trak', 'udta']);
  });

  it('leaves one caption behind, never two', () => {
    const twice = stampMovie(stamped, 'Rows in June');
    expect(movieTitle(twice)).toBe('Rows in June');
    const moov = blocksIn(twice).find((one) => one.kind === 'moov')!;
    const inside = blocksIn(twice, moov.body, moov.at + moov.length).filter((one) => one.kind === 'udta');
    expect(inside).toHaveLength(1);
  });
});
