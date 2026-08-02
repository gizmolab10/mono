---
kind: procedure
title: "Adding a Guide"
description: "Put a new guide where overview will find it, label it, and prove it arrived."
tags: [notes, setup]
date: 2026-08-02
---

# Adding a guide

A new guide only reaches overview if it sits in the right place and carries the five labels. Here is the whole of it.

## 1. Put it in a guides folder

`<project>/notes/guides/...` — any depth of folders under that. The shared guides live at `notes/guides/...` at the top of the repo. Nothing outside those folders is swept, so a file in a work folder will never be listed.

Do not name it `index` — those are left out on purpose, since the folders do that job.

## 2. Give it the label block

Five labels, this order, fenced by three dashes above and below, at the very top:

```
---
kind: procedure
title: "Adding a Guide"
description: "One sentence saying what this file tells you to do."
tags: [notes, setup]
date: 2026-08-02
---
```

- **kind** — one of: rule, procedure, reference, architecture, philosophy. Pick by the first question that answers yes: does it tell me what to do at all times → rule; how to carry out one task → procedure; how a part of an app works → architecture; why rather than what → philosophy; otherwise reference.
- **title** — the human name, unique across every guide.
- **description** — one sentence that stands alone in a search result.
- **tags** — one or more from the closed list below. Anything not on it is dropped and said so in the log.
- **date** — the last real change, as year-month-day. A change of meaning, not a typo.

## 3. Use only these tags

collaboration, prose, session-start, code-style, visual-design, refactoring, migration, testing, debugging, build, deploy, setup, tools, philosophy, porting, notes, architecture, data, geometry, user-interface, platform, research.

Adding a new one means adding it to the app's own list first — the closed list is the whole point.

## 4. Restart ov's server

The list of which files exist is settled when the app's code is prepared; reloading the page re-reads the files it already knows but never asks whether new ones appeared.

```
~/GitHub/mono/notes/tools/hub/servers.sh ov
```

Then reload the page. The count should go up by one.

## 5. Check the log

`logs/ov.log` says what the sweep found: how many files, how many index files were left out, how many carry no labels, which kinds and tags turned up. A new guide that isn't in the count, or that reads as unlabeled, shows up here first.
