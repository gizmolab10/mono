# Handbook

The authority for how the memory system runs. The design rationale lives in `memory/core/zone/work/AI memory redesign.md`; this file is the law. Tune the system by editing this file — nowhere else.

## Session phases

**Start.** Read `memory/index.md` → this file → the project's `index.md` → the project's `truth/lexicon.md` (always) → truths whose `use_when` matches the task. Budget: ~2,000 words; if exceeded, name the fat files rather than skipping any.

**During.** When a decision lands, edit its one truth file at that moment and add one `D:` log line. Ideas get an `I:` line, or a paragraph in `zone/ideas.md`. Never defer writes to session end.

**End.** Append `S:` lines for state. Anything left open goes into the project's `zone/questions.md` — questions are not history, and a log buries them. The file exists only while questions do.

Log entries are one line each, tagged: `D:` decision · `I:` idea · `S:` state/progress. Questions are not log entries: they live in the project's `zone/questions.md`, one line each, removed when answered — a `D:` line records the question and its answer. They stand under day headings (`## 25 August 2026`), in reverse chronological order — newest day first, newest line first within its day. A new entry goes at the top of today's heading. The writer asks the clock in the same write that stamps the heading — a date typed from memory is not a date, and a new day makes its heading at the top. Never reuse a stale heading: that is how dates get lost.

## Consolidate

Run when a project's log exceeds ~30 entries, or before a major work burst.

1. Read every log entry newer than the `<!-- consolidated: DATE -->` marker, the lines below it.
2. Read `zone/questions.md` too: strike any question the work has since answered, recording the answer as a `D:`. Then **settle each line** by tag: `D:` → edit the owning truth (and `decisions.md` if the rationale will be questioned again), and where no truth owns it, make one — and the `truth/` or `zone/` folder, where that is missing too; `S:` → rewrite the *current state* paragraph in the project's `zone/drive.md`; `I:` → promote to a truth / `ideas.md`, keep, or cull. While settling, scan the prose for defined terms used off-definition (reword or formally redefine) and undefined terms (reword into plain language — never retroactively coin).
3. **Map upkeep:** when the project's truth holds a map, ask git what changed under the project's code since the marker — files added, moved, removed — and edit the map to match. No change, no edit.
4. Move the marker. The settled lines stay where they are: the log only grows, so any twist and turn can be found and dated later.
5. **Verification pass:** confirm every line above the marker was settled into a named home or dismissed with a stated reason. For a large settle, report this step as 'unfinished' in the chat reply.
6. **No commit.** Settle never commits — committing `memory/` is Jonathan's act, done by him, when he chooses.

Never summarize prose into vaguer prose. Settling copies facts to their one home and deletes nothing from a log.

## Concurrent sessions and recovery

- One project, one active session. Different projects are naturally safe.
- If two sessions must share a project: log appends merge; truth edits require having read the file since the other session's last commit. Only one session may consolidate.
- Recovery: a bad settle is one `git revert` of its labeled commit, then settle again.

## Design churn

- Truths are current-only. On a pivot, rewrite the truth wholesale; one `D:` line records the pivot; git records the old words.
- `truth/` may hold folders: a folder there names a design's parts. A file's kind of truth stays its `type` label, wherever it sits, and every lookup over `truth/` reads the folders too.
- A no-longer-current but carefully composed file moves whole into the project's `archive/` — kept readable, never loaded at start, no sizing limit.
- `logs/decisions.md` holds every decision, dated, live or final, and every pac decided. A line is never deleted: it is how "when did we decide that" is answered. In logs since 18 September 2026, the past.

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

- `zone/ideas.md`: append freely, zero ceremony. Every consolidation triages each idea — promote, keep, or cull. Three consolidations without promotion → promote or cut. A culled idea leaves one dated `I:` line in the log saying it was culled and why.
- `zone/drive.md`: the current drive — the one proposal being implemented. `drive X` moves proposal X here from proposals.md; the file carries the plan and one present-tense where-it-stands line. `drive` or `go drive` implements the plan, then moves the proposal to working features rewritten as a feature description when it is an app feature, or else to the work journal as what was changed and why. ideas.md stays uncluttered by proposals in flight.
- `zone/proposals.md`: every proposal not yet the drive, and every open pac, gathered so ideas.md holds only ideas; one leaves when it becomes the drive, dissolves into truth, or is culled, and a culled one leaves one dated `D:` line in the log saying so and why. The file exists only while proposals do.
- `zone/questions.md`: what is unanswered, one line each; a question leaves when a dated `D:` line in the log records the question and its answer. The file exists only while questions do. It is Jonathan's own memory. No orientation reports it, no reply lists it, nothing in it is ever raised as a nudge. The one time it is spoken: the work in hand touches a question that is written there — then say which question, once, and carry on. Written into at session end, settled at a consolidation, silent otherwise. Co reads it at start to be able to recognise the touch, and says nothing about it.
- `zone/ref/`: visual references, descriptively named.
- `shared/truth/taste.md`: recurring visual/design principles; loaded whenever the task is visual, on any project.

## Logs


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
- Record it as a section in the most relevant project's `zone/proposals.md`
- Waits there for resolution; decided, its dated line goes to `logs/decisions.md`

