# Workflow

See [motive.md](use%20ai.md) for the origin story and philosophy behind this system. See [[development states]] for details about how work (ahem) flows.

## development states

What we are doing, in order, and the tasks that run at any time. What each item is, with its states and the mark of each, is the third table.

### the cycle, in order

| step | who | what happens | tasks run | items that change state |
| --- | --- | --- | --- | --- |
| start | co | orients: root index, handbook, project index, lexicon, the truths that match, questions read and never reported | start | none |
| debt | Jonathan | selects something from code debt.md | debt | none |
| cadence | both | pac, where, propose, decide: Jonathan frames and decides, co reads and proposes | pac, where, propose, d, drive | proposal open → decided or culled; pac open → decided; decision made; drive present → implemented → a feature or journaled |
| go | co | builds what was decided, tests before saying done | go | plan step open → built; checkbox item open → done; question asked → answered |
| v | Jonathan | looks at the screen: good, perfect or done is a sign-off, anything else a criticism | v | working feature row untried → tried |
| record | co | moves done items to the work journal, rewritten corrections to their truths with a row in distilled.md, done files to logs | record | checkbox item and plan step done → journaled; correction rewritten → placed; done folder file → in logs; proposal decided → journaled |
| consolidate | co | settles every log line since the marker into its home, the marker moved, nothing deleted; no commit | consolidate | log line new → settled; question answered → logged; idea kept → promoted or culled; decision live → final |
| commit | Jonathan | commits memory | none | none |

### at any time

| task | who | what happens | items that change state |
| --- | --- | --- | --- |
| learn | co | a mistake captured as a correction, in co's words | correction → captured |
| finished | co | finished.md written, one line per file holding done items | none |
| check | co | the memory system audited; findings reported, nothing fixed | none |
| cleanup | co | after files move: links, CLAUDE files, hooks, shorthand, maps and indexes put right | none |
| full log | co | when a log has lost lines: log.md re-assembled from every committed version, every line under its day once | none |
| define | co | a lexicon entry and its D: line | lexicon entry → defined |
| pause, mothball | co | the current context written down, to pick up later | none |

### items and their states

| item | where it lives | states | marks |
| --- | --- | --- | --- |
| checkbox item | ideas.md, a work note | open, done, journaled | `- [ ]`, `- [x]`, moved into the work journal |
| plan step | the plan | open, built, journaled | `- [ ]`, `- [x]` with a Built note, moved into the work journal |
| correction | zone/learn.md | captured, rewritten, placed | `- [ ]` in co's words, `- [x]` in Jonathan's words, moved into its truth with a row in logs/distilled.md |
| proposal | proposals.md, or a zone file of its own | open, decided or culled, journaled | its section; the word Decided, or a dated D: line saying culled and why; moved into the work journal |
| pac | zone/proposals.md, then logs/decisions.md | open, decided | its section; a dated line in decisions.md |
| decision | logs/decisions.md | live, final | its line; the line stays, dated |
| question | questions.md | asked, answered | its line; a dated D: line holding the question and its answer, the line gone from questions.md |
| log line | logs/log.md | new, settled | above the consolidated marker; below it, kept |
| idea | ideas.md | kept, promoted or culled | its line; a truth or a proposal made from it, or a dated I: line saying culled and why |
| done folder file | zone/work/done | done, in logs | the file; moved into logs |
| working feature row | working features.md | untried, tried | `[ ]`, `[x]` in the done column |
| drive | zone/drive.md | present, implemented, a feature or journaled | the file; its plan built by `drive` or `go drive`; the proposal rewritten as a working features row when it is an app feature, or else a work journal entry saying what changed and why |
| truth | truth/ | current, archived, dead | the file; in archive/; deleted, git remembering |

## Cadence

Turn-taking. Jonathan moves, co responds, Jonathan reads, Jonathan decides, co acts. Forward progress made out of small, careful, deliberate moves — not sweeping leaps.

**Roles**
    Jonathan frames the question and decides about proposals and visual feedback.
    Co researches, analyzes, proposes. In small increments. Tests, code, request visual feedback.

Co's query-response is best for Jonathan if it is precise, concise, and easy to comprehend. Long responses are wasted on him. Explanations irrelevant until asked for.

Living notes at [[cadence]].

## One truth, one place

Guides encode decisions, grouped by topic. CLAUDE.md is the entry point, the large scale map. Don't duplicate — reference.

## Where work lives

One project, three folders under `memory/<project>/`:

1. `truth/` — the concrete: the decided design, one concept per file; the lexicon, the map of source files, working features.
2. `zone/` — the present: `drive.md`, opening with the project's current state; `ideas.md`; `proposals.md`, the open pacs among them; `questions.md`; `learn.md`; work notes in `work/`, one folder down in `next/` or `soon/`.
3. `logs/` — the past, only ever added to: `log.md`, `work journal.md`, `decisions.md`, `distilled.md`, `collisions.md`.

