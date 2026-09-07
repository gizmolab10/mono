---
kind: specify
title: "Photo gallery"
description: "A folder of photos on a page: one showing, click it for the next."
tags: [keep, now]
date: 2026-08-19
---
# photo gallery

add a feature that takes a folder of photos. displays one, click on it to go to the next.

## proposal

we will rely on some stuff we have

1. renderer
2. asset awareness

we need an html injector

### 1. The photos

One folder per gallery under `src/assets/`. The build finds every photo there but files them by name and forgets the folder (`loadAssets`, in `src/lib/ts/utilities/loader.ts`). One more function remembers: a folder name in, its photos out, in name order.

A folder's name is matched loosely: case is ignored, and a space, a hyphen and an underscore all read as the same character. So the folder `the vineyard` answers a page asking for `the-vineyard`, and a dropped photo goes into the folder already on disk rather than making a second one beside it.

### 2. Markdown
```text
> [!gallery] the-vineyard
```
A number after a bar — `> [!gallery] the-vineyard|400` — draws every photo in that gallery 400 tall, shrinking or enlarging it to match. Without one, each photo is drawn at its own size.

It is said as a callout because Obsidian reads `![[gallery: x]]` as an embed of a note called that, finds none, and offers to make one. A callout is a shape Obsidian draws without complaint, and the preprocessor catches it before the callout plugin runs — the same path the centered line takes.

The preprocessor turns it into an empty `<div>` carrying the folder name, and the height where one was said:
```html
<div class="gallery" data-folder="the-vineyard" data-height="400"></div>
```
FYI, `![[photo.jpg]]` remains functional.

### 3. How it becomes clickable

The renderer (`src/lib/svelte/Renderer.svelte`) finds each `<div>` and builds a photo component inside it with that folder's photos. Changing the page throws that html away on its own. However, the arrow keys have a window listener which hands events to the gallery element. The element must be unregistered from the listener.

What the component puts inside:
```html
<div class="gallery" data-folder="The Vineyard">
    <button class="gallery-photo" aria-label="next photo">
        <img src="/assets/vineyard-3.a1b2c3.jpg" alt="sunset over the rows">
    </button>
    <p class="gallery-caption">3 of 12 sunset over the rows</p>
</div>
```

The photo is the button, so a click anywhere on it goes to the next. `src` is the address the build gives that file, never the path on disk.

### 3a. Movies

A folder may hold movies as well as stills: `.mov`, `.mp4`, `.m4v`, `.webm`. One plays on its own, with sound and with its own controls. A browser that forbids sound before the page has been touched holds it until you press play. `.mov` is a QuickTime wrapper — Safari plays it, other browsers often will not, so `.mp4` is the safe one to keep.

A movie is not the button: its own controls own every press inside it, so stepping past one is done with the arrow keys. Stepping away builds a fresh element, so the movie that was playing stops.

### 4. What it does

The first photo. A click or the right arrow shows the next, the left goes back, the last wraps to the first. Under it, one caption: what the photo is called — the title it carries inside itself, or its file name.

### 5. A caption, written into the file

A photo can carry its own title — JPEG in an XMP block, PNG in a `tEXt` chunk keyed "Title" — and that title becomes the caption. Where a file carries none, its file name answers instead. The reading happens while the site is built (`plugins/photo-titles.ts`), since no browser hands a page what a picture carries.

Captions are written from the app itself:

1. **The technical preference.** `gallery.technical` in the browser's own storage, read once as the app launches, off for everyone else. Set it by hand: `localStorage.setItem('gallery.technical', 'true')`.
2. **The edit button**, top right, shown only where that preference is on.
3. **Pressing it** puts every gallery on the page into editing: each one gives way to a box a photo can be dropped into.
4. **Dropping a photo** asks for a caption, then writes the caption inside the file and saves it into that gallery's folder.

Two limits, both real:

- **A page cannot write to disk**, so the writing is done by the dev server (`plugins/caption-drop.ts`). The edit button does nothing on the built site.
- **png, jpeg, gif and movies carry a caption** — a `tEXt` chunk, an XMP block, a comment block, and a `©nam` block inside the movie's description. HEIC is refused, with a line saying so. Only the jpeg goes through exifr; the rest are read by hand.
- **One movie in three is refused**: where a movie keeps its description before its picture data, adding a caption there would shift every offset into that data and break the movie. Where the description comes last — an iPhone movie, for one — nothing moves and the caption is written.

## how it gets proved

- `![[gallery: X]]` shows every photo in folder X, in name order
- clicking walks 1 → 2 → 3 → 1, arrows both ways
- the caption reads what the photo is called, and nothing else
