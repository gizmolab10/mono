---
kind: explain
title: "Working features"
description: "What the site does today, and what each thing cannot do. Newest first."
tags: [journal, now]
date: 2026-08-23
---
# Working features

What works today. Each entry says its own limit, where it has one.

## Reordering a gallery — 2026-08-23

The order belongs to the folder, in one list — `order.md` beside the pictures, naming them one to a line. A file's line is its place, so no picture is ever rewritten to reorder it.

- **While editing, the table shows the order** — the first column is where each file sits, and one row is highlighted.
- **A click picks a row**, and up and down move the highlight. Both wrap: past the last is the first.
- **Option with them moves the file**, swapping it with the one beside it — and past the last it swaps with the first.
- **A move writes the list alone** — a few bytes, whatever the pictures weigh, and one commit on the published site.
- **A folder with no list** is shown in file-name order, and the first move writes the list whole.
- **A file the list does not name** goes at the end; a name the folder no longer holds is left out.

## Editing from the published site — 2026-08-21

Proved on littlecloudvineyard.com: a photo added, a caption written, and both showing.

- **Add a file** — dropped into the box, given a caption, committed. **Under 5 MB**; that is what Netlify hands a function, and anything larger is refused twice, by the page and by the function.
- **Change a caption** — typed into the table, written inside the file itself, committed. Any size.
- **Delete a file** — asked about first, then committed. It cannot be undone from the page, and it frees nothing in the repository.
- **The passphrase** — asked for once, remembered in that browser, forgotten when it is wrong. Netlify holds the real one.
- **Every write is a commit, then a rebuild**, so the site catches up a minute or two later.

## The photo gallery — 2026-08-21

- **One folder of pictures, shown one at a time.** `> [!gallery] the vineyard` on a line of its own; `|400` after the name draws every picture 400 tall.
- **A click, or the right arrow, shows the next**; the left goes back; the last wraps to the first.
- **Movies play** — `.mov`, `.mp4`, `.m4v`, `.webm` — with sound and their own controls. A movie is not the button, so the arrow keys step past it.
- **The caption is what the picture is called**: the title inside the file, or its file name where it carries none. png, jpeg, gif and movies each keep it in their own place.
- **`lv.technical` says three things**: unset, no edit button at all; false, the table without the drop box; true, a file may be added.

## The site itself

- **Every page is a md file** under `src/md/`, rendered with Obsidian syntax — wiki-links, image embeds, callouts, and the centered line.
- **Clicking a link swaps the page** without a full reload, and the address bar follows.
- **The status line** says when a link leads nowhere, and clears on the next good move.
- **The sidebar and its hamburger are out of sight** for now. Both stand, ready to come back.
- **No scrollbars are drawn.** Everything still scrolls by wheel, trackpad and arrow key.
