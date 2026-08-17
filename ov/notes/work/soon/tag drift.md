---
kind: specify
title: "Tag drift"
description: "Guides whose tags stopped describing them when the tags were renamed."
tags: [now, notes]
date: 2026-08-09
---
# Tag drift

Four tags were renamed in place, across every guide that wore them, without anyone reading the guides:

| was | is now |
| --- | --- |
| `wire` | `program` (by way of `write`) |
| `visual-design` | `arrange` |
| `think` | `plans` |

A blind rename keeps the file marked but changes what the mark says. Below is every guide where the new word no longer describes the file. Judged from each file's own title and description, nothing else.

`plans` came through clean — both files wearing it really are plans, so it is not in the table.

## `program` where the file is not about writing code

The old `wire` meant "how this is wired together" — a reference to an existing arrangement. `program` means the act of writing code. Most of the ninety-odd files that changed are genuine code references and read fine. These do not.

| Guide | What it actually is | Why `program` misreads it |
| --- | --- | --- |
| `mo / tools / hub-app` | What the Hub app is and what its screens do | A description of an app for the person using it, not of code being written |
| `di / project / overview / project` | The big picture of what happens from launch | Orientation for a newcomer; it names no code |
| `di / project / overview / map of di files` | Where everything lives in the di source | A map. Its other two tags, `journal` and `notes`, already say what it is |
| `ji / project / map of ji files` | Every source file in ji | Same — a map, not programming |
| `ov / project / map of ov files` | Every source file in overview | Same |
| `ji / setup / launching the AI` | Docker, the model, the key server, the tunnel, the password | A setup procedure. Nothing in it is written; things are installed and started |
| `ji / specifications / hierarchy spec` | What ji's arrangement of documents and tags should become | A specification — what to build, not the building |
| `ji / specifications / intersection spec` | The rules the intersection app follows | Same |
| `ws / core / styles` | One place that works out every color | Named `specify`, and about a rule rather than code. The `program` tag fights its own kind |
| `ov / operations / editing` | How the app lets you change a guide from inside it | Written for the person using the app |

## `arrange` where the file is not about arrangement

`visual-design` covered how a thing looks. `arrange` covers where things are placed. Colors, typefaces and conventions are the first thing; none of these files is the second.

| Guide | What it actually is | Why `arrange` misreads it |
| --- | --- | --- |
| `mo / develop / aesthetics` | Visual constants arrived at by small perturbations | About how things look, not where they sit |
| `mo / develop / css` | Styling patterns and gotchas | Its other tag, `style`, already carries it |
| `mo / tools / try both` | Build two versions behind one switch and look at each | A way of working. Nothing here is arranged |
| `di / ui / style` | The look every control shares | Look, not placement — and `style` says it already |
| `ws / core / styles` | Working out every color from the current state | Color. The furthest thing from arrangement |
| `ji / specifications / intersection spec` | One source of truth for every color | Same |

## Not a rename, but found while looking

| Guide | What is wrong |
| --- | --- |
| `ov / design / OKF — midway review and plan` | Carries no tags at all — its tags line is empty |
| `mo / develop / conceptual composition` | Carries no description, and one tag (`proposal`) |
| `ov / design / constants` | Its title reads "UX terms and concepts", which is the title of a different guide |

## What to do with this

Every row is a judgment about one file, so each wants a person's eye, not a sweep. The two that need no judgment are the empty tags line and the borrowed title.
