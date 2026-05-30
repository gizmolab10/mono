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

function basename(path: string): string {
  return path.substring(path.lastIndexOf('/') + 1);
}

function stripMdExt(filename: string): string {
  return filename.endsWith('.md') ? filename.slice(0, -3) : filename;
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
