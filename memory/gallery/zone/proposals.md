---
kind: analyze
title: "Proposals"
description: "gallery proposals — each being weighed or driven; one leaves when it becomes the drive, dissolves into truth, or dies."
tags: [now, proposal, weighed]
date: 2026-09-09
---
# Proposals

## a picture fills the box it is given (9 September 2026)

Proposal — in mj, a picture grows or shrinks to fill the operation view, keeping its aspect ratio, with a margin of at least `--gap-huge`, core's largest gap, on every side. Today it is capped at 700px whatever the box is.

**The parts.** Two, one per owner.

1. **The host measures the box.** mj's Operation.svelte wraps the gallery in a div that keeps `--gap-huge` of space on every side, reads that div's inner width and height as they change, and hands them to the component as one optional value, the space the picture may fill.
2. **The component fits the picture and its caption together.** Gallery.svelte, given that space, first takes the caption's own height, and the gap between the two, off the space's height. Then it reads the picture's own width and height once it has loaded, scales it to the larger size that fits what is left both ways, and sets that width and height on the image. The image's box is then exactly the picture, the caption sits right under it, both sit inside the margin, and the rounded corners are tight. A movie is sized the same way from its own width and height.

**What does not change.** lv hands no space, so its pictures keep the 700px cap and the height a page asks for after the bar. The cap in Gallery.css stays for any host that hands nothing. Changed 10 September 2026: lv hands a space too, through gallery's own page. Renderer.svelte hands each gallery on the md file the space the rest of the page leaves it, the page's border kept, so lv's picture, caption and title fill the view together.

**Success criteria.** In mj, a small picture grows and a large one shrinks until the picture and its caption together leave `--gap-huge` on the tighter pair of sides, the ratio unchanged, at every window size. lv draws exactly as today.

**Cost.** Operation.svelte: the wrapper and two bound sizes, about eight lines. Gallery.svelte: one optional prop, the load handler that reads the picture's size, and the arithmetic, about fifteen lines. No stylesheet change.

**Decided 9 September 2026.** The caption's height comes out of the space first, so picture and caption together keep the margin.

**Built 9 September 2026.** Gallery.svelte takes the space as an optional value, reads the picture's or the movie's own size when it loads, takes the caption's height and the gap above it off the space, and sets the scaled width and height on the element, lifting the stylesheet's caps. mj's Operation.svelte measures the space inside the margin and hands it over. The table and the drop box, while editing, sit inside the same margin.

**Changed 10 September 2026.** The margin is none: picture and caption fill the box out to its edges. And the space is no longer measured, which arrived a frame late while the window was dragged and jittered. App.svelte computes the box's height from the window's, less the margins and the controls row's height, which the row hands back, and Operation.svelte hands the box's size down. Whatever overflows for a frame is clipped.

## Router, Parser and Persistence: library or host (9 September 2026)

Proposal — sort the three by core's rule. State lives in the host, behavior in the library, and the library keeps none of a host's vocabulary.

**What each does today.** Parser turns one md file's text into html through the remark and rehype chain, Obsidian links included. It holds no state and names nothing of lv's. Renderer and Sidebar import it. Router holds the current file's name and the status message, keeps the browser's address bar in step with the name, and names lv's home page as `HOME`. StatusLine, Renderer and Sidebar import it. Persistence reads and writes five flags in the browser's local storage, every key beginning `gallery.`: the sidebar shown, technical, editing, the pass, and which folders are open. Sidebar, Gallery, S_Sidebar and Technical import it.

**The sort.**

1. **Parser: library, as it is.** Behavior only.
2. **Router: library, with the home page handed in.** The wiring is behavior. The name of the home page is the host's word, so the host hands it over at startup, the way it calls Configuration, and Router holds no string of lv's. Built 9 September 2026: Router reads `customizations.home` when a page is asked for, never while it loads, and the host's Main.ts sets it before mounting.
3. **Persistence: the mechanism in core, the keys in the host.** Decided and built 9 September 2026 by the pac in core's decisions: reading and writing under a prefix is core's `Preferences` class. Since lv imports gallery, the same day, gallery's Persistence.ts holds the keys and the named pairs for both hosts, and each host hands over only its prefix, `customizations.prefix`.

**Success criteria.** gallery's library holds no string that is lv's own, proved by search. lv and mj both run on the sorted files. The three test files stay beside what they prove and pass.

**Cost.** Parser, nothing. Router, one parameter and one call per host. Persistence, one prefix parameter in the library and one file of keys per host, about twenty lines.

**Decided.** gallery's first two questions, image files are dragged and dropped and all of of lv's code that supports this remains in gallery. The home page's name belongs in the host's Customizations.
