# mu design

mu is a music browser. It scans a disk, reads each file's own labels — artist, album, title — and offers several hierarchies over one collection: by folder, by artist, by album, by name, by letter. It is ov's structure with tags and kinds swapped for that metadata.

## Where the library is

The volume `/Volumes/muice myoozk`, decided 11 September 2026: an NTFS disk over USB, 4.5 TB with 3.2 TB used, four top folders, Any Audio, HD Audio, MVE and MuSC-V, and 18,219 files outside the recycle bin and the system folder. Most are flac, 6227, then jpg, 3085, mp4, 1954, and vob, 1421. Only 73 are mp3. The full count by ending is in ov's decisions.md.

## What it draws today

panel, taken whole on 7 September 2026: a controls row holding core's hamburger and the name mu, a details column with nothing in it, and an operation view holding one line. Everything from core arrives through `common/Core.ts`. `Customizations.ts` holds one switch, the name.

## Where the rest goes

The details column takes the filters: artist, album, alphabet. The operation view takes the list and the player. The goal, its challenges and its checklist are in [zone/project goal.md](../zone/project%20goal.md).
