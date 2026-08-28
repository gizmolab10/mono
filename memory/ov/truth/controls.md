---
type: design
title: Controls
description: How the list's filters and the editor's controls behave.
tags: [filters, controls, editor]
use_when: [filter work, segmented controls, tag picking, editor title row]
updated: 28 August 2026
---
# Controls in the UX

The memory system is a collection in the projects filter. Its files carry their own bundle; the memory/ prefix is stripped from their paths.

Projects allow more than one pick. Empty means all. The project column shows unless exactly one is picked. The kinds row offers only kinds with matches; a picked kind that loses its last match clears itself.

The option-click ladder, on every multi-select control: plain click toggles one; option-click keeps only that one, inside its own control (one tagset); command-option-click keeps only that one everywhere. hit_target hands every press its mouse state, so held keys can be read.

Indents: sub-filter clickables stand in from the edge by --gap-big; a child row in the files list indents by --gap-big per level. Each row's tags end with the picked tags, in the picked order, so the right edge matches the tags filter.

Every background that lights fades in and out, two timings said once in main.css. Buttons, pills, clickables and a row of the list take `--hover-fade`; a whole section's background — section bodies, the tag areas' bare space, the editor's filter block, its label rows, its top rows — takes `--hover-fade-section`, twice as slow, since it moves far more color.

The editor's form is folded by one clickable reading 'more'. It is five stacked sections: search, back links, information (title, date, brief, use when), kinds, tags — each with its own clickable riding the line above it, all five indented alike. The search section's line is the stack's own leading one, drawn under the section's heavy line. The search section holds `--gap` below its field, over and above the half-space the stack leaves; the field is a box with an edge of its own and needs room a row of plain words does not. Every clickable is built by the form, in its own out-of-sight row, never inside the section it folds: a folded section draws nothing, so a clickable built inside it would disappear with the row and leave nothing to press. Search stands bare there — it draws its own section only when something else places it — and folding the whole form now folds the search row with it. The line at the foot of either filter stack is always drawn while that stack is on screen, whatever is folded among its sections — in the editor by the form's own foot, in the list by the count section's heavy edge. Both stacks are told the line below is somebody else's, so a last fold ends against it rather than drawing one of its own. In the list that line is thin (`--thick`) while the tags are folded and heavy while they are open: folded, what it closes off is a run of accent rather than a row of pills. Folded, each clickable says what it hides: the title, the kind, the tags worn.

`use when` holds several occasions, one to a line. It is written into the file as `use_when: [a, b]`, and only when the guide names any; both that shape and one-name-to-a-line are read back.

The region holding a view keeps one heavy line more padding at its foot than at its other three edges — whatever ends down there otherwise stands hard against the rounded corner while everything else has a whole gap around it. Nothing lowers itself with a margin: the page above is `flex: 1` and gives back whatever a margin takes.

The back links live inside the form, below search, standing bare there like search does; the form builds their clickable, which folded says how many guides point here. With nothing pointing here the row does not exist at all — no fold, no clickable. The fold is remembered across visits. Back_Links still draws a section of its own when something places it alone.

The editor's title tools are four buttons standing centered on the information section's line, hidden only while the whole form is folded — they act on the form's state, so the information section folding leaves them. Its clickable says only 'information', open or folded. Each is a direction: title onto the top heading, top heading into the title, title onto the filename (a rename, lowercased, links and all), filename into the title (capitalized). Their holder on the separator is transparent — each button masks the line for itself, so the line shows through the gaps (`transparent` on Action). The page redraws whenever the body under the labels changes from outside; label-only saves leave it alone. The line's press-anywhere-folds contract is retired.
