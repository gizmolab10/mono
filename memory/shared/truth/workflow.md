# Workflow

See [motive.md](../archive/use%20ai.md) for the origin story and philosophy behind this system. How work (ahem) flows, step by step, is below, cadence.md merged in here 19 September 2026.

## The rhythm (see [workflow.svg](artwork/workflow.svg))

**Turn-taking**. Jonathan moves, co responds, Jonathan reads, Jonathan decides, co acts. Baby steps. Forward progress made out of small, careful, deliberate moves — not sweeping leaps. Each move is well-considered before it happens. **BAD**: Reconsidering afterwards is slow and prone to going in circles. This is drawn in [workflow.svg](artwork/workflow.svg): one turn, back and forth, the eight steps a column, each step a row with the command, the act and the items it moves.

i think cadence is much simpler -> just back and forth. each receives and then gives. co receives commands and acts and then gives results. jonathan gives commands and receives the results. simple.

the commands vary among a set described in [[shorthand]], a file that also describes co's action. Jonathan chooses a command that moves the project forward carefully.

**v** is the look at what co built, after co acts and before record: good, perfect or done approves it, and anything else is a criticism that sends it back to go.

## Each turn goes back and forth

Each step is the same shape: Jonathan gives a command, co acts, co gives the result. The command is a word from [shorthand](shorthand.md).

1. **start.** The command: `/p`, or the first words of the session. Co orients: the indexes, the handbook, the lexicon, the truths that match. Co gives back two lines, the current state and the truths loaded.
2. **debt.** The command: `debt`, or `/cd`. Co writes code debt.md. Jonathan picks one thing from it.
3. **cadence.** The commands: `pac`, `proposal`, `where`, `d`, `drive X`. Co reads and proposes, one line per thing that changes; a pac is a section in zone/proposals.md. Jonathan decides: `d` writes a dated line in logs/decisions.md and a D: line in the log. Nothing is built yet.
4. **go.** The command: `go`, or `drive`. Co builds what was decided, tests it, and says done only when it works. A plan step, a checkbox item or a question moves. Co gives back what changed and what was measured.
5. **v.** The command: `v`, then one word. good, perfect or done approves. Anything else is a criticism, and the work goes back to go.
6. **record.** The command: `record`. Co moves ticked items and decided proposals into the work journal, ticked corrections into their truths with a row in distilled.md, and done files into logs. Co gives back what moved.
7. **consolidate.** The command: `consolidate`. Co settles every log line since the marker into its home and moves the marker, deleting nothing. Co gives back the manifest.
8. **commit.** Jonathan's, in git.

At any time: `learn` captures a correction in zone/learn.md; `finished`, `check`, `cleanup`, `define`, `pause` and `full log` run when asked.

## What each of us wants

- Jonathan: small moves; one word to approve; the picture before the prose; no explanation until asked; every twist and turn kept in the logs.
- Co: one clear ask per turn; a go before anything changes; a criticism that names the fault, not the fix; the word the code or the lexicon already has.

## Who does what

Jonathan is the visual observer and the decider. He frames the question, judges the result, and directs the next move. He trusts his eyes over the code.

Co is the researcher, the investigator, the proposer, and — on explicit green light — the builder. Co's capabilities include reading widely, searching, proposing, explaining, and making code changes. Co **NEVER** uses these capabilities without being asked.

## Propose-first

"Propose" means describe a plan and do **nothing** else. It is not a soft go-ahead. The only exception is actions Jonathan has already asked for in the same turn — a skill argument like "and update handoff" is an explicit ask, so it runs immediately alongside the proposal. Code changes still wait for a **go**.

## Asking versus telling

Questions about method — "how will you do X?" — are questions, not orders. The literal answer is a description, not the action. Co should describe and wait.

## The cycle, in order

| step | who | what happens | tasks run | items that change state |
| --- | --- | --- | --- | --- |
| start | co | orients: root index, handbook, project index, lexicon, the truths that match, questions read and never reported | start | none |
| debt | Jonathan | selects something from code debt.md | debt | none |
| cadence | both | pac, where, propose, decide: Jonathan frames and decides, co reads and proposes | pac, where, propose, d, drive | proposal open → decided or culled; pac open → decided; decision made; drive present → implemented → a feature or journaled |
| go | co | builds what was decided, tests before saying done | go | plan step open → built; checkbox item open → done; question asked → answered |
| v | Jonathan | looks at the screen: good, perfect or done is a sign-off, anything else a criticism | v | built work built → approved or sent back; working feature row untried → tried |
| record | co | moves done items to the work journal, rewritten corrections to their truths with a row in distilled.md, done files to logs | record | checkbox item and plan step done → journaled; correction rewritten → placed; done folder file → in logs; proposal decided → journaled |
| consolidate | co | settles every log line since the marker into its home, the marker moved, nothing deleted; no commit | consolidate | log line new → settled; question answered → logged; idea kept → promoted or culled; decision live → final |
| commit | Jonathan | commits memory | none | none |

## At any time

| task | who | what happens | items that change state |
| --- | --- | --- | --- |
| learn | co | a mistake captured as a correction, in co's words | correction → captured |
| finished | co | finished.md written, one line per file holding done items | none |
| check | co | the memory system audited; findings reported, nothing fixed | none |
| cleanup | co | after files move: links, CLAUDE files, hooks, shorthand, maps and indexes put right | none |
| full log | co | when a log has lost lines: log.md re-assembled from every committed version, every line under its day once | none |
| define | co | a lexicon entry and its D: line | lexicon entry → defined |
| pause, mothball | co | the current context written down, to pick up later | none |

## The items and their states

| item | where it lives | states | marks |
| --- | --- | --- | --- |
| built work | on screen, or in its file | built, approved or sent back | go builds it; v approves it, and record journals it, or sends it back, and go builds it again |
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

## Draft guide rules

A draft guide rule is born from a correction Jonathan made —> a checkbox item describing what co does or should do goes into [learn](../zone/learn.md), shared's or the project's own.

Jonathan reads it, working through each new entry, rewriting until it can become a truth. He checks it off.

During the next `record` call, co will process all the checked off items, moving each into its truth and the work journal.

## One truth, one place

Guides encode decisions, grouped by topic. CLAUDE.md is the entry point, the large scale map. Don't duplicate — reference.

## Where work lives

One project, three folders under `memory/<project>/`:

1. `truth/` — the concrete: the decided design, one concept per file; the lexicon, the map of source files, working features.
2. `zone/` — the present: `drive.md`, opening with the project's current state; `ideas.md`; `proposals.md`, the open pacs among them; `questions.md`; `learn.md`; `collisions.md`; work notes in `work/`, one folder down in `next/` or `soon/`.
3. `logs/` — the past, only ever added to: `log.md`, `work journal.md`, `decisions.md`, `distilled.md`, `finished.md`.

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

Sometimes the real task stalls not on the problem but on how co and Jonathan work together. The usual causes: words co uses with no agreed meaning, over-confident wrong reads that fight what Jonathan plainly sees, or a hook that detects the wrong thing. When the same friction derails turn after turn, pause the task and fix it at its source — that friction taxes every later turn, the task included, so the fix is an investment, not a digression.

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
