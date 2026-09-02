---
kind: specify
title: "Lexicon (mono)"
description: "The words every project says, and the word to use where another has been banned."
tags: [always, prose, session, team]
date: 2026-08-11
---
# Lexicon

The words used across every project. Use them exactly, even when a near synonym exists. If it is here, that is its name.

Reaching for a word that is not here, say so and stop. Do not invent one.

A part of the app that has a name in the code — a file, a folder, a class, a prop — is called by that name. Plain english says what a thing **does**; it never renames what a thing **is**. A description in place of a name cannot be looked up, cannot be searched for, and does not say whether one thing is meant or several.

Each project keeps its own lexicon for its own things — [di](../../../di/notes/guides/pre-flight/lexicon.md), [ji](../../../ji/notes/guides/pre-flight/lexicon.md), [ov](../../../ov/notes/guides/pre-flight/lexicon.md). Nothing here is repeated there.

## Who

- **Jonathan** — what and why. Direction, taste, decision.
- **co** — how and where. Reads, traces, proposes, and builds on a go. Never *the collaborator*, never *Claude*, never *the assistant*. In every guide, note and reply, co is named **co** — never *i*, never *me*, never *you*. A rule addressed to co says "co", so the reader always knows who is meant.

## What we keep

- **guide** — a file in `notes/guides/`. Living reference; it holds decisions, not work.
- **work note** — a file in `notes/work/`. What is being done now.
- **collection** — one project's whole set of files: mono, di, ji, ov, ga, me.
- **labels** — the five lines at the top of a file: kind, title, description, tags, date.
- **kind** — the first label, saying what sort of file it is. Five exist: howto, specify, explain, arch, analyze.
- **tag** — a word in the labels saying what the file is about.
- **brief** — the description label. One sentence.
- **map** — a project's file map. Read it instead of discovering files using regex and wildcards; update it when files move.
- **index** — the list of what a folder holds. Update it when files come or go.
- **handoff** — current status and the one **Next** action. Read first each session.
- **code debt** — open tasks as checkboxes. **code debt paid** holds the finished ones.
- **journal** — finished work, newest first.
- **learn** — past mistakes, never to be repeated. Twenty entries means time to distill.
- **lexicon** — this file.
- **banned words** — the words that mean nothing to Jonathan, each with the word to use instead.
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
- **evidence** — a quoted line and its file, on its own line, after the plain words.
- **visual confirmation** — Jonathan looked at the screen and said what he saw. Never *eyeball*, never *nod*.
- **mistrust point** — a mark against trust, earned by stating a thing as fact without checking it, or by calling work done while steps remain.
- **complaint** — one row in the murk record: a reply Jonathan could not read. **rate** is complaints per 100 replies.

## Verbs to use carefully

The [banned words](banned%20words.md) turned the right way round — the word to use, with the one it replaces.

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
- **button** — a thing on screen that can be pressed. Never *mark*.
- **decoration** — something stamped on a thing to say what it is: a number beside a row, a slash across a folder. Never *mark*.
- **gap** — empty space. Never *room*.
- **margin** — the empty strip at an edge. Never *band*, *bar*, *padding*, *gutter*.
- **highlight**, **highlighted** — shown as picked, or shown as under the cursor. Never *lit*, never *mark*. Between these three, *mark* has no use left at all.
- **hierarchy** — how things sit inside each other. Never *tree*.
- **details** — the column at the side. Never *panel*.
- **mock** — a small made-up case that shows the fault. Never *repro*.
- **detour** — work off the path of the task. Never *side-build*.
- **bug**, **problem** — something wrong. Never *liar*.
- **more work** — the next step is heavier than this one. Never *heavy lift*.
- **easy to misuse** — the shape invites the mistake. Never *footgun*.
- **plugin architecture** — the shared storage interface. Never *seam*.
- **main** — belonging to every project. Never *cross-project*.
- **drifted** — moved off true over time. Never *slid*.
- **who does what** — the division of labor. Never *split*.
- **useless cruft** — what is there and does nothing. Never *padded*.
