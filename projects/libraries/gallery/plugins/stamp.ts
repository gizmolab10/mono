// Writing a caption into a picture, so the title travels inside the file
// itself and `plugins/photo-titles.ts` finds it again on the next build.
//
// Three shapes, one per kind of file:
//   PNG   a `tEXt` chunk keyed "Title", written straight after the header.
//   JPEG  an XMP block holding `dc:title`, written as an APP1 segment straight
//         after the two-byte start.
//   GIF   a comment block, written after the header and the colour table.
//   MOV   a `©nam` block inside the movie's description — see `movie-title.ts`,
//         which also says which movies can take one at all.
//
// HEIC is refused: nothing here reads it.

import { isMovieFile, movieTakesACaption, stampMovie } from './movie-title';
import { crc32 } from 'node:zlib';

const PNG_HEAD = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// What a name says it can hold. A movie also has to be looked inside — see
// `movieTakesACaption` — since the answer depends on how that file is built.
export function canHoldACaption(name: string): boolean {
  return /\.(png|jpg|jpeg|gif)$/i.test(name) || isMovieFile(name);
}

// One PNG chunk: four bytes of length, four letters of kind, the body, and a
// four-byte check over the kind and the body together.
function chunk(kind: string, body: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(body.length);
  const named = Buffer.concat([Buffer.from(kind, 'ascii'), body]);
  const check = Buffer.alloc(4);
  check.writeUInt32BE(crc32(named) >>> 0);
  return Buffer.concat([length, named, check]);
}

export function stampPng(bytes: Buffer, caption: string): Buffer {
  if (!bytes.subarray(0, 8).equals(PNG_HEAD)) { throw new Error('not a PNG'); }
  const kept: Buffer[] = [bytes.subarray(0, 8)];
  let at = 8;
  while (at + 8 <= bytes.length) {
    const length = bytes.readUInt32BE(at);
    const kind = bytes.toString('ascii', at + 4, at + 8);
    const whole = bytes.subarray(at, at + 8 + length + 4);
    // An older title is dropped, so one file never answers with two.
    const isTitle = kind === 'tEXt' && bytes.toString('latin1', at + 8, at + 8 + 5).toLowerCase() === 'title';
    if (!isTitle) { kept.push(whole); }
    if (kind === 'IHDR') { kept.push(chunk('tEXt', Buffer.concat([Buffer.from('Title\0', 'latin1'), Buffer.from(caption, 'latin1')]))); }
    if (kind === 'IEND') { break; }
    at += 8 + length + 4;
  }
  return Buffer.concat(kept);
}

// The XMP an image carries: plain XML, wrapped in the marker Adobe settled on,
// which exifr reads as `dc:title`.
function xmpFor(caption: string): Buffer {
  const said = caption.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const xml =
    `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>` +
    `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">` +
    `<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">` +
    `<dc:title><rdf:Alt><rdf:li xml:lang="x-default">${said}</rdf:li></rdf:Alt></dc:title>` +
    `</rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>`;
  return Buffer.concat([Buffer.from('http://ns.adobe.com/xap/1.0/\0', 'latin1'), Buffer.from(xml, 'utf8')]);
}

export function stampJpeg(bytes: Buffer, caption: string): Buffer {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) { throw new Error('not a JPEG'); }
  const body = xmpFor(caption);
  const head = Buffer.alloc(4);
  head.writeUInt16BE(0xffe1, 0);          // APP1
  head.writeUInt16BE(body.length + 2, 2); // its own two bytes count
  // Anything already carrying XMP is passed over, so one file never answers twice.
  const rest = withoutXmp(bytes.subarray(2));
  return Buffer.concat([bytes.subarray(0, 2), head, body, rest]);
}

function withoutXmp(bytes: Buffer): Buffer {
  const kept: Buffer[] = [];
  let at = 0;
  while (at + 4 <= bytes.length) {
    if (bytes[at] !== 0xff) { break; }
    const kind = bytes[at + 1];
    if (kind === 0xda) { break; }   // the picture itself begins here
    const length = bytes.readUInt16BE(at + 2);
    const whole = bytes.subarray(at, at + 2 + length);
    const isXmp = kind === 0xe1 && bytes.toString('latin1', at + 4, at + 4 + 28).startsWith('http://ns.adobe.com/xap/1.0/');
    if (!isXmp) { kept.push(whole); }
    at += 2 + length;
  }
  kept.push(bytes.subarray(at));
  return Buffer.concat(kept);
}

