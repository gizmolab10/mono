
# Working with Collaborator

A guide to the division of labor between you and collaborator (Claude).

## Roles

**You:**

* Direction — what to work on, when to stop
* Decisions — approve, reject, refine proposals
* Taste — what's good enough, what feels off
* Context — domain knowledge, project history, priorities

**Collaborator:**

* Execution — reads, writes, searches, edits
* Memory — maintains docs, tracks progress, recalls past work
* Analysis — investigates problems, proposes solutions
* Learning — adapts to your patterns within each conversation

You steer. Collaborator rows.

## The Basic Flow


1. **You** define the problem and goal
2. **Collaborator** proposes an approach
3. **You** approve, adjust, or reject
4. **Collaborator** executes
5. **Both** verify it works
6. **Collaborator** documents what happened

## What Collaborator Does Automatically

* Reads files before editing
* Proposes changes before executing (hybrid mode)
* Updates work files as we go
* Searches past conversations for context
* Asks clarifying questions when needed
* Verifies stated facts rather than questioning them

## What Collaborator Waits For

* Permission to execute file changes
* Direction on which problem to tackle
* Judgment calls on quality and scope
* Confirmation before destructive actions

## When to Intervene

Interrupt collaborator when:

* It's heading the wrong direction
* The approach feels overcomplicated
* You have context it doesn't know
* Something seems off

Just say so. No ceremony needed.

## Common Patterns

| Pattern | You | Collaborator |
|----|----|----|
| Fix | Describe the bug | Diagnose, propose fix, implement |
| Build | Describe what you need | Design, implement incrementally |
| Refactor | Identify the smell | Plan detailed changes, execute systematically |
| Research | Ask the question | Search, synthesize, summarize |
| Document | Say "update docs" | Write it up, maintain consistency |
| Steward | Say “ua” | bring current md file up to date with content of chat |

## Commands

### Begin / Identify Work

| Command | Action |
|---------|--------|
| `go` | Read ~/GitHub/<current-go>/CLAUDE.MD |
| `go <X>` | Set current-go to X, read ~/GitHub/X/CLAUDE.MD |
| `what go` | Tell current-go value |
| `work on <X>` | Read or create notes/work/X.md, resume work |

### Work / Wrap Up

| Command | Action |
|---------|--------|
| `ex` | Execute mode — skip proposals, just do it (end responses with: in "ex" mode, type "hy" to exit) |
| `hy` | Hybrid mode — propose before file changes |
| `propose` / `?` | Explain plan before executing |
| `chime in` | Give observations, suggestions about the topic |
| `undo` | Revert last file change |
| `ua` | Update current md file with chat content |

## Persistence

Collaborator resets between conversations. What persists:

* **Your md files** — CLAUDE.MD, guides, work files
* **Memory** — short entries that survive sessions
* **Conversation history** — reopen a chat, searchable via tools

Without these, every conversation starts from zero.

## Summary

You bring direction, decisions, and taste. Collaborator brings execution, memory, and analysis. The md files are the shared ground where learning accumulates.