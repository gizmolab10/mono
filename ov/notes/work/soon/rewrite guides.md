---
kind: specify
title: "Rewritten guides"
description: "Every guide carrying the stale tag, with what I'd do to it"
tags: [proposal, soon]
date: 2026-08-08
---
# Rewritten guides

Every guide carrying the **stale** tag, with what I'd do to it. Read all 21 on 2026-08-03. One
line each on what the guide is for, then the rewrite I'd offer. Nothing here is written into
the guides themselves — say the word on any of them and I'll do it.

## The shared guides

### `notes/guides/collaborate/exclude.md`

Three folder names to skip when building a map file, and a sentence saying searching is
unaffected.

**Rewrite:** merge it into the map-building instructions and delete the file. Three words do
not want a guide of their own, and a reader has to be told the list exists before it helps
them — which the file cannot do for itself.

### `notes/guides/pre-flight/gotchas.md`

Where the collaborator's own tools misbehave: use one writing tool over another, verify what
the shell claims, cycle tools rather than repeat a failing one.

**Rewrite:** cut the first half. The tool names it warns about are from a different tool set
than the one running now, so the advice is either untestable or already automatic. What
survives is one rule — when a tool fails, try a different one rather than repeating or asking
— which belongs in the working rules, not in a file of its own.

### `notes/guides/pre-flight/always.md`

Points at the two standing rule sets and holds the three rules belonging to neither.

**Rewrite:** none needed beyond one addition — the canary rule names a check with no
instructions for what to do when it passes beyond re-reading, and the reward line is noise.
Otherwise this one is current: it was rewritten two days ago and is the only stale-tagged
pre-flight file that is genuinely up to date. I'd take the tag off.

### `notes/guides/pre-flight/gates.md`

A table saying which guide must be read before which kind of task, and a four-step ritual for
doing so.

**Rewrite:** the table names four guides by paths that no longer exist (`chat.md`, `voice.md`,
`journals.md`, `markdown.md`) and one anchor inside a file that was split in two. Either point
every row at a file that exists, or fold the whole thing into the keywords table, which does
the same job by a different route. Two files layering the same idea is the real staleness here.

### `notes/guides/pre-flight/kinds.of.tasks.md`

Task types, the guides each one needs, and the conflicts between those guides.

**Rewrite:** same fault as gates — most of the guides in the second column are gone or renamed.
Worth keeping for one thing alone: it is the only file that names the conflicts between guides,
which is genuinely useful. I'd cut it to just the conflicts and let the keywords table carry the
pointing.

### `notes/guides/pre-flight/keywords.md`

A long table mapping a word in a request to the guide to read before acting.

**Rewrite:** check every row against what exists — several point at files that were renamed
this week (`create a design`, `keep shop`, `update guides`) and at `chat.md`, which is gone.
Then say plainly at the top that the table is read on every response, since nothing in it says
so and that is its whole reason for existing.

### `notes/guides/pre-flight/pitfalls.md`

Twenty numbered edge cases that have caused mistakes, mostly failures to read before acting.

**Rewrite:** the numbering skips from 16 to 19, so two entries were removed and nothing was
renumbered — that alone says the file is not being maintained. Several entries are now enforced
by hooks and could go. The rest overlap heavily with the working rules; I'd merge the two and
keep one file, since a reader told to read both will read neither carefully.

### `notes/guides/pre-flight/agency.md`

Sixteen standing rules on how the work is done.

**Rewrite:** current and load-bearing — I follow it every turn. Two rules are stale in detail:
rule 4 says to prefer certain file tools over shell commands, which the hooks now enforce
themselves, and rule 16 points at pitfalls, which I'd merge into this file. I'd take the tag off
after those two.

### `notes/guides/pre-flight/response.md`

How every reply is written: how short, how plain, what must be proved before sending.

**Rewrite:** current — written two days ago, and the newest rule in it (how to name a file) was
added today. I'd take the tag off. The one thing I'd add: it says a hook enforces the
evidence rule, which is worth naming outright rather than as a struck-through line.

### `notes/guides/pre-flight/shorthand.md`

Every short command Jonathan types, and what each one does.

**Rewrite:** two rows point at guides by their old names, and one names a file that moved
projects. Otherwise this is the most-used file in the set and reads well. I'd fix the three
rows and take the tag off.

### `notes/guides/pre-flight/banned words.md`