Three files are written by tools, never by hand: code debt and dead links in shared's zone, finished in shared's logs.

## How work moves

1. A session starts per the handbook's Session phases.
2. Work is chosen from code debt.
3. A work note in `zone/work/` holds the problem, the goal, the phases as checkboxes and the next action.
4. A proposal opens as the section below says; decided, it dissolves into truth, with one line in decisions.md.
5. Built work is recorded: record moves ticked items into the work journal and rewritten corrections into their truths; consolidate settles the log.
6. A finished work note moves whole into `logs/`.

## Opening a proposal

Two lines before anything else: what we already have, and the one piece we do not.

```text
we will rely on some stuff we have

1. renderer
2. asset awareness
3. html injector      <- we need this one
```

Jonathan wrote that at the top of the photo-gallery proposal; mine had the new piece buried inside a paragraph three sections down, where it read as a step rather than as the work. The list makes the whole structure plain: two things to lean on, one thing to build.

Check every name on the list before writing it down. He had to ask whether all three existed, and one of them did not.

## Tidying up

Reorganize and merge files so each has one clear job — removing duplication, sharpening purpose, finding the right home for each piece. (For changing a single doc, see Safe updating below.)

**The process:**

1. Read what exists
2. Spot overlap and blur
3. Propose cleaner splits
4. Move or merge until each file has one clear job
5. Trim dated material and work-in-progress hedging

**The goal:** Fewer files, clearer purposes, easier to find things, easier to maintain. Less confusion for both co and Jonathan.

## Safe updating

When updating a work doc — milestones, notes, plans — keep its content intact. (For reorganizing across files, see Tidying up above.)

1. **Reorder, don't remove.** Move sections around to improve flow — never delete material.
2. **"Propose a rewrite" means propose.** Present the plan, wait for approval before touching the file.
3. **Summarize by adding, not replacing.** If a synopsis or summary would help, add it alongside the original — don't compress the original into it.
4. **Design notes are not clutter.** Type definitions, rationale, lifecycle rules, error source mappings — these are decisions, not noise. They stay.
5. **When in doubt, add a section.** A new "synopsis" or "open items" section at the top costs nothing. Gutting the middle to make room costs everything.

## Fixing friction before the work

Sometimes the real task stalls not on the problem but on how co and Jonathan work together. The usual causes: words co uses with no agreed meaning, over-confident wrong reads that fight what Jonathan plainly sees, or a check that fires on the wrong thing. When the same friction derails turn after turn, pause the task and fix it at its source — that friction taxes every later turn, the task included, so the fix is an investment, not a digression.

How to run such a pause:

1. **Trust what Jonathan observes** over co's reasoning and over the logs (BOTH are often WRONG).
2. **Fix the cause, not a symptom.** ALWAYS formulate ONE source of truth. Assure that the rule and the tool that enforces it cannot drift apart.
3. **Write the lesson down as a rule** so it outlives the session — for example, "NEVER use a word with no agreed, shared meaning; ALWAYS FIRST propose it for the lexicon."
4. **Allow pauses and tangents.** A translate-fix is a temporary aside. In the current project's [[memory/ji/zone/work/handoff]] file, record where the real task was paused — from which it can resume.

## Regular review

Are these guides effective and intelligible? Are they smooth, engaging and gentle? Are they brief and precise?

Jonathan can only read a little at a time and immediately his comprehension plummets. This is not good. Makes him wonder how many of these files are doing what was intended, or indeed ANYTHING useful. Of course they MUST be readable by him.

Journal it here. Jonathan will read the first bit of this file. first he will ask co to read it. then he will edit it until it makes sense. then he will ask co to compare and to learn from his example. Thus...

### Grow the guides the way the lexicon grows

Evidence so far suggests that Jonathan cannot describe what is optimal. Rules and more rules end up tangled rather than dialing in. Our lexicon experiment tells us that when co records each correction Jonathan gives, co can use it to grow the lexicon, and that co's responses have gotten easier for Jonathan to read — enough to stay in the flow.

This same growth strategy will work for the guides, for one reason: every lexicon entry comes from a correction Jonathan actually made, in his preferred words.

**1.** When Jonathan corrects co, that correction becomes one line of a guide, in the words he used. It happens immediately.

**2.** However, before adding that line, look for a line already saying something close. If there is one, the new line takes its place. So a guide holds about as many lines as Jonathan has made distinct complaints, and never more.

**3.** Adding and removing will hopefully improve communication in general, and also specifically with his understanding of each rule.

## Writing design documents

See [create a design](develop/create%20a%20design.md).
