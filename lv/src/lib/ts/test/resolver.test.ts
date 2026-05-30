// Tests for the name-resolver rules in `notes/work/bare bone website.md`:
// a wiki-link's bare name becomes either a page address or, for an image,
// the bundled image address. It also reports whether a page exists and hands
// back a page's raw text.

import { describe, it, expect } from 'vitest';
import {
  resolveHref,
  pageExists,
  getMdText,
  getAllPermalinks,
} from '../utilities/resolver';

describe('turning a name into an address', () => {
  it('turns a page name into a slash address with spaces encoded', () => {
    expect(resolveHref('Little Cloud Vineyard')).toBe('/Little%20Cloud%20Vineyard');
  });

  it('turns an image name into its bundled address', () => {
    const url = resolveHref('lcv.label.png');
    expect(url).not.toBe('/lcv.label.png');
    expect(url).toContain('lcv.label');
  });
});

describe('does a page exist', () => {
  it('says yes for the home page', () => {
    expect(pageExists('Little Cloud Vineyard')).toBe(true);
  });

  it('says no for a name with no file', () => {
    expect(pageExists('No Such Page')).toBe(false);
  });
});

describe('getting a page body', () => {
  it('hands back the text of a real page', () => {
    expect(getMdText('Page 1')).toContain('another photo');
  });

  it('hands back nothing for a missing page', () => {
    expect(getMdText('No Such Page')).toBeUndefined();
  });
});

describe('the list of every resolvable name', () => {
  const all = getAllPermalinks();

  it('includes the home page', () => {
    expect(all).toContain('Little Cloud Vineyard');
  });

  it('includes the vineyard label image', () => {
    expect(all).toContain('lcv.label.png');
  });
});
