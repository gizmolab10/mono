---
title: "Simplify gaps"
description: "How the two filter stacks size their rows: the slot owns the reach, rows hold plain padding in rungs, the tags run holds its own headroom."
date: 2026-09-05
---
# Simplify gaps

How the spacing around every filter row is made, in both browse and edit. Three layers, each with one job. The numbers are today's rungs — [[constants & subtypes]].

## the slot

The stack gives every section a slot. A slot runs from the middle of the line above it to the middle of the line below it: its `padding-top` and `padding-bottom` are half the spacing each, where spacing is the stack's gap plus its line thickness — browse and the editor both hand it `gap.big` 9.72 and `thickness.normal` 1.11, so 10.83, and a half-gap is 5.42. The line above a section is drawn on the slot's top edge. The first section holds no half-gap above itself unless the stack leads with a line; then its slot begins on that line, the same as every other.

A section that handles mouse clicks says so in its `Stacked` entry, `answers`: the hit target's name, its kind, its press or release, and its tip. The stack registers the slot itself as the target and changes the bg color of the slot on hover — half-gaps and all — and disables the handler while the section is folded. A section handed `highlighted` is filled the same way from outside, which is how the editor's four way-out sections light as one. No row reaches over the half-gaps, and no filter file names `--over` or `--under`.

A shut section — folded, or open with nothing to show — is `height.small` 17.5 tall, border-box, so the line below it sits the folded distance below its own line whether it folded one field or a run of tag rows. The last section under a line drawn by whoever holds the stack gives back what that line is thicker than the stack's own, so the line's bottom edge sits where a usual line's would. Only a fold is filled with the accent; an empty section shows the page color. The stack leaves half a gap below its last section, and nothing at all below a shut one.

Browse hands its stack `under`, the thickness of the count section's edge: thin, 1.11, while the tags are folded, heavy, 7.78, while they are open, starved included. The editor's stack ends on the form's own foot.

## the row

A row's breathing gap is plain `padding-top` and `padding-bottom`, each a rung, inside the slot's half-gaps.

Browse, in Browse_Filters: the search row a small gap, 4.32, above and below its field; the projects and kinds rows a small gap above and below; the tags run's holder a small gap above.

The editor, in Edit_Filters: every label row one gap, 7.78, below; the search row a faint gap, 1.94, above its field and a tiny plus a faint, 5.83, below, one gap in all; the kinds row a tiny gap, 3.89, above and below; the information rows a small gap below, with a small gap above the fields inside; the tags run's holder a small gap above and one gap below.

## the tags run

Both tags runs hold a small gap, 4.32, of `margin-top` always. A tagset's name rides above its pill's top edge when the area is open, when one tag is all that is left of it, or when something in it is picked; the margin keeps a name on the top row clear of the line overhead. Nothing measures whether a name rides. The margin sits outside the height `smooth_height` states for the run, so it never joins the slide when the run changes height. Tag_Rows, which measured the top row, has no caller.

## the starved case

When the search text leaves a projects, kinds or tags section nothing to offer, the section is `empty`: it renders nothing, the stack sizes its slot as a fold, and its line carries the 'no options for current search' label in place of the centered clickable. Folding and unfolding it moves nothing below it. Browse's tags keep the heavy line below them either way.
