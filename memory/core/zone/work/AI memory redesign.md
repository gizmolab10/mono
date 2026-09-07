---
kind: analyze
title: "Memory System Design"
description: "A fresh design for a persistent, tweakable memory that carries context across chats, survives consolidation, and supports several concurrent long-term projec..."
tags: [keep, now, proposal]
date: 2026-08-21
---
# Memory System Design

A fresh design for a persistent, tweakable memory that carries context across chats, survives consolidation, and supports several concurrent long-term projects through heavy design change. Structure layer: OKF (Open Knowledge Format).

## Terms

Two terms this document relies on, defined under its own contract:

- **memory system** — the entire set of markdown files described in this file: the `memory/` tree with its indexes, logs, truths, and zones. Not: this design doc, and not the AI's built-in memory.
- **prompt cache** — the slice of the memory system loaded into a session's context by `start`: root index → protocol → project index → matched truths, lexicon included. The memory system is what is *stored*; the prompt cache is what is *loaded*.

## The four failure modes this fixes

1. **Context loss between chats** — each session starts blind. Fix: a small, mandatory orientation read at session start, cheap enough that it always happens.
2. **Loss during consolidation** — summarizing discards facts silently. Fix: consolidation *settles* the log instead of summarizing it — every line is settled into its one home, dismissed with a reason, or carried forward unsettled.
3. **Fossilized design** — memory written for design v1 misleads work on design v3. Fix: truth files describe only the *current* design; history lives in the log and git, never in the truths.
4. **Scattered truth** — the same fact in four files means three of them are wrong after a change. Fix: one fact, one file; everything else links.

## Principles

- **Three time layers.** Truth files say what *is*. The log says what *happened recently*. Git says what *was*. Never mix layers: no history in truths, no current-state authority in logs.
- **One fact, one file.** To change a design decision, you edit exactly one file. If another file needs the fact, it links to the single-source-of-truth file.
- **Two structures only.** The root has one structure; every project folder has one identical structure. Nothing else to learn.
- **Small files, flat folders.** Truths stay under ~100 lines; `truth/` never grows subfolders. When a file outgrows its concept, split it and update the index.
- **OKF-compliant throughout.** Every file carries frontmatter (`type` required); `index.md` and `log.md` are reserved names with reserved roles. This is what makes "find where the truth lives" mechanical — for you and for any agent.

## Layout

```
memory/                      # a folder inside your existing repo; an OKF bundle
├── index.md                 # root map: every project, one line each — read first, always
├── shared/                  # main bundle, same structure as a project
│   ├── index.md
│   ├── log.md
│   ├── truth/
│   │   ├── protocol.md      # the operating rules themselves — see "Where the rules live"
│   │   ├── lexicon.md       # global terms — see "Prose and terminology"
│   │   ├── taste.md         # your visual/design principles — see "Zone" below
│   │   └── conventions.md   # how you like to work with AI
│   └── zone/
└── <project>/               # one folder per project (di/, ws/, musicology/ …)
    ├── index.md             # orientation: what it is, current state, catalog of its truths
    ├── log.md               # append-only journal, periodically consolidated
    ├── truth/               # flat; one concept per file; the ONLY place a fact lives
    │   ├── architecture.md
    │   ├── data-model.md
    │   ├── decisions.md     # live rationales only (see "Design churn")
    │   ├── lexicon.md       # this project's terms (see "Prose and terminology")
    │   └── …
    ├── zone/               # ideas + visual references
    │   ├── ideas.md
    │   └── ref/             # images, palettes, screenshots
    └── archive/             # no longer current, carefully composed — kept whole, never loaded at start
```

Two levels deep, everywhere. `shared/` is just a project whose subject is you. The three content folders complete a set: truth is believed, zone is not yet believed, archive is no longer believed.

## File anatomy

Every truth file is an OKF concept document:

```yaml
---
type: design               # required — pick from a tiny vocabulary you keep in root index.md
title: Data model
description: Current entity/relationship design and why it holds.
tags: [persistence, schema]
use_when: [changing storage, adding entity types, migration work]
updated: 2026-08-22
---
```

