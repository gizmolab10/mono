// Tests for the name-resolver rules in `notes/work/bare bone website.md`:
// a wiki-link's bare name becomes either a page address or, for an image,
// the bundled image address. It also reports whether a page exists and hands
// back a page's raw text.
//
// The page and the picture read are gallery's own sample: `src/md/Home.md` and
// `src/assets/sample pictures/one.png`.

import { describe, it, expect } from 'vitest';
import {
  resolveHref,
  pageExists,
  getMdText,
  getAllPermalinks,
} from '../utilities/Resolver';

describe('turning a name into an address', () => {
  it('turns a page name into a slash address with spaces encoded', () => {
    expect(resolveHref('Sample Page')).toBe('/Sample%20Page');
  });

  it('turns an image name into its bundled address', () => {
    const url = resolveHref('one.png');
    expect(url).not.toBe('/one.png');
    expect(url).toContain('one.png');
  });
});

describe('does a page exist', () => {
  it('says yes for the home page', () => {
    expect(pageExists('Home')).toBe(true);
  });

  it('says no for a name with no file', () => {
    expect(pageExists('No Such Page')).toBe(false);
  });
});

describe('getting a page body', () => {
  it('hands back the text of a real page', () => {
    expect(getMdText('Home')).toContain('Home');
  });

  it('hands back nothing for a missing page', () => {
    expect(getMdText('No Such Page')).toBeUndefined();
  });
});

describe('the list of every resolvable name', () => {
  const all = getAllPermalinks();

  it('includes the home page', () => {
    expect(all).toContain('Home');
  });

  it('includes a sample picture', () => {
    expect(all).toContain('one.png');
  });
});
