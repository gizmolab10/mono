// Gallery. One folder of photos shown one at a time: which photo is up, what
// the caption under it says, and where a click or an arrow key moves.
//
// The photos themselves come from the loader (`photosInFolder`). Everything
// here is arithmetic on the position, so it can be proved without a browser.

import type { Photo } from './loader';

// A movie plays; everything else is drawn as a still. `.mov` is a QuickTime
// wrapper — Safari plays it, other browsers often will not, so `.mp4` is the
// safe one to keep.
const MOVIE = /\.(mov|mp4|m4v|webm)$/i;

export function isMovie(name: string): boolean {
  return MOVIE.test(name);
}

// Where a step lands. The run wraps at both ends: forward from the last photo
// is the first, back from the first is the last. A folder holding nothing at
// all stays at zero.
export function step(at: number, count: number, by: number): number {
  if (count <= 0) { return 0; }
  return ((at + by) % count + count) % count;
}

// The words under the photo: where it sits in the run, then the file's own
// name with its extension taken off — `3 of 12 sunset over the rows`.
export function captionFor(at: number, photos: Photo[]): string {
  const one = photos[at];
  if (!one) { return ''; }
  const name = one.name.replace(/\.[a-z0-9]+$/i, '');
  return `${at + 1} of ${photos.length} ${name}`;
}
