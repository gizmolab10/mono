---
kind: explain
title: "OKF — turning the guides into a knowledge bundle"
description: "OKF is an open format for curated knowledge: a folder of markdown files kept in version control, one concept per file, each with a small block of labels at t..."
tags: [keep, proposal, incorporated]
date: 2026-08-08
---
# OKF — turning the guides into a knowledge bundle

OKF is an open format for curated knowledge: a folder of markdown files kept in version control, one concept per file, each with a small block of labels at the top. Source: [OKF + RAG](https://medium.com/@ravishkhullar/okf-rag-the-ultimate-ai-agent-architecture-26b9ceed44f1).

The guides are already most of the way there — markdown, in folders, under version control. What's missing is the labels and the one-concept-per-file rule. This covers the project guides as well as the shared ones: 165 files in four bundles, 50 shared, 67 in di, 40 in ws, 8 in ji. 31 of those are index files whose fate step 5 decides, leaving 134 that need a label block.

## Steps

1. [x] **Fix the label set.** Five labels: kind, title, description, tags, date. Settled below.
2. [x] **Choose the kinds.** Five of them, and the order for picking one. Settled below.
3. [x] **Add the label block to each guide.** 134 files, done. The body of each file was left exactly as it was — the block sits above it, fenced by three dashes above and below, in the order kind, title, description, tags, date. No title is repeated.
4. [ ] **Split the files that cover several things.** One concept per file. The always file is the deliberate exception — it stays whole and its rules carry their own tags instead.
5. [ ] **Decide what happens to the index files.** Either drop them, since the labels do that job now, or keep one list per folder.
6. [ ] **Verify.** Every file's label block reads cleanly, every tag is on the list, every title is unique.

## Labels

Five labels, every file, same order, no extras. Anything a label can't hold belongs in the body.

| Label | What it holds |
| --- | --- |
| kind | What sort of guidance this is. One word, from the Kinds list below. |
| title | The human name. Unique across every guide, so no two files answer to the same call. |
| description | One sentence: what this file tells you to do. Written so it stands alone in a search result. |
| tags | One or more from the closed list below. Nothing invented on the spot. |
| date | Last real change, as year-month-day. Not a fix to a typo — a change of meaning. |

Left out: an **owner** label, saying who decides what a file says. In a two-person shop the answer is Jonathan every time. A label block is plain text, so a sixth line can go in with one pass over the files whenever it earns its place.

## Tags (closed list)

Twenty-two. The first sixteen came from the shared guides — the folder-by-folder rundown in [synopsis of our guides](../../../../notes/guides/assessment%20of%20our%20guides.md) is where each one came from. The last six came from the project guides, which are a different animal: they describe apps rather than tell me how to work.

The folder a file sits in is not a tag. A tag says what the file is *about*, so two files in different folders about the same thing find each other.

1. **team** — who does what, turn-taking, proposals, designs
2. **prose** — voice, journals, how writing should read
3. **session** — what to read or do before acting
4. **style** — naming, formatting, how code is organized
5. **visual-design** — look and feel, spacing, styling
6. **refactor** — reshaping code that already works
7. **migrate** — moving a component to a new shape
8. **test** — writing and running tests
9. **debug** — finding out why something is wrong
10. **build** — the tools that turn source into a site
11. **deploy** — getting a built site online
12. **setup** — getting a machine or an account ready
13. **tools** — a single tool's own quirks
14. **vision** — why the work is shaped this way
15. **port** — moving work between projects
16. **notes** — keeping the note files themselves in order

From the project guides:

17. **wire** — how the parts of an app fit together, and what each part is responsible for
18. **data** — what gets stored, where it lives, and how it survives a reload
19. **geometry** — shapes, positions, angles, and the math that places things in space
20. **UX** — the parts a person sees and touches: controls, layout, selection, navigation
21. **platform** — what a particular host or framework demands of us
22. **research** — a subject studied before deciding, not a decision already made
23. **stale** — this one has fallen behind what it describes, and wants a rewrite
24. **think** — something here is unsettled and wants working out before it is acted on

Where the last six land, so the list can be checked against real files rather than taken on faith: **wire** on the top-level overviews and ji's three specs; **data** on what ws calls databases, state, preferences, and recents; **geometry** on di's algebra, axes, rotation, faces, and both dimension files; **UX** on di's components and ws's ux files; **platform** on ws's five platforms files; **research** on di's four study files.

New tags are not forbidden forever, but adding one means adding it here first. That's the whole point of closing the list.

## Kinds

Seven. The test each one has to pass: knowing the kind changes what I do with the file before I have read a word of it.

The first five say how a guide reads. The last two say what it is about, and were folded in when the separate purpose filter went — asking the same question twice, once by the folder a file sits in and once by the file's own words, meant two places to look and two ways to be wrong.

| Kind | What it means | What I do with it |
| --- | --- | --- |
| specify | A standing instruction. Breaking it is a mistake. | Obey it, every time, without being asked. |
| howto | Steps for a task, when that task comes up. | Follow it start to finish while doing that task. |
| refer | Facts, commands, names, quirks. | Look things up in it. Never obey it. |
| arch | How one part of an app actually works. | Read it before touching that part. |
| explain | Why the work is shaped this way. | Read it to judge a call the other kinds don't cover. |
| design | A record of how something was built. | Read it to learn what was already decided and why. |
| work | A note about work in hand. | Read it to pick up where the work was left. |

### Why these five and not more

The obey/follow/look-up divide is the whole point — those three cover most of the shared guides and they are genuinely different acts. **arch** earns its place on volume alone: 70 of the 165 files sit under an architecture folder, and none of the first three fit them. **explain** earns its place because those files answer a question the others can't — what to do when no rule applies.

Everything else I considered folded in:

1. A **record** kind for the running logs of past mistakes. It folds into specify: the whole reason those files are read at session start is "never do this again", which is an instruction, not history.
2. A **specification** kind for ji's three spec files. It folds into arch: a spec says how a part works, written before the part exists instead of after.
3. A **map** kind for the index files. Held until step 5 decides whether index files survive at all.

### How the kind is chosen

One question at a time, first yes wins:

1. Is it a record of how something was built? → **design**
2. Is it a note about work in hand? → **work**
3. Does it tell me what to do at all times? → **specify**
4. Does it tell me how to carry out one task? → **step**
5. Does it describe a part of an app? → **wire**
6. Does it explain why rather than what? → **explain**
7. Otherwise → **refer**

Order matters because files straddle. The debugging guide is two principles plus some technique — the first question catches it as a rule, which is right, because those principles apply whether or not I am debugging.

## Reorganize the guides

So it is much easier for me to

1. [ ] grok the big picture
2. [ ] explore specific issues

No two of the four bundles agree on how they are arranged, so neither goal is reachable today.

### One shape, all four bundles

The shared guides use eight folders. di uses four, ws uses two, ji uses three and leaves three files loose at the top. The same subject lands somewhere different each time — how code should look is `develop/style.md` in the shared guides, `collaborate/style.md` in ws, and `architecture/ui/style.md` in di. Testing is `test/testing.md` shared and `project/philosophy/testing.md` in di.

So: one folder shape, used in all four. A folder that a bundle has nothing to say about simply isn't there. Then I can walk any project and already know where I am.

### A map page per bundle, built from the labels

Every file's title and description, listed on one page, grouped by kind. That page is the big picture, and it is not hand-written — it is assembled from what the labels already say, so it cannot drift out of step with the files the way a hand-kept summary does. Today's hand-kept summary is [synopsis of our guides](../../../../notes/guides/assessment%20of%20our%20guides.md); it is thorough and it is stale the moment a file changes.

One map per bundle, plus one that stitches the four together. Reading the stitched one is every guide in a few minutes.

### Tags are the way in to a specific issue

Once every file is labeled, a specific issue starts as a tag, not as a guess about which folder someone filed it under. Two files in different projects about the same trouble find each other. This is why the tag list is closed — an open list drifts into synonyms and the search quietly stops working.

## Success

Every one of the 134 files carries a valid label block. No file covers two concepts, except the always file, whose rules carry their own tags. Asking for "everything tagged test" returns the right set by reading the labels alone.

## ov — the map page, made live

The map page above is the part of this that can't be hand-written without going stale. So it isn't a page — it's an app. `ov`, short for overview, is a small web app whose whole job is to be the picture of these four collections. Its proposal is [ov](ov%20-%20goals.md); the summary is here because this is the plan it serves.

It reaches outside its own folder on purpose: the guides are the thing it shows. What travels with it is only their addresses. At launch it reads each file once, keeps the five labels off the top, and lets the rest go — so the picture cannot drift from the files, because it *is* the files, read fresh every time.

On screen: a details column on the left with the accent color picker, and beside it the guides. Across the top of that, the three ways in — one kind at a time, any number of tags, and words looked for in the titles and descriptions. Below, the files themselves, folders leading their contents, each folder opening and shutting and remembering which it was.

Both of this proposal's goals fall out of that:

- **The big picture** — every file and folder in one list, and a count on each folder saying how many of the files under it match what's asked for.
- **A specific issue** — pick a tag, and every file about it appears whichever collection it sits in, its folders pulled back on screen around it.

What it found on its first run, which is the check on this whole plan: 165 files across four collections, 31 of them index files (left out, since the folders do that job now), leaving 134 — every one carrying a full label block, none missing. All five kinds turn up. All 22 tags turn up, across 241 placements.

That last count is the argument for closing the tag list: overview shows the tags as a row of pills, and a list that drifts into synonyms becomes a row nobody can read.

## Why no database

One question decides where the truth lives: can a person change this thing without the app running? For guides the answer is yes, every day, in Obsidian and in an editor — so the file is the truth and the labels belong in it. A database would hold the same five labels a second time, and two places that can both be authored will disagree, with nothing able to say which is right. Put the labels in the file instead and the app is one reader among many; losing it costs nothing, and there is no schema, no migration, and no second copy to keep true. The trade is that every question is answered by walking what was read at launch — 175 files and 1.4 million characters, of which only the labels are kept. Size never flips this: when that read starts to hurt, the answer is a store that mirrors the files and can be thrown away, never one that owns them. ji is the other case, and that is why the same code came over here with its storage deliberately left behind.

## Encapsulate for opensourcing

Everything this proposal defines — the five kinds, the twenty-four tags, the short names of the collections, and the handling that goes with them — is spread across overview's files today. The idea is to gather it into one file of its own, at `ov/src/lib/ts/common/okf`, so that the format has a single home in the code.

**Pro.** Every rule of the format lands in one place: the kinds, the tags, the collection names, reading the labels off a file's top, and throwing out a tag that isn't on the list. What a guide *is* — its shape as a thing the app holds — stays separate from what the format *allows*. Adding a tag or a collection becomes a one-file change. And when the format goes out into the world, the file that defines it is the file you hand over.

**Con.** The sweeps that find the files can't follow. The build reads each collection's folder path literally and cannot follow a name, so either a collection's short name and where its files live end up in two different files, or the new file takes on finding files as well as defining the format.

Evidence: `ov/src/lib/ts/managers/Guides.ts`, the note above the sweeps — "These patterns must be written out in full — the build reads them literally and cannot follow a name."

Nothing else breaks: the filters, the list and the reading view already read the kinds and the tags from one place.
