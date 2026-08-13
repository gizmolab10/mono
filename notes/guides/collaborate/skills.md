---
kind: refer
title: "Skills"
description: "The words typed with a leading slash, what each one does, and where they live."
tags: [session, team, tools]
date: 2026-08-10
---
# Skills

A skill is a word typed with a leading slash. Each is one small file under `.claude/commands/`, holding plain instructions rather than code — typing the word hands those instructions over as if Jonathan had written them out.

The list is read when a session starts. A file added part-way through is not offered until the session is restarted.

They fall into three sorts.

## Pick up a project

Each writes the project's short name into `.working_project`, then reads that project's list of what is owed and offers the first unchecked thing. Which file holds that list differs by project, which is why each has its own skill rather than one shared word.

| Skill | Project |
| --- | --- |
| `/mo` | the shared collection |
| `/di` | design intuition |
| `/ws` | webseriously |
| `/ji` | Jeffrey's space |
| `/ga` | the game |
| `/me` | Jonathan's own work |
| `/ma` | ma |
| `/s3` | s3 |
| `/lv` | lv |

Two of them do not write the project name: `/ji` and `/lv` only read and offer.

## Work on whatever is already picked up

| Skill | What it does |
| --- | --- |
| `/cd` | reads whichever project is picked up, and offers the first unchecked thing it owes |
| `/re` | the same, from that project's revisit file |

## Everything else

| Skill | What it does |
| --- | --- |
| `/always` | proves that the guides arriving with every message and the guides wearing the `always` tag are the same set |
| `/br` | stops the work and walks the four steps of [breakdown](breakdown.md): declare it, state the objective, take stock, try again |
| `/dream` | a reflective pass over the memory files, gathering what was learned into something a later session can read quickly |

## Skills against shorthand

A skill is a whole instruction, typed alone. [Shorthand](../pre-flight/shorthand.md) is a word typed inside an ordinary sentence — `pac`, `loc`, `v:` — which changes how that one reply is written. The two never overlap: a skill starts with a slash and stands on its own line.
