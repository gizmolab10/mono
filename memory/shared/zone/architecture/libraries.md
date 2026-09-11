---
type: design
title: "Libraries"
description: "What a library is in mono, and how a host takes one on: nothing built on its own, one alias and one bridge per library per host, and a library that imports a library does the same."
use_when: [making a library, a project taking a library on, deciding what belongs in a library and what in the host]
date: 10 September 2026
---
# Libraries

A library is a project other projects import: core, panel and gallery today, the filter tree to come. Nothing is published outside mono, so no library is built on its own. vite builds each app from all the source, on this machine and on Netlify, and that is the whole build.

## What a library is

- It holds behavior, not state. What a viewer chooses, and what an app remembers, live in the host. The library offers the way, as core's Preferences does, or takes the value as a prop, or as a switch the host sets before mounting, as gallery's Customizations does.
- It names nothing of any host's. A host's word in a library is a fault.
- It checks and tests alone: its own tsconfig.json and vitest config, so a fault of its own shows before a host finds it.
- It imports a library the way a host does, below.

## How a host takes a library on

1. **One alias per library, in two files.** `"<library>/*"` in tsconfig.json's paths and `<library>` in vite.config.ts's resolve, both pointing at the library's source folder. A third time in a standalone vitest config, where a host keeps one: that config is read in place of vite's, never beside it. An alias is read by the build, not by a file, and a host's build compiles every library its library imports, so the host carries the alias of each of those too, while its code names only its own.
2. **One bridge per library.** One file in `common/`, `Core.ts` for core, `Panel.ts` for panel and `Gallery.ts` for gallery, that imports what the host needs from the library, one line per thing. Every other file of the host imports from the bridge. A stylesheet has no exports, so `main.ts` imports a library's stylesheets itself.
3. **No second version survives.** A file the host takes from a library is deleted from the host.
4. **A test proves it.** One test in the host, ov's `core_alias.test.ts` or lv's `Aliases.test.ts`, that only the bridges name an alias.
5. **The host pays what the library owes at startup.** Remembered values are read into the library's stores and written back, and the library's switches are set, before anything mounts.

core's own case, with the lessons it cost, is [adopting core](../../../core/truth/adopting%20core.md).
