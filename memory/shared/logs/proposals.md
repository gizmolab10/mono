# Proposals

## fewer words, same facts (8 September 2026)

Proposal — one rule for Always, and a hook that counts.

**The fault, measured.** One D: line from today: "bridge freed from Configuration's sense first: core's own comment, both goals truths, ov's map and startup line, the entry files of lv, mj, mu and panel, and mu's and mj's operation views now say pushes onto the page." 43 words, one sentence, one fact. The same fact: "Eleven places called Configuration the bridge. Now they say it pushes onto the page." 15 words.

**Where the words come from.** Four habits, each visible in that line. A dash that hides a second sentence. A name followed by its description, when the lexicon already holds the description. A list of every file touched, when a count and git would do. A reason nobody asked for, hung on with "since" or "so that".

**The rule, for Always.** State. Does a sentence bend — a dash, a "since", a name followed by what it means, a list where a count would do? Cut it in two, or cut the second half. One fact per sentence. A thing with a name gets its name and nothing after it.

**The hook.** conciseness-check.sh already runs on every reply. It gains two counts: sentences over 25 words, and dashes per sentence. Over the cap, it reports the sentence. The same counts run on every D: line written into a log.

**The caps.** A sentence: 25 words. A D: line: one sentence. A reply: one sentence per fact, no restating.

**Success criteria.** Every reply and every log line passes the hook. Jonathan reads a week of log lines without asking what one means.

**Cost.** One rule, about thirty lines of shell, one test case.

**Open.** Whether the pac format, one paragraph per pac, keeps its length or takes the same cap per part.

## proposal: the hooks do not reach this session (27 August 2026)

Resolved 7 September 2026: the hooks read `truth/` — conventions.md (always, response and the banned words folded in), agency.md, lexicon.md, and each project's `truth/banned words.md`. The open question below is answered the second way: always.md moved into the memory system, as a section of conventions.md, and the hook follows it there.

I broke the "stands" rule the day after it was written. I first blamed my memory. Reading the hooks says otherwise.

**What already exists.** `mono/.claude/hooks/` holds a working enforcement apparatus, aimed at exactly this problem:

- `inject-always.sh` runs on every prompt. It pushes `memory/shared/notes/guides/pre-flight/always.md` into the session whole, every single turn, plus one more file per turn in rotation — response, agency, lexicon, the project's banned words. It also checks that every file wearing the `always` tag is actually being sent, and complains when the labels lie.
- `banned-words-check.sh` runs when a reply finishes. It reads the banned-words table as its only authority, generates plural and past forms, and blocks the reply. A row with an empty Meaning column is a hard block; a row with a Meaning is a sense check — it blocks once and asks me to judge. Retries are capped so it cannot loop.
- Four more finish-the-reply checks beside it: conciseness, phrases, diagnostic citation, murk count. Plus `plain-english-check.sh` on every file write.

**Why it did not stop me.** Two gaps, and neither is about remembering.

1. **None of it runs here.** These hooks are Claude Code hooks on your Mac. This is a Cowork session in Anthropic's cloud; it never executes them. The proof is in the hooks' own logs: `log.jsonl` and `murk.jsonl` were last written on 24 August at 19:00, and every turn we have worked since has been in this session. Four days of replies passed no check at all.
2. **Where they do run, they read the old notes.** The rotation names `memory/shared/notes/guides/pre-flight/` files only. `memory/shared/truth/conventions.md` is in no rotation and no table. The rule I broke does exist in the banned-words table — `stand, stands, standing, stood → remain, unchanged` — as a sense check, not a hard block. So even on the Mac it would have asked me to judge rather than refused.

**What follows.**

- The enforcement gap is not a missing hook. It is that half our work now happens where hooks cannot run. Any rule that must hold in every session has to live somewhere both session kinds read — which today means CLAUDE.md and the memory system, not `.claude`.
- The migration (changed to inception, on 28 August 2026) has a collision to settle: the hooks' single source of truth is `memory/<project>/notes/guides/pre-flight/banned words.md` and `always.md`, both on the death list. Either the hooks are re-pointed at `memory/shared/truth/`, or those two files join shorthand.md as "stays by design". Re-pointing is the honest answer; it is your hands, since I cannot write `.claude`.
- The rows that matter — "stands", "lands" — should be hard blocks, not sense checks. A sense check asks me to judge the very thing I got wrong.

Open question: is `conventions.md` folded into `always.md` (one file, injected whole, every turn), or does `always.md` move into the memory system and the hook follow it there?
