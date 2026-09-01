// Tests for writing a caption into a picture, per `notes/work/photo gallery.md`:
// a PNG carries it in a `tEXt` chunk keyed "Title", a JPEG in an XMP block, and
// anything else is refused. What is written must be what `plugins/photo-titles.ts`
// reads back.

import { describe, it, expect } from 'vitest';
import { deflateSync, crc32 } from 'node:zlib';
import { stamp, stampPng, stampJpeg, stampGif, gifComment, canHoldACaption } from '../../../../plugins/stamp';

// The smallest real PNG: the signature, a header chunk, one pixel, and the end.
function tinyPng(): Buffer {
  const chunk = (kind: string, body: Buffer) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.length);
    const named = Buffer.concat([Buffer.from(kind, 'ascii'), body]);
    const check = Buffer.alloc(4);
    check.writeUInt32BE(crc32(named) >>> 0);
    return Buffer.concat([length, named, check]);
  };
  const head = Buffer.alloc(13);
  head.writeUInt32BE(1, 0);
  head.writeUInt32BE(1, 4);
  head[8] = 8; head[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', head),
    chunk('IDAT', deflateSync(Buffer.from([0, 0, 0, 0]))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// A JPEG's bones: the start, one empty segment, the picture, the end.
function tinyJpeg(): Buffer {
  return Buffer.from([0xff, 0xd8, 0xff, 0xfe, 0x00, 0x04, 0x00, 0x00, 0xff, 0xda, 0x00, 0x02, 0x00, 0xff, 0xd9]);
}

// A whole GIF, one pixel wide: the header, the screen, a two-colour table, one
// picture, and the end.
function tinyGif(): Buffer {
  return Buffer.from([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61,             // GIF89a
    0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00,       // one by one, a colour table of two
    0x00, 0x00, 0x00, 0xff, 0xff, 0xff,             // the two colours
    0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,   // the picture
    0x02, 0x02, 0x44, 0x01, 0x00,                   // its bytes, then the closing zero
    0x3b,                                            // the end
  ]);
}

describe('what can carry a caption', () => {
  it('takes a png, a jpeg and a gif', () => {
    expect(canHoldACaption('rows.png')).toBe(true);
    expect(canHoldACaption('rows.JPG')).toBe(true);
    expect(canHoldACaption('rows.jpeg')).toBe(true);
    expect(canHoldACaption('rows.gif')).toBe(true);
  });

  it('takes a movie, whose own shape decides the rest', () => {
    expect(canHoldACaption('yo bro.mov')).toBe(true);
    expect(canHoldACaption('yo bro.mp4')).toBe(true);
  });

  it('refuses everything else', () => {
    expect(canHoldACaption('rows.HEIC')).toBe(false);
    expect(() => stamp('rows.HEIC', tinyPng(), 'x')).toThrow(/png, jpeg, gif and movies/);
  });
});

describe('writing a caption into a gif', () => {
  const stamped = stampGif(tinyGif(), 'Zoogilly boogley');

  it('keeps it a gif, whole', () => {
    expect(stamped.toString('ascii', 0, 6)).toBe('GIF89a');
    expect(stamped[stamped.length - 1]).toBe(0x3b);
    // Every byte of the original is still there, with the comment written in.
    expect(stamped.length).toBeGreaterThan(tinyGif().length);
  });

  it('reads the caption back', () => {
    expect(gifComment(stamped)).toBe('Zoogilly boogley');
  });

  it('leaves one caption behind, never two', () => {
    const twice = stampGif(stamped, 'Rows in June');
    expect(gifComment(twice)).toBe('Rows in June');
    expect(twice.toString('latin1')).not.toContain('Zoogilly boogley');
  });

  it('says nothing for a gif carrying none', () => {
    expect(gifComment(tinyGif())).toBeNull();
  });

  it('carries a caption longer than one piece', () => {
    const long = 'the vineyard '.repeat(40).trim();
    expect(gifComment(stampGif(tinyGif(), long))).toBe(long);
  });
});

describe('writing a caption into a png', () => {
  const stamped = stampPng(tinyPng(), 'Morning fog over the rows');

  it('keeps it a png', () => {
    expect(stamped.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    expect(stamped.subarray(-12).toString('ascii', 4, 8)).toBe('IEND');
  });

  it('holds the caption under the key photo-titles reads', () => {
    const words = stamped.toString('latin1');
    expect(words).toContain('tEXt');
    expect(words).toContain('Title\0Morning fog over the rows');
  });

  it('leaves one caption behind, never two', () => {
    const twice = stampPng(stamped, 'Rows in June');
    const words = twice.toString('latin1');
    expect(words).toContain('Title\0Rows in June');
    expect(words).not.toContain('Morning fog over the rows');
  });
});

describe('writing a caption into a jpeg', () => {
  const stamped = stampJpeg(tinyJpeg(), 'Tom at the crush pad');

  it('keeps it a jpeg', () => {
    expect(stamped[0]).toBe(0xff);
    expect(stamped[1]).toBe(0xd8);
    expect(stamped.subarray(-2)).toEqual(Buffer.from([0xff, 0xd9]));
  });

  it('holds the caption where exifr looks for a title', () => {
    const words = stamped.toString('latin1');
    expect(words).toContain('http://ns.adobe.com/xap/1.0/');
    expect(words).toContain('<dc:title>');
    expect(words).toContain('Tom at the crush pad');
  });

  it('leaves one caption behind, never two', () => {
    const twice = stampJpeg(stamped, 'Harvest, 2021');
    const words = twice.toString('latin1');
    expect(words).toContain('Harvest, 2021');
    expect(words).not.toContain('Tom at the crush pad');
  });

  it('writes the ampersand and the angle brackets so the block still reads', () => {
    const odd = stampJpeg(tinyJpeg(), 'Tom & <Haley>').toString('latin1');
    expect(odd).toContain('Tom &amp; &lt;Haley&gt;');
  });
});
