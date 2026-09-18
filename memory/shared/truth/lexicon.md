# Lexicon — shared

The words used across every project. Use them exactly, even when a near synonym exists. If it is here, that is its name.

Reaching for a word that is not here, say so and stop. Do not invent one.

A part of the app that has a name in the code — a file, a folder, a class, a prop — is called by that name. Plain english says what a thing **does**; it never renames what a thing **is**. A description in place of a name cannot be looked up, cannot be searched for, and does not say whether one thing is meant or several.

Each project keeps its own lexicon for its own things — [core](../../core/truth/lexicon.md), [di](../../di/truth/lexicon.md), [ji](../../ji/truth/lexicon.md), [lv](../../lv/truth/lexicon.md), [ov](../../ai/truth/lexicon.md). Nothing here is repeated there.

## The memory system

- **memory system** — the entire set of markdown files under `memory/`: indexes, logs, truths, zones. Not: the design doc, not the AI's built-in memory.
- **prompt cache** — the slice of the memory system loaded into a session's context by `start`. Not: Anthropic's API prompt caching.
- **truth** — a file in a `truth/` folder stating the current design of one concept; the only place that fact lives. Not: history (that is git's job), not an idea (that is the zone's).
- **settle** — consolidation's line-by-line step: each log line moved into its one home, dismissed with a stated reason, or carried forward unsettled. Not: summarizing.
- **toolkit** — the set of skills that act on the memory system: start, pac, define, propose, settle, check, where, summary. Not: the shorthand file (the trigger surface), not any one skill.
- **adoption** — a core file taken in by a host: one line in the host's Core.ts, the host's own copy deleted. Never "borrowing."
- **bridge** — the host's one file per library that imports what it needs from that library, `Core.ts` for core, `Panel.ts` for panel and `Gallery.ts` for gallery: every other host file imports from the bridge, never from the library. A stylesheet has no exports, so `main.ts` is the one other bridge, for a library's stylesheets alone. Not: `Configuration.ts`, which pushes core's numbers onto the page.
- **library** — a project other projects import: core, panel and gallery. Built by no one on its own; an app's build takes the library's source in. Not: a package, since nothing in mono is published. The rule for every library is `zone/architecture/libraries.md`.
- **host** — a project that imports a library: every app, and a library that imports a library, as gallery imports core. A host holds the state, the library the behavior.
- **drive** — the current undertaking: the one proposal being decided and implemented, held in `zone/drive.md` until it dissolves into truth. The file opens with the project's **Current state:** paragraph, moved there from index.md 16 September 2026.
- **zone** — the folder holding a project's live thinking: active plans, research, considerations, bright ideas, visual references. Named for the state of mind that fills it and the zoning-in that empties it. Not: truth, not a waiting room for belief.
- **logs** — the third folder of a project's memory, beside truth and zone, holding what happened and what is waiting on it: the log, the journal, learn, proposals, questions, collisions, and the app's own log files. Decided 14 September 2026. Not: truth, which states the current design; not zone, which holds live thinking.

## Who

- **Jonathan** — what and why. Direction, taste, decision.
- **co** — how and where. Reads, traces, proposes, and builds on a go. Never *the collaborator*, never *Claude*, never *the assistant*. In every guide, note and reply, co is named **co** — never *i*, never *me*, never *you*. A rule addressed to co says "co", so the reader always knows who is meant.

## What we keep

