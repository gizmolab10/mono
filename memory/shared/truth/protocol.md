---
kind: specify
title: "Protocol"
description: "The operating rules of the memory system. Every session loads this at start; every skill points here."
tags: [always, team]
date: 
---
# Protocol

The authority for how the memory system runs. The design rationale lives in `ov/notes/work/AI memory redesign.md`; this file is the law. Tune the system by editing this file — nowhere else.

## Session protocol

**Start.** Read `memory/index.md` → this file → the project's `index.md` → the project's `truth/lexicon.md` (always) → truths whose `use_when` matches the task. Budget: ~2,000 words; if exceeded, name the fat files rather than skipping any.

**During.** When a decision lands, edit its one truth file at that moment and add one `D:` log line. Ideas get an `I:` line, or a paragraph in `zone/ideas.md`. Never defer writes to session end.

**End.** Append `S:` lines for state. Anything left open goes into the project's `open questions.md` — questions are not history, and a log buries them.

Log entries are one line each, tagged: `D:` decision · `I:` idea · `S:` state/progress. Open questions are not log entries: they live in the project's `open questions.md`, one line each, removed when answered — a `D:` line records the answer. They stand under day headings (`## 25 August 2026`), in reverse chronological order — newest day first, newest line first within its day. A new entry goes at the top of today's heading. The writer asks the clock in the same write that stamps the heading — a date typed from memory is not a date, and a new day makes its heading at the top. Never reuse a stale heading: that is how dates get lost.

## Consolidation

Run when a project's log exceeds ~30 entries, or before a major work burst.

1. Read every log entry above the `<!-- consolidated: DATE -->` marker.
2. Read `open questions.md` too: strike any question the work has since answered, recording the answer as a `D:`. Then **settle each line** by tag: `D:` → edit the owning truth (and `decisions.md` if the rationale will be questioned again); `S:` → rewrite the *current state* paragraph in the project's `index.md`; `I:` → promote to a truth / `ideas.md`, keep, or cull. While settling, scan the prose for defined terms used off-definition (reword or formally redefine) and undefined terms (reword into plain language — never retroactively coin).
3. Delete settled entries; move the marker.
4. **Verification pass:** confirm every dropped line was settled into a named home or dismissed with a stated reason. For a large settle, have a *new* session run this check.
5. **Commit as one labeled commit** — `memory: settle <project>` — touching nothing else. If the `memory/` tree is not yet tracked by git, a one-time baseline commit (`memory: baseline`) comes first, so reverting a settle never removes the tree.

Never summarize prose into vaguer prose. Settling moves facts to their one home and throws away only what it names.

## Concurrent sessions and recovery

- One project, one active session. Different projects are naturally safe.
- If two sessions must share a project: log appends merge; truth edits require having read the file since the other session's last commit. Only one session may consolidate.
- Recovery: a bad settle is one `git revert` of its labeled commit, then settle again.

## Design churn

- Truths are current-only. On a pivot, rewrite the truth wholesale; one `D:` line records the pivot; git records the old words.
- A no-longer-current but carefully composed file moves whole into the project's `archive/` — kept readable, never loaded at start, no sizing limit.
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

## Pros and cons

This is where collaborator can advise Jonathan about a decision, it is a key control in the surface.

- Grounded the advice in
    - read the truths X touches
    - `decisions.md` (was this already decided? — if so, lead with the reasons)
    - the lexicon
    - `taste.md` when visual
- Argue both sides
    - every point tied to a specific truth, principle, or cost
    - no generic filler
    - lexicon terms used exactly
    - no new terms
- End with the question that would decide it
- Record it in the most relevant project's `zone/decisions.md`
- Waits there for resolution

## Skills

One skill per procedure; the skill is a trigger, not a copy. Write skills (`d`, `pac`, `go`, `define`, `propose`, `settle`) log every run; read-only skills (`start`, `t`, `syns`, `obs`, `check`, `where`, `summary`) don't.

- **d** (decision) — execute "Session protocol" (During) for one decision: edit the one truth file that owns it, add one `D:` log line. The workhorse; a write skill, logged by its nature.
- **start** — execute "Session protocol" (Start). Reply: three-line orientation — current state, truths loaded, the open questions.
- **pac** — pros and cons of X; the response is written into the most relevant project's `truth/decisions.md`
- **define** — execute "Prose and terminology" for one term. The lexicon's only door.
- **propose** — capture without incorporating, into whichever project the idea is most relevant to: its `zone/ideas.md`, an `I:` line, or its `open questions.md`; truths untouched; promotion only at settle or on instruction. pac and propose stay two commands.
- **go** (g) — implement the proposal or suggestion on the table, as stated. A write skill: the work it does leaves its own `D:`/`S:` lines.
- **settle** — execute "Consolidation", all five steps; finish with the settle manifest (each line and where it went).
- **check** — audit: OKF structure (frontmatter, `type`, links), the sizing table below, terminology drift, duplicated facts, and skill pointers (every section a skill references must exist in this file). Aimed at a settle: verify the commit diff cold; if this session performed the settle, ask for a rerun in a new session. Report finding → file → fix; fix nothing unless instructed.
- **t** (translate) — reword the last reply, or the quoted words, into plain language. Nothing is written; if the same wording needs translating twice, that is a conventions.md rule waiting to be recorded.
- **where** — execute "Finding where to tweak"; reply with the one owning path.
- **obs** (observations) — say what has been noticed but not said: suggestions, reminders, things seen in passing. The only place such things appear; no reply carries them unasked. Read-only.
- **syns** (synonyms) — list words synonymous with the given one, single words preferred. Read-only.
- **summary** — the state of the current chat, with extreme brevity: done, in motion, open. A handful of lines, no preamble, no recap of how we got here.

## Hooks

Hooks only read, check, and remind — they never write truths, settle, coin, or delete. A hook can suggest; only I decide.

- Session start → run `start`.
- Commit touching `memory/` → structural `check`; violations block.
- Commit touching `memory/` → warn if `truth/` changed but the project's `log.md` didn't.
- Log past ~30 entries → announce "settle is due"; never settle.
- Session end → draft `S:` lines and open questions; they land only on approval.

## Inception

The old system (CLAUDE.md's reading-on-load list, `notes/guides/`, per-project `notes/work/` files) is being abandoned completely. Until it's gone:

- Move truths, not history: only currently-true content a session would act on enters `memory/`; journals, handoffs, mothballs, and stories stay behind as the archive, abandoned in place.
- Pull, don't push: move a thing the day work actually reaches for it; never bulk-import.
- A move is a move: delete what the old file loses — content never lives in both systems.
- Write nothing new into the old system, ever. All new rules, terms, decisions, and notes go into `memory/`.
- Keep `truth/inception.md` current: it lists what still lives only in the old system; remove a line when its content moves in or is declared dead. When the list is empty, delete the file, shrink CLAUDE.md's "Reading on load" to `start` alone — done.
- Exception: `notes/guides/pre-flight/shorthand.md` stays — it is the trigger surface; its rows point here.

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
| toolkit | no two skills overlap; a definition stays near one line | merge the overlapping pair; trim the fat definition |
