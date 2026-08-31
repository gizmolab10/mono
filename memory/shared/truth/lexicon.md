---
type: reference
title: Shared lexicon
description: Cross-project terms, defined once. Loaded at every session start.
tags: [lexicon, terminology, incorporated]
use_when: [every session]
updated: 27 August 2026
---
# Shared lexicon

- **memory system** — the entire set of markdown files under `memory/`: indexes, logs, truths, zones.
  Not: the design doc, not the AI's built-in memory.
- **prompt cache** — the slice of the memory system loaded into a session's context by `start`.
  Not: Anthropic's API prompt caching.
- **truth** — a file in a `truth/` folder stating the current design of one concept; the only place that fact lives.
  Not: history (that is git's job), not an idea (that is the zone's).
- **settle** — consolidation's line-by-line step: each log line moved into its one home, dismissed with a stated reason, or carried forward unsettled.
  Not: summarizing.
- **toolkit** — the set of skills that act on the memory system: start, pac, define, propose, settle, check, where, summary.
  Not: the shorthand file (the trigger surface), not any one skill.
- **zone** — the folder holding a project's live thinking: active plans, research, considerations, bright ideas, visual references. Named for the state of mind that fills it and the zoning-in that empties it.
  Not: truth, not a waiting room for belief.
