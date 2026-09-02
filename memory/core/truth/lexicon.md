---
type: reference
title: ov lexicon
description: The exact words ov uses in prose, comments, log lines, and test names — the one home.
tags: [lexicon, terminology, incorporated]
use_when: [every ov session]
updated: 29 August 2026
---
# ov lexicon

The words used in this project. When writing prose, comments, log lines, or test names, use these words exactly, even when near synonyms exist. If it's here, that's its name. Reaching for a word that is not here, say so and stop — do not invent one.

The shared [banned words](../../../notes/guides/pre-flight/banned%20words.md) list holds the words that mean nothing to Jonathan, each with the word to use instead; ov's own [banned words](../../../ov/notes/guides/pre-flight/banned%20words.md) does the same for this project. The words every project says — guide, work note, collection, labels, kind, tag, brief — are not repeated here.

## Three views (details, browser, editor)

- **files list** — the screen showing every guide the filters leave. Never *the table*.
- **editor** — the screen showing one guide. Never *viewer*.
- **filters** — the things that narrow the list: search text, any number of projects, one kind, any number of tags.
- **count row** — the row above the files list, holding the folders button, how many files are left, and what is picked.
- **header row** — the row at the top of the files list naming its columns. Never *the titles row*.

## The elements

- **stack** — a run of sections, a gap between each pair, a separator standing centred in every gap. The gap belongs to the stack, and the stack owns every measurement in the app's spacing.
- **section** — one thing in a stack: plain markup, the clickable riding the separator above it, and whether it is folded. It names no gap and no separator of its own.
- **subsection** — a section of a stack that is itself a section of another stack.
- **separator** — the drawn divider between things. Never *line* in prose, never *divider*. Drawn with flares at each end.
- **clickable** — the pill button standing on a separator that folds the section below it away, and says what it hides while folded. Not: any other button; not a word in the file's contents.
- **information rows** — the rows of the editor's label form holding title, date, brief and use when. Not: the kinds row, the tag rows.
- **pill** — a control shaped as a rounded lozenge.
- **tagset** — one area of tags standing as a single pill. Never *area pill*.
- **seg control** — the run of elements inside an elongated pill.
- **soft pointer** — the small triangle that folds a thing away. Never *mark*, never *arrow*, never *triangle*.
- **steppers** — the pair of fat triangles that step from one thing to the next.
- **gap** — empty space. Never *room*.

## Presenting a file

- **the html** — a guide's markdown turned into something readable. Never *the drawn page*, never *the rendered page*.
- **div** — one outermost div of the html: a paragraph, a heading, a table, a chunk of code. Never *block*, never *piece*, never *element*.
- **fold** — to hide a section's content. Its opposite is **unfold**. Never *collapse*, never *hide*.
- **highlighted** — marked on screen. Never *lit*.

## Everything else

- **dispatcher** — the small server that reads and writes files on this machine. Never *local server*, never *backend*.
- **ladder** — the nine increments every set of constants can define, smallest first: micro, faint, tiny, small, normal, big, fat, huge, pill. Sets can define only some of the increments.
