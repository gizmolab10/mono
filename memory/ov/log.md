---
kind: analyze
title: "ov log"
description: "<!-- consolidated: 26 August 2026 -->"
tags: [journal, now]
date: 2026-08-26
---
# ov log

<!-- consolidated: 26 August 2026 -->

## 28 August 2026
- D: the title tools show whenever the form is open, folded information or not — they act on state, not on anything drawn; the information clickable says only its name, open or folded
- D: 'more' lost the scissors; a guide with no back links gets no back-links row at all; the title tools stand centered on the information line
- D: the form's clickable reads '✂ more' now; back links moved inside the form below search (bare, like search); the four title tools moved onto the information line; the region-foot padding change was reverted
- D: the view region holds --thick-huge more padding at its foot; the back links line was too high and a margin could not lower it — the markdown page is flex:1 and gives back what a margin takes
- D: a Section can ask for the accent while folded (accent_when_folded); the back links section does, and takes one huge less than the usual folded height
- D: the back links section gained a clickable, 'back links' — folded it says the count; remembered as show_backlinks
- D: the list's closing line is thin while the tags are folded, heavy while they are open
- D: the line at the foot of a filter stack is always drawn while the stack is on screen, whatever is folded — in the editor by the form's own foot, in the list by the count section's heavy edge; both stacks are told foot='below', so a last fold ends against that line rather than drawing one
- D: renamed for one meaning each: fold word → clickable, file's words → file's contents, word rows → information rows, w_words → w_search_text, onsay(words) → onshow(message)
- D: only the search section holds --gap below its content — the field is a box with an edge of its own; every other section keeps the half-space the stack leaves, and the stale label-rows.first rule went
- D: a stack's fold word is built by the stack's owner, never inside the section it folds — the search word vanished with its own row and could not bring it back
- D: the search row moved inside the filters stack, at the top — Search can now stand bare and hand its fold word out, the editor passes page and the search ref through the form
- D: a section's background fades at twice the length of a button's — hover 333ms, hover_section 666ms, both pushed onto the page at startup
- D: every section background that lights now fades — the one rule in main.css names them all
- D: the fade rule still named guides-table, renamed files-table long ago, so list rows had been jumping

## 27 August 2026
- I: proposal — code debt lives in the zone like ideas, never in truth; zone/debt.md per project, done items deleted and logged, settle triages it, an idea promoted becomes debt before it becomes truth
- D: handoff.md and code debt.md moved from ov/notes/work into memory/ov/zone, as they were — history and all; the old index no longer names them, the death list records the move
- D: the editor's label form gains a 'use when' field — several occasions, one to a line, written as `use_when: [a, b]` and only when the guide names any; read back from either shape
- D: the form's word rows are a folded section of their own now, 'information', its word riding a line under the heavy one at the same indent as kinds and tags; title, brief, date and use when live in it

- Q: fold ov/notes/guides/pre-flight/lexicon.md into truth/lexicon.md, or leave it where ov's CLAUDE.md already points? (carried from 22 August)
