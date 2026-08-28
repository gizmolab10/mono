---
kind: explain
title: "Murk record"
description: "The use case behind the murk guide: twelve causes found in one rule set, six now closed, and the daily rate they were measured against."
tags: [journal, keep, notes, prose, team]
date: 2026-08-17
---
# Murk journal

Murk is bad news. We may have conquered it — see [murk.md](../../../../notes/guides/collaborate/avoid%20murk.md). Our journey so far...

## afternote ...

the mixture of prose in all our guides is not to Jonathan's liking. our next goal ought to include tracking how Jonathan rewrites my material. keep a separate journal of rewrites. eg, line 10 above was rewritten by Jonathan. propose a record that captures the 'how to write it Jonathan's way'. write it here.

hint. rules that currently are in our guides are just best guesses by Jonathan. consider them unsalvageable, if they're in the way.

### The rewrites are the record

You have rewritten three lines in this file. Each time you did the same thing: I said what was
missing, you said what was there.

| I wrote | You wrote |
| --- | --- |
| A whole day at nothing at all | A whole day of ease and flow |
| Reasoned is not measured | Evidence matters |
| The strategies drawn out of this are a guide now | Murk is bad news. We may have conquered it |

Keep the record as that table and nothing else — two columns, one row per rewrite. A paragraph
under each row explaining it would be more of the prose you are objecting to.

Nothing can gather these on its own. The murk count works because both the reply you could not read
and the one that replaced it pass through the chat. You rewrite in Obsidian, and nothing watches
that. So a row gets written only when I read a file and find that a line I wrote is no longer mine.

## Some rules that cause murk

I do have a tendency to carelessness. Write faster, care less, produce murk. And yet, ...

I write under a set of rules that arrive before every message. Jonathan's hypothesis was that those
rules — the ones meant to make writing clear — were themselves manufacturing the murk. Evidence concurs. Six
rules alone push directly toward murk. This is before the careless kicks in. This journal is the investigation and fix.

### 1. The rules pull against each other

One rule caps a reply at three sentences. Three others each cost words: quote the line and name the
file, name every part and say what each does, say what both sides are and never one as the absence of
the other. Four rules, one budget.

### 2. A ban with nothing behind it

Another rule says: say what a thing does, not what it is called. No names of code, no jargon. So
every noun in a reply is a paraphrase — and there was no list of paraphrases to reach for.
Twenty-six rows saying which words never to use, and no row saying which word to use instead.

This is the strongest cause on the list. A word invented fresh each turn is a word the reader has to
decode each turn.

*Repaired.* [lexicon.md](../../../../notes/guides/pre-flight/lexicon.md) now holds 44 words, gathered
from three project lexicons, the guides, the hooks and one session's chat.

### 3. Two thirds of the rules are absent from any given turn

The rules do not fit in what can be sent, so they arrive one file in three, in rotation. A rule i
wrote to yesterday is not in front of me today, and today's reply is written to a different two
thirds.

