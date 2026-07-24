# Workflow

See [motive.md](../philosophy/motive.md) for the origin story and philosophy behind this system.

## Cadence

Turn-taking. Jonathan moves, co responds, Jonathan reads, Jonathan decides, co acts. Forward progress made out of small, careful, deliberate moves — not sweeping leaps.

**Roles.** Jonathan frames the question and decides. Co researches, traces, proposes, and — on explicit green light — builds. Co has wide capabilities but uses them only when pointed at them.

**Propose-first.** "Propose" means describe the plan and do nothing else. The one exception is actions Jonathan has already asked for in the same turn — a skill argument like "and update handoff" runs immediately alongside the proposal. Code changes still wait for a go.

**Questions are not orders.** "How will you do X?" asks for a description, not the action itself. Describe and wait.

Living notes at [../../../di/notes/work/cadence.md](../../../di/notes/work/cadence.md).

## The structure
- `notes/guides/` — living reference (style, patterns, how-tos)
- `notes/work/` — ALL work is recorded here, as we go
- `CLAUDE.MD` — entry point, tells Claude where to start

## One truth, one place

Guides encode decisions, grouped by topic. CLAUDE.MD is the entry point, the large scale map. Don't duplicate — reference.

## Starting work
When asked to "work on X":
1. Check if `notes/work/X.md` exists
2. If yes → read and resume
3. If no → create it with problem/goal/phases structure

## Work file structure
```markdown
# Title
**Started:** YYYY-MM-DD
**Status:** Phase N in progress

## Problem
What we're solving.

## Goal
What success looks like.

## Phase 1: Name
- [ ] Task
- [ ] Task

## Next Action
**Phase N:** Specific next step
```
Update status and checkboxes as work progresses.

## The handoff pieces

The living work of a project sits in its work area — `notes/work/` for a light project (flat), `notes/work/now/` for a larger one. A small set of files, each with one job:

- **`handoff.md`** — current status and the single **Next** action, the baton; read first each session.
- **`code.debt.md`** — open coding tasks, as checkboxes.
- **`code.debt.paid.md`** — finished tasks, archived out of code.debt.
- **`work journal.md`** — chronological log of finished proposals.
- **`working features.md`** — running list of what currently works.

When to move things between these — done work to the journal, the active surface kept short — is [shop keeping](shop%20keeping.md)'s job.

Two more are reference, kept in the project's `guides/` (`guides/` for a light project, `guides/project/overview/` for a larger one):

- **`map.md`** — the file map; read instead of globbing, update when files move.
- **`file layout.md`** — where paths live; update when paths change.

**Locations vary; `done` and `up` don't care.** They act on whichever of these a project has, wherever it keeps them — so ji (flat in `notes/work/`, `guides/` sibling to work) and di (active files in `notes/work/now/`, map deep under `guides/project/overview/`) are both handled without hard-coding either path.

**Minimal set.** A new project needs only `code.debt.md` to start — a list of what to build. Add `handoff.md` once sessions span more than one sitting, then the rest as the project grows. Don't create files a light project won't feed: the `done` and `up` steps skip pieces that don't exist. (ji, for one, keeps `code debt.md`, `handoff.md`, and a work journal flat in `notes/work/`, with maps in `notes/guides/`.)

**Reference implementation (di) — reconcile.** di is the model these conventions came from, but it predates them and drifted. To bring it into line:

- **Move** di's `road.map.md` out of `notes/work/now/` into `guides/` — a roadmap is reference, not active work (as ji keeps it).
- **Create** a notes-map for di; it has none, unlike ji's `guides/notes map.md`.
- **Rename / revise** (Jonathan's call, not an established need — I AM GUESSING these are wanted): shallow di's `map.md` from `guides/project/overview/` up to `guides/`, and reconcile di's dotted names (`code.debt.md`, `road.map.md`) against ji's spaced/plain style.

## Finishing work
When work is complete, one of two destinations:

| Destination | When | Example |
|-------------|------|---------|
| `notes/work/done/` | Task is finished, doc is historical record | svelte.md, quaternions.md |
| `notes/guides/` | Doc becomes living reference for future work | testing.md |

## Tidying up

Reorganize and merge files so each has one clear job — removing duplication, sharpening purpose, finding the right home for each piece. (For changing a single doc, see Safe updating below.)

**The process:**

1. Read what exists
2. Spot overlap and blur
3. Propose cleaner splits
4. Move or merge until each file has one clear job
5. Trim dated material and work-in-progress hedging

**The goal:** Fewer files, clearer purposes, easier to find things, easier to maintain. Less confusion for both co and Jonathan.

## Safe updating

When updating a work doc — milestones, notes, plans — keep its content intact. (For reorganizing across files, see Tidying up above.)

1. **Reorder, don't remove.** Move sections around to improve flow — never delete material.
2. **"Propose a rewrite" means propose.** Present the plan, wait for approval before touching the file.
3. **Summarize by adding, not replacing.** If a synopsis or summary would help, add it alongside the original — don't compress the original into it.
4. **Design notes are not clutter.** Type definitions, rationale, lifecycle rules, error source mappings — these are decisions, not noise. They stay.
5. **When in doubt, add a section.** A new "synopsis" or "open items" section at the top costs nothing. Gutting the middle to make room costs everything.

## Fixing friction before the work

Sometimes the real task stalls not on the problem but on how co and Jonathan work together. The usual causes: words co uses with no agreed meaning, over-confident wrong reads that fight what Jonathan plainly sees, or a check that fires on the wrong thing. When the same friction derails turn after turn, pause the task and fix it at its source — that friction taxes every later turn, the task included, so the fix is an investment, not a digression.

How to run such a pause:

1. **Trust what Jonathan observes** over co's reasoning and over the logs. When his eyes and the numbers disagree, the numbers are suspect first.
2. **Fix the root, not a symptom.** Make the shared reference the one source of truth, so the rule and the tool that enforces it cannot drift apart.
3. **Write the lesson down as a rule** so it outlives the session — for example, never use a word with no agreed, shared meaning; propose it for the shared list first.
4. **Allow pauses.** A friction-fix is still a detour. In the handoff file, record where the real task was paused.

## Diagnostic logging

See the diagnostic-logging rule in the always files — always.md item 7.

## Writing design documents

See [design.md](creating%20a%20design.md).
