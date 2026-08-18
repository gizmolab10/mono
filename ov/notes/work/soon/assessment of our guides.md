---
kind: design
title: "Assessment of our Guides"
description: "A hand-kept rundown of every shared guide, what is thin, and what is missing."
tags: [journal, notes, now, proposal, session, team]
date: 2026-07-08
---
# Assessment of mono's guide files

Mono's guides can apply to any development project, are intended to:

1. allow hyper fast construction of high quality software.
2. adhere to decisions made along the way

62 files in eight folders (not counting index files), counted 2026-08-11.

## Three tiers

The guides act as a three-tier memory architecture.

1. message — without these, the AI drives me nuts
2. session — always applicable, but too big to fit
3. on demand — commands, shorthand, how to, etc.

## Observations

- **Three files are applied to every message**, invoked by a hook: [always](pre-flight/always.md), and one of [response](pre-flight/response.md), [agency](pre-flight/agency.md) and [lexicon](pre-flight/lexicon.md) on a rotation. Providing a rock solid guarantee of consistency and good communication.
- **The pre-flight folder layers the same idea three ways** — [keywords](pre-flight/keywords.md) trigger [gates](pre-flight/gates.md) which point at guides — so the right guide for a task type cannot be missed.
- **Two files hold the whole vocabulary**: [banned words](pre-flight/banned%20words.md) says which words are never used, and [lexicon](pre-flight/lexicon.md) says which words to reach for, with each project keeping its own for its own things. The lexicon arrives before a message is written; the table is read by the two scripts that check a finished reply.
- **One acknowledged conflict** between guides: [refactor](develop/refactor.md) wants every file searched before each single change; [migrate](develop/migrate.md) groups several changes into one phase and searches twice, once before the phase and once after. The [kinds of tasks](pre-flight/kinds%20of%20tasks.md) table says outright that the two disagree.
- **Two files overlap on enforcement**: [hooks](collaborate/hooks.md) describes the mechanism, [always](pre-flight/always.md) lists what the mechanism enforces. They are designed to be read together.
- **Two siblings with a split purpose**: [build](develop/build.md) is the tooling reference, [build notes](develop/build%20notes.md) is the maintenance process for the build-notes log.
- **The develop folder has grown to sixteen files** and now holds three things at once: how to write code, how to write a document about code, and what past work taught. The last two arrived from elsewhere — [create a proposal](develop/create%20a%20proposal.md) came from setup, [lessons](develop/lessons.md) came from di.

## Redundancies and conflicts

Every one below was found by reading the files, and every one names where it sits.

### One rule, said in several places

A rule in three files is three wordings, and no reader can tell whether they differ.

- **Read before act** — [agency](pre-flight/agency.md) 7, [pitfalls](pre-flight/pitfalls.md) 1, and [chat](collaborate/chat.md)'s File Freshness, which carries its own list of trigger phrases the other two do not have.
- **Exact match** — [agency](pre-flight/agency.md) 5 and [pitfalls](pre-flight/pitfalls.md) 2.
- **Show evidence** — [always](pre-flight/always.md) 5 and [pitfalls](pre-flight/pitfalls.md) 3.
- **Test before done** — [agency](pre-flight/agency.md) 12 and [pitfalls](pre-flight/pitfalls.md) 5.
- **What to do when a tool fails** — [pitfalls](pre-flight/pitfalls.md) 6 and the whole of [gotchas](pre-flight/gotchas.md). Both say use write_file over create_file, and both say cycle tools rather than repeat. The second file adds nothing the first lacks.
- **Search every file before a multi-file change** — [gates](pre-flight/gates.md)'s table, [kinds of tasks](pre-flight/kinds%20of%20tasks.md)'s multi-file row, and [chat](collaborate/chat.md)'s refactoring discipline. Three.
- **The done checklist** — [shorthand](pre-flight/shorthand.md)'s `done` row, and a hardcoded copy inside `.claude/hooks/done-checklist.sh` at line 42. A script holding a copy of a guide is the pair most likely to drift, since nothing reads both.
- **The banned-word pairs** — [banned words](pre-flight/banned%20words.md) and the last section of [lexicon](pre-flight/lexicon.md). Deliberate: one is the wall, one is the word to reach for. Still two copies of 21 pairs.

### Two files that disagree

- **`rewrite` means two opposite things.** [shorthand](pre-flight/shorthand.md) row 24 makes it a request to say the last reply again in plain English. [agency](pre-flight/agency.md) 8 lists it among the six words that turn a proposal into work. One word, one meaning asking for words, the other for action.
- **Act, or wait?** [pitfalls](pre-flight/pitfalls.md) 4 says "if obvious, act". [agency](pre-flight/agency.md) 8 says do not edit anything unless Jonathan says one of six words. A single clear next step satisfies the first and is forbidden by the second.
- **[always](pre-flight/always.md) pulls against itself.** Rule 1 caps a reply at three sentences. Rules 5, 6 and 7 each demand more words — a quoted line, every part named, both sides of a difference stated. Four rules, one budget.
- **[voice](collaborate/voice.md) breaks its own rule.** It tells the writer to prefer the lexicon and avoid the banned words, and its own list of what good prose is says "easy to absorb". *Absorb* is on the banned list.