- **guide** — a file in a project's `notes/guides/`, under `memory/`. Living reference; it holds decisions, not work.
- **work note** — a file in a project's `notes/work/`, under `memory/`. What is being done now.
- **collection** — one project's whole set of files: mono, di, ji, ov, ga, me. When the six entries under new lexicon in memory/ai/zone/work/music and ai.md are decided, this entry changes with them, a collection becoming a dropped folder for mu and a project for ai, and ov's lexicon takes their definitions.
- **label** — a name and a value on a file, with who wrote it, hand, rule or ai: a row in the db beside the dispatcher, never a line in the file since 10 September 2026. For a markdown file, its kind and each of its tags. For a song, its artist, album and title. Never the screen's text beside a control, which this word does not name here. Decided 12 September 2026, over key, trait, field, aspect, attribute, fact, property, tuple and kvp.
- **kind** — the label saying what sort of file it is, one per file. Six exist: analyze, arch, explain, howto, music, specify.
- **tag** — a label saying what the file is about, any number per file, from a closed list.
- **brief** — the description, one sentence, a field on the file's row in the db.
- **map** — a project's file map. Read it instead of discovering files using regex and wildcards; update it when files move.
- **index** — the list of what a folder holds. Update it when files come or go.
- **handoff** — current status and the one **Next** action. Read first each session.
- **code debt** — one line per memory file holding unfinished work, across every project: `memory/shared/zone/code debt.md`, written by `tools/code_debt.py` and never by hand; the shorthand `debt` runs it. Named unfinished until 15 September 2026. Until then the name of a project's own file of open tasks as checkboxes, whose finished ones went to **code debt paid**.
- **correction** — a lesson Jonathan gave co: one checkbox line in `memory/shared/zone/corrections.md`, captured in co's words, rewritten when Jonathan puts it in his and ticks it, placed when record moves it into its truth. Decided 17 September 2026.
- **record** — the task that moves done items into the work journal, done files into logs and rewritten corrections into their truths; the shorthand of that name, in place of done and process finished. Decided 17 September 2026.
- **journaled, placed, captured, rewritten** — states of an item: journaled, moved into the work journal; placed, a correction moved into its truth; captured, a correction in co's words; rewritten, one in Jonathan's, ticked. Decided 17 September 2026.
- **finished** — one line per memory file holding finished work, across every project: `memory/shared/logs/finished.md`, written by `tools/finished.py` and never by hand; the shorthand `finished` runs it. Checked boxes and settled proposals count; a work journal's entries and decided pacs do not, the journal being where finished items end up and decisions.md the rationale's home. `tools/process_finished.py`, the shorthand `process finished <X>`, moves one project's finished items into its work journal, `memory/X/logs/work journal.md`, and each done folder's files into its logs folder. Decided 15 September 2026.
- **journal** — finished work, newest first.
- **learn** — past mistakes, never to be repeated. Twenty entries means time to distill.
- **lexicon** — this file.
- **banned words** — the words that mean nothing to Jonathan, each with the word to use instead; the table in [conventions](conventions.md#banned-words).
- **hook** — a shell command that fires on its own, before a message or after a reply.
- **shorthand** — the short commands Jonathan types.

## A turn

- **turn** — one message from Jonathan and the reply to it.
- **session** — one conversation, start to end. Co remembers nothing across two.
- **propose** — describe the plan and stop. A question is not an order.
- **go** — the word that turns a proposal into work. So do solve, impl, proceed, create, rewrite.
- **think mode** — the default: read, search, describe, propose. Nothing is changed.
- **the gate** — what co shows before acting, so a skipped check is visible.

## Saying what is true

- **I AM GUESSING** — the exact words that must open any claim with no evidence behind it.
- **evidence** — a line number and a file name. Do not reveal until Jonathan asks you to describe the evidence. See always rule 4 in [conventions](conventions.md).
- **visual confirmation** — Jonathan looked at the screen and said what he saw. Never *eyeball*, never *nod*.
- **headless** — a browser co runs from a script on this machine, with no window on any screen. It loads the page, presses what the script says, and answers what it drew: sizes, places, colors, the requests it made, the lines the page logged. Co reads those numbers (rather than guessing what a browser would do). It is not Jonathan's browser, so it cannot see his fonts, his window or his settings.
- **mistrust point** — a mark against trust, earned by stating a thing as fact without checking it, or by calling work done while steps remain.
- **complaint** — one row in the murk record: a reply Jonathan could not read. **rate** is complaints per 100 replies.

## Verbs to use carefully

The [banned words](conventions.md#banned-words) turned the right way round — the word to use, with the one it replaces.

- **move** — relocate: put it there and take it from here. Never *copy*, which is a different act.
- **add**, **insert**, **write**, **update**, **put** — changes to text or code, and a thing arriving somewhere. Never *land*, in any sense.
- **do**, **perform** — taking an action. Never *land*.
- **implement**, **write** — building a thing. Never *land*.
- **done**, **complete** — finished work. Never *ship*.
- **write code** — producing code. Never *ship*.
- **place**, **include** — putting a value where it goes. Never *absorb*.
- **are built** — code that exists. Never *stands*, which is a metaphor.
- **sits**, **is drawn at** — where a thing is on screen. Never *stands* there either.
- **remain**, **unchanged** — what is still there after a change. Never *stands*, in this or any other sense: the word is banned outright.
- **path** — where a file is, counting from the top of the repo. Never *place*, which keeps its everyday sense: said in one place, holds its place in the run.
- **url** — a target on the web. **address** — either one, when a link could carry either.
- **content** — everything a file holds. Never *words*, which means words and nothing else: the words looked for, the word on a line, the words a link reads as.
- **register** — tell the hits manager about a thing, so it knows where that thing stands and what it says. Never *hand over*, never *hand to*.
- **stub out** — empty bodies ready to fill. Never *scaffold*.
- **button** — a thing on screen that can be pressed. Never *mark*. Pressed, it is a button; only looked at, a decoration. Fold marks and step marks are pressed, so they are buttons.
- **decoration** — something stamped on a thing to say what it is: a number beside a row, a slash across a folder. Never *mark*. Never a thing that is pressed — that is a button.
- **gap** — empty space in a layout. Never *room* for that. Room keeps its everyday sense of capacity: room to spare, make room, not enough room.
- **margin** — the empty strip at an edge. Never *band*, *bar*, *padding*, *gutter*.
- **highlight**, **highlighted** — shown as picked, or shown as under the cursor. Never *lit*, never *mark*. Between these three, *mark* has no use left at all.
- **hierarchy** — how things sit inside each other. Never *tree*.
- **details** — the column at the side.
- **mock** — a small made-up case that shows the fault. Never *repro*.
- **detour** — work off the path of the task. Never *side-build*.
- **bug**, **problem** — something wrong. Never *liar*.
- **more work** — the next step is heavier than this one. Never *a heavy lift* as an estimate. "Does the heavy lifting" — does most of the work — keeps its words.
- **easy to misuse** — the shape invites the mistake. Never *footgun*.
- **plugin architecture** — the shared storage interface. Never *seam*.
- **global** — belonging to every project. Never *cross-project*.
- **drifted** — moved off true over time. Never *slid*.
- **who does what** — the division of labor. Never *split*.
- **useless cruft** — what is there and does nothing. Never *padded*.
