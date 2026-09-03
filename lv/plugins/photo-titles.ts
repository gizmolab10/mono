// Photo titles. A picture can carry a title inside itself — JPEG keeps one in
// its IPTC or XMP block, PNG in a `tEXt` chunk keyed "Title" — and macOS Photos
// writes exactly that when you name a photo. No browser hands a page that
// title, so it is read here, while the site is being built, and handed to the
// app as a plain map: file name -> title.
//
// Anything without a title is left out; the gallery falls back to the file's
// own name.

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { Plugin } from 'vite';
import { isMovieFile, movieTitle } from './movie-title';
import { gifComment } from './stamp';
import exifr from 'exifr';

const NAME = 'virtual:photo-titles';
const RESOLVED = '\0' + NAME;

const READABLE = /\.(jpg|jpeg|png|gif|webp|avif|tif|tiff|mov|mp4|m4v)$/i;

// Every title found under one folder, walked whole. A file that carries none,
// or that cannot be read at all, is simply left out.
async function titlesUnder(root: string): Promise<Record<string, string>> {
  const titles: Record<string, string> = {};

  async function walk(here: string) {
    let names: string[] = [];
    try {
      names = await readdir(here);
    } catch {
      return;
    }
    for (const name of names) {
      const path = join(here, name);
      const what = await stat(path).catch(() => null);
      if (!what) { continue; }
      if (what.isDirectory()) { await walk(path); continue; }
      if (!READABLE.test(name)) { continue; }
      const title = await titleOf(path);
      if (title) { titles[name] = title; }
    }
  }

  await walk(root);
  return titles;
}

// The title a single file carries. Three places hold one, and the first that
// answers wins: XMP's `dc:title`, IPTC's object name, and the EXIF description.
// A PNG's `tEXt` chunk is read by hand, since exifr does not read PNG text.
async function titleOf(path: string): Promise<string | null> {
  const bytes = await readFile(path).catch(() => null);
  if (!bytes) { return null; }

  if (/\.png$/i.test(path)) { return pngTitle(bytes); }
  if (/\.gif$/i.test(path)) { return gifComment(bytes); }
  if (isMovieFile(path)) { return movieTitle(bytes); }

  const read = await exifr.parse(bytes, { xmp: true, iptc: true }).catch(() => null);
  if (!read) { return null; }
  const said = read.title ?? read.dc?.title ?? read.ObjectName ?? read.Headline ?? read.ImageDescription;
  const one = wordsIn(said);
  return one !== null && one.trim() !== '' ? one.trim() : null;
}

// A title comes back in more than one structure. Written in one language it is a
// pair — the language and the words. Written in several it is one entry per
// language. Either way the words are what is wanted, never the language's name.
function wordsIn(said: unknown): string | null {
  if (typeof said === 'string') { return said; }
  if (Array.isArray(said)) { return wordsIn(said[0]); }
  if (typeof said === 'object' && said !== null) {
    const one = said as Record<string, unknown>;
    if (typeof one.value === 'string') { return one.value; }
    if (typeof one['x-default'] === 'string') { return one['x-default'] as string; }
    for (const two of Object.values(one)) {
      const found = wordsIn(two);
      if (found !== null) { return found; }
    }
  }
  return null;
}

// A PNG carries its text in `tEXt` chunks: four bytes of length, the four
// letters `tEXt`, then a keyword, a zero, and the words themselves.
function pngTitle(bytes: Buffer): string | null {
  let at = 8;   // past the eight-byte signature
  while (at + 8 <= bytes.length) {
    const length = bytes.readUInt32BE(at);
    const kind = bytes.toString('ascii', at + 4, at + 8);
    const body = at + 8;
    if (kind === 'tEXt') {
      const chunk = bytes.subarray(body, body + length);
      const zero = chunk.indexOf(0);
      if (zero > 0) {
        const key = chunk.toString('latin1', 0, zero);
        const words = chunk.toString('latin1', zero + 1).trim();
        if (key.toLowerCase() === 'title' && words !== '') { return words; }
      }
    }
    if (kind === 'IEND') { break; }
    at = body + length + 4;   // past the body and its four-byte check
  }
  return null;
}

export function photoTitles(assets = 'src/assets'): Plugin {
  const root = resolve(process.cwd(), assets);
  return {
    name: 'photo-titles',
    resolveId(id) {
      return id === NAME ? RESOLVED : null;
    },

    // The map is built once and held. Nothing about a virtual module tells the
    // dev server that a file on disk changed, so a photo written while the
    // server runs would never be read — the page would keep answering with the
    // map made at launch, reload after reload. So the assets folder is watched,
    // and any file arriving, changing or leaving throws the map away and sends
    // the page around again.
    configureServer(server) {
      server.watcher.add(root);
      server.watcher.on('all', (_event, path) => {
        if (!path.startsWith(root)) { return; }
        const held = server.moduleGraph.getModuleById(RESOLVED);
        if (held) { server.moduleGraph.invalidateModule(held); }
        server.ws.send({ type: 'full-reload' });
      });
    },
    async load(id) {
      if (id !== RESOLVED) { return null; }
      const titles = await titlesUnder(root);
      return `export default ${JSON.stringify(titles)};`;
    },
  };
}
