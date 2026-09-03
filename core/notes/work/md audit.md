---
kind: analyze
title: "md audit"
description: "Every md file in ov read end to end on 2026-08-22, and the improvements each wants — the drift first, then the labels, then the shape of the notes."
tags: [keep, notes, now, proposal]
date: 2026-08-22
---
# md audit

Every markdown file in `ov/` was read whole — the entry point, the four guide folders, the work notes, and the eleven in soon. Thirty-three files. The goals file was read against all of them, since it describes what this was meant to be.

The headline: **the corpus already knows its faults.** The four staleness files diagnose dead pointers, borrowed titles, hand-kept counts and bloated done-lists better than any outside reader could. What this audit adds is that the same faults now live in ov's own notes — and that the diagnoses were written down and mostly never executed. So: the drift first, then the labels, then the shape of the notes, then what would keep all of it true without a person sweeping.

## 1 — The entry points mislead

These are the files a fresh session reads first, and each one points somewhere wrong.

**CLAUDE.md** carries three faults, and it is eleven lines long:

1. "The file map is `notes/guides/map.md`" — no such file. The map lives at `notes/guides/project/map of ov files.md`. Every session told to read the map instead of discovering files using regex and wildcards starts by failing to.
2. The one-line description — "a barebones web app: a details column on the left, an accent color picker inside it" — is the phase-3 empty room. The app is now a knowledge-base browser and editor with features numbered to 72 and 410 tests. A session that trusts this line misjudges everything it touches.
3. "Nothing about documents, tags, storage, or chat belongs in this project" — written when that was true. Tags are now the app's center: a closed list, eight areas, filters, a label form. The prohibition contradicts the app it guards.

**`notes/guides/index.md`** lists one file — Editing — out of the ten guides under it. Either it lists the three subfolder indexes, or it lists everything, or it goes (see section 7 on OKF step 5). As it stands it says the guides are one file.

**`notes/work/index.md`** links "Working features" at `../../../di/notes/work/now/working features.md` and labels it **ji**. The path says di, the label says ji, and ov's own copy sits at `guides/project/working features.md` — three answers, none of them the file. The same index says soon holds "Nine notes"; soon's own index lists eleven. And it ends with an empty "## More" heading.

**Two homes for the founding document.** CLAUDE.md and work/index both send the reader to `ji/notes/work/proposals/ov.md`; the same document sits here as `guides/design/ov - goals.md`. Nothing says which is authoritative or whether they still agree. Pick one home and make the other a pointer.

## 2 — The current-state files state the old names

This is the deepest fault, because these files exist precisely to be current.

**`work/current context.md`** says "Five kinds — specify, step, wire, explain, refer." Two of those names are dead (`step` became `howto`, `wire` became `arch`) and the set itself has changed twice since (`analyze` in, `refer` and `design` out — journal, 2026-08-19). The same file says 123 tests; the journal says 410. The file whose whole job is what-you-can't-read-off-the-code is describing an earlier app.

**`guides/design/OKF.md`** is the format's home, and it no longer states the format. Its Kinds section is headed "Seven," its argument is titled "Why these five and not more," and its how-to-choose list still says **step** and **wire**. Its Tags section opens "Twenty-two," then numbers twenty-four, introducing the tail as "the last six" while listing eight. This file deserves better than a patch: split it into a short living spec (the kinds, the tags, the label rules — as they are today, one screen) and a record of how the format got here. The spec half is also exactly the `okf` encapsulation file the proposal's last section already wants.

**`work/soon/organize.md`** holds a proposed lexicon that now argues with the settled one. It says "line — never *separator* in prose"; the lexicon says "separator — never *line* in prose." It says "the drawn page"; the lexicon says "the html — never *the drawn page*." It says "piece"; the lexicon says "div — never *piece*." It also states six kinds and twenty-nine tags. A session that reads both files is being trained in two vocabularies — the exact murk cause 6, the guides modelling what they forbid. Cut the superseded proposal from organize and leave the counts, or mark the whole file as history.

**No two files agree on a number.** Gathered in one place:

| What | Said where | Says |
| --- | --- | --- |
| tags | OKF prose / OKF list / organize / map (File.ts line) | 22 / 24 / 29 / 34 |
| kinds | OKF table / organize / current context / journal 08-19 | 7 / 6 / 5 (old names) / 5 (current) |
| tag areas | features #22 / features #43 / map (Tag_Areas line) | 6 / 7 / 8 |
| tests | current context / journal | 123 / 410 |
| notes in soon | work index / soon index | 9 / 11 |

None of these was wrong when written. The rule that fixes the class: **one number, one home** — a count lives in exactly one file and every other file links to it or does without. (Section 7 offers the stronger version: no hand-kept counts at all.)

## 3 — Checkboxes that disagree with their own notes

- **`ov - goals.md` phases 5–8 are all unchecked, and all built.** The filters, the hierarchal list, opening a file, the ported tests and build notes — every unchecked box in the Content view section is live in the app. Either check them with a line saying when, or add one line above the section saying it was superseded by what got built. As written, the founding doc claims the app's main body doesn't exist.
- **The same file's success checks are marked done while their own notes say otherwise.** Items 4, 6 and 7 read `[x]` beside "hasn't been watched yet" and "written, not pressed yet." A checked box with an unverified note is the exact shape the murk journal warns about — the mark says one thing, the words another.
- **`working features.md` skips #20** (…22, 21, 19…). The assessment file dings mono's pitfalls guide for precisely this: a numbering skip says the file is not being maintained. Renumber or add the missing row.
- **`handoff.md` and `code debt.md` disagree about the first unchecked item.** Handoff says it is the guide→file rename; the debt list's first unchecked item is now the md-system audit. One sentence in handoff fixes it.

## 4 — Labels that break their own rules