[inject-always.sh:25](../../../../.claude/hooks/inject-always.sh#L25)

### 4. A forced swap can change the meaning

The [banned words](../../../../notes/guides/pre-flight/banned%20words.md) table was applied word for
word. `move` for `copy` are different acts. `gap` for `room` loses the sense of capacity. A sentence
bent around a word that does not fit is murky by construction — the reader feels the strain and reads
the strain instead of the meaning.

*Repaired, half.* The table no longer arrives before a message, the lexicon does, saying the same 21
pairs the right way round. The table stays on disk, where the two scripts that check a finished reply
still read it.

### 5. The ban is enforced, plain English is not

A hook checks every reply against the banned words and rejects a hit. Nothing checked whether a
sentence said a thing.

### 6. The guides model what they forbid

They arrive with every message. What they do is what i do. Six ways, counted next.

## Guides were murky, too

1. **Pointers to names that no longer exist.** Twenty-six rows across three guides sent a reader to
   six files that had been renamed or moved. Nine links went nowhere. One file named as a standard
   piece every project keeps existed in no project.
2. **The words disagree with the link.** `See [refactoring.md](../../../../notes/guides/develop/refactor.md)` — the reader
   trusts the word and hunts a file that is not there.
3. **Three names for one actor.** Collaborator, co, Claude. A reader has to work out they are one.
4. **Rules written as codes.** `STOP/SEARCH/LIST/WAIT` stands alone in two files and is unpacked in a
   third. A label for a rule stated elsewhere is not a rule, it is a lookup the reader has to do.
5. **Guessing left inside a standing rule.** A whole section ending "I AM GUESSING these are wanted",
   living in a file whose kind is instruction.
6. **One rule stated three times, differently.** Read-before-acting appears in three guides, three
   wordings, and no reader can tell whether they differ.

### Six parts make a reply

Both halves above blame the rules. That is still too small a frame. Six parts make any reply, and
murk can come out of any of them:

1. **The one who asks** — sets the frame. One word, "murky", produced a file with twelve causes in
   it. What is asked decides what is answerable.
2. **The one who writes** — and can be careless inside rules that were perfectly clear.
3. **The guides** — 55 files, read once at the start, then relied on from memory.
4. **The hooks** — 16 scripts, pushing rules in before each message and checking the draft after.
5. **The carrier** — what gets the words across, with its own limit and its own habit of rewriting
   the conversation behind you. Not yours.
6. **Everything else read** — the top-level instructions, each project's file map, the learn files.
   Not guides, and under none of the rules above.

## Evidence matters

Every cause above was arrived at by thinking. Not one was measured. Which is cause 5 all over again,
in a file complaining about cause 5.

So one thing now gets counted, and the signal had been there the whole time: every `t` is a reader
saying the sentence failed. Nothing had ever recorded them.

[murk-count.sh](../../../../.claude/hooks/murk-count.sh) runs after every reply. It writes one row per
reply, and when the next message opens with `t`, `translate`, `rewrite`, `plain`, `simplify` or
`murky`, a second row holding both sides — the reply that could not be read, and the one that
replaced it. It never blocks and never speaks.

Four things come out of that file:

1. **A rate** — complaints per 100 replies. Change a rule, watch the number. If it does not move, the
   change did nothing.
2. **A shape** — every unreadable sentence beside the one that replaced it, which shows what they
   have in common where twelve reasoned causes only guessed at it.
3. **A lexicon** — words the reader accepted, taken from the record instead of invented.
4. **A chain** — B is the same words as the next row's A, so a run of complaints links up when the
   file is read. Nothing has to be written to hold one.

A chain is worth more than the pairs it is made of. The last reply in a run is the target — it says
how far off I started, and how many turns the distance cost. The middle ones are my wrong guesses
about what the first should have said, so a run maps the ways one sentence can be misread.

**It lost half of every complaint for weeks.** The hook took the second-to-last thing I had said and
called it the reply you could not read. Every tool call is its own entry, so for any reply that
looked a file up first, that was a tool call holding no words. It wrote an empty string and said
nothing about it — cause 5 again, in the very thing built to measure cause 5.

Mended on 2026-08-18: it now passes over the entries holding no words and counts only the replies.
[murk-count.test.sh](../../../../.claude/hooks/murk-count.test.sh) builds a conversation with
thinking and two tool calls between the two replies and proves the pair comes back whole. Run
against the old line, that test fails exactly the way the record did. Rows written before the mend
stay half empty — the hook only writes forward.

### Tracking the effects

| date       | replies | complaints | rate |
| ---------- | ------- | ---------- | ---- |
| 2026-08-12 |      46 |          6 | 13.0 |
| 2026-08-13 |     106 |          1 |  0.9 |
| 2026-08-14 |     120 |          5 |  4.2 |
| 2026-08-15 |     136 |         10 |  7.4 |
| 2026-08-16 |      72 |          1 |  1.4 |
| 2026-08-17 |      71 |          0 |  0.0 |
| 2026-08-18 |      26 |          1 |  3.8 |
| **whole**  | **577** |     **24** |  4.2 |

Read off [murk.jsonl](../../../../.claude/hooks/murk.jsonl), 601 rows. Of the twenty-four complaints,
twenty-two were `t`, one was `murky` and one was `translate`.

**A whole day of ease and flow.** 2026-08-17 ran 71 replies without one asking to be said again. The
days on either side read 1.4 and 3.8, and the three before them read 13.0, 4.2 and 7.4.

Jonathan, on seeing it: *"our three-turns design seems to be reducing the murk. this is a tremendous
relief to me."*

That is the first line here that is neither a cause nor a count. It is what the counting was for.
Unreadable writing is not an aesthetic complaint — it is a tax the reader pays in attention, turn
after turn, and a number falling to zero is the tax being lifted.

**What the number cannot say.** It cannot say which change did it. The lexicon, the rotation that
carries the lexicon, the length cap, the word bans and the distilling all arrived across those same
days. One number cannot separate five causes. And it counts only the murk that was named, so every
figure here is a floor.

## What closed, what stands

Six of the twelve have moved:

- **Cause 2, no lexicon** — closed. It exists and arrives every third turn.
- **Cause 3, the rotation** — closed as unfixable, which is a real state and worth recording.
- **Causes 4 and 5, the banned words** — half done. The lexicon took the table's slot, and the table
  stays where it does no harm to a sentence being written. The risk i named — a lexicon that is all
  preference and no nouns — did not come true: two thirds of it names things.
- **Cause 5's other half** — the record now counts what nothing counted before.
- **Cause 1, the rules pulling against each other** — closed by measurement, not by argument. The cap
  and the three rules that cost words all still stand, unchanged, and the rate fell anyway. What
  changed around them was the lexicon: with a settled word for each thing, saying it costs fewer
  words, so the budget stopped being the binding constraint.
- **Cause 6, the guides modelling what they forbid** — half done. The raw learn log went from 37
  entries to none, each becoming a rule in the guide it belongs to. One rule, one place, said once.

Still standing: every fault in the guides except the third — `co` is now the one name. The dead
pointers, the words that disagree with their links, the rules written as codes, the guessing inside a
standing rule and the one rule stated three times are all untouched.

Never examined: parts 1, 5 and 6 of the machine — the one who asks, the carrier, and everything read
that is not a guide.
