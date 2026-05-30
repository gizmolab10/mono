// Loader. At build time, Vite walks the md folder and the assets folder
// and hands back the contents of every md file plus the bundled URL for
// every image. The result is two maps keyed by simple file name (without
// the path, and for md files without the .md extension).

// md files: load every file under src/md as raw text.
const rawMdModules = import.meta.glob<string>('/src/md/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

// images: load every image under src/assets as a bundled URL.
const assetModules = import.meta.glob<string>(
  '/src/assets/**/*.{png,jpg,jpeg,gif,svg,webp,avif}',
  {
    query: '?url',
    import: 'default',
    eager: true,
  }
);

export type MdMap = Map<string, string>;    // file name (no .md) -> contents
export type AssetMap = Map<string, string>; // file name (with extension) -> URL

// One page on disk: its name (no .md), the folder it sits in ('' at the top
// level), and its raw text.
export type MdEntry = { name: string; folder: string; text: string };

const MD_ROOT = '/src/md/';

function basename(path: string): string {
  return path.substring(path.lastIndexOf('/') + 1);
}

function stripMdExt(filename: string): string {
  return filename.endsWith('.md') ? filename.slice(0, -3) : filename;
}

// The folder a page sits in, relative to the md root. Top-level pages return
// an empty string. A page one folder deep returns that folder's name.
function folderOf(path: string): string {
  const rel = path.startsWith(MD_ROOT) ? path.slice(MD_ROOT.length) : path;
  const slash = rel.lastIndexOf('/');
  return slash === -1 ? '' : rel.slice(0, slash);
}

// Returns a map from md file name (without the .md extension) to file contents.
// File names are unique across the entire md folder by guarantee.
export function loadMdFiles(): MdMap {
  const map = new Map<string, string>();
  for (const [path, contents] of Object.entries(rawMdModules)) {
    const name = stripMdExt(basename(path));
    map.set(name, contents);
  }
  return map;
}

// Returns one entry per md file: its name, the folder it sits in, and its
// raw text. Folder is '' for top-level pages.
export function loadMdEntries(): MdEntry[] {
  const entries: MdEntry[] = [];
  for (const [path, text] of Object.entries(rawMdModules)) {
    entries.push({ name: stripMdExt(basename(path)), folder: folderOf(path), text });
  }
  return entries;
}

// Returns a map from image file name (with extension) to bundled URL.
// File names are unique across the entire assets folder by guarantee.
export function loadAssets(): AssetMap {
  const map = new Map<string, string>();
  for (const [path, url] of Object.entries(assetModules)) {
    const name = basename(path);
    map.set(name, url);
  }
  return map;
}