Body: plain markdown stating the current truth. Links to related truths are ordinary markdown links — the bundle becomes a navigable graph.

`use_when` is the retrieval trigger: at session start the AI matches the task against these lines and loads only the relevant truths. Keep `type` to a vocabulary of five or so (`design`, `spec`, `decision`, `principle`, `reference`) — a big taxonomy is where simplicity goes to die.

### index.md (per project)

Three parts, strictly: one paragraph of *what this project is*, one paragraph of *current state* (rewritten at every consolidation, never appended), and a catalog — one line per truth file with its description. No facts live here; it only points.

### log.md (per project)

Append-only, dated, one line per entry, each tagged:

```
## 2026-08-22
- D: replaced si_recents with snapshot-based history — old model couldn't express branching
- I: hover states could share the hit-testing quadtree
- S: search trie indexing done; link-mode search remains
- Q: does undo belong in the snapshot system or stay separate?
```

`D` decision, `I` idea, `S` state/progress, `Q` open question. The tags make consolidation mechanical: each tag has a known destination.

## Where the rules live

A rule that exists only in this design doc governs nothing — no session is told to read a design doc. So the memory is **self-hosting**: the operating rules (session protocol, prose contract, settling procedure) are transcribed at adoption into `shared/truth/protocol.md`, and the root `index.md` opens by pointing there. The mandatory orientation read *is* the mechanism that loads the law — a session cannot be oriented without having read the rules. This doc remains the rationale; `protocol.md` is the authority, and tuning the system (a new limit, a changed procedure) means editing that one file, like any other truth.

One honest limit: this guarantees every session *reads* the rules, not that it keeps applying them an hour in. Structural violations are caught mechanically (`okf` CLI validation); prose violations are caught at the settling step. Mid-session drift has no mechanical fix — the backstops exist because it will happen.

## Session protocol

**Start.** Read `memory/index.md` → `shared/truth/protocol.md` → the project's `index.md` → the project's `lexicon.md` (always) → truths whose `use_when` matches the task. Orientation should cost under ~2,000 words; if it costs more, the truths have gotten fat — split or prune.

**During.** When a decision lands, edit the one truth file *at that moment* and add one `D:` log line. Ideas get an `I:` line (or a paragraph in `zone/ideas.md` if they deserve one). Don't defer writes to the end of the session — end-of-session is where context dies.

**End.** Append `S:` lines for state, `Q:` lines for anything left open. Ten seconds of writing.

## Consolidation (where loss usually happens)

Run when a project's log exceeds ~30 entries, or before starting a major work burst. Procedure:

1. Read every log entry above the `<!-- consolidated: DATE -->` marker.
2. **Settle each line** by tag: `D:` → edit the owning truth file (and `decisions.md` if the rationale will be questioned again); `S:` → rewrite the *current state* paragraph in `index.md`; `Q:` → carry forward to the top of the fresh log; `I:` → promote to a truth/`ideas.md`, keep, or cull.
3. Delete settled entries; move the marker.
4. **Verification pass:** diff the log trim against the truth edits and confirm every dropped line was either settled or explicitly discarded with a reason. Nothing vanishes silently — this single rule is the fix for consolidation loss. Stronger form, worth using for a large settle: have a *fresh* session run the check, so the checker isn't grading its own work.
5. **Commit as one labeled commit** (`memory: settle <project>`), touching nothing else. This is what makes a bad settle undoable.

Consolidation never summarizes prose into vaguer prose. It moves facts to their one home and throws away only what it names.

## Concurrent sessions and recovery

