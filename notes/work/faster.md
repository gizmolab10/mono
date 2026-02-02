# Faster Session Starts

**Started:** 2026-02-01
**Status:** Research

## Problem

`go di` costs ~45k input tokens — reads CLAUDE.MD chain, all pre-flight guides, collaborate guides, di project files, work/resume. Every new session pays this cost. No way to "bake" context into reusable tokens.

## Options

| Approach | Effect |
|----------|--------|
| Trim guides | Remove rarely-used files from always-read path |
| Lazy load | Only read guides when keyword triggers, not at session start |
| Consolidate | Merge small files into fewer larger ones (fewer read calls) |
| Shorten resume.md | Keep tight; archive detail to milestone files |

## Constraint

Claude Code has no "cached context" feature. Fresh reads every session. Tradeoff: no stale cache across sessions, but startup cost is unavoidable.

## Next Action

Audit which guides are actually used. Consider moving some to keyword-triggered only.
