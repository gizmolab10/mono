# Slow

**Dates:** 2026-04-10 (bottleneck audit), 2026-04-11 (work-folder reorg cleanup), 2026-04-15 (skip-when-clean gate shipped), 2026-04-16 (bottlenecks #3–8, #10, #11, #14 shipped; remaining mothballed)
**Session topic:** render pipeline performance audit and bottleneck cleanup; work-folder reorganization cleanup; skip-the-paint-when-nothing-changed gate; world-matrix cache, face-pair prune, and map-lookup swaps

**Next:** bottleneck work is complete. Eleven of fifteen shipped; four mothballed (scratch-memory group #9, #12, #13 and string-key #15 — revisit only if profiling points at allocation pressure). Still open: review the three semantically-suspicious handoff references flagged in the 2026-04-11 session below.

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
- The map file updated to include the new work file: [map.md](../../../../../guides/project/overview/map.md)
- One memory update: the feedback rule for pre-existing errors now says "always fix" instead of "report and ask."

---

## What's queued

All bottleneck work is complete or mothballed. Items 1–4 below were done on 2026-04-15 and 2026-04-16.

- ~~Verify the gate in real use.~~ Done — tumble verified, instrumentation deleted.
- ~~Delete the instrumentation.~~ Done.
- ~~Align the bottleneck-two proposal text.~~ Done.
- ~~Move on to bottleneck three.~~ Done, plus #4, #5, #6, #7, #8, #10, #11, #14.

Remaining open item: review the three semantically-suspicious handoff references from the 2026-04-11 session.

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

**Updated the project map** ([map.md](../../../../../guides/project/overview/map.md)). The "Notes — Work" section was a flat list of files that no longer existed. I rewrote it into seven groupings that mirror the new folder layout: plan, now-slow, now-facets, next, milestones (open), milestones (done), and done. Every file currently in the new structure is now listed under its correct grouping.

**Updated the shorthand file** ([notes/guides/pre-flight/shorthand.md](notes/guides/pre-flight/shorthand.md)). Three table rows pointed at paths that no longer existed:

- The `theory` shorthand now points to [theory.md](../designs/theory.md). The action description was tightened to fit the table's column width.
- The `handoff` shorthand now points to [handoff.md](./handoff.md). I picked the slow handoff because that is where the most recent active session lives — see the open question below.
- The `hands` shorthand now points to the same slow handoff for the same reason.

**Updated the two slash command files**:

- [.claude/commands/di.md](.claude/commands/di.md) — `revisit.di.md` is now under the `plan/` folder.
- [.claude/commands/cd.md](.claude/commands/cd.md) — `code.debt.md` is now under the `plan/` folder.

**Updated this handoff file's own self-reference**. The "files touched this session" line for the bottlenecks file pointed at the old path. Updated to the new path with a parenthetical note about where it used to live.

### Files I deliberately did not touch

**Historical journal entries inside `done/`** that mention old paths in narrative form. Per the journals rule and pitfall #16, historical journal content stays as-is — the old paths are part of the snapshot of what was true at the time.

- [skills.md:12](../../../../done/skills.md#L12) — example text quoting an old slash command.
- [chat.md:89](../../../../done/chat.md#L89) and [chat.md:233](../../../../done/chat.md#L233) — historical session notes.

**The generated project snapshot dump** at [notes/tools/scripts/snapshot.md](notes/tools/scripts/snapshot.md). It is a generated file from January 31, not hand-edited. Touching it would be wrong.

### Items I flagged for Jonathan's review

These are not stale in the strict sense — every path resolves to a real file — but they look semantically wrong after the reorg. Three files link to the slow handoff but the surrounding text reads like they actually mean the facets handoff:

- [26.lacemaker.md:9](../../26.lacemaker.md#L9) — references "handoff.md for dead ends, and solved items" while pointing to the slow handoff. Lacemaker is milestone 26, which was facets-adjacent. Probably should point to the facets handoff.
- [now/index.md:7](../../../../now/index.md#L7) — describes the link as "current session plan for milestone 27" while pointing to the slow handoff. Milestone 27 is selection algorithm, not slow render.
- [theory.md:8](../designs/theory.md#L8) — sits inside the facets folder and describes the link as "what's being worked on right now, what's blocked, what was just solved" while pointing at the slow handoff.

I AM GUESSING these are leftovers from the reorg that should be repointed at [handoff.md](../handoff.md), but only Jonathan can confirm.

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

## no longer Open decisions Jonathan needs to make

(The four original open questions were decided on 2026-04-15 — see the session
entry below. Remaining open items are captured in the Next line at the top.)

---

## Session 3 — 2026-04-15 — skip-when-clean gate shipped

Wired the full skip-the-paint-when-nothing-changed gate for bottleneck two. All
three layers of coverage are in place, every test still passes, and the type
checker is clean.

### Decisions made at the start of the session

The four open questions were answered before building:

- Rot prevention: strongest. Every write to a canvas-affecting input now
  funnels through a tiny wrapper that marks the canvas out of date, so new
  stores added later get coverage automatically when declared through that
  wrapper.
- Ship order: three logical steps. Wiring first, then the gate, then the
  wrapper migration. All three were done in one session.
- Keystroke override: skipped. The one-character rollback lever at the top of
  the render module is enough.
- Targeted marks: shipped alongside the subscriptions, not as a follow-up.
  Without them the gate would leave three categories silently stale — window
  resize, direct bound writes, and propagation-driven changes.

### What shipped

**A per-canvas out-of-date flag.** The render module now carries a private
boolean that starts on, flips off at the start of every paint, and flips back
on whenever any input the canvas cares about changes. A one-character
rollback lever at the top of the module forces the flag to stay on forever,
restoring the old always-paint behavior if something goes wrong.

- Flag, mark function, rollback lever, clear-on-paint: [Render.ts](di/src/lib/ts/render/Render.ts)

**Twenty-six subscriptions at setup.** Fourteen scene inputs (selection,
object list, tick pulse, forward-face tracker, editing mode, decorations
bitmask, persisted orientation, 2D/3D mode, line thickness, grid opacity,
show-grid, solid mode, precision, persisted scale), six color inputs (hover
derivation, selected, background, text, edge, accent), and six interaction
inputs (pointer hover, drag pin offer, face-label editor, angular editor,
dimension editor, unit system). Every subscription's unsubscribe is held on
the render module so hot-module-reload can drop them cleanly.

- Subscriptions, hot-reload cleanup, gate, instrumentation: [Engine.ts](di/src/lib/ts/render/Engine.ts)

**Three targeted marks for the non-reactive paths.** Direct writes that bypass
reactive stores get covered at their chokepoints: the bound setter on every
smart object, the top of the post-propagate hook, and the top of the resize
method.

- Bound-change callback: [Smart_Object.ts](di/src/lib/ts/runtime/Smart_Object.ts)
- Propagate hook and bound-change wire-up: [Engine.ts](di/src/lib/ts/render/Engine.ts)
- Resize mark: [Render.ts](di/src/lib/ts/render/Render.ts)

**Early-return gate in the animation tick.** If the canvas is up to date and
the orientation snap-back animation is not running, the tick returns early
and skips all per-frame work.

**Rot prevention via a writable wrapper.** A new helper wraps a Svelte
writable so every set and update calls a canvas-stale callback. Setup hooks
that callback to the render module. The fourteen canvas-affecting scene
stores, the six color stores, and the six interaction stores were migrated
to the helper.

- Helper: [Stale_Writable.ts](di/src/lib/ts/common/Stale_Writable.ts)
- Migrations: [Stores.ts](di/src/lib/ts/managers/Stores.ts), [Colors.ts](di/src/lib/ts/utilities/Colors.ts), [Hits_3D.ts](di/src/lib/ts/events/Hits_3D.ts), [Drag.ts](di/src/lib/ts/editors/Drag.ts), [Face_Label.ts](di/src/lib/ts/editors/Face_Label.ts), [Angular.ts](di/src/lib/ts/editors/Angular.ts), [Dimension.ts](di/src/lib/ts/editors/Dimension.ts), [Units.ts](di/src/lib/ts/types/Units.ts)

**Instrumentation in the tick loop.** The loop logs a rolling summary every
two seconds showing how many ticks it painted and how many it skipped.
Temporary — to be removed once the gate is proven in real use.

### What did not ship

- Debug flag flips that are not wired through anything reactive will not mark
  the canvas. The original proposal called this out and left it for later.
- Any mutation site the audit missed will be silent. The counter is the tool
  for finding those; use it during real interaction.

### Test results

- Four hundred and ninety-six tests remain green (five hundred and fourteen
  overall, including the ones that were pre-existing but unchanged).
- Type-check is clean with zero errors and zero warnings.

### Files touched — session 3

- `di/src/lib/ts/render/Render.ts`
- `di/src/lib/ts/render/Engine.ts`
- `di/src/lib/ts/runtime/Smart_Object.ts`
- `di/src/lib/ts/common/Stale_Writable.ts` (new)
- `di/src/lib/ts/managers/Stores.ts`
- `di/src/lib/ts/utilities/Colors.ts`
- `di/src/lib/ts/events/Hits_3D.ts`
- `di/src/lib/ts/editors/Drag.ts`
- `di/src/lib/ts/editors/Face_Label.ts`
- `di/src/lib/ts/editors/Angular.ts`
- `di/src/lib/ts/editors/Dimension.ts`
- `di/src/lib/ts/types/Units.ts`

---

## Notes for future sessions

- The audit's line numbers were captured on this date; any file touched before the wiring is built can shift its line numbers. Re-verify before wiring.
- Bottleneck four (the pass that walks every vertex to find the largest extent) becomes free as a side effect of bottleneck one — its only consumer was the second pipeline, which is now gated off. The bottleneck-two work doesn't need to address it; bottleneck four can be marked done in the same pass that updates the suggested-order list.
- The "facets is mothballed" status was confirmed both by the comment on the debug flag and by the recent commit history. If facets ever comes back, the bottleneck-one gate is the place to flip it back on.
