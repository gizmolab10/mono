// Tests for the gallery rules in `notes/work/photo gallery.md`:
// a folder of photos read in name order, the markdown that asks for one, and
// the walk from photo to photo with its caption.

import { describe, it, expect } from 'vitest';
import { photosInFolder, loadAssetFolders } from '../utilities/loader';
import { captionFor, isMovie, nameOf, step } from '../utilities/gallery';
import photoTitles from 'virtual:photo-titles';
import { render } from '../utilities/parser';

describe('a folder of photos', () => {
  it('finds the photos in the folder, in name order', () => {
    const names = photosInFolder('the-vineyard').map((one) => one.name);
    expect(names.length).toBeGreaterThan(1);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })));
  });

  it('hands back an address for each one', () => {
    for (const one of photosInFolder('the-vineyard')) {
      expect(one.url.length).toBeGreaterThan(0);
    }
  });

  it('answers nothing for a folder that is not there', () => {
    expect(photosInFolder('No Such Folder')).toEqual([]);
  });

  it('finds the folder however the name is written', () => {
    const many = photosInFolder('the-vineyard').length;
    expect(photosInFolder('The Vineyard')).toHaveLength(many);
    expect(photosInFolder('the_vineyard')).toHaveLength(many);
  });

  it('leaves out the images sitting at the top of assets', () => {
    for (const photos of loadAssetFolders().values()) {
      expect(photos.every((one) => one.name !== 'icon.png')).toBe(true);
    }
  });
});

describe('asking for a gallery in markdown', () => {
  it('turns into an empty box carrying the folder name', () => {
    expect(render('> [!gallery] the-vineyard')).toContain('<div class="gallery" data-folder="the-vineyard"></div>');
  });

  it('draws every photo at the height said after the bar', () => {
    expect(render('> [!gallery] the-vineyard|400')).toContain('<div class="gallery" data-folder="the-vineyard" data-height="400"></div>');
  });

  it('says no height where none is asked for', () => {
    expect(render('> [!gallery] the-vineyard')).not.toContain('data-height');
  });

  it('leaves every other callout to the callout plugin', () => {
    expect(render('> [!note] just a note')).not.toContain('class="gallery"');
  });

  it('leaves a plain image embed alone', () => {
    const html = render('![[lcv.label.png]]');
    expect(html).toContain('<img');
    expect(html).not.toContain('class="gallery"');
  });
});

describe('a movie among the photos', () => {
  it('knows a movie by its ending', () => {
    expect(isMovie('harvest.mov')).toBe(true);
    expect(isMovie('harvest.MP4')).toBe(true);
    expect(isMovie('harvest.webm')).toBe(true);
  });

  it('knows a still is not one', () => {
    expect(isMovie('morning fog.png')).toBe(false);
    expect(isMovie('harvest.moving.jpg')).toBe(false);
  });
});

describe('what a photo is called', () => {
  it('uses the title the file carries', () => {
    expect(nameOf({ name: 'IMG_5305.jpg', url: '/x', title: 'Tom at the crush pad' })).toBe('Tom at the crush pad');
  });

  it('falls back to the file name, extension taken off', () => {
    expect(nameOf({ name: 'rows in june.png', url: '/x' })).toBe('rows in june');
  });

  it('falls back where the title is empty', () => {
    expect(nameOf({ name: 'rows in june.png', url: '/x', title: '   ' })).toBe('rows in june');
  });

  it('reads the titles out of the photos while the site is built', () => {
    expect(typeof photoTitles).toBe('object');
    for (const [name, title] of Object.entries(photoTitles)) {
      expect(name.length).toBeGreaterThan(0);
      expect(typeof title).toBe('string');
    }
  });
});

describe('walking the photos', () => {
  const photos = photosInFolder('the-vineyard');

  it('steps 1 to 2 to 3 and wraps back to 1', () => {
    expect(step(0, 3, 1)).toBe(1);
    expect(step(1, 3, 1)).toBe(2);
    expect(step(2, 3, 1)).toBe(0);
  });

  it('walks backwards, and back from the first is the last', () => {
    expect(step(2, 3, -1)).toBe(1);
    expect(step(0, 3, -1)).toBe(2);
  });

  it('stays put where the folder holds nothing', () => {
    expect(step(0, 0, 1)).toBe(0);
  });

  it('says what you are looking at, and nothing else', () => {
    const last = photos.length - 1;
    expect(captionFor(last, photos)).toBe(nameOf(photos[last]));
  });

  it('says nothing at all where there is no photo', () => {
    expect(captionFor(0, [])).toBe('');
  });
});
