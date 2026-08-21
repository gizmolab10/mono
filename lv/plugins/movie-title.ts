// A title inside a movie. QuickTime and MP4 files are built of blocks, each
// one four bytes of length, four letters of name, then its body — and blocks
// hold other blocks. The description block is `moov`; a title lives in a
// `udta` block inside it, under the name `©nam`, which is where Apple Photos
// writes one.
//
// Reading is a walk. Writing adds bytes inside `moov`, which shifts everything
// after it — so it is only safe where `moov` is the last block in the file.
// Where `moov` comes first, every offset pointing into the picture data would
// have to be corrected too, and a mistake there ruins the movie; that case is
// refused instead.

const NAME = Buffer.from([0xa9, 0x6e, 0x61, 0x6d]);   // ©nam

export type Block = { kind: string; at: number; length: number; body: number };

// The blocks lying side by side in one stretch of a file.
export function blocksIn(bytes: Buffer, from = 0, to = bytes.length): Block[] {
  const blocks: Block[] = [];
  let at = from;
  while (at + 8 <= to) {
    let length = bytes.readUInt32BE(at);
    const kind = bytes.toString('ascii', at + 4, at + 8);
    let body = at + 8;
    if (length === 1) { length = Number(bytes.readBigUInt64BE(at + 8)); body = at + 16; }
    if (length === 0) { length = to - at; }
    if (length < 8) { break; }
    blocks.push({ kind, at, length, body });
    at += length;
  }
  return blocks;
}

export function isMovieFile(name: string): boolean {
  return /\.(mov|mp4|m4v)$/i.test(name);
}

// Whether a caption can be written into this movie: only where the description
// block is the last one in the file.
export function movieTakesACaption(bytes: Buffer): boolean {
  const tops = blocksIn(bytes);
  const last = tops[tops.length - 1];
  return !!last && last.kind === 'moov';
}

// The title a movie carries, or nothing. Two places are read: the `udta` block,
// where a title is written by hand, and the `meta` block an iPhone writes.
export function movieTitle(bytes: Buffer): string | null {
  const moov = blocksIn(bytes).find((one) => one.kind === 'moov');
  if (!moov) { return null; }
  const inside = blocksIn(bytes, moov.body, moov.at + moov.length);

  const udta = inside.find((one) => one.kind === 'udta');
  if (udta) {
    for (const one of blocksIn(bytes, udta.body, udta.at + udta.length)) {
      // Matched as bytes: the name begins 0xa9, and reading a block's name as
      // ascii drops that bit, so `©nam` would arrive as `)nam` and never match.
      if (!bytes.subarray(one.at + 4, one.at + 8).equals(NAME)) { continue; }
      // A `©nam` body is two bytes of length, two of language, then the words.
      const said = bytes.toString('utf8', one.body + 4, one.at + one.length).replace(/\0+$/, '').trim();
      if (said !== '') { return said; }
    }
  }

  const meta = inside.find((one) => one.kind === 'meta');
  if (meta) {
    const found = titleInMeta(bytes, meta);
    if (found) { return found; }
  }
  return null;
}

// An iPhone's `meta` block holds a list of names and a matching list of values.
// The title, where there is one, sits under `©nam` in the value list.
function titleInMeta(bytes: Buffer, meta: Block): string | null {
  // Four bytes of version stand before this block's own blocks.
  const ilst = blocksIn(bytes, meta.body + 4, meta.at + meta.length).find((one) => one.kind === 'ilst');
  if (!ilst) { return null; }
  for (const one of blocksIn(bytes, ilst.body, ilst.at + ilst.length)) {
    if (!bytes.subarray(one.at + 4, one.at + 8).equals(NAME)) { continue; }
    const data = blocksIn(bytes, one.body, one.at + one.length).find((two) => two.kind === 'data');
    if (!data) { continue; }
    // A `data` body is four bytes saying what kind, four reserved, then the words.
    const said = bytes.toString('utf8', data.body + 8, data.at + data.length).trim();
    if (said !== '') { return said; }
  }
  return null;
}

// One block: its length, its name, its body.
function block(kind: string, body: Buffer): Buffer {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length + 8, 0);
  head.write(kind, 4, 'latin1');
  return Buffer.concat([head, body]);
}

// A `©nam` block: two bytes saying how many words, two saying the language,
// then the words themselves.
function nameBlock(caption: string): Buffer {
  const words = Buffer.from(caption, 'utf8');
  const head = Buffer.alloc(4);
  head.writeUInt16BE(words.length, 0);   // how many words
  head.writeUInt16BE(0, 2);              // the language, left unsaid
  return block('\u00a9nam', Buffer.concat([head, words]));
}

export function stampMovie(bytes: Buffer, caption: string): Buffer {
  const tops = blocksIn(bytes);
  const moov = tops.find((one) => one.kind === 'moov');
  if (!moov) { throw new Error('this movie carries no description block'); }
  if (!movieTakesACaption(bytes)) {
    throw new Error('this movie keeps its description before its picture data, and writing there would break it');
  }

  // Everything inside moov, with any older udta left out, and a fresh one added.
  const inside = blocksIn(bytes, moov.body, moov.at + moov.length)
    .filter((one) => one.kind !== 'udta')
    .map((one) => bytes.subarray(one.at, one.at + one.length));
  const udta = block('udta', nameBlock(caption));
  const body = Buffer.concat([...inside, udta]);

  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length + 8, 0);
  head.write('moov', 4, 'latin1');
  return Buffer.concat([bytes.subarray(0, moov.at), head, body]);
}
