---
kind: refer
title: "Murk"
description: "Why the replies come out murky: six causes in the hooks, six in the guides, four now closed and one counted."
tags: [active, notes, prose, team]
date: 2026-08-11
---
# Murk

## define

challenging to understand.

### pros and cons of

remove banned words

## hypothesis

the mono guides and hooks system contribute to a strong tendency towards murk. and then i ask for translate, t. analyze them as a system and determine if the hypothesis is true, and a list of causes

### yes, and the system is the larger half

The hypothesis holds. Six of the rules that are applied to every message push toward murk on their own, before any carelessness of mine.

### 1. Resolve this as a single rule

The rules pull against each other

From [always.md](../../../notes/guides/pre-flight/always.md), rule 1 caps a reply at three sentences. Rules 5, 6 and 7 each cost words:

1. quote the line
2. name the file
3. name every part
4. say what each does
5. say what both sides are
6. rather than one as the absence of the other

Four rules, one budget. What comes out is compression — clauses stacked, connectives dropped — and compression reads as murk.

### 2. A ban on the names, with no list of what to say instead

Rule 2 says *say what a thing does, not what it is called. No names of code, no jargon.* So every noun in a reply is a paraphrase, and mono has no list of paraphrases to reach for — 26 rows of words never to use, and none of words to use. di, ji and ov each keep a lexicon. mono keeps none, and mono is what governs every reply.

This is the strongest cause. A word invented fresh each turn is a word you have to decode each turn.

**decision**: add a lexicon — **done**. [lexicon.md](../../../notes/guides/pre-flight/lexicon.md) holds 44 words every project says, gathered from the three project lexicons, the guides, the hooks and one session's chat. It arrives every third turn, in the slot the shared banned-word table used to hold.

### 3. Two thirds of the rules are absent from any given turn

