---
type: design
title: Controls
description: How the list's filters and the editor's controls behave.
tags: [filters, controls, editor]
use_when: [filter work, segmented controls, tag picking, editor title row]
updated: 2026-08-25
---
# Controls

The memory system is a collection in the projects filter. Its files carry their own bundle; the memory/ prefix is stripped from their paths.

Projects allow more than one pick. Empty means all. The project column shows unless exactly one is picked. The kinds row offers only kinds with matches; a picked kind that loses its last match clears itself.

The option-click ladder, on every multi-select control: plain click toggles one; option-click keeps only that one, inside its own control (one tagset); command-option-click keeps only that one everywhere. hit_target hands every press its mouse state, so held keys can be read.

Indents: sub-filter fold words stand in from the edge by --gap-big; a child row in the files list indents by --gap-big per level. Each row's tags end with the picked tags, in the picked order, so the right edge matches the tags filter.

The editor's title tools — copy to H1, grab title from filename — ride the form's top line, right of the fold word, and hide while the form is folded. The line's press-anywhere-folds contract is retired.