The OKF label spec is five lines and these files sit within reach of it:

| File | Fault | Fix |
| --- | --- | --- |
| `work/current context.md` | empty description | write the one line |
| `work/creativity.md` | title "unnamed", empty description, two-line body | name it and grow it, or fold its one thought into code debt and delete |
| `soon/hits manager.md` | empty description | write the one line |
| `soon/ov installer.md` | empty description | write the one line |
| `work/code debt.md` | description is an instruction ("write a proposal for JUST the first unchecked item…"), repeated as the body's first line | that sentence is a standing instruction — it belongs in handoff or the body once; the description should say what the file is |
| `soon/repair staleness of files.md` | description is a corrupted mid-sentence fragment with escaped quotes | rewrite |
| `design/OKF — midway review and plan.md` | description copied from OKF.md, cut off at "at t…"; H1 reads "OKF — is it worth it?", a different question than the title | give it its own description; make title and H1 one answer |
| `design/compose an email.md` | title says "ov installer", H1 says "compose an email", and the real installer stub is `soon/ov installer.md` — two files, three names, crossed | retitle this one honestly (it is a Windows mailto setup guide); the design index's link text inherits the fix |
| `guides/project/map of ov files.md` | date 2026-07-31, content plainly mid-August | the date rule says last change of meaning; this breaks it — see section 7 |
| `work/work journal.md` | date 2026-08-10, newest entry 08-19; title is just "Work" | date; and a title that survives beside every other file's ("work journal") |
| `guides/project/working features.md` | date 2026-08-06, features through #72 | date |
| `soon/murk journal.md` | wears `now` and `stow` together — one area says active, the other says put away | pick one |

Two smaller word-level notes. The lexicon says "highlighted — never *lit*," and the features file and current context say "lit" throughout — if the lexicon governs prose in these files, they are out of compliance; if it governs only new writing, say so in the lexicon. And the murk journal links the murk guide at `collaborate/avoid murk.md` while the work journal says it landed at `collaborate/murk.md` — one of the two is a dead pointer.

## 5 — Finished work parked in soon

Soon's charter is "work that is coming." Three of its files are records of work that came and went:

- **`hits manager.md`** — the post-mortem says both fixes are in, 356 tests pass. What remains live is one proposal (the self-check) — and the journal says even that was done (feature #60). This is a record now, and a good one; its keep is the post-mortem and the risk section, which read like a guide to the manager's one danger.
- **`murk journal.md`** — "We may have conquered it." Six of twelve causes closed, the strategies already distilled into a guide. A record.
- **`mouse ux.md`** — the Conclusion says "keep both," code debt marks the item done, yet an "Undecided" section still stands with three open questions. Either answer them or strike them; a decided file with an undecided tail reads as neither.

The assessment file predicted this exact lapse — keep shop has no trigger — and cited ov's own code debt as the evidence. Which points at the other half: **code debt's done list runs to roughly three hundred lines against some sixty of live debt.** The journal already holds what's finished. Move the done list there (or into a paid file, as keep shop wants) and let the debt file be the debt.

## 6 — Four files about staleness, and none executed

`assessment of our guides`, `stale guides`, `tag drift`, and `rewrite guides` overlap heavily: the assessment names thin files, stale guides ranks the worst ten, tag drift lists the misfit tags, and rewrite guides holds a written, ready rewrite for all 21 stale-tagged files — ending "say the word on any of them and I'll do it." The word was apparently never said. Meanwhile the assessment is itself internally stale ("62 files in eight folders" above a Folders section that says seven; label date 07-08, body says counted 08-11) — and rewrite guides already sentenced it: cut the first two sections, keep the structural gaps as a short file.

The suggestion is not another analysis. It is: execute rewrite guides (its per-file verdicts are specific and mostly mechanical), then collapse the four files into two — the structural-gaps file the rewrite already proposed, and one short live list of what's still stale, which the app itself can increasingly generate.

## 7 — What would keep it true

Every fault above is drift, and drift returns unless something structural stops it. Five candidates, smallest first:

1. **One number, one home.** Better: no hand-kept counts of things the app counts. Ov already knows how many tags, kinds, areas, files and index entries there are; a note that needs the number should say "the closed list" and link, not restate it. The counts table in section 2 is five files that would then have nothing to be wrong about.
2. **Dates from the writes, not the hand.** The app writes labels on every edit; have it stamp `date` on any change that touches the body. Hand-kept dates are wrong in at least four files today, and the label spec's own rule (change of meaning, not typo) is unenforceable by memory.
3. **Point ov at its own notes.** The dead-link report and the stale sweep were built for the collections; sections 1 and 4 of this audit are mostly things those tools would have caught in `ov/notes` (the map path in CLAUDE.md, the working-features link, the murk-guide path). Ov auditing everyone but itself is how its own index went stale.
4. **A labels check in the repair section:** title unique and not "unnamed", description non-empty and not a copy of another file's, tags free of contradictory pairs (`now` + `stow`), H1 agreeing with title. Every row of section 4's table is one of these four rules.
5. **Decide OKF step 5 — the index files.** It has been open since 2026-08-08, and the indexes are where much of section 1 lives. The app already leaves them out and the folders do the job on screen; on disk they exist only for Obsidian and drag-and-drop mending. Either commit to them (and then the check in item 4 covers them) or drop them and delete the mending code. The undecided middle is what drifts.

## Do first

1. Fix CLAUDE.md — the map path, the description, the prohibition line. Five minutes, and every session after benefits.
2. Bring current context current — kinds, counts, test number — or cut its numbers per rule 1 above.
3. Split OKF into living spec + record; the spec is the encapsulation file it already asks for.
4. Sweep section 4's table — every row is a one-line fix.
5. Say the word on rewrite guides.
