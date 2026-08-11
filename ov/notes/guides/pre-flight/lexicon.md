---
kind: specify
title: "Lexicon (ov)"
description: "The exact words overview uses in prose, comments, log lines, and test names."
tags: [prose, session]
date: 2026-08-09
---

# Lexicon

The words used in this project. When writing prose, comments, log lines, or test names, use these words exactly, even when near synonyms exist. If it's here, that's its name.

Reaching for a word that is not here, say so and stop. Do not invent one.

The shared [banned words](../../../../notes/guides/pre-flight/banned%20words.md) list holds the words that mean nothing to Jonathan, each with the word to use instead. Overview's own [banned words](banned%20words.md) does the same for this project.

The words every project says — guide, work note, collection, labels, kind, tag, brief — are not repeated here.

## The two screens

- **the list** — the screen showing every guide the filters leave. Never *browse*, never *the table*.
- **the editor** — the screen showing one guide. Never *the viewer*.
- **the filters** — the four things that narrow the list: words looked for, one collection, one kind, any number of tags.
- **the count row** — the row above the list, holding the folders button, how many files are left, and what is picked.
- **the header row** — the row at the top of the list naming its columns. Never *the titles row*.

## The parts a screen is built from

- **section** — a line across the top, then whatever it holds, with equal gap above and below it. Stacks of these make a screen.
- **line** — the drawn divider between things. Never *separator* in prose, never *divider*.
- **the word on a line** — the one word riding a line, which folds away whatever the line bounds.
- **pill** — a control shaped as a rounded lozenge.
- **tagset** — one area of tags standing as a single pill. Never *area pill*.
- **seg control** — the run of tags inside an open tagset, each tag its own segment.
- **soft pointer** — the small triangle that folds a thing away. Never *mark*, never *arrow*, never *triangle*.
- **steppers** — the pair of fat marks that step from one thing to the next.
- **gap** — empty space. Never *room*, and never *padding* in prose.

## The words of a guide on screen

- **the drawn page** — a guide's markdown turned into something readable. Never *the html*, never *the rendered page*.
- **piece** — one outermost block of the drawn page: a paragraph, a heading, a table, a chunk of code. Never *block*, never *element*.
- **the box** — the plain field that stands in for a piece while that piece is being changed.
- **fold** — to put a section's own pieces out of sight. Its opposite is **unfold**. Never *collapse*, never *hide*.
- **highlighted** — marked on screen. Never *lit*.

## Everything else

- **the dispatcher** — the small server that reads and writes files on this machine. Never *the local server*, never *the backend*.
- **the ladder** — the nine steps every measurement uses, smallest first: micro, faint, tiny, small, normal, big, fat, huge, pill. A kind of measurement leaves out any step it has no use for.
