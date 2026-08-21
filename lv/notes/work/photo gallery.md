---
kind: specify
title: "Photo gallery"
description: "A folder of photos on a page: one showing, click it for the next."
tags: [now]
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

A folder's name holds no spaces — `the-vineyard`, never `The Vineyard`. The name is matched loosely, so a page may still ask for `![[gallery: The Vineyard]]`: case is ignored, and a space, a hyphen and an underscore all read as the same character. The photos themselves keep whatever names they have, since each one becomes a caption.

### 2. Markdown
```text
![[gallery: The Vineyard]]
```
A number after a bar — `![[gallery: the-vineyard|400]]` — draws every photo in that gallery 400 tall, shrinking or enlarging it to match. Without one, each photo is drawn at its own size.

The MD link preprocessor turns this into an empty `<div>` carrying the folder name, and the height where one was said:
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

The first photo. A click or the right arrow shows the next, the left goes back, the last wraps to the first. Caption: `3 of 12 sunset over the rows`.

## how it gets proved

- `![[gallery: X]]` shows every photo in folder X, in name order
- clicking walks 1 → 2 → 3 → 1, arrows both ways
- the caption under the third of twelve reads `3 of 12` and that photo's name
