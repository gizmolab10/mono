---
kind: analyze
title: "mu ideas"
description: "mu's live thinking — plans, research, considerations, ideas."
tags: [now]
date: 2026-08-27
---
# mu ideas

read and answer line 35

goal is to scan a local filesystem and extract **music** and meta data and navigation through it on a variety of hierarchies as we now do with folders. tag sets and kinds can show up as hierarchies

- [ ] open zip, rar, z7 files
- [ ] filter by
    - [ ] artist name
        - [ ] song list
    - [ ] album title
        - [ ] song list
    - [ ] song names
    - [ ] alphabet
- [ ] incorporate the above as hierarchies
- [ ] each song listed
    - [ ] play the song
    - [ ] pdf, txt
    - [ ] show the album
- [ ] tiny dispatcher installer

## considerations

27 August 2026, CLAUDE

mu is a music browser: scan the disk, read each file's own labels (artist, album, title), and offer several hierarchies over one collection — ov's shape, with tags and kinds swapped for metadata. Most of it is known territory.

1. **The tiny dispatcher installer.** Building the dispatcher is easy; installing it on someone else's machine is not — macOS signing and notarization, auto-start, updates. WHAT DOES THIS MEAN: "A product problem, not a code problem."
2. **Scale.** A real music library is tens of thousands of files. Reading every file's metadata each launch will not do. mu needs 1) a saved index, 2) a way to notice what changed, 3) a gradual buildout of the index (start small so first launch is fast, page through the rest when cpu is idle).
3. **vob.** No browser plays MPEG-2, so it needs ffmpeg on the dispatcher's side — converting once or transcoding as it streams. A two-hour DVD (~4.7 GB): roughly 10–20 minutes with an Apple Silicon Mac's hardware encoder, up to an hour with software x264. Only a few minutes if mu wants the audio alone, which for a music library it likely does. ——— can the transcoding happen while playing?
4. **Archives (zip, rar, 7z).** Easy: one free tool, `unar` (`brew install unar`), opens all three. The dispatcher runs with the user's rights and can call any installed tool — no OS permission involved. The app asks in its own words the first time; the dispatcher checks the tool is there, runs it, and says how to install it when missing. WinRAR is not needed on the Mac.
5. **mp4.** Native: the browser plays mp4/m4a, so a music video is a `<video>` element.
6. **The rest is trivial.**  The browser plays mp3/m4a/flac natively. The dispatcher serves the audio bytes, the hierarchies (a pivot over the same rows), pdf/txt beside a song (name matching).
