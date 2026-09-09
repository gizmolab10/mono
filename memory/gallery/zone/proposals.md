---
kind: analyze
title: "Proposals"
description: "gallery proposals — each being weighed or driven; one leaves when it becomes the drive, dissolves into truth, or dies."
tags: [now, proposal, weighed]
date: 2026-09-09
---
# Proposals

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