- **One project, one active session** is the working rule. Different projects are naturally safe — their folders are disjoint, and `shared/` is read-mostly.
- **If two sessions must share a project**, appends to `log.md` merge harmlessly; truth edits are the hazard. Rule: before editing a truth, a session must have read it *since the other session's last commit* — practically, commit memory edits promptly and re-read before touching a file you've been away from. Only one session may consolidate.
- **Recovery.** A settle later found to have lost something is one `git revert` of its labeled commit (that's why step 5 exists): the log lines come back, the truth edits unwind, and you settle again. Nothing in this system is ever more than one commit from undone.

## Design churn

Projects that redesign heavily need two protections:

- **Truths are current-only.** When the design pivots, rewrite the truth file wholesale — don't annotate it with "formerly…". One `D:` log line records the pivot; git records the corpse.
- **`decisions.md` holds *live* rationales only.** Not an ADR archive — just the handful of choices likely to be revisited, each with its one-line "why," so closed questions are never reopened. When a decision becomes final, delete its line. This file staying short is the sign the design has stabilized.

## Prose and terminology

Terminology is a compression scheme: a precise term lets one word carry a paragraph of design. It degrades the same way truths do — through casual reuse. Every loose use of a term ("snapshot" for three different things, "hits" drifting from its definition) debases it slightly, until it means everything and therefore nothing, and prose written with it stops being trustworthy memory.

AI writing has a second, worse failure: **word salad** — fluent prose built from impressive undefined terms, unintelligible to the human it was written for. The memory bans it structurally, with one contract:

> **Every term in memory prose is either plain language, a lexicon entry, or defined in the same write that first uses it. No third category exists.**

The human is the primary reader. A sentence the AI would have to explain is a defective sentence — the fix is rewording, not explanation.

**Solution: the lexicon.** Each project gets `truth/lexicon.md`; terms that span projects live in `shared/truth/lexicon.md`. A term's definition is a fact like any other, so the same law applies — one term, one entry, one file. Entry format, deliberately spartan:

```
- **snapshot** — an immutable capture of navigation state at a moment of user action.
  Not: a saved document, not an undo frame.
```

One sentence of definition; an optional *Not:* line naming the near-misses, because most degradation happens at the boundary with a neighboring concept.

Rules:

- **One concept, one name; one name, one concept.** Synonyms and overloading are banned in memory prose, exactly as duplicated facts are banned in truths. If prose wants to use a defined term loosely, reword the prose or redefine the term — never split the difference.
- **Plain language is the default.** A term is coined only when it will recur and genuinely compresses a concept — roughly, when it would otherwise be re-explained three times. Most word salad is needless coinage; the cheapest fix is not coining.
- **Coining is deliberate and atomic.** A new term enters prose and the lexicon in the same write, with a `D:` log line (`D: coined "snapshot" = …`). An undefined term is not a draft to be cleaned up later — it is an error at the moment of writing, exactly like a fact landing outside its one file.
- **Redefinition is a design decision.** When a design pivot changes what a term means, edit its one entry, log the `D:` line, and let consolidation sweep old-sense uses. A term whose meaning moved silently is worse than a fossilized truth file — it corrupts every sentence it appears in, past and future.
- **Deprecation is deletion.** Dead terms leave the lexicon; git remembers them. A lexicon full of retired vocabulary is noise in every orientation read.

**Enforcement is write-time first, consolidation second.** The contract above binds every write as it happens. Consolidation is the backstop: step 2 of the procedure gains a sub-check that scans the prose being settled for (a) defined terms used off-definition — reword or formally redefine — and (b) undefined terms that slipped through — **reworded into plain language, never retroactively coined**. Auto-coining at cleanup would launder word salad into the lexicon; the lexicon only accepts terms someone chose on purpose.

The lexicon is orientation-critical: it loads at every session start, inside the ~2,000-word budget. That's the forcing function for keeping it small — it is the vocabulary actively in play, not a glossary of everything ever named.

## Zone: ideas and visual sense

- **`zone/ideas.md`** — append freely, zero ceremony. Each consolidation forces triage: promote, keep, or cull. Ideas that survive three consolidations either graduate to a truth or get cut — a simmering pile that only grows is where ideas go to be forgotten politely.
- **`zone/ref/`** — images, palettes, screenshots, competitor grabs. Name files descriptively; a one-line note per file at the top of `ideas.md` if the *why it's here* isn't obvious.
- **`shared/truth/taste.md`** — the compounding asset. Every time you notice you *keep* liking or rejecting something across projects ("hover states should whisper," "no borders where spacing can do the job"), it gets a line here. The AI reads it whenever `use_when` includes visual or UI work, on any project. This is how visual sense accumulates instead of being re-derived per chat.

## Finding where to tweak (the OKF payoff)

Question: *"where does the truth about X live?"* Three mechanical answers, in order:

1. The project's `index.md` catalog — one screen, one line per truth.
2. Frontmatter grep — `tags` and `description` across `truth/` (flat folders make this trivial).
3. The link graph — any truth that mentions X links to X's owning file, because duplication is banned.

Because the bundle is spec-compliant, the `okf` CLI can validate it (frontmatter present, `type` set, links unbroken) — a pre-commit check that keeps the structure honest as the memory grows.

## Skills: the control surface

The protocol makes reliability the AI's job; skills make it *yours*. A skill is a short named command you speak to run one procedure of this system on demand — so every reliability mechanism is something you can invoke, not something you hope the AI remembers. Two laws keep the set trustworthy: **one skill per procedure**, and **the skill is a trigger, not a copy** — each skill's body is a pointer into `protocol.md`, where the procedure lives as a single source of truth. Tuning a procedure means editing `protocol.md` once; every skill that runs it is current automatically.

The set:

- **start** — load the prompt cache: root `index.md` → `protocol.md` → project `index.md` → `use_when`-matched truths. Session start, project switch — and mid-session whenever the AI sounds like it has forgotten the rules. `start` is also the drift-correction command: re-grounding on demand instead of arguing with a drifted session.
- **pac** — pros and cons of X: a grounded deliberation before a decision. It reads the truths X touches, `decisions.md` (was this already decided?), the lexicon, and `taste.md` when X is visual — then argues both sides, each point tied to a specific truth, principle, or cost, never generic filler. It ends with the question that would decide the matter, not a verdict (unless asked), and offers to capture the outcome via `propose` or a `D:` line.
- **define** — coin or redefine a term: lexicon entry, `D:` log line, and (on redefinition) a sweep of old-sense uses, in one atomic act. The only door into the lexicon.
- **propose** — put something forward without implementing it: it goes in `zone/ideas.md` or as an `I:`/`Q:` line, and truth files stay untouched until you ask that the proposal be implemented.
- **settle** — run the five-step consolidation on a project, ending in its one labeled commit.
- **check** — the audit: `okf` structural validation, terminology drift scan (off-definition and undefined terms), duplicate-fact hunt, and skill-pointer verification (every skill's referenced `protocol.md` section must still exist — the skills live outside the memory system, so nothing else audits them). Aimed at a settle, it verifies the commit diff cold; for real independence, run it in a *new* session — a skill cannot freshen its own context, and the checker must not be the settler.
- **where** — name the one file that owns a topic, before you or the AI touch it.
- **summary** — the state of the current chat, with extreme brevity: done, in motion, open. A handful of lines, no preamble, no recap of how we got here.

Skills that write (`define`, `propose`, `settle`), log; skills that only read (`start`, `pac`, `check`, `where`, `summary`) don't log. And the set stays small by the same rule as everything else: a new skill must own an already defined procedure in `protocol.md` — a skill without a procedure is distracting and improperly defined.

## Hooks: automation that boosts work flow

Skills are verbs you speak; hooks fire the same procedures on events, no speech required. One boundary keeps them trustworthy: **hooks automate reading, checking, and reminding — never writing truths, settling, coining, or deleting.** A hook may run a read-only skill; a write skill is only ever run by you. Automation proposes; you dispose.

The reasonable-and-reliable set:

- **Session start → run `start`.** Orientation is mandatory, and mandatory things should be mechanical. The highest-value hook: it removes the one failure — starting blind — that causes most of the others.
- **Commit touching `memory/` → structural `check`.** `okf` validation (frontmatter present, `type` set, links unbroken) plus the sizing limits. Violations block the commit. Scoped to diffs that touch `memory/` — a hook that fires on every mono commit gets disabled in irritation, which is worse than no hook. This is the honest half of `check` — the half that needs no judgment.
- **Commit touching `memory/` → truth-without-log warning.** A diff that edits `truth/` but not that project's `log.md` is probably a decision that skipped its `D:` line. Warn, don't block — it might be a typo fix.
- **Log past ~30 entries → announce "settle is due."** The hook never settles; it makes the debt visible so the trigger doesn't depend on anyone noticing.
- **Session end → draft the `S:`/`Q:` lines.** The AI drafts; the lines land only when you approve them.

What deliberately stays manual: settling, defining, promoting or culling ideas, every truth edit. Those are the places where the system's *meaning* is made, and automating meaning-making is how word salad and silent loss come back through the back door.

## Sizing rules

| Thing | Limit | When exceeded |
| --- | --- | --- |
| truth file | ~100 lines | split by concept; update index |
| truths per project | ~15 | merge cold ones; question the taxonomy |
| log | ~30 entries | consolidate |
| orientation read | ~2,000 words | prune index + fat truths |
| `decisions.md` | ~10 live items | delete finalized ones |
| `ideas.md` idea age | 3 consolidations | promote or cull |
| `lexicon.md` | ~30 terms | delete dead terms; question whether coinages are earning their keep |
| skill set | ~8 verbs | merge overlapping skills; a skill must own a `protocol.md` procedure |

## Adoption

1. **DONE** Create `memory/` inside the repo that holds your projects; add root `index.md` and `shared/`. No separate repo — the surrounding repo's history is the archaeology layer, and memory edits travel in the same commits as the work they describe.
2. **DONE except hooks** Transcribe the operating rules from this doc into `shared/truth/protocol.md`; point the root `index.md` at it first. Create the eight skills as thin triggers into it *(done as shorthand rows in `notes/guides/pre-flight/shorthand.md`)*. Delete all the existing hooks that are not described here and create the new hooks *(pending)*.
3. **DONE** Seed `shared/truth/taste.md` with five principles you already know you hold *(seeded, then edited by Jonathan; `conventions.md` also begun)*.
4. **DONE** Bring up **one** project: write its `index.md` and its two or three obviously-needed truths from scratch (current design only — resist importing history) *(ov is first; lv's skeleton sits ready beside it)*.
5. Work normally for a week with the session protocol; run the first consolidation by hand to feel the settling step.
6. Add the other projects only after the first one's rhythm feels satisfying and solid.

## Leaving the old system

The memory system replaces an older one: CLAUDE.md's reading-on-load list, `notes/guides/`, and the per-project `notes/work/` files (handoffs, work journals, learn files, mothballs, current contexts). The goal is that system's **complete abandonment** — not coexistence. Five rules govern the exit:

1. **Move truths, not history.** Worth moving: anything *currently true* that a session would act on — a rule, a design fact, a term, a live question, a lesson's conclusion. Each settles into its one home in `memory/`. Not worth moving: journals, handoffs, mothballs, finished contexts, the stories behind lessons. That is history; the old files *are* the archive, and they get abandoned in place, not imported. (This is the same fossil rule the truths already live by.)
2. **Pull, don't push.** No big-bang import. When work actually reaches for something that exists only in the old system, move it that day. Anything nothing reaches for was already dead — a sweep would just copy fossils forward with the living.
3. **A move is a move, not a copy.** When content enters `memory/`, the old file loses it — delete the moved lines, or the whole file when nothing is left. A line living in both systems is two sources of truth, banned here as everywhere.
4. **Write nothing new into the old system, ever.** Every new rule, term, decision, and note goes into `memory/` from now on. The old system only shrinks. This rule alone guarantees abandonment; the others just set the pace.
5. **`migration.md` keeps the death list.** `shared/truth/migration.md` names, one line each, what still lives only in the old system. A line leaves when its content moves in or is declared dead. The file emptying is the finish line: when it's empty, delete it, shrink CLAUDE.md's "Reading on load" to `start` alone, and the old system is gone.

Rough mapping when things do move: pre-flight and collaborate rules → `protocol.md` or `conventions.md`; the mono-wide and per-project lexicons → the owning `truth/lexicon.md`; a learn entry → the rule the mistake taught, in its owning truth (the story stays behind); a handoff or current-context → the project index's *current state* paragraph plus `Q:` lines. One deliberate exception: `shorthand.md` stays where it is — it is the trigger surface, and its rows already point into `protocol.md`.
