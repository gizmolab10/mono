---
kind: analyze
title: "How many md files? 531"
description: "What is actually in the repo, in markdown"
tags: [plans, proposal, soon]
date: 2026-08-08
---
# How many md files? 531

What is actually in the repo, in markdown. Counted 2026-08-01, skipping installed packages, built output, and the worktree copies.

## **By project**

| Where | Files |
| --- | --- |
| di | 197 |
| shared (mono) | 167 |
| ws | 101 |
| ji | 38 |
| ga | 13 |
| ov | 12 |
| me | 3 |

## **By what they are**

| Kind | Files |
| --- | --- |
| work notes | 286 |
| guides | 169 |
| loose — neither guides nor work | 61 |
| manuals | 12 |
| archives | 3 |

## What stands out

1. **Work notes outnumber guides two to one.** 286 files of in-flight thinking against 169 of settled guidance. Overview shows only the 169; the larger half of what's written is invisible to it.
2. **138 of the 169 guides are listed.** The other 31 are index files, left out on purpose since the folders do that job.
3. **61 files sit outside both** — neither guide nor work note. Nine of them sit loose at a project's top: a stray dated file, five read-me files, a project template, and a note called `uniface.md`.
4. **di holds more markdown than the shared collection**, and nearly twice ws — but only 52 of di's 197 files are guides.

## Next

- Should we include work notes here? The app is deliberately about guides; the count says that leaves most of the writing out.
- Analyze the loose files. What are they for? Does anything belong in guides, in work, or deletion?
- Focus on murky, what are its causes. [[Voice]], [[replying]], [[chat]], [[shorthand]], [[sparse replies]], [[CLAUDE]], [[guides.layout]], [[ov/notes/guides/pre-flight/lexicon]], 

## Proposal — two lexicons, one shared and one for overview

### Success

1. Every word for a thing has exactly one home: the shared lexicon if more than one project says it, overview's own if only overview does.
2. Asked a question, I answer with those words and no others. Reaching for a word that is in neither, I say so and stop rather than inventing one.
3. Neither file repeats the other. A word in the shared one is never restated in overview's.

### Why now

di and ji each keep a lexicon; the shared collection does not, and neither does overview. So the words that every project says — guide, collection, labels, kind, tag — have no home at all, and the words overview alone says have none either. Variation in what I call a thing is the murkiness being chased in the line above.

`di/notes/guides/pre-flight/lexicon.md` — the model. `notes/guides/collaborate/voice.md:56` already says "prefer lexicon", pointing at a file that does not exist for this work.

### What moves to the shared collection

These are said by every project, so they belong at the top, not in overview:

| Word | What it means |
| --- | --- |
| guide | one settled file under a project's guides folder |
| work note | one in-flight file under a project's work folder — never a guide |
| collection | one project's whole set: mo, ws, di, ji, ov. Never "bundle", never "repo" |
| labels | the block at the top of a guide — five things, always in this order |
| kind | one of the six: specify, howto, arch, explain, refer, design |
| tag | one of the twenty-nine on the closed list. A file wears any number |
| tag area | one of the seven groupings the tags are read in. Only a way of reading them |
| brief | the one line saying what a guide is for. Never "description" |
| title | what a guide calls itself. Falls back to the file's own name |
| index file | the file beside a folder's contents listing them. Never a guide |
| map | the file naming every file in a project. One for the code, one for the guides |
| handoff | the one thing to do next |
| code debt | everything still owed |
| journal | what has been finished, newest first |
| proposal | success first, then the shape of it, then the risk |
| the collaborator | me. Also "co". Never "the assistant", never "the AI" |

### A starting lexicon for overview

Gathered from the words already in the code and the notes, not invented here.

#### The two screens

| Word | What it means |
| --- | --- |
| the list | the screen showing every guide the filters leave |
| the editor | the screen showing one guide |
| the filters | the four things that narrow the list: words, collection, kind, tags |
| the count row | the row above the list: the folders button, how many files, what is picked |
| the header row | the row at the top of the list naming its columns |

#### The parts a screen is built from

| Word | What it means |
| --- | --- |
| section | a line across the top, then what it holds, with equal gap above and below |
| line | the drawn divider. Never "separator" in prose, never "divider" |
| the word on a line | the one word riding a line, which folds what the line bounds |
| pill | a control shaped as a rounded lozenge |
| tagset | one area of tags standing as a single pill |
| seg control | the run of tags inside an open tagset, each its own segment |
| soft pointer | the small triangle that folds a thing away |
| steppers | the pair of marks that step from one thing to the next |
| gap | empty space. Never "room", never "padding" in prose |

#### The words of a guide on screen

| Word | What it means |
| --- | --- |
| the drawn page | a guide's markdown turned into something readable |
| piece | one outermost block of the drawn page — a paragraph, a heading, a table |
| the box | the field that stands in for a piece while it is being changed |
| fold | to put a section's own pieces out of sight. Its opposite is unfold |
| highlighted | marked on screen. Never "lit" |

#### Everything else

| Word | What it means |
| --- | --- |
| the dispatcher | the small server that reads and writes files. Never "the local server" |
| the ladder | the nine steps every measurement uses: micro, faint, tiny, small, normal, big, fat, huge, pill |

### The order

The shared file first, since overview's own cannot be written without knowing what it must not repeat. Then overview's. Then a line in each project's always file pointing at both.

