# mu design

mu is a music browser. It scans a disk, reads each file's own labels — artist, album, title — and offers several hierarchies over one collection: by folder, by artist, by album, by name, by letter. It is ov's structure with tags and kinds swapped for that metadata.

## What it draws today

panel, taken whole on 7 September 2026: a controls row holding core's hamburger and the name mu, a details column with nothing in it, and an operation view holding one line. Everything from core arrives through `common/Core.ts`. `Customizations.ts` holds one switch, the name.

## Where the rest goes

The details column takes the filters: artist, album, alphabet. The operation view takes the list and the player. The goal, its challenges and its checklist are in [zone/project goal.md](../zone/project%20goal.md).