### A file against the world

- **[always](pre-flight/always.md)'s brief says five rules.** Its first line says seven govern every reply.
- **[hooks](collaborate/hooks.md) puts the scripts in the wrong repo.** It says they live in `di/.claude/hooks/` and log to `di/.claude/hooks/log.jsonl`. They live in mono's `.claude/hooks/`.
- **[hooks](collaborate/hooks.md) counts sixteen.** Seventeen are wired today, and its Stop table leaves out the murk counter.
- **[pitfalls](pre-flight/pitfalls.md) skips two numbers.** It runs 1 to 16, then jumps to 19. Either two rules were removed without renumbering, or two are missing.

## Still needed

### Thin — a topic named without the content

- [exclude](collaborate/exclude.md) (8 lines of body) — three folder names and one sentence. Missing: why each is skipped, and what breaks when one is not.
- [port](develop/port.md) — the three steps and a template. Missing: a worked example from a real port, what went wrong in it, and how to tell the port matches the original.
- [limitations](philosophy/limitations.md) — names three failure modes and says outright, in its own last section, that naming is not enough to catch one in the act. Missing: the symptom each one shows on the surface.
- [constants](develop/constants.md) and [conceptual composition](develop/conceptual%20composition.md) — both carry an empty brief, so neither says what it is for before it is opened.

### Partial — substance present, an obvious gap on first use

- [migrate](develop/migrate.md) — 335 lines, cut at a "STOP WRITING DOCUMENT" marker on line 84. Phases 6 to 9 are listed with nothing under them.
- [chat](collaborate/chat.md) — the working contract is there. Missing: how to recover when an approach unravels mid-session.
- [keep shop](develop/keep%20shop.md) — describes the practice. Missing: what triggers it, and how to know a file is ready to put away.
- [build notes](develop/build%20notes.md) — the process is clear. Missing: a worked example of filtering a real window of changes.
- [testing](test/testing.md) — the commands are there. Missing: when mocking is worth it, and when it ties a test to the code it is testing.
- [hooks](collaborate/hooks.md) — the mechanism and the live suite are documented. Missing: when a hook is the right tool and when a guide is.

### Structural gaps — topics no file covers

- **Context compaction** — what to keep and how to recover when the running conversation is summarized.
- **When to stop** — criteria for "this is done", for a feature, a refactor and a fix alike.
- **Error-handling discipline** — the systematic response to a break: stop and re-read, or keep going.
- **Dependencies** — when to add, upgrade or remove one.
- **Session handoff** — the order of things at the end of a session. The `done` command in [shorthand](pre-flight/shorthand.md) names the steps; no guide explains them.
- **Recovery from a misapplied guide** — what to do once a discipline was skipped and damage followed.
- **Velocity against depth** — when a quick patch is right and when a design is.
- **Multi-project coherence** — how the guides stay aligned across mono, ws, di, ji and ov, and when a project's own guide overrides the shared one.

## Exposure

What is risked, ranked by likelihood and cost.

### Struck — co goes off the rails and cannot recover

[breakdown](collaborate/breakdown.md) holds the four steps — declare it, state the objective, take stock, try again — and `/br` walks them on the spot. [keywords](pre-flight/keywords.md) sends four phrases to it; [gates](pre-flight/gates.md) names two states that call for it: the same fix tried twice, and three rounds with nothing measured.

**Still open:** it was written while nothing was failing. Whether the four steps hold under a real breakdown is unproven.

### High — compaction loses working state

Any investigation in flight, any hypothesis not yet written down, is gone when the conversation is summarized. What survives is whatever a note already holds. Nothing says what to write down before it happens, and the moment it happens cannot be predicted.

### High — keep shop lapses

[keep shop](develop/keep%20shop.md) describes the practice and does not trigger it. Without "do this when X", the work notes fill again, and every session pays for the bloat on every read.

**Direct evidence:** ov's [code debt](../../ov/notes/work/code%20debt.md) done list runs to a hundred lines, and nothing prompts the move to a paid file.

### Medium — a STOP marker misleads a reader

A reader following [migrate](develop/migrate.md) reaches line 84 and has nothing for phases 6 to 9. Either the missing phases get invented, or the guide is abandoned partway and the discipline goes with it.

### Medium — the same mistakes come round again

Naming a failure mode is not enough to spot one happening. [limitations](philosophy/limitations.md) says so itself.

### Lower — porting reinvents its own process

With [port](develop/port.md) thin, the first port of anything invents the method again.

## Folders

Seven, each holding one kind of guidance.

### collaborate — how Jonathan and co work together

