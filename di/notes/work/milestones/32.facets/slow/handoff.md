# Slow

**Dates:** 2026-04-10 (bottleneck audit), 2026-04-11 (work-folder reorg cleanup)
**Session topic:** render pipeline performance audit and bottleneck cleanup; work-folder reorganization cleanup

**Next:** decide the four open questions for the render-skip-when-clean wiring (rot prevention, ship order, helper name, audit results placement) and then build the wiring per the proposal at the end of `bottlenecks.md`. Also: review the three semantically-suspicious handoff references flagged in the 2026-04-11 session below.

(Code-debt work lives in its own handoff at [di/notes/work/now/handoff.md](di/notes/work/now/handoff.md).)

> **NOTE on historical paths below:** the work-folder layout has been reorganized twice since the sessions recorded here. Paths inside the session narratives (`di/notes/work/bottlenecks.md`, `di/notes/work/plan/*`, `di/notes/work/now/slow/*`, `di/notes/work/now/facets/*`) are historical and no longer resolve. The sessions are preserved for their record of decisions made at the time. See [di/notes/map.md](di/notes/map.md) for the current layout.

---

## What we did this session

### Step one — full performance audit of the render code

I read every render file in the project and produced a ranked list of fifteen performance bottlenecks. Each one has a plain-English description, an evidence link to the file and line, and a concrete proposal for how to fix it. The whole list lives in a new work file at `bottlenecks.md` in this folder. We agreed the design of every bullet is sound; the file is the working document for the rest of this work.

### Step two — shipped bottleneck one

The biggest single win on the list was the duplicate geometry pipeline that runs every frame even though its only consumer (the facets debug renderer) is mothballed. We wrapped the entire second-pipeline compute block in a single switch that matches the same debug flag the consumer is gated on. When the flag is off (its current state), the whole block is skipped. When the flag is on, behavior is identical to before.

