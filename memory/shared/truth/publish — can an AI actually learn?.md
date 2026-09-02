---
kind:
title: Can an AI actually learn?
description: The whole memory design, explained plainly and in enough detail that a newcomer and their AI could build it.
use_when:
  - explaining the system to someone new
  - writing about the system
  - publishing the recipe
tags: [incorporated]
date:
---
# Can an AI actually learn?

Prompted by [Your ChatGPT can be much better than the one you're using](https://medium.com/@office.dosanko/your-chatgpt-can-be-much-better-than-the-one-youre-using-05cb5b16d1e9) (office.dosanko, Medium). What I present here offers what that article leaves out: enough detail to build the thing. Paste it to your AI and build it together.

## The idea

An AI forgets. We all know this, right? Close the chat and a lot of the work we did together is gone. The next chat starts from what remains (in claude's internal memory files), and we spend the first ten minutes painfully and carefully re-explaining. As well, long chats get compressed to save space, and the compression quietly forgets.

Articles about giving an AI external memory appear weekly. Briefly said, keep the memory outside the AI, in ordinary text files on our own computer. At the start of every chat, the AI reads a few of them. Having done that, it knows what we know.

It 'learns' by editing the files. It only when we ask for it, so you can catch and reject hallucinations and mud.

Write it once when the insight hits you, relieving yourself of the burden of remembering and articulating it accurately.

## Uncommon goals

What sets this one apart is these three goals, and the mechanism that accomplishes each.

- **Maintain a single source of truth that adjusts to constant design change.** Real projects pivot, again and again, moving from prototype to MVP and then through potentially endless tweaks and polish. The memory must always say what is true *now* — never a pile of layers where what is new contradicts history. The mechanism: removing history engenders clarity — and the removed material is preserved in git.
- **Pinpoint anything fast.** When one detail needs changing, there must be exactly one place to change it, and finding that place must take seconds — not a tedious hunt through an ever-growing corpus.
- **Keep refining how you and the AI talk.** Every example of poor communication — a vague word, an unreadable reply, a misunderstood request — is recorded and then enforced: a small, carefully chosen dictionary defends against **word salad**, and a conventions file turns each friction into a standing rule. This solves my most unpleasant pinch point working with AI.

If you have felt any of those three problems, this article was written for you.

## The folders

One folder called `memory/`. Inside it, one folder per project, plus one called `shared/` for things true across every project — the rules, the shared vocabulary, your taste. Each project folder looks like this:

```
memory/
  shared/
    index.md          the table of contents
    log.md
    truth/            1 source of truth
      handbook.md     1 source of governing rules
      lexicon.md      1 dictionary
      decisions.md    choices made, and why
    zone/             everything not yet accepted
      ideas.md
  my-project/
    index.md
    log.md
    truth/ ...
    zone/ ...
```

## The four kinds of file

### **The table of contents** (`index.md`)

One page. What this project is, one paragraph saying how it stands right now, and a list of the truth files with one line each saying what each holds. When the AI starts a chat, this is the first thing it reads.

### **Facts the project has incorporated** (`truth/`)

Each file covers exactly one subject. Each fact lives in exactly one file — never two, so there is never a second copy to fall out of date. Each file starts with a few labeled lines the AI can search: a one-line description, a few tags, and a `use_when` line saying which kinds of task should load it. Keep each file under about 100 lines and each project under about 15 of them; past that, split or merge.

Facts are written as what IS true, only. When a design changes, the old wording is deleted and replaced — not kept alongside. History is not the truth folder's job (see snapshots, below).

One truth file deserves special mention: `decisions.md`. It holds only choices likely to be revisited — one line each: the date, what was chosen, and why. When a decision goes final and no one will ever reopen it, its line is deleted. Kept under about ten live items, or it silts up into a second log.

Another: `conventions.md`, in `shared/`. This is where the collaboration itself improves. Every friction — a vague word the AI used, a reply written so you had to work to read it, a request it misunderstood — becomes a recorded rule here, and the AI reads the file at every chat's start. Corrections stop repeating because they stop being conversation and become memory.

### **The project's live thinking** (`zone/`)

A scratchpad. Anything may be jotted here with no ceremony. Nothing here is treated as true until it is deliberately moved into `truth/`. An idea that sits untouched through three tidy-ups gets promoted or thrown out.

### **The log** (`log.md`)

One line per event. Lines sit under a heading for each day (`## 27 August 2026`), newest day first, newest line first within its day. Each line starts with a letter:

```
## 27 August 2026
- D: picked blue for the header — the gray read as disabled
- Q: does the footer need the same treatment?
- I: the settings page could reuse the header's layout
- S: header done; footer untouched
```

D is a decision made. I is an idea. Q is a question still open. S is where things stand. The dates matter — never reuse yesterday's heading for today's line.

## The daily rhythm

**Start of a chat.** The AI reads: the table of contents, the rules file, the dictionary, and whichever truth files' `use_when` lines match today's task. A few pages — about 2,000 words — not the whole pile.

**During the chat.** The moment a decision is made, the AI edits the one truth file that owns that fact and adds one D: line to the log. Nothing waits until the end of the chat, because chats end without warning.

**End of the chat.** An S: line saying where things stand, and a Q: line for anything left hanging.

## Tidying up

The log grows. Around thirty lines, it gets tidied. The steps:

1. Read every log line.
2. Settle each one: a D: line's fact goes into the truth file that owns it; an S: line rewrites the "how it stands" paragraph in the table of contents; a Q: line is carried forward to the top of the fresh log; an I: line is promoted into truth, kept in the scratchpad, or thrown out.
3. Delete the settled lines.
4. Check: every deleted line either reached a named home or was dismissed with a stated reason. Nothing gets "summarized" into vagueness.
5. Save the whole change as one snapshot, labeled so it can be found.

**Snapshots** come from git — an ordinary free tool programmers use that keeps every past version of every file. (Your AI knows it well and can set it up in minutes.) Git is what makes deleting safe: old facts are not hoarded "just in case," because git remembers them, and a tidy-up that went wrong is undone with one command.

So there are three layers of time: the truth files say what IS true, the log says what happened recently, and git says what USED to be true.

## Words

Every project keeps a small dictionary file (`lexicon.md`). A term goes in because it has meaning that is specific to the project. Any word not in the lexicon must be plain language, common in use and meaning. Each entry is one line, with an optional line naming what the term does NOT mean. For example,

```
- **zone** — the folder where ideas gather before they are accepted as truth. in the sense of 'how I stay in the creative zone'
  Not: truth.
```

This matters more than it sounds: AI writing drowns people in impressive-sounding words whose meaning is difficult to guess. The lexicon is the answer. When the AI uses a new term, it must define it, or use plain words instead. The user then has the option to ask that the term be added to the lexicon (define).

## The toolkit

You run the system with a handful of one-word commands the AI has been taught. Define them once, as skills, and then they are reliable, repeatable, available, easy to use. These seven skills give you reliable steering as you drive your projects forward:

- **start** — read the files and say in three lines: how things stand, what was loaded, what questions are open.
- **decision, d** — a decided-upon fact -> put it into the most relevant truth file and add a D: line to the log. This command is the workhorse — the most-used command of all.
- **pac** — pros and cons of a choice, each point tied to a recorded fact, ending with the question that would decide it. Written into the decisions file.
- **propose** — jot an idea into 'ideas' where it can be developed.
- **go, g** — implement a proposal or proceed with a suggestion made by the AI.
- **settle** — run the tidy-up, all five steps, ending with a list of where every line went.
- **check** — audit the files: broken structure, drifting word meanings, duplicated facts.

These 5 skills significantly aid communication:

- **define** — add one term to the dictionary. AI never adds on its own.
- **translate, t** — reword the AI's last reply in plain words. The repair command for the third goal; a phrase needing translation twice becomes a recorded rule.
- **synonyms, syns** — offer a list of words synonymous with the one given.
- **where** — name the one file that owns a given fact.
- **summary, sum** — the state of the current chat in a handful of lines.

Keep the set small — around a dozen. Commands that write (define, propose, settle, go, decision, pac) always leave a log line; commands that only read (check, translate, where, summary) don't.

One obstacle worth knowing about before you hit it: the AI only obeys words it re-reads every chat. A sequences of chat exchanges is forgotten with the conversation. Add new skills as and when you find yourself repeating something tedious or complex.

## Who decides

You. The AI changes nothing unless you ask for it.

Some advise: after a big tidy-up, open a brand-new chat and ask it to **check** the work. The chat that did the tidying will overlook its own mistakes; a fresh one has no stake in them.

Some AI setups can run small jobs automatically — when a chat opens, before a file is saved, or on a timer. Those jobs are allowed to read files and speak up: eg, 'the log is long and ready for tidying', or 'a fact changed with no log line'. It helps a lot if you never allow AI to change anything — no writing facts, no tidying, no deleting.

A reminder costs you nothing even when it is wrong. AI authored material is best treated as suspect.

## If you already have a pile of notes

Most people do. Do not import it. The rules that worked:

- **Move truths, not history.** Only what is currently true and would change what the AI does enters the memory. Old journals, dead plans, and stories stay behind.
- **Pull, don't push.** Move a thing the day real work actually reaches for it. Never bulk-import — bulk imports carry the rot in with the food.
- **A move is a move.** Delete what the old file loses. A fact living in two places is already two facts.
- **Write nothing new into the old pile, ever.** From day one, every new rule, term, and decision goes into the memory. The old pile only shrinks.
- **Keep a death list.** One file naming what still lives only in the old pile; strike a line when its content moves in or is declared dead. An empty list means the old pile can be deleted.

## Build it

Tell your AI something like: "Create the folder layout above. Write the rules file from this page — the four kinds of file, the daily rhythm, the five tidy-up steps, the dictionary rules, the dozen commands, and who decides. Seed the dictionary with nothing. Then run start." Then use it for real work, and fix the rules the moment they chafe — the rules file is itself a truth file, edited like any other.

## Why it works

- Everything is small: small files, short logs, a few pages read per chat. Small enough that you can read all of it — which means you can catch it drifting.
- Every fact has exactly one home, so fixing a fact is editing one file.
- Deleting is safe, so the files stay current instead of hoarding history.
- You stay in charge, so the memory stays honest.
