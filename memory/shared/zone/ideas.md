---
kind: analyze
title: "Ideas"
description: "<!-- Ideas about the collaboration itself"
tags: [born, now]
date: 22 August 2026
---
# Ideas

- [ ] create mj (gallery of girls)

---

## life cycle (30 August 2026)

Proposal — the flow from any idea to truth, five stages, each with one file, nothing waiting anywhere else:

1. Born: a paragraph in zone/ideas.md, or just an `I:` line. Zero ceremony.
2. Weighed: pac grows that same entry in place — For, Against, deciding question. The idea and its evaluation are one thing; nothing moves.
3. Waiting: the deciding question alone goes to questions.md, one line linking the entry. Start reads it every session, so no idea rots unseen.
4. Decided: d — edit the owning truth to state what now holds, one `D:` log line, strike the question, delete the zone entry; one line of why in decisions.md per its own law; a case in cases.md when it teaches.
5. Settled: settle commits; git keeps the full argument forever.

Closes the four doors: pacs live in zone with the ideas they weigh, questions.md holds every wait as one line, decisions.md returns to decided one-liners, unresolved.md is never born.

## rename protocol.md — Jonathan hates the name (30 August 2026)

Candidates: law, canon, code, charter, constitution, covenant, doctrine, creed, rulebook, playbook, bylaws, regimen, procedure, practice, custom, order, rubric, ritual. Already taken: code (software), convention (conventions.md); the file calls itself "the law."

## proposal: the hooks do not reach this session (27 August 2026)

I broke the "stands" rule the day after it was written. I first blamed my memory. Reading the hooks says otherwise.

**What already exists.** `mono/.claude/hooks/` holds a working enforcement apparatus, aimed at exactly this problem:

- `inject-always.sh` runs on every prompt. It pushes `notes/guides/pre-flight/always.md` into the session whole, every single turn, plus one more file per turn in rotation — response, agency, lexicon, the project's banned words. It also checks that every file wearing the `always` tag is actually being sent, and complains when the labels lie.
- `banned-words-check.sh` runs when a reply finishes. It reads the banned-words table as its only authority, generates plural and past forms, and blocks the reply. A row with an empty Meaning column is a hard block; a row with a Meaning is a sense check — it blocks once and asks me to judge. Retries are capped so it cannot loop.
- Four more finish-the-reply checks beside it: conciseness, phrases, diagnostic citation, murk count. Plus `plain-english-check.sh` on every file write.

**Why it did not stop me.** Two gaps, and neither is about remembering.

1. **None of it runs here.** These hooks are Claude Code hooks on your Mac. This is a Cowork session in Anthropic's cloud; it never executes them. The proof is in the hooks' own logs: `log.jsonl` and `murk.jsonl` were last written on 24 August at 19:00, and every turn we have worked since has been in this session. Four days of replies passed no check at all.
2. **Where they do run, they read the old notes.** The rotation names `notes/guides/pre-flight/` files only. `memory/shared/truth/conventions.md` is in no rotation and no table. The rule I broke does exist in the banned-words table — `stand, stands, standing, stood → remain, unchanged` — as a sense check, not a hard block. So even on the Mac it would have asked me to judge rather than refused.

**What follows.**

- The enforcement gap is not a missing hook. It is that half our work now happens where hooks cannot run. Any rule that must hold in every session has to live somewhere both session kinds read — which today means CLAUDE.md and the memory system, not `.claude`.
- The migration (changed to inception, on 28 August 2026) has a collision to settle: the hooks' single source of truth is `notes/guides/pre-flight/banned words.md` and `always.md`, both on the death list. Either the hooks are re-pointed at `memory/shared/truth/`, or those two files join shorthand.md as "stays by design". Re-pointing is the honest answer; it is your hands, since I cannot write `.claude`.
- The rows that matter — "stands", "lands" — should be hard blocks, not sense checks. A sense check asks me to judge the very thing I got wrong.

Open question: is `conventions.md` folded into `always.md` (one file, injected whole, every turn), or does `always.md` move into the memory system and the hook follow it there?

## fine-tuning the control surface: pac vs propose

25 August 2026

1. pac always writes something, the current task decides where
2. "propose" adds ideas to the project for which it has strongest relevance
3. decision: must be two commands since they are at different points along the arc of idea development
    1. pac is research and assessment
    2. propose happens later

## a better term than 'control surface'

27 August 2026 — settled: **toolkit** (d). The hunt ran control surface → verbs → actions → commands → shorthand → set of available actions; ops was pac'd and passed over.

