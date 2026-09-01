---
kind: specify
title: "Gates"
description: "Which guide must be read before which kind of task."
tags: [session]
date: 2026-05-10
---
# Gates

Task-specific checkpoints. BEFORE the task, read the guide.

| Task | Gate |
|------|------|
| Refactoring (remove/rename symbols) | Read chat.md#refactoring-discipline, then STOP/SEARCH/LIST/WAIT |
| Writing prose for guides | Read voice.md |
| Updating journal | Read journals.md |
| Creating new md files | Read markdown.md |
| Multi-file edits | Search ALL files first, list scope, then proceed |
| Starting a work session | Read the relevant notes/work/\*.md file |
| The same fix tried twice | Read breakdown.md and walk its four steps, or run /br |
| Three rounds with nothing measured | Read breakdown.md and walk its four steps, or run /br |
| **Claims about codebase** | **Search first. No "X is unused" or "X is only called from Y" without grep evidence.** |

## Gate Protocol

When a task matches a gate:

1. **Announce:** "This is a \[task type\]. Co reads \[guide\] first."
2. **Read:** Actually read the guide section.
3. **Quote:** State the key rule from the guide.
4. **Execute:** Follow the rule.

Do not skip gates to appear faster. The gate exists because skipping it caused failures and massive time wastage.
