---
type: design
title: Controls
description: How the list's filters and the editor's controls behave.
tags: [filters, controls, editor]
use_when: [filter work, segmented controls, tag picking, editor title row]
updated: 26 August 2026
---
# Controls in the UX

The memory system is a collection in the projects filter. Its files carry their own bundle; the memory/ prefix is stripped from their paths.

Projects allow more than one pick. Empty means all. The project column shows unless exactly one is picked. The kinds row offers only kinds with matches; a picked kind that loses its last match clears itself.

The option-click ladder, on every multi-select control: plain click toggles one; option-click keeps only that one, inside its own control (one tagset); command-option-click keeps only that one everywhere. hit_target hands every press its mouse state, so held keys can be read.

Indents: sub-filter fold words stand in from the edge by --gap-big; a child row in the files list indents by --gap-big per level. Each row's tags end with the picked tags, in the picked order, so the right edge matches the tags filter.

The editor's title tools are four buttons riding the form's top line, right of the fold word, hidden while the form is folded. Each is a direction: title onto the top heading, top heading into the title, title onto the filename (a rename, lowercased, links and all), filename into the title (capitalized). Their holder on the separator is transparent — each button masks the line for itself, so the line shows through the gaps (`transparent` on Action). The page redraws whenever the body under the labels changes from outside; label-only saves leave it alone. The line's press-anywhere-folds contract is retired.