## Decision process

Compressed stories of decided pacs gather in `shared/truth/cases.md` — the one file for them.

- A case is at most five lines: the deciding question, the d verbatim, one present-tense sentence of what now holds, the `decisions.md` that keeps the full record
- A case enters only when it teaches something no stored case does
- Of two cases teaching the same, the clearer remains
- Records never move — `decisions.md` keeps the full pacs

## Skills

One skill per procedure; the skill is a trigger, not a copy. Write skills (`d`, `pac`, `go`, `define`, `propose`, `settle`) log every run; read-only skills (`start`, `p`, `t`, `syns`, `obs`, `check`, `where`, `summary`) don't.

- **d** (decision) — execute "Session phases" (During) for one decision: edit the one truth file that owns it, add one `D:` log line. The workhorse; a write skill, logged by its nature.
- **p** — pick the project to work on: `/p ov` writes `ov` to `.working_project` and says which is picked. A name with no folder at `~/GitHub/mono/<name>/` is refused. Nothing else is read and nothing is offered. Read-only of the memory system, so unlogged.
- **start** — execute "Session phases" (Start). Reply: two-line orientation — current state, truths loaded.
- **pac** — pros and cons of X; the response is written as a section in the most relevant project's `zone/proposals.md`, and its decision as a dated line in `logs/decisions.md`
- **define** — execute "Prose and terminology" for one term. The lexicon's only door.
- **propose** — capture without incorporating, into whichever project the idea is most relevant to: its `zone/ideas.md`, an `I:` line, or its `zone/questions.md`; truths untouched; promotion only at settle or on instruction. pac and propose stay two commands.
- **go** (g) — implement the proposal or suggestion on the table, as stated. A write skill: the work it does leaves its own `D:`/`S:` lines.
- **settle** — execute "Consolidation", every step; finish with the settle manifest (each line and where it went).
- **check** — audit: links, the sizing table below, terminology drift, duplicated facts, skill pointers (every section a skill references must exist in this file), and colliding rules — read every always-tagged guide, the pre-flight guides included, and list any pair of rules that cannot both be obeyed. Aimed at a settle: verify the commit diff cold; if this session performed the settle, ask for a rerun in a new session. Report finding → file → fix; fix nothing unless instructed. The findings go into the project's `zone/questions.md`, under a `## checked` subsection, one line each — there is no separate report file.
- **t** (translate) — reword the last reply, or the quoted words, into plain language. Nothing is written; if the same wording needs translating twice, that is a conventions.md rule waiting to be recorded.
- **where** — execute "Finding where to tweak"; reply with the one owning path.
- **obs** (observations) — say what has been noticed but not said: suggestions, reminders, things seen in passing. The only place such things appear; no reply carries them unasked. Read-only.
- **syns** (synonyms) — list words synonymous with the given one, single words preferred. Read-only.
- **summary** — the state of the current chat, with extreme brevity: done, in motion, open. A handful of lines, no preamble, no recap of how we got here.

## Hooks

Hooks only read, check, and remind — they never write truths, settle, coin, or delete. A hook can suggest; only I decide.

- Session start → run `start`.
- Commit touching `memory/` → structural `check`; violations block.
- Commit touching `memory/` → warn if `truth/` changed but the project's `logs/log.md` didn't.
- Log past ~30 entries → announce "settle is due"; never settle.
- Session end → draft `S:` lines and questions; they land only on approval.

## Inception

The old notes (CLAUDE.md's reading-on-load list, the `guides/` and `work/` folders under each `memory/<project>/notes/`) is being abandoned completely. Until it's gone:

- Moved 7 September 2026: every project's notes folder sits whole at `memory/<project>/notes/`, and mono's own at `memory/shared/notes/` — journals, handoffs, mothballs and stories included, as they were. `notes/tools/` became `tools/` at the top of the repo, and `notes/` is gone. A moved folder is still the old notes: its truths enter `truth/` one at a time, the day work reaches for them.
- A move is a move: delete what the old file loses — content never lives in both systems.
- Write nothing new into the old notes, ever. All new rules, terms, decisions, and notes go into `memory/`.
- Keep `truth/inception.md` current: it lists what still lives only in the old notes; remove a line when its content moves in or is declared dead. When the list is empty, delete the file, shrink CLAUDE.md's "Reading on load" to `start` alone — done.
- `memory/shared/truth/shorthand.md` is the trigger surface; its rows point here.

## Sizing rules

these are soft limits. always allow them to be exceeded, and ask Jonathan in these words "we have reached the limit for X. shall I change it to N or execute the task in the 'when exceeded' column?" — of course, replace N with the new number.

| Thing | Limit | When exceeded |
|---|---|---|
| truth file | ~300 lines | split by concept; update index |
| truths per project | ~50 | merge cold ones |
| orientation read | ~2,000 words | prune index + fat truths |
| `ideas.md` idea age | 3 consolidations | promote or cull |
| `lexicon.md` | ~80 terms | delete dead terms |
| toolkit | no two skills overlap; a definition stays near one line | merge the overlapping pair; trim the fat definition |