// Where the blocks of a GIF begin: six bytes of header, seven describing the
// screen, and the colour table those seven ask for.
function gifBlocksAt(bytes: Buffer): number {
  const flags = bytes[10];
  const table = (flags & 0x80) ? 3 * (1 << ((flags & 0x07) + 1)) : 0;
  return 13 + table;
}

// One run of length-prefixed pieces, ending at a zero length. Answers where the
// run ends.
function pastSubBlocks(bytes: Buffer, at: number): number {
  while (at < bytes.length) {
    const length = bytes[at];
    if (length === 0) { return at + 1; }
    at += 1 + length;
  }
  return at;
}

// The words a GIF's comment blocks hold, or nothing.
export function gifComment(bytes: Buffer): string | null {
  if (bytes.toString('ascii', 0, 3) !== 'GIF') { return null; }
  let at = gifBlocksAt(bytes);
  while (at < bytes.length) {
    const kind = bytes[at];
    if (kind === 0x3b) { return null; }                       // the end
    if (kind === 0x21) {                                      // an extension
      const label = bytes[at + 1];
      const body = at + 2;
      const ends = pastSubBlocks(bytes, body);
      if (label === 0xfe) {
        const words: Buffer[] = [];
        let one = body;
        while (one < ends && bytes[one] !== 0) {
          words.push(bytes.subarray(one + 1, one + 1 + bytes[one]));
          one += 1 + bytes[one];
        }
        const said = Buffer.concat(words).toString('utf8').trim();
        if (said !== '') { return said; }
      }
      at = ends;
      continue;
    }
    if (kind === 0x2c) {                                      // a picture
      const flags = bytes[at + 9];
      const table = (flags & 0x80) ? 3 * (1 << ((flags & 0x07) + 1)) : 0;
      at = pastSubBlocks(bytes, at + 10 + table + 1);          // past the code size, then the pieces
      continue;
    }
    return null;                                              // nothing this reads
  }
  return null;
}

// A comment block: the two bytes that open it, the words in pieces of at most
// 255, and a zero to close.
function gifCommentBlock(caption: string): Buffer {
  const words = Buffer.from(caption, 'utf8');
  const pieces: Buffer[] = [Buffer.from([0x21, 0xfe])];
  for (let at = 0; at < words.length; at += 255) {
    const piece = words.subarray(at, at + 255);
    pieces.push(Buffer.from([piece.length]), piece);
  }
  pieces.push(Buffer.from([0x00]));
  return Buffer.concat(pieces);
}

export function stampGif(bytes: Buffer, caption: string): Buffer {
  if (bytes.toString('ascii', 0, 3) !== 'GIF') { throw new Error('not a GIF'); }
  const begins = gifBlocksAt(bytes);
  const kept: Buffer[] = [bytes.subarray(0, begins), gifCommentBlock(caption)];
  let at = begins;
  while (at < bytes.length) {
    const kind = bytes[at];
    if (kind === 0x3b) { kept.push(bytes.subarray(at)); break; }
    if (kind === 0x21) {
      const label = bytes[at + 1];
      const ends = pastSubBlocks(bytes, at + 2);
      // An older comment is dropped, so one file never answers with two.
      if (label !== 0xfe) { kept.push(bytes.subarray(at, ends)); }
      at = ends;
      continue;
    }
    if (kind === 0x2c) {
      const flags = bytes[at + 9];
      const table = (flags & 0x80) ? 3 * (1 << ((flags & 0x07) + 1)) : 0;
      const ends = pastSubBlocks(bytes, at + 10 + table + 1);
      kept.push(bytes.subarray(at, ends));
      at = ends;
      continue;
    }
    kept.push(bytes.subarray(at));    // nothing this reads — carried whole
    break;
  }
  return Buffer.concat(kept);
}

// The one way in: hand it a file's bytes and a caption, get the stamped bytes.
export function stamp(name: string, bytes: Buffer, caption: string): Buffer {
  if (/\.png$/i.test(name)) { return stampPng(bytes, caption); }
  if (/\.jpe?g$/i.test(name)) { return stampJpeg(bytes, caption); }
  if (/\.gif$/i.test(name)) { return stampGif(bytes, caption); }
  if (isMovieFile(name)) {
    if (!movieTakesACaption(bytes)) {
      throw new Error(`"${name}" keeps its description before its picture data, and writing there would break it`);
    }
    return stampMovie(bytes, caption);
  }
  throw new Error(`"${name}" cannot carry a caption — png, jpeg, gif and movies do`);
}