- [breakdown](collaborate/breakdown.md) — what to do when the work has gone wrong and neither of us knows how to get back.
- [cadence](collaborate/cadence.md) — how the two of us actually work together.
- [chat](collaborate/chat.md) — who does what, and what co must do to stay reliable.
- [composition](collaborate/composition.md) — props down, events up, slots for flexible content.
- [context filters](collaborate/context%20filters.md) — the habit of leaving out what does not fit the current task, named so it can be refused.
- [exclude](collaborate/exclude.md) — the folders a map file skips.
- [expectations](collaborate/expectations.md) — how to get co's best work and avoid its worst.
- [hooks](collaborate/hooks.md) — what hooks are, how they differ from memory, and which are live.
- [jonathan](collaborate/jonathan.md) — the phrases Jonathan uses to steer a debugging session, and what each asks for.
- [organize](collaborate/organize.md) — what is actually in the repo, and the one vocabulary for talking about it.
- [skills](collaborate/skills.md) — the words typed with a leading slash, and what each does.
- [tags hierarchy](collaborate/tags%20hierarchy.md) — the seven areas the tags are read in.
- [voice](collaborate/voice.md) — how prose written into files reads: first person, warm, punchy.
- [workflow](collaborate/workflow.md) — the turn-taking cadence and the propose-before-acting discipline.
- [write a journal](collaborate/write%20a%20journal.md) — the formatting rules for a running journal.

### develop — how to write the code, and how to write about it

- [add a file](develop/add%20a%20file.md) — putting a new guide where overview finds it, labelling it, proving it arrived.
- [aesthetics](develop/aesthetics.md) — visual constants, arrived at by small perturbations rather than formulas.
- [build](develop/build.md) — Netlify, VitePress and related tooling, with the gotchas that bite.
- [build notes](develop/build%20notes.md) — hand-distilling the build-notes table from the change history.
- [conceptual composition](develop/conceptual%20composition.md) — no brief; opens on its own subject.
- [constants](develop/constants.md) — the one ladder of measurement names, and the table it replaced.
- [create a design](develop/create%20a%20design.md) — how the two of us write a design document together.
- [create a proposal](develop/create%20a%20proposal.md) — a worked example of writing a proposal in short cycles.
- [css](develop/css.md) — styling patterns and gotchas from real work.
- [keep shop](develop/keep%20shop.md) — keeping the note files in a shape that still guides the next session.
- [lessons](develop/lessons.md) — patterns distilled from finished milestones that would mislead a successor.
- [markdown structure](develop/markdown%20structure.md) — structuring markdown so every concept has a heading to link to.
- [migrate](develop/migrate.md) — writing a migration document that breaks a big change into safe phases.
- [port](develop/port.md) — moving a capability between projects: read the source, describe it, write a spec.
- [refactor](develop/refactor.md) — the guardrails for letting co refactor a temperamental codebase.
- [specification driven development](develop/specification%20driven%20development.md) — what di is meant to do, from a drawing to a lumber list.
- [style guide](develop/style%20guide.md) — naming, formatting and organization, followed strictly across projects.

### philosophy — why the work is shaped this way

- [limitations](philosophy/limitations.md) — the failure modes co falls into, named so they can be spotted early.
- [logic driven design](philosophy/logic%20driven%20design.md) — rules, tests and code in lock-step, so drift is caught by the build.
- [use ai](philosophy/use%20ai.md) — let structure emerge, keep work files raw, distill guides out of them.

### pre-flight — what to read or do before acting

- [agency](pre-flight/agency.md) — how the work is done: what to touch, what to prove, what never to change unasked.
- [always](pre-flight/always.md) — the rules that must never be out of sight.
- [banned words](pre-flight/banned%20words.md) — the words that cause friction, each with the word to use instead.
- [gates](pre-flight/gates.md) — which guide must be read before which kind of task.
- [gotchas](pre-flight/gotchas.md) — where co's own tools misbehave, and the workaround for each.
- [keywords](pre-flight/keywords.md) — the words in a request that require reading a guide first.
- [kinds of tasks](pre-flight/kinds%20of%20tasks.md) — task types, the guides each needs, and the conflicts between them.
- [pitfalls](pre-flight/pitfalls.md) — edge cases that caused mistakes, mostly failures to read before acting.
- [response](pre-flight/response.md) — how every reply is written, and what must be proved before it is sent.
- [shorthand](pre-flight/shorthand.md) — the short commands Jonathan types, and what each does.

### setup — onboarding and deployment

- [access](setup/access.md) — setting up the Claude desktop app to reach local files.
- [manually install AnythingLLM](setup/manually%20install%20AnythingLLM.md) — getting that engine running on this machine.
- [netlify](setup/netlify.md) — the seven published sites, where each builds from, and how to add another.
- [onboarding](setup/onboarding.md) — setting up a new machine to work on the monorepo.
- [vitepress](setup/vitepress.md) — how the documentation sites are configured.

### test — running and writing tests

- [debugging](test/debugging.md) — check the source first, and work systematically.
- [testing](test/testing.md) — the test commands and the patterns to write tests with.

### tools — reference for individual tools

- [git](tools/git.md) — undoing common mistakes in the change history.
- [hub-app](tools/hub-app.md) — what the Hub app is, how it is put together, what its screens do.
- [single line of progress](tools/single%20line%20of%20progress.md) — a build script that reports on one line that updates in place.
- [try both](tools/try%20both.md) — build two ways of showing something at once, behind one word you flip.