The words that cause friction, each with what to use instead.

**Rewrite:** current in content; what is stale is the framing. It says di keeps its own list at
a path that exists, but nothing says how the two are combined, and the "hooked" and "same"
columns are explained in a paragraph that takes longer to read than the table. I'd move that
explanation under the table as two short notes.

### `notes/guides/synopsis of our guides.md`

A hand-kept rundown of every shared guide: what is settled, what is thin, what is missing.

**Rewrite:** this is the most stale file in the whole set — dated four weeks ago, it knows
nothing of overview, of the rules being split in two, of the labels every guide now carries, or
of any file renamed since. Its own worth is in the third section, the ten structural gaps, which
is thinking rather than bookkeeping. I'd cut the first two sections entirely — overview now
answers those questions live — and keep the gaps as a short file of its own.

## di's guides

### `di/notes/guides/pre-flight/always.md`

The standing rules that apply only to di, read alongside the shared ones.

**Rewrite:** four of the paths it hands out are wrong, and they are the first paths a session
follows: the revert hook is now a folder, and di's own learn file sits somewhere other than
where this says. Fix those four, then cut rule 8 — five paragraphs of past mistakes that repeat
what the shared pitfalls file already says, at greater length.

### `di/notes/guides/project/philosophy/update guides.md`

How to keep di's guide pages in step with its code.

**Rewrite:** it names two files that are gone, one of them di's own map — the very file it tells
you to update. Point it at the map's real place, and cut rule 4, which describes a component
tree that no longer has those four children.

### `di/notes/guides/project/philosophy/logic driven design.md`

Rules, tests and code kept in lock-step, so any drift is caught by the build.

**Rewrite:** it hangs on a checking tool that is not in the repo and a manager file that is
gone, so the loop it describes cannot be run as written. Either the tool comes back or the file
should say plainly that the discipline is now carried by the test runner and the type check.
As it stands it describes a process nobody can follow.

## ws's guides

### `ws/notes/guides/architecture/ux/paging.md`

How the radial ring shows one page of widgets at a time when they do not all fit.

**Rewrite:** it names a pager component that is gone, and half the file is code quoted at
length — which ages faster than anything else in a guide. I'd cut every code block, keep the
three-part explanation and the edge cases, and point at the files rather than copying them.

### `ws/notes/guides/architecture/ux/breadcrumbs.md`

Three parts working together to show either ancestry or browsing history.

**Rewrite:** 34,000 characters, a table of contents, quoted code throughout, a line reading
"Migration plans have been moved to ." with nothing after it, and two files named that are
gone. This is a design document that outgrew being a guide. I'd cut it to a page: what the
three parts are, how they hand off, and where to look — and mothball the rest.

### `ws/notes/guides/architecture/internals/styles.md`

One place that works out every color from the current state.

**Rewrite:** 32,000 characters with a table of contents ten entries deep, sections headed
"Implementation Status" and "Future Work", and a file named that is gone. Same treatment as
breadcrumbs: keep the idea — every color derived in one place from state — and the list of what
each state means, cut the planning sections, which are notes rather than a guide.

## ji's guides

### `ji/notes/guides/map.md`

Every source file in ji, one line each.

**Rewrite:** three of the files it names are gone, and it still describes the chat view and the
manage-tags stub as if both were live. A map is worth exactly its accuracy, so the fix is
mechanical rather than editorial: walk it against the folder and correct every line. Overview's
repair could do most of it.

### `ji/notes/guides/specifications/db spec.md`

What ji stores, where, and what the first working version had to do.

**Rewrite:** it names two files that do not exist, and its own opening says the paths are under
ws rather than ji — a leftover from where it was written. More deeply: it is a specification for
work already done, so it describes what was intended rather than what exists. I'd retitle it as
a record of the design decision and write a short current one beside it, or drop it.

## What these have in common

1. **Half are stale by a path, not by an idea.** Fixing the paths would clear the tag on nine of
   them without a word of prose changing.
2. **The three biggest — breadcrumbs, styles, paging — are stale because they are documents, not
   guides.** They quote code, carry tables of contents, and hold planning sections. Anything
   that quotes code goes stale the moment the code moves.
3. **The pre-flight folder repeats itself three ways** — keywords point at gates which point at
   guides — and every one of those pointers is a thing that can rot. One table would rot in one
   place.
