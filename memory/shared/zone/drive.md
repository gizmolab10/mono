# Drive

## 1. gate, check, require, detect

Jonathan, 19 September 2026: gate, check, require and detect all mean the same thing, a condition that must hold, in four different contexts, and co uses them in the wrong context.

1. **Before** — taken from {CLAUDE, hooks, shared-t}, on 19 September 2026: 
    1. **check** in 51 files — 35 in map of shared files.md and 27 in hooks.md, the hook scripts named -check; 
    2. **require** in 15 files, 9 in pitfalls.md; 
    3. **gate** in 9 files, 6 in gates.md; 
    4. **detect** in 2 files, refactor.md and unit testing.md.
2. **After** — One context per word:
    - **check** — when co looks at a thing and compares it with what should be.
    - **required** — a feature, library or facility that if missing blocks work.
    - **gate** — a statement or condition that must be true before the work can be performed or described. [[gates]] lists them by task.
    - **detect** — a check that runs by itself, in code or a hook, and reports what it finds. Every hook detects.
3. **The wrong uses**, found by reading each use against its context, listed here with the file and line and the word it should be.
4. **The fix**, one file per turn: the lexicon holds the four entries, the wrong uses are rewritten, gates.md keeps or loses its name, agency 24 and the hook comments say the right word.

**Current status:** the inventory scanned. The four meanings above are rewritten.

## 2. markdown issue

Proposed 19 September 2026

### Plan

Restrict the hook's **output** to well under co's (unmeasured) estimate of 10KB. This avoids causing the Claude harness to save anything to a file.

#### Proposal

1. A rule in [[agency]]: when a hook's **output** is saved to a file, co reads that file the same turn.
2. A SessionStart hook runs when a session starts. With the key word compact in its settings it runs only at the start that follows a compaction, and not at a fresh start or a resume. It writes CLAUDE.md's reading-on-load list to standard output, which the Claude harness adds to co's context. Then co reads conventions.md and the rest again. Verified 19 September 2026 -> [Claude Code hooks guide](https://code.claude.com/docs/en/hooks-guide) shows this very use (re-adding context after compaction).
3. Co must read less per turn: Always, and a better division system (next) for the rotating reads.

### A better division — by size

Reading [[always]] takes 3.1K, leaving about 7K for the rotated content. That content adds up to about 27K. That's 4 divisions.
A division by section must leave Always pluwith Response at 10.6KB, over the size where the Claude harness saves to a file, about 10KB by co's guess. A division by size does better: the hook cuts each file it goes round into pieces of at most 5KB, cut only at a heading, and goes round the pieces.

---

### Analysis

**The cause.** On every turn, the hook inject-always.sh does two things:
1. reads the Always section of conventions.md
2. in rotation, reads one of these:
    1. conventions' rest
    2. agency
    3. the lexicon
    4. the project's banned words

When a hook's **output** on a turn is large, the Claude harness saves it to a file, and co reads only the first 2KB of it: rules 1 to 5 of Always and nothing else (eg, Response). This session's context was recently compacted. Since then, co has only read single rules of Response, those a task pointed at.

#### Use case

While editing files this afternoon, co has written file names as they appear on disk, such as `chat.md`, violating [[conventions]] (Response 4 says a file name is written as a clickable link, including the folder it lives in). Seems to me that the violations were happening BEFORE the compaction, so that cannot be the cause. What is the cause? This is a very interesting question because it assesses the reliability of this new memory system.

#### current division by size

Current sizes measured 19 September 2026, Always at 3.1KB read every turn:

| piece | KB |
| --- | --- |
| Response | 7.5 |
| Banned words | 6.2 |
| agency.md | 5.3 |
| Conduct | 4.4 |
| lexicon, largest section | 4.1 |
| lexicon, smallest section | 0.4 |

see also [[system failure]].