- Change: [Render.ts:404-406](di/src/lib/ts/render/Render.ts#L404-L406)
- Tests still pass: four hundred and ninety-six green.
- Type-check is clean.
- Jonathan declined the follow-up step (deleting the second-pipeline file outright). The code stays around.

### Step three — fixed two pre-existing errors that surfaced during type-check

Both were unrelated to bottleneck one but blocking a clean type-check. Per the updated "always fix preexisting" feedback rule, I fixed them in the same session.

- Removed an unused type import in the stores module: [Stores.ts:5](di/src/lib/ts/managers/Stores.ts#L5)
- Moved the edge-color store destructure from the stores object to the colors object (the field had moved to the colors module): [D_Preferences.svelte:11](di/src/lib/svelte/details/D_Preferences.svelte#L11)

### Step four — deep dive on bottleneck two (skip render when nothing has changed)

Most of the session was on bottleneck two. We did a lot of analysis but did not ship any code. The plan now lives as the proposal section, the risks section, and the audit results section inside `bottlenecks.md` under heading "## 2."

**Audit.** I delegated a thorough sweep of the codebase to find every site that mutates anything the canvas reflects. The audit returned roughly one hundred and forty distinct call sites grouped into fourteen categories — camera, selection, hover, drag, store tick, snap animation, tree changes, bound writes, history, constraints, resize, preferences, debug flags, and an "other" catch-all. Each site has a plain-English label and a clickable link. The audit lives inside the bottleneck-two section of `bottlenecks.md`.

**Star marking.** Every audit bullet is now marked with a `*` if it writes a reactive store, or unmarked if it mutates a plain class field. The split matters because every reactive-store write already fires its subscribers — so the renderer can subscribe once per store and catch every starred bullet for free. About one hundred and ten of the bullets are starred. The unstarred ones cluster into three places: the bound-setter on the smart-object class, the constraint propagation function, and the renderer's resize method.

**Tier-one writable list.** I produced a list of twenty-six reactive stores that are safe to subscribe to — the ones whose every change is canvas-relevant and not chatty. Lower-tier stores (like the mouse-position counters) are explicitly excluded as too noisy. The list is in the chat record for this session and should be re-derived from the audit before the wiring is built.

**Alternatives we considered and rejected.**

- *Subscribe only to the tick store.* Rejected because the tick is called from only twelve places and misses hover, selection, wheel zoom, snap animation, side-panel sliders, and window resize. With tick-only the canvas would freeze on most pointer interactions. Documented in the chat record.
- *Replace the flag with a direct render call from the mark function.* Rejected because a single user action typically writes several stores in one stack frame, so the canvas would paint several times per visible change. The cleanest rescue (wrapping in a frame request) re-introduces a flag under a different name. Documented in the chat record.

**Final wiring proposal.** I drafted a concrete proposal that names every piece: the flag, the helper function, the twenty-six subscriptions, the three targeted marks for the unstarred clusters, the gate in the animation tick, the rollback lever, the rot-prevention plan, the ship order, and the verification plan. The proposal is the second half of the long chat exchange — it has not been distilled back into the proposal section of the file yet. Bringing the file in line with the proposal is the next concrete editing task.

### Step five — chime on the current proposal text

I read the proposal section as it stands in `bottlenecks.md` and offered nine corrections. The biggest ones:

- Bullet one is now obsolete (it asks for an audit that has been completed).
- The helper function should not take a boolean argument — every caller should only ever set the flag to true; the clear should be a private field write inside the render function.
- The subscribe-to-reactive-stores shortcut is missing from the proposal bullets entirely. Right now the proposal still describes the expensive individual-wiring path.
- The three targeted marks for the unstarred clusters are not named in the proposal bullets.
- The audit results section is physically inside the risks section, which breaks the flow of the risks list — it should move to after the risks.
- The "is snap animation running" check that the gate depends on is not defined anywhere yet.
- The rot-prevention bullet lists three options without picking one.

These corrections have not been applied to the file. They are queued.

---

## What's shipped this session

- Bottleneck one: second-pipeline compute is now gated on its debug switch.
- Two pre-existing type-check errors fixed (unused import, moved field reference).
- One linter blank-line cleanup in the project map file.
- The new work file `bottlenecks.md` itself (created, populated, restructured several times).
- The map file updated to include the new work file: [map.md](di/notes/map.md)
- One memory update: the feedback rule for pre-existing errors now says "always fix" instead of "report and ask."

---

## What's queued

In the order I would tackle them:

1. **Apply the chime corrections to the bottleneck-two proposal section** in `bottlenecks.md`. Specifically: delete the obsolete first bullet, remove the boolean parameter from the helper signature, add a bullet naming the subscribe-to-reactive-stores shortcut as the primary path, add a bullet naming the three targeted marks, name the "is snap animating" check as something that needs to be added, pick a default rot-prevention option, move the audit results section to sit after the risks instead of inside them, and define the per-tick paint counter concretely.
2. **Decide the four open questions** that the proposal still leaves open:
   - Which rot-prevention option (strongest, middle, or weakest).
   - One commit or three commits for the ship.
   - Whether to include the temporary keystroke override in the first commit.
   - Whether to ship the three targeted marks alongside the subscriptions or as a follow-up commit.
3. **Build the wiring** per the proposal — the twenty-six subscriptions in one helper function, the three targeted marks, the unsubscribe list, the gate in the animation tick, the rollback constant.
4. **Verify** by running the per-tick paint counter and walking through every interaction type.
5. **Move on to bottleneck three** (rebuild the world transform once per object per frame instead of several times). This is a mechanical refactor and unlocks per-face and per-edge work below it.

---

## Files touched this session

- `di/notes/work/now/slow/bottlenecks.md` — created and rewritten several times (lived at `di/notes/work/bottlenecks.md` until the work-folder reorg)
- `di/notes/map.md` — added the new work file, fixed a blank-line warning
- `di/src/lib/ts/render/Render.ts` — gated the second-pipeline compute
- `di/src/lib/ts/managers/Stores.ts` — removed unused type import
- `di/src/lib/svelte/details/D_Preferences.svelte` — moved edge-color destructure to the colors object

---

## Session 2 — 2026-04-11 — work-folder reorganization cleanup

Jonathan reorganized everything under `di/notes/work` into new top-level folders: `plan`, `now/slow`, `now/facets`, `next`, `milestones` (with a `done` subfolder), and `done`. He asked me to scan for stale references to the old paths and update every live system file that broke.

### What I did

**Updated the project map** ([di/notes/map.md](di/notes/map.md)). The "Notes — Work" section was a flat list of files that no longer existed. I rewrote it into seven groupings that mirror the new folder layout: plan, now-slow, now-facets, next, milestones (open), milestones (done), and done. Every file currently in the new structure is now listed under its correct grouping.

**Updated the shorthand file** ([notes/guides/pre-flight/shorthand.md](notes/guides/pre-flight/shorthand.md)). Three table rows pointed at paths that no longer existed:

- The `theory` shorthand now points to [di/notes/work/now/facets/designs/theory.md](theory.md). The action description was tightened to fit the table's column width.
- The `handoff` shorthand now points to [di/notes/work/now/slow/handoff.md](di/notes/work/milestones/32.facets/slow/handoff.md). I picked the slow handoff because that is where the most recent active session lives — see the open question below.
- The `hands` shorthand now points to the same slow handoff for the same reason.

**Updated the two slash command files**:

- [.claude/commands/di.md](.claude/commands/di.md) — `revisit.di.md` is now under the `plan/` folder.
- [.claude/commands/cd.md](.claude/commands/cd.md) — `code.debt.md` is now under the `plan/` folder.

**Updated this handoff file's own self-reference**. The "files touched this session" line for the bottlenecks file pointed at the old path. Updated to the new path with a parenthetical note about where it used to live.

### Files I deliberately did not touch

**Historical journal entries inside `done/`** that mention old paths in narrative form. Per the journals rule and pitfall #16, historical journal content stays as-is — the old paths are part of the snapshot of what was true at the time.

- [di/notes/work/done/skills.md:12](di/notes/work/done/skills.md#L12) — example text quoting an old slash command.
- [di/notes/work/done/chat.md:89](di/notes/work/done/chat.md#L89) and [di/notes/work/done/chat.md:233](di/notes/work/done/chat.md#L233) — historical session notes.

**The generated project snapshot dump** at [notes/tools/scripts/snapshot.md](notes/tools/scripts/snapshot.md). It is a generated file from January 31, not hand-edited. Touching it would be wrong.

### Items I flagged for Jonathan's review

These are not stale in the strict sense — every path resolves to a real file — but they look semantically wrong after the reorg. Three files link to the slow handoff but the surrounding text reads like they actually mean the facets handoff:

- [di/notes/work/milestones/done/26.lacemaker.md:9](di/notes/work/milestones/done/26.lacemaker.md#L9) — references "handoff.md for dead ends, and solved items" while pointing to the slow handoff. Lacemaker is milestone 26, which was facets-adjacent. Probably should point to the facets handoff.
- [di/notes/work/plan/index.md:7](di/notes/work/now/index.md#L7) — describes the link as "current session plan for milestone 27" while pointing to the slow handoff. Milestone 27 is selection algorithm, not slow render.
- [di/notes/work/now/facets/designs/theory.md:8](theory.md#L8) — sits inside the facets folder and describes the link as "what's being worked on right now, what's blocked, what was just solved" while pointing at the slow handoff.

I AM GUESSING these are leftovers from the reorg that should be repointed at [di/notes/work/now/facets/handoff.md](di/notes/work/milestones/32.facets/handoff.md), but only Jonathan can confirm.

### Pre-existing warnings I left alone on files I touched

- [.claude/commands/cd.md:1](.claude/commands/cd.md#L1) — flagged for missing top-level heading. The sibling slash command files do not have headings either; this is the slash-command convention. Adding one would diverge.
- [notes/guides/pre-flight/shorthand.md:15](notes/guides/pre-flight/shorthand.md#L15) — the `show` row is two characters wider than the table's column width. Pre-existing alignment slop, not introduced this session.

### Open question for Jonathan on the shorthand

There are now two active handoffs — one in `now/slow/` for the render performance work and one in `now/facets/` for the facets work. The shorthand currently points `handoff` and `hands` at the slow one because that is the active session. Three options if you want a different shape:

1. Leave it as is — slow handoff is the default, facets is reached by full path.
2. Rename the shorthand to `slow-handoff` and add a `facets-handoff` row.
3. Make the shorthand context-aware (read a "current focus" file and dispatch accordingly).

### Files updated this session

- `di/notes/map.md`
- `notes/guides/pre-flight/shorthand.md`
- `.claude/commands/di.md`
- `.claude/commands/cd.md`
- `di/notes/work/now/slow/handoff.md` — this file (self-reference fix and the section you are reading)

---

## Open decisions Jonathan needs to make

- Which rot-prevention strategy to commit to.
- Whether the wiring ships in one commit or three.
- Whether to include the keystroke-override escape hatch.
- Whether to ship the three targeted marks alongside or after the subscription wiring.
- Whether to shorten the helper function name (long, explicit, or terse).

---

## Notes for future sessions

- The audit's line numbers were captured on this date; any file touched before the wiring is built can shift its line numbers. Re-verify before wiring.
- Bottleneck four (the pass that walks every vertex to find the largest extent) becomes free as a side effect of bottleneck one — its only consumer was the second pipeline, which is now gated off. The bottleneck-two work doesn't need to address it; bottleneck four can be marked done in the same pass that updates the suggested-order list.
- The "facets is mothballed" status was confirmed both by the comment on the debug flag and by the recent commit history. If facets ever comes back, the bottleneck-one gate is the place to flip it back on.
