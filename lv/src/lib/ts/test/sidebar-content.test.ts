// Tests for the runtime sidebar builder described in
// `notes/work/bare bone website.md`: the sidebar is built from each page's
// top settings, the home page is pinned first in bold with a divider and
// labelled by its title, and every other page follows alphabetically.

import { describe, it, expect } from 'vitest';
import { parseFrontMatter, composeSidebarMd, type PageInfo } from '../utilities/sidebar-content';

describe('reading a page top settings', () => {
  it('pulls the title and home flag even with blank lines between', () => {
    const front = parseFrontMatter('---\n\ntitle: Home\n\nhome: true\n\n---\n\n# Body');
    expect(front.title).toBe('Home');
    expect(front.home).toBe('true');
  });

  it('returns nothing when there is no top block', () => {
    expect(parseFrontMatter('# Just a heading')).toEqual({});
  });
});

describe('composing the sidebar list', () => {
  it('pins the home page first, in bold, with a divider, labelled by its title', () => {
    const pages: PageInfo[] = [
      { name: 'Little Cloud Vineyard', title: 'Home', home: true, folder: '' },
    ];
    const md = composeSidebarMd(pages);
    expect(md).toContain('**[Home](Little Cloud Vineyard)**');
    expect(md).toContain('---');
  });

  it('lists the other top-level pages alphabetically under the home page', () => {
    const pages: PageInfo[] = [
      { name: 'Cherry', home: false, folder: '' },
      { name: 'Apple', home: false, folder: '' },
      { name: 'Little Cloud Vineyard', title: 'Home', home: true, folder: '' },
      { name: 'Banana', home: false, folder: '' },
    ];
    const md = composeSidebarMd(pages);
    const apple = md.indexOf('[[Apple]]');
    const banana = md.indexOf('[[Banana]]');
    const cherry = md.indexOf('[[Cherry]]');
    expect(apple).toBeGreaterThan(-1);
    expect(apple).toBeLessThan(banana);
    expect(banana).toBeLessThan(cherry);
    // The home page is not repeated in the plain list.
    expect(md).not.toContain('[[Little Cloud Vineyard]]');
  });

  it('falls back to the file name when a page has no title', () => {
    const pages: PageInfo[] = [{ name: 'Untitled Page', home: true, folder: '' }];
    expect(composeSidebarMd(pages)).toContain('**[Untitled Page](Untitled Page)**');
  });

  it('with no home page, lists every page alphabetically and adds no divider', () => {
    const pages: PageInfo[] = [
      { name: 'Beta', home: false, folder: '' },
      { name: 'Alpha', home: false, folder: '' },
    ];
    const md = composeSidebarMd(pages);
    expect(md).not.toContain('---');
    expect(md).not.toContain('**[');
    expect(md.indexOf('[[Alpha]]')).toBeLessThan(md.indexOf('[[Beta]]'));
  });
});

describe('grouping pages by folder', () => {
  it('puts each folder under a heading with its pages nested below', () => {
    const pages: PageInfo[] = [
      { name: 'Home', home: true, folder: '' },
      { name: 'Page 1', home: false, folder: 'The Vineyard' },
    ];
    const md = composeSidebarMd(pages);
    const heading = md.indexOf('## The Vineyard');
    const page = md.indexOf('[[Page 1]]');
    expect(heading).toBeGreaterThan(-1);
    expect(heading).toBeLessThan(page);
  });

  it('orders folders alphabetically and pages alphabetically within each', () => {
    const pages: PageInfo[] = [
      { name: 'Pear', home: false, folder: 'Orchard' },
      { name: 'Apple', home: false, folder: 'Orchard' },
      { name: 'Merlot', home: false, folder: 'Cellar' },
    ];
    const md = composeSidebarMd(pages);
    const cellar = md.indexOf('## Cellar');
    const orchard = md.indexOf('## Orchard');
    expect(cellar).toBeLessThan(orchard);
    expect(md.indexOf('[[Apple]]')).toBeLessThan(md.indexOf('[[Pear]]'));
  });

  it('keeps top-level pages above the folder sections', () => {
    const pages: PageInfo[] = [
      { name: 'About', home: false, folder: '' },
      { name: 'Page 1', home: false, folder: 'The Vineyard' },
    ];
    const md = composeSidebarMd(pages);
    expect(md.indexOf('[[About]]')).toBeLessThan(md.indexOf('## The Vineyard'));
  });
});