The [inject-always.sh:25](../../../.claude/hooks/inject-always.sh#L25) hook sends one of three files per message, in rotation. A rule I wrote to yesterday is not in front of me today; the next turn's reply is written to a different two thirds.

**decision**: analyze the risk. i suspect it is low — **settled, and you were right**. The limit is not ours to lift: nothing in the hooks sets it, and "about 2000" is my own guess in a comment. The rotation is three long today, not four, since ji keeps no banned-word list of its own.

### 4. Some of the forced swaps change the meaning

The file [banned words.md](../../../notes/guides/pre-flight/banned%20words.md) is applied word for word. `move` for `copy` are different acts. `gap` for `room` loses the sense of capacity. A sentence bent around a word that does not fit is murky by construction.

**decision**: pac: discard it — **half done**. The table no longer arrives before a message; the lexicon does, saying the same 21 pairs the right way round, as a word to reach for. The table itself still sits on disk and is still read by the two scripts that check a finished reply, so the ban stands where it does no harm to a sentence being written.

### 5. The ban is enforced; plain English is not

A hook checks every reply against the banned words and rejects a hit. Nothing checks whether a sentence says a thing. What is measured is what gets obeyed, so word choice is policed and clarity is left to me.

**decision:** same as #4 — **and now clarity is measured too**, see below.

### 6. The guides model what they forbid

Six ways, counted below. They arrive with every message, so what they do is what I do.

## yes, our guides are murky

### 1. Pointers to names that no longer exist

26 rows across [keywords](../../../notes/guides/pre-flight/keywords.md), [kinds of tasks](../../../notes/guides/pre-flight/kinds%20of%20tasks.md) and [gates](../../../notes/guides/pre-flight/gates.md) send you to `refactoring.md`, `migration.md`, `style.md`, `markdown.md`, `journals.md` and `hub/port.md` — all renamed or moved. Nine markdown links go nowhere. `file layout.md` is named as a standard piece every project keeps; no project has one.

### 2. The words disagree with the link

`See [refactoring.md](../develop/refactor.md)` — the reader trusts the word and looks for a file that isn't there.

[chat.md:249](../../../notes/guides/collaborate/chat.md#L249)

### 3. Three names for one actor

[chat](../../../notes/guides/collaborate/chat.md) calls it collaborator, co, and Claude; [workflow](../../../notes/guides/collaborate/workflow.md) calls it co. A reader has to work out they are one.

### 4. Rules written as codes

`STOP/SEARCH/LIST/WAIT` stands alone in two files and is unpacked in a third. Same shape: `problem/goal inline`, `search-per-change`, `hypotheses, verify source` — each a label for a rule stated elsewhere.

### 5. Guessing left inside a standing rule

[workflow](../../../notes/guides/collaborate/workflow.md) carries a whole reconcile-di section, ending "I AM GUESSING these are wanted" — a proposal living in a file whose kind is howto.

### 6. One rule stated three times, differently

Read-before-act appears as [agency](../../../notes/guides/pre-flight/agency.md) 7, [pitfalls](../../../notes/guides/pre-flight/pitfalls.md) 1, and [chat](../../../notes/guides/collaborate/chat.md)'s File Freshness with its own trigger list. Three wordings; no reader can tell whether they differ.

## the six parts of the teamwork

Neither half above is the whole thing. Six parts make every reply, and murk can come out of any of them.

1. **Jonathan** — sets the frame. One word — "murky" — got a file with twelve causes in it. What is asked for decides what is answerable.
2. **Claude** — writes the reply, and can be careless inside rules that were perfectly clear.
3. **The guides** — [notes/guides/](../../../notes/guides/), 55 files. Read at session start, then relied on from memory for the rest of the session.
4. **The hooks** — [.claude/hooks/](../../../.claude/hooks/), 16 scripts. Push rules in before each message and check the draft after it.
5. **The carrier** — what gets the words across. The injector says its own limit in its second line, "cut off at about 2000", and compaction rewrites the conversation behind me. Neither is ours.
6. **Everything else i read** — [CLAUDE.md](../../../CLAUDE.md), each project's file map, and the two learn files. Not guides, and not under any of the rules above.

The two halves blame parts 3 and 4. Parts 1, 5 and 6 have not been examined at all.

## measuring it

Every cause above is reasoned. Not one is measured — which is cause 5 all over again, in a file complaining about cause 5.

So now one thing gets counted. The signal was always there: every `t` is Jonathan saying that sentence did not land. Nothing recorded them.

[murk-count.sh](../../../.claude/hooks/murk-count.sh) runs after every reply. It writes one row per reply, and when his message begins with `t`, `translate`, `rewrite`, `plain`, `simplify` or `murky`, a second row holding both sides — the reply he could not read, and the one that replaced it. It never blocks and never speaks.

Three things come out of that file:

1. **A rate** — complaints per 100 replies. Change a rule, watch the number. If it does not move, the change did nothing.
2. **A shape** — fifty unreadable sentences side by side show what they have in common, which the twelve causes above only guessed at.
3. **A lexicon** — each murky sentence beside the plain one that replaced it. Words he accepted, from the record, not invented.

Ask `rate` for the number. It will not catch murk he shrugs past, so the number is a floor.

### the record

| date | replies | complaints | rate |
| --- | --- | --- | --- |

### what is settled and what is not

Four of the twelve moved today.

- **Cause 2, no lexicon** — closed. [lexicon.md](../../../notes/guides/pre-flight/lexicon.md) exists and arrives every third turn.
- **Cause 3, the rotation** — closed as unfixable. The limit is not ours to lift and was never measured.
- **Causes 4 and 5, the banned words** — plan A is half done. The lexicon took the table's slot in what arrives; the table stays on disk for the two scripts that check a finished reply. The risk I named — a lexicon that is all preference and no nouns — did not come true: two thirds of it names things, and only the last section is preference.
- **Cause 5's other half** — the murk record now counts what nothing counted before.

Still standing: causes 1 and 6, and every cause in the second part except the one it named itself. `co` is now the one name for the collaborator, which closes that part's third cause.

Not examined at all: parts 1, 5 and 6 of the teamwork — Jonathan, the carrier, and everything read that is not a guide.
