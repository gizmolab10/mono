# Build & Deploy

Reference for Netlify, VitePress, and related tooling.

## Netlify

**Base directory:** When set, all paths in `netlify.toml` are relative to it. The build command runs from there.

## VitePress

**srcDir:** Relative to where vitepress runs (the directory containing `.vitepress/`), not relative to `.vitepress/config.mts`.

**Build output location:** `yarn docs:build > file.txt` writes relative to where the shell runs, not where vitepress runs. Need to explicitly set the output path.

**Stale cache:** After moving or deleting files, VitePress cache can hold stale references causing build failures. Fix: `rm -rf .vitepress/cache .vitepress/dist`

**srcExclude patterns:** VitePress uses glob patterns like `**/node_modules/**`. When parsing these in custom tools, strip both the `**/` prefix AND `/**` suffix to get the directory name. Otherwise `**/node_modules/**` won't match `node_modules`.

## Gitignore

**Wildcards:** `**/` prefix matches at any depth. Useful for `.vitepress/cache/` that could exist in multiple locations.

## Filenames

Avoid spaces in filenames (e.g., `index copy.html` from macOS Finder duplicates). They break VitePress builds.
