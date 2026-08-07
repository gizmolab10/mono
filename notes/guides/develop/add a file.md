---
kind: step
title: "Adding a Guide"
description: "Put a new guide where overview will find it, label it, and prove it arrived."
tags: [notes, setup, tools]
date: 2026-08-02
---
# How to add a file

A new file must be where overview can find it and carry the five labels. Several steps. The first two prepare it for OKF, the rest puts it in the right spot.

## 1. Give it the label block

Five labels, this order, fenced by three dashes above and below, at the very top:

```
---
kind: step
title: "Adding a File"
description: "One sentence saying what this file tells you to do."
tags: [notes, setup]
date: 2026-08-02
---
```

- **kind** — one of: specify, step, refer, wire, explain. Pick by the first question that answers yes: does it tell me what to do at all times → specify; how to carry out one task → step; how a part of an app works → wire; why rather than what → explain; otherwise refer.
- **title** — the human name, unique across every guide.
- **description** — one sentence that stands alone in a search result.
- **tags** — one or more from the closed list below. Anything not on it is dropped and said so in the log.
- **date** — the last real change, as year-month-day. A change of meaning, not a typo.

## 2. Use only these tags

build, data, debug, deploy, geometry, migrate, notes, platform, port, prose, refactor, research, session, setup, stale, style, team, test, think, tools, UX, vision, visual-design, wire.

Adding a new one means adding it to the app's own list first — the closed list is the whole point.

## 3. Put it in a guides folder

`<project>/notes/guides/...` — any depth of folders under that. The shared guides live at `notes/guides/...` at the top of the repo. Nothing outside those folders is swept, so a file in a work folder will never be listed.

Do not name it `index` — those are left out on purpose, since the folders do that job.

## 4. Restart ov's server

The list of which files exist is settled when the app's code is prepared; reloading the page re-reads the files it already knows but never asks whether new ones appeared.

```
~/GitHub/mono/notes/tools/hub/servers.sh ov
```

Then reload the page. The count should go up by one.

## 5. Check the log

`logs/ov.log` says what the sweep found: how many files, how many index files were left out, how many carry no labels, which kinds and tags turned up. A new guide that isn't in the count, or that reads as unlabeled, shows up here first.
