// Name resolver. Given a wiki-link's bare name (the part inside [[...]]),
// figure out what the rendered href (or image src) should be.
//
// Two flavors:
// - Image embeds: ![[name.png]] -> bundled image URL from the asset map.
// - Page links:   [[Other Note]] -> a path the router will pick up.

import { loadAssets, loadMdFiles } from './loader';

const assetMap = loadAssets();
const mdMap = loadMdFiles();

const IMAGE_EXT = /\.(jpg|jpeg|png|webp|gif|svg|bmp|ico|apng)$/i;

// Every valid file name the wiki-link parser is allowed to resolve.
// Includes md file names (without .md) and image file names (with extension).
export function getAllPermalinks(): string[] {
  return [...mdMap.keys(), ...assetMap.keys()];
}

// Returns true if the name maps to a real md file on disk.
export function pageExists(name: string): boolean {
  return mdMap.has(name);
}

// Convert a matched permalink into an href (or img src).
// For images, returns the bundled URL.
// For pages, returns a path-style URL that the router will pick up.
export function resolveHref(permalink: string): string {
  if (IMAGE_EXT.test(permalink)) {
    return assetMap.get(permalink) ?? permalink;
  }
  return '/' + encodeURIComponent(permalink);
}

// Returns the raw text of a named md file, or undefined if not found.
export function getMdText(name: string): string | undefined {
  return mdMap.get(name);
}
