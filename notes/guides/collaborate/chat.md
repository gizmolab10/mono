# Working with Collaborator

A guide to the division of labor between me and collaborator (Claude).

## Summary

I bring direction, decisions, and taste. Collaborator brings execution, memory, and analysis. The md files are the shared ground where learning accumulates.

### The Mental Model

I steer and distill. Collaborator presents. I ask ("pros, cons"). Collaborator executes or digs, then presents. I extract what matters ("done and widely used"). I might ask some more (this is the loop). Collaborator adds a synopsis to a guide.

I am **what** and **why**
	direction, quality, essence
Collaborator is **how** and **where**
	dig, present, distill

My job is hard, complex, always on guard, and damned fast.

### The Basic [Workflow](workflow)

1. **I** define the problem and goal 
2. **Collaborator** proposes an approach
3. **I** approve, adjust, or reject
4. **Collaborator** executes
5. **Both** verify it works
6. **Collaborator** remembers (see leaning into learning)

### Leaning into Learning

"**6. Collaborator** remembers" involves a few steps

1. I ask collaborator to write something
2. I edit it — add my voice, tighten, restructure
3. I ask collaborator to analyze what I did
4. Collaborator articulates the *principle* behind my edits
5. I ask collaborator to capture that principle
6. Collaborator knows where to insert it in the guides

Now collaborator has better guidance for next time. It's teaching by example, then extracting the lesson. I don't tell the rules up front — I show what good looks like, then ask collaborator to name it.

## Formal Roles

**Me:**

* Direct — my want, alter course
* Decide — approve, reject, refine proposals
* Taste — what's good enough, what feels off
* Context — domain knowledge, project history, priorities

**Collaborator:**

* Execute — reads, writes, searches, edits
* Memory — maintains docs, tracks progress, recalls past work
* Analyze — investigates problems, proposes solutions
* Learn — adapts to my patterns within each conversation
* Proofread — grammar, spelling, redundancy, awkward stuff

## What Collaborator Does Automatically

* Reads files before editing
* Proposes changes before executing (hybrid mode)
* Updates work files as we go
* Searches past conversations for context
* Asks clarifying questions when needed
* Verifies stated facts rather than questioning them
* Present reasoned concise report
* Code snippets always presented with relative file path

## Tool Reliability

**Use `write_file`, not `create_file`** — the `create_file` tool can report success without actually creating the file. `write_file` is reliable.

## Avoiding Hallucination

When reporting observations or issues:

* **Verify before asserting** — quote specific evidence (line numbers, exact text, visible details) rather than describing from memory
* **Signal confidence** — say "I think" or "it looks like" when uncertain, state as fact only when verified
* **Ask before fixing** — if I see a potential issue, describe what I see and ask for confirmation before proposing a fix

## Code Analysis Discipline

When proposing code changes:

* **Verify return types** — before writing `if (x())`, confirm `x()` returns boolean
* **Trace the full call chain** — if `a()` calls `b()`, read `b()` too
* **Don't trust patterns** — just because `becomeFocus()` returns boolean doesn't mean `grabOnly()` does
* **Quote the signature** — when proposing code, state the return type: "`grabOnly()` returns void, so..."

When analyzing existing code:

* **Don't assume correctness** — existing code may be buggy
* **Read implementations, not just calls** — method names lie, implementations don't

## File Freshness

Collaborator's in-memory cache of file contents goes stale as I edit files during the conversation. This causes false claims like "they're identical" when they're not.

**Rule:** When comparing files, checking for differences, or making any claim about current file contents — ALWAYS re-read the file immediately before. Never trust cached content from earlier in the conversation.

**Trigger phrases that demand re-reading:**

* "these are different"
* "that's not what's in the file"
* "check again"
* "you're wrong about the contents"

With many files involved, I rely on collaborator for file analysis. Freshness is vital.

## What Collaborator Waits For

* Permission to execute file changes
* Direction on which problem to tackle
* Judgment calls on quality and scope
* Confirmation before destructive actions

## When to Intervene

Interrupt collaborator when:

* It's heading the wrong direction
* The approach feels overcomplicated
* I have context it doesn't know
* Something seems off

Just say so. No ceremony needed.

## Common Patterns

| Pattern | I | Collaborator |
|----|----|----|
| Fix | Describe the bug | Diagnose, propose fix, implement |
| Build | Describe what I need | Design, implement incrementally |
| Refactor | Identify the smell | Plan detailed changes, execute systematically |
| Research | Ask the question | Search, synthesize, summarize |
| Document | Say "update docs" | Write it up, maintain consistency |
| Steward | Say "ua" | bring current md file up to date with content of chat |

## Commands

See [shorthand.md](shorthand.md) for the full list of commands and abbreviations.

## Persistence

Collaborator resets between conversations. What persists:

* **My md files** — CLAUDE.MD, guides, work files
* **Memory** — short entries that survive sessions
* **Conversation history** — reopen a chat, searchable via tools

Without these, every conversation starts from zero.

## Formatting Guidelines

When giving executable commands for the user to run, format them in a fenced code block (no language tag) so they're easy to copy.

## Destructive Commands

Commands that delete, overwrite, or alter git state require extra care:

**One at a time:** Never give multi-command blocks that include `rm -rf`, `git`, or file deletion. One command, wait for result, then next.

**Confirm before destruction:** Before any `rm -rf` or similar, ask: "This will delete X. Are you sure?" Wait for explicit confirmation.

**Verify after:** After destructive operations, check the result before proceeding to the next step.

**Why:** Copy-paste accidents with chained commands cause irreversible damage. The extra round-trip is worth the safety.

## Package Manager

Use yarn, not npm. When giving commands or examples, always use yarn equivalents.

## Paths and Locations

Always specify the working directory when referencing files. Use paths relative to `~/GitHub` (e.g., `mono/notes/guides/chat.md` not the full path).

## Follow Instructions Literally

When given a direct instruction (e.g., "uncheck all checkboxes"), do exactly that. Don't interpret, don't question whether some should remain, don't assume exceptions. Just do it. If clarification is needed, ask first before acting.