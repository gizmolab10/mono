---
type: principle
title: Protocol
description: The operating rules of the memory system. Every session loads this at start; every skill points here.
tags: [protocol, rules, operations]
use_when: [every session, running any skill, tuning the system]
updated: 2026-08-22
---
# Protocol

The authority for how the memory system runs. The design rationale lives in `ov/notes/work/AI prompt caching redesign.md`; this file is the law. Tune the system by editing this file — nowhere else.

## Session protocol

**Start.** Read `memory/index.md` → this file → the project's `index.md` → the project's `truth/lexicon.md` (always) → truths whose `use_when` matches the task. Budget: ~2,000 words; if exceeded, name the fat files rather than skipping any.

**During.** When a decision lands, edit its one truth file at that moment and add one `D:` log line. Ideas get an `I:` line, or a paragraph in `zone/ideas.md`. Never defer writes to session end.

**End.** Append `S:` lines for state, `Q:` lines for anything left open.

Log entries are dated, one line each, tagged: `D:` decision · `I:` idea · `S:` state/progress · `Q:` open question.

## Consolidation

Run when a project's log exceeds ~30 entries, or before a major work burst.

1. Read every log entry above the `<!-- consolidated: DATE -->` marker.
2. **Settle each line** by tag: `D:` → edit the owning truth (and `decisions.md` if the rationale will be questioned again); `S:` → rewrite the *current state* paragraph in the project's `index.md`; `Q:` → carry forward to the top of the fresh log; `I:` → promote to a truth / `ideas.md`, keep, or cull. While settling, scan the prose for defined terms used off-definition (reword or formally redefine) and undefined terms (reword into plain language — never retroactively coin).
3. Delete settled entries; move the marker.
4. **Verification pass:** confirm every dropped line was settled into a named home or dismissed with a stated reason. For a large settle, have a *new* session run this check.
5. **Commit as one labeled commit** — `memory: settle <project>` — touching nothing else.

Never summarize prose into vaguer prose. Settling moves facts to their one home and throws away only what it names.

## Concurrent sessions and recovery

- One project, one active session. Different projects are naturally safe.
- If two sessions must share a project: log appends merge; truth edits require having read the file since the other session's last commit. Only one session may consolidate.
- Recovery: a bad settle is one `git revert` of its labeled commit, then settle again.

## Design churn

- Truths are current-only. On a pivot, rewrite the truth wholesale; one `D:` line records the pivot; git records the corpse.
- `decisions.md` holds live rationales only — choices likely to be revisited, one line of "why" each. Delete a line when its decision becomes final.

## Prose and terminology

**Every term in memory prose is either plain language, a lexicon entry, or defined in the same write that first uses it. No third category exists.** The human is the primary reader; a sentence that needs explaining is fixed by rewording, not explanation.

- Lexicon entry format: `**term** — one-sentence definition.` plus an optional `Not:` line naming near-misses.
- One concept, one name; one name, one concept. No synonyms, no overloading.
- Plain language is the default: coin only what would otherwise be re-explained three times.
- Coining is atomic: entry, first use, and `D:` line in the same write.
- Redefinition is a design decision: edit the one entry, log it, sweep old-sense uses.
- Deprecation is deletion; git remembers.
- The owning lexicon is the project's `truth/lexicon.md`; cross-project terms go in `shared/truth/lexicon.md`.

## Zone

- `zone/ideas.md`: append freely, zero ceremony. Every consolidation triages each idea — promote, keep, or cull. Three consolidations without promotion → promote or cut.
- `zone/ref/`: visual references, descriptively named.
- `shared/truth/taste.md`: recurring visual/design principles; loaded whenever the task is visual, on any project.

## Finding where to tweak

In order, stopping at the first hit: (1) the project's `index.md` catalog; (2) frontmatter grep over `tags`/`description` in `truth/`; (3) the link graph. Two files claiming one topic is a duplication bug — fix it.

## Skills

One skill per procedure; the skill is a trigger, not a copy. Write skills (`define`, `propose`, `settle`) log every run; read-only skills (`start`, `pac`, `check`, `where`) don't.

- **start** — execute "Session protocol" (Start). Reply: three-line orientation — current state, truths loaded, unsettled `Q:` lines.
- **pac** — pros and cons of X, grounded: read the truths X touches, `decisions.md` (was this already decided? — if so, lead with the recorded why), the lexicon, `taste.md` when visual. Argue both sides steelmanned, every point tied to a specific truth, principle, or cost; no generic filler; lexicon terms used exactly; no new terms. End with the question that would decide it — a verdict only if asked. Offer to capture via `propose` or a truth edit with its `D:` line.
- **define** — execute "Prose and terminology" for one term. The lexicon's only door.
- **propose** — capture without believing: `zone/ideas.md` or an `I:`/`Q:` line; truths untouched; promotion only at settle or on instruction.
- **settle** — execute "Consolidation", all five steps; finish with the settle manifest (each line and where it went).
- **check** — audit: OKF structure (frontmatter, `type`, links), the sizing table below, terminology drift, duplicated facts, and skill pointers (every section a skill references must exist in this file). Aimed at a settle: verify the commit diff cold; if this session performed the settle, ask for a rerun in a new session. Report finding → file → fix; fix nothing unless instructed.
- **where** — execute "Finding where to tweak"; reply with the one owning path.

## Hooks

Hooks automate reading, checking, and reminding — never writing truths, settling, coining, or deleting. Automation proposes; you dispose.

- Session start → run `start`.
- Commit touching `memory/` → structural `check`; violations block.
- Commit touching `memory/` → warn if `truth/` changed but the project's `log.md` didn't.
- Log past ~30 entries → announce "settle is due"; never settle.
- Session end → draft `S:`/`Q:` lines; they land only on approval.

## Sizing rules

| Thing | Limit | When exceeded |
|---|---|---|
| truth file | ~100 lines | split by concept; update index |
| truths per project | ~15 | merge cold ones |
| log | ~30 entries | settle |
| orientation read | ~2,000 words | prune index + fat truths |
| `decisions.md` | ~10 live items | delete finalized ones |
| `ideas.md` idea age | 3 consolidations | promote or cull |
| `lexicon.md` | ~30 terms | delete dead terms |
| skill set | ~7 verbs | merge overlapping skills |
