# render is stale


## Proposal: wire a "render is stale" gate into the renderer

## Goal

Stop the renderer from painting sixty times a second when nothing has changed. When idle, the render loop does no work. When active, behavior is identical to today.

## What gets added

### 1. A stale flag and a mark function, on the renderer

Add a private boolean on the renderer, starting `true` so the first frame always paints. Add a single public function that sets it to `true`. Add one constant at the top of the renderer module — an "always redraw" override — which, when true, forces the flag to stay dirty forever. Ship with the override set to `false`. Flipping it to `true` is the one-character rollback lever.

### 2. A "wire up stale-marking" helper, called once at setup

The helper attaches subscriptions to every tier-one writable (twenty-six of them, enumerated below) and keeps every returned unsubscribe function in a private list on the renderer. The renderer's existing reset path calls each unsubscribe function, so that on hot-module-reload the old subscriptions do not pile up.

Evidence for the reset hook that the unsubscribe walk should attach to:

- [Animation.ts:20-23](vscode-webview://081v1990oep8ie604s97pudvrnipbh0so5lle4fbgfctemaevakk/di/src/lib/ts/render/Animation.ts#L20-L23)

### 3. The twenty-six subscriptions

Each one calls the mark function from its subscription callback. No transformation, no filtering, no conditional — the callback body is one line that marks stale. They live in the single helper from step two. Listed here grouped by source module.

**Scene stores** — fourteen subscriptions:

- selection, scene-list, tick, front-most-face, editing-mode, decorations bitmask, persisted orientation, view-mode, line-thickness, grid-opacity, show-grid, solid-vs-wireframe, precision, persisted scale.
- Evidence that these are all writables: [Stores.ts:11-33](vscode-webview://081v1990oep8ie604s97pudvrnipbh0so5lle4fbgfctemaevakk/di/src/lib/ts/managers/Stores.ts#L11-L33)

**Color stores** — six subscriptions:

- hover color, selected color, background color, text color, edge color, accent color.
- Evidence: [Colors.ts:35-40](vscode-webview://081v1990oep8ie604s97pudvrnipbh0so5lle4fbgfctemaevakk/di/src/lib/ts/utilities/Colors.ts#L35-L40)

**Interaction stores** — five subscriptions:

- 3D hover from the hit module.
- Pin-offer from the drag module.
- Face-label editor state from the face-label module.
- Angular editor state from the angular module.
- Dimension editor state from the dimension module.
- Unit system from the units module.

Evidence for each:

- [Hits_3D.ts:32](vscode-webview://081v1990oep8ie604s97pudvrnipbh0so5lle4fbgfctemaevakk/di/src/lib/ts/events/Hits_3D.ts#L32)
- [Drag.ts:102](vscode-webview://081v1990oep8ie604s97pudvrnipbh0so5lle4fbgfctemaevakk/di/src/lib/ts/editors/Drag.ts#L102)
- [Face_Label.ts:17](vscode-webview://081v1990oep8ie604s97pudvrnipbh0so5lle4fbgfctemaevakk/di/src/lib/ts/editors/Face_Label.ts#L17)
- [Angular.ts:18](vscode-webview://081v1990oep8ie604s97pudvrnipbh0so5lle4fbgfctemaevakk/di/src/lib/ts/editors/Angular.ts#L18)
- [Dimension.ts:18](vscode-webview://081v1990oep8ie604s97pudvrnipbh0so5lle4fbgfctemaevakk/di/src/lib/ts/editors/Dimension.ts#L18)
- [Units.ts:424](vscode-webview://081v1990oep8ie604s97pudvrnipbh0so5lle4fbgfctemaevakk/di/src/lib/ts/types/Units.ts#L424)

(Twenty-six stores, but twenty-one items in the list above because the six colors and fourteen scene stores are grouped. I AM GUESSING the grouped counts match — fourteen plus six plus six singletons equals twenty-six. If you see a mismatch during implementation, the source of truth is the tier-one list in the subscriptions chime above, which enumerated every store individually.)

### 4. Three targeted marks for the unstarred audit clusters

Every unstarred audit bullet lives in one of three places. A single mark call inside each place covers its whole cluster, because every cluster funnels through a single chokepoint.

**Inside the smart-object bound-setter.** Every "bound and value writes" bullet ends up calling the bound setter on a smart object. One mark inside the setter covers the whole category — thirty-three audit bullets for the cost of one line.

I AM GUESSING there is a single bound-setter function called `set_bound` on the smart object class. The audit references use the `set_bound` name and the direct field-writes (`axis.start.value = ...`) — if there is not a single entry point, this mark has to go in two or three places instead of one. Verify by searching for `set_bound` in the smart-object module.

**Inside the constraint propagation function.** Every "constraint / formula propagation" bullet goes through `propagate` (or `propagate_all`). A mark at the top or bottom of each of those covers all twenty-three audit bullets.

Evidence that propagate is a single named function worth wiring here:

- The register-post-propagate hook that proves a named chokepoint exists: [Engine.ts:47](vscode-webview://081v1990oep8ie604s97pudvrnipbh0so5lle4fbgfctemaevakk/di/src/lib/ts/render/Engine.ts#L47)

**Inside the renderer's resize method.** The resize method already exists and is called from the only two paths that matter — the initial canvas setup and the window-resize handler. One mark at the top of resize covers all five resize audit bullets.

Evidence:

- [Render.ts:147-152](vscode-webview://081v1990oep8ie604s97pudvrnipbh0so5lle4fbgfctemaevakk/di/src/lib/ts/render/Render.ts#L147-L152)

### 5. The gate in the animation tick

At the top of the per-tick callback, before `tick_snap_animation`, check: if the flag is clean and no snap animation is running, return early. If either is true, do the existing work: advance the snap animation, update the front-face tracker, paint the canvas. At the very start of the render call, clear the flag back to `false`.

Evidence for where the tick callback lives:

- [Engine.ts:134-138](vscode-webview://081v1990oep8ie604s97pudvrnipbh0so5lle4fbgfctemaevakk/di/src/lib/ts/render/Engine.ts#L134-L138)

### 6. The rot-prevention plan

Pick one option and commit to it in the same commit that ships the gate, or the plan will decay as new mutation sites are added later. My recommendation, in order of strength:

- **Strongest:** route every reactive-store write through a helper that also marks stale. Any new store added to the helper is auto-covered.
- **Middle:** add a development-mode assertion that logs when a store writes without the flag being set in the same microtask.
- **Weakest:** leave a prominent comment on the flag declaration naming the invariant. Relies on the next author reading the comment.

## Ship order

This can land in one commit or three. Splitting gives faster feedback:

1. **Commit one — wire the flag but do not gate.** Add the flag, add the mark function, add the twenty-six subscriptions, add the three targeted marks. Do not add the early-return in the tick callback yet. The behavior is identical to today, but you can add one line of instrumentation (a per-frame counter that logs when the flag is stale at the top of each tick) and watch a full session to see whether the flag fires where you expect. Missing wiring will show up as "canvas changed but flag was not set at the start of the tick that painted it."
    
2. **Commit two — flip the gate on.** Add the early-return. Run through every interaction type once to verify nothing is visibly stale.
    
3. **Commit three — rot prevention.** Whichever option you picked in step six.
    

## Verification plan

Before flipping the gate on (between commits one and two):

- **Instrument.** Add a temporary per-tick counter that logs "paint happened" and "paint skipped because clean" separately. Watch the counter while doing common interactions — idle, hover, click-select, drag a face, drag-rotate, wheel zoom, slide the line-thickness slider, change the unit system, change the edge color, undo, redo, snap-back animation, window resize. For each interaction, the counter should show paint-happened events on every frame you see a visible change and paint-skipped-because-clean events when you expect idle.
- **Watch for missed wiring.** If any interaction shows "the canvas visibly changed but the last tick was skipped," there is a missing mark. Fix it before going further.
- **Watch for wasted wiring.** If idle periods still show paint-happened events, some store is firing when you expect idle. Track it back to the source and either remove the subscription (if it's in tier three by accident) or leave it if it's intentional.

After flipping the gate on (commit two):

- **Replay the same interactions.** Behavior should be identical. If any interaction produces a stale image, there is either a missing mark or a wrong clear-order in the gate.
- **Measure idle frame cost.** Open the dev-tools performance panel with the app idle and confirm that the per-tick work has dropped to near-zero.
- **Run the full test suite.** All four hundred and ninety-six tests should still pass — they do not touch the render loop directly but they do exercise the mutation paths that now wire through the mark function.

## Rollback

Three escalating levers, weakest first:

- **One-character revert.** Flip the "always redraw" override constant to `true`. The gate becomes a no-op. No commit needed, no deploy needed — the next reload picks up the change.
- **Keystroke override.** The optional "maybe" item from the proposal — a key that toggles the override at runtime. Hold it until the audit shakes out. Remove after.
- **Revert commit two.** Undo the early-return line. Commits one and three stay in place; the wiring is still there but no longer gates anything.

## Size estimate

- Twenty-six subscription lines.
- One helper function plus unsubscribe list plus reset call — about fifteen lines of bookkeeping.
- Three targeted mark calls, one line each.
- One early-return in the tick callback, two or three lines.
- One override constant, one line.

Roughly fifty lines of new code plus whatever the rot-prevention option costs.

## What this proposal does not include

- Any change to the tick store or its existing consumers. The side panels continue to refresh via the tick exactly as they do today.
- Any change to the render function's internals. The gate is a wrapper around render, not a rewrite of render.
- Any attempt to coalesce multiple mutations into a single mark. The flag naturally coalesces because many writes in one tick still produce one paint.
- Any of the other bottlenecks. Item two stands on its own.

## Open questions for you to decide before I build

- **Do you want the "every store write routes through a helper" option for rot prevention, or the assertion, or the comment?** Strongest first, pick based on how much plumbing you want in the stores module.
- **Do you want the ship-in-three-commits split, or one commit?** The split is safer; the combined commit is faster.
- **Do you want the keystroke override in the first commit or not?** Dropping it simplifies the ship; keeping it helps debug a silent-staleness bug if one slips through.
- **Do you want me to file the three targeted marks inside their respective modules, or leave them as a follow-up?** They are independent of the subscription wiring and can ship in a later commit, though the gate is only safe to enable after they are in place.

### Risks

The change is mechanically small and logically simple — one flag, two places to clear and set. Its risk is not in the patch itself but in the audit around it. The failure mode is silent: a stale image, not an exception.

### The big risk — silent failure when a change source is missed

Today the screen redraws sixty times a second no matter what, so any mutation path shows up on screen within a frame even if nobody remembered to tell the renderer it changed. Adding the flag flips that contract: every mutation must actively mark the renderer dirty, or its effect never appears on screen. When a caller is missed, the bug is silent — no error, no crash, just a stale image that only moves when some unrelated change also happens to mark the flag.

The audit to find every mutation is the risk, not the flag itself. Miss one and the user sees a CAD app that sometimes forgets to update.

The mutation paths I can already see that will need wiring — and there are probably more I have not traced:

- Camera move, pan, zoom, and rotate.
- The tumble-orientation snap animation that advances on each tick.
- Selection changes.
- Hover changes from pointer events.
- Drag steps from pointer events.
- Every mutation through the constraints propagation path.
- Scene load, undo, redo, duplicate, delete, add-child, import, fit-to-children.
- Window resize and device-pixel-ratio changes.
- Preference changes that affect rendering (line thickness, grid opacity, edge color, solid mode, view mode, show-names, show-dimensionals, show-angulars).
- Debug flag flips made through the browser devtools or keyboard shortcuts.

Evidence for where these live:

- The animation tick calls three things every frame; the last one is the render: [Engine.ts:134-138](di/src/lib/ts/render/Engine.ts#L134-L138)
- The snap animation step writes orientation every tick while running: [Engine.ts:340-356](di/src/lib/ts/render/Engine.ts#L340-L356)
- Many places across the managers and the render files subscribe to stores: [Stores.ts:1-30](di/src/lib/ts/managers/Stores.ts#L1-L30)

### Second risk — animation freezes if the flag is only set once per event

If the flag is cleared at the start of render, and the orientation-snap-animation step writes orientation but does not mark dirty, the first frame of the animation runs, clears the flag, and then the next frame sees a clean flag and skips — even though the animation is not done. The animation visibly freezes partway through the snap-back.

Mitigation: the tick should detect "snap animation in progress" and force the flag on for that case, or the orientation setter must set the flag itself.

Evidence:

- The snap-animation tick runs before render each frame: [Engine.ts:134-138](di/src/lib/ts/render/Engine.ts#L134-L138)
- The body of the snap animation writes a new orientation each frame: [Engine.ts:340-356](di/src/lib/ts/render/Engine.ts#L340-L356)

### Audit results

Every call site below mutates something the canvas reflects. Each needs to call `mark_render_as_stale(true)` when the gate lands. Categories match the proposal's audit-first bullet. Line numbers were captured on the date of the audit and should be re-verified before wiring.

**Legend:** a bullet starting with `*` writes directly to a reactive store. Unstarred bullets mutate a plain class field or data object. The split matters because every reactive-store write already fires subscribers — a single "mark stale whenever any reactive store fires" hook would cover every starred bullet at once, leaving only the unstarred bullets to be wired individually.

#### 1. Camera move, pan, zoom, scale, ortho toggle

- User toggles orthographic projection mode — [Engine.ts:445](di/src/lib/ts/render/Engine.ts#L445)
- View mode toggle moves camera back to the 2D ortho framing position — [Engine.ts:444](di/src/lib/ts/render/Engine.ts#L444)
- \* View mode toggle restores prior 3D orientation on exit — [Engine.ts:448](di/src/lib/ts/render/Engine.ts#L448)
- \* Scale store written during wheel zoom — [Drag.ts:229](di/src/lib/ts/editors/Drag.ts#L229)
- Graph component calls camera resize on window change — [Graph.svelte:81](di/src/lib/svelte/main/Graph.svelte#L81)
- \* Tumble store written during free 3D rotate — [Drag.ts:249](di/src/lib/ts/editors/Drag.ts#L249)
- Tumble store written during edge-constrained rotate — [Drag.ts:333](di/src/lib/ts/editors/Drag.ts#L333)

#### 2. Selection change

All selection writes flow through the selection-setter, which writes a reactive store.

- \* Set selection via the hit module — [Hits_3D.ts:38](di/src/lib/ts/events/Hits_3D.ts#L38)
- \* Clear selection when drag starts — [Hits_3D.ts:53](di/src/lib/ts/events/Hits_3D.ts#L53)
- \* Set selection to best face on click — [Hits_3D.ts:91](di/src/lib/ts/events/Hits_3D.ts#L91)
- \* Set selection while editing a face label — [Face_Label.ts:50](di/src/lib/ts/editors/Face_Label.ts#L50)
- \* Restore prior selection on label edit cancel — [Face_Label.ts:100](di/src/lib/ts/editors/Face_Label.ts#L100)
- \* Keyboard tree navigation — set selection — [Events.ts:285](di/src/lib/ts/events/Events.ts#L285)
- \* Keyboard: collapse parent, select next sibling — [Events.ts:302](di/src/lib/ts/events/Events.ts#L302)
- \* Keyboard: select first child — [Events.ts:319](di/src/lib/ts/events/Events.ts#L319)
- \* Keyboard selection in 3D view — [Events_3D.ts:125](di/src/lib/ts/events/Events_3D.ts#L125)
- \* Mousedown selects a face — [Events_3D.ts:128](di/src/lib/ts/events/Events_3D.ts#L128)
- \* Mousedown on empty space selects root — [Events_3D.ts:150](di/src/lib/ts/events/Events_3D.ts#L150)
- \* Double-click on empty space clears selection — [Events_3D.ts:152](di/src/lib/ts/events/Events_3D.ts#L152)
- \* Duplicate leaves the new clone selected — [Engine.ts:757](di/src/lib/ts/render/Engine.ts#L757)

#### 3. Hover change

All hover writes go through the hover-setter, which writes a reactive store.

- \* Set hover via the hit module — [Hits_3D.ts:37](di/src/lib/ts/events/Hits_3D.ts#L37)
- \* Clear hover on mouseup — [Hits_3D.ts:52](di/src/lib/ts/events/Hits_3D.ts#L52)
- \* Clear hover when mouse leaves the canvas — [Events_3D.ts:46](di/src/lib/ts/events/Events_3D.ts#L46)
- \* Set hover to the face under the pointer (or clear if already selected) — [Events_3D.ts:60](di/src/lib/ts/events/Events_3D.ts#L60)
- \* Clear hover when the drag target changes — [Events_3D.ts:82](di/src/lib/ts/events/Events_3D.ts#L82)
- \* Clear hover on edge / corner pick — [Events_3D.ts:94](di/src/lib/ts/events/Events_3D.ts#L94)
- \* Clear hover on mouseup after drag — [Events_3D.ts:108](di/src/lib/ts/events/Events_3D.ts#L108)
- \* Clear hover when a drag begins — [Events_3D.ts:119](di/src/lib/ts/events/Events_3D.ts#L119)

#### 4. Drag step, drag-end, guidance updates

- \* Clear pin-offer when drag target is cleared — [Drag.ts:111](di/src/lib/ts/editors/Drag.ts#L111)
- \* Set pin-offer after a drag completes with snaps — [Drag.ts:186](di/src/lib/ts/editors/Drag.ts#L186)
- \* Clear pin-offer when a drag is cancelled — [Drag.ts:219](di/src/lib/ts/editors/Drag.ts#L219)
- Face drag moves a child SO in its parent's space — [Drag.ts:620](di/src/lib/ts/editors/Drag.ts#L620)
- Face drag moves the opposite bound along with the first — [Drag.ts:621](di/src/lib/ts/editors/Drag.ts#L621)
- Edge shifted to a snap target during face drag (near side) — [Drag.ts:674](di/src/lib/ts/editors/Drag.ts#L674)
- Edge shifted to a snap target during face drag (far side) — [Drag.ts:675](di/src/lib/ts/editors/Drag.ts#L675)
- Edge drag stretches bounds — [Drag.ts:712](di/src/lib/ts/editors/Drag.ts#L712)
- Edge-snap detected during face drag — [Drag.ts:631](di/src/lib/ts/editors/Drag.ts#L631)
- Pin formulas set on the dragged SO after accept — [Drag.ts:206](di/src/lib/ts/editors/Drag.ts#L206)
- Pin formulas set on the sibling SO after accept — [Drag.ts:212](di/src/lib/ts/editors/Drag.ts#L212)
- Propagate after pin formulas set — [Drag.ts:220](di/src/lib/ts/editors/Drag.ts#L220)

#### 5. Store tick / reactive pulse

Every entry here writes the tick store — they all qualify as reactive writes.

- \* Tick after setup completes — [Engine.ts:131](di/src/lib/ts/render/Engine.ts#L131)
- \* Tick after the drag handler writes bounds — [Engine.ts:86](di/src/lib/ts/render/Engine.ts#L86)
- \* Tick after delete — [Engine.ts:525](di/src/lib/ts/render/Engine.ts#L525)
- \* Tick after import — [Engine.ts:625](di/src/lib/ts/render/Engine.ts#L625)
- \* Tick after add child — [Engine.ts:705](di/src/lib/ts/render/Engine.ts#L705)
- \* Tick after duplicate — [Engine.ts:758](di/src/lib/ts/render/Engine.ts#L758)
- \* Tick after fit-to-children — [Engine.ts:854](di/src/lib/ts/render/Engine.ts#L854)
- \* Tick after dimension edit — [Dimension.ts:90](di/src/lib/ts/editors/Dimension.ts#L90)
- \* Tick after angular edit — [Angular.ts:72](di/src/lib/ts/editors/Angular.ts#L72)
- \* Tick fires when the repeater post-propagate hook updates the SO list — [Engine.ts:52](di/src/lib/ts/render/Engine.ts#L52)
- \* Tick after a face label edit commits — [Face_Label.ts:75](di/src/lib/ts/editors/Face_Label.ts#L75)
- \* Tick during face label sync — [Face_Label.ts:88](di/src/lib/ts/editors/Face_Label.ts#L88)

#### 6. Orientation snap animation step

- \* Animation in progress writes a fresh slerped orientation each frame — [Engine.ts:354](di/src/lib/ts/render/Engine.ts#L354)
- \* Animation completion writes the final orientation — [Engine.ts:345](di/src/lib/ts/render/Engine.ts#L345)
- Animation starts when rotation-snap is toggled off — [Engine.ts:388](di/src/lib/ts/render/Engine.ts#L388)
- Animation starts when rotation-snap is toggled on and entering 2D — [Engine.ts:402](di/src/lib/ts/render/Engine.ts#L402)

#### 7. Geometry mutation — tree changes

- Default root SO created on first run — [Engine.ts:192](di/src/lib/ts/render/Engine.ts#L192)
- \* Add child SO to the selection or the root — [Engine.ts:704](di/src/lib/ts/render/Engine.ts#L704)
- \* Delete selected SO and everything under it — [Engine.ts:524](di/src/lib/ts/render/Engine.ts#L524)
- \* Duplicate selected SO as a sibling — [Engine.ts:756](di/src/lib/ts/render/Engine.ts#L756)
- \* Import SO subtree from `.di` text — [Engine.ts:625](di/src/lib/ts/render/Engine.ts#L625)
- \* Strip repeater clones and restore the template — [Engine.ts:1065](di/src/lib/ts/render/Engine.ts#L1065)
- \* Fit root to children — [Engine.ts:854](di/src/lib/ts/render/Engine.ts#L854)
- \* SO list republished after scene load — [Engine.ts:224](di/src/lib/ts/render/Engine.ts#L224)
- \* SO list republished after repeater sync — [Engine.ts:52](di/src/lib/ts/render/Engine.ts#L52)

#### 8. Geometry mutation — bounds and value writes

- Dimension edit writes the edited bound — [Dimension.ts:79](di/src/lib/ts/editors/Dimension.ts#L79)
- Dimension edit writes the paired opposite bound — [Dimension.ts:80](di/src/lib/ts/editors/Dimension.ts#L80)
- Symmetric dimension edit writes min — [Dimension.ts:85](di/src/lib/ts/editors/Dimension.ts#L85)
- Symmetric dimension edit writes max — [Dimension.ts:86](di/src/lib/ts/editors/Dimension.ts#L86)
- Angular edit writes the rotation angle value — [Angular.ts:69](di/src/lib/ts/editors/Angular.ts#L69)
- Face drag moves min bound — [Drag.ts:620](di/src/lib/ts/editors/Drag.ts#L620)
- Face drag moves max bound — [Drag.ts:621](di/src/lib/ts/editors/Drag.ts#L621)
- Stretch resets initial bounds on the dragged corner — [Drag.ts:697](di/src/lib/ts/editors/Drag.ts#L697)
- Stretch writes the new bound at drag end — [Drag.ts:712](di/src/lib/ts/editors/Drag.ts#L712)
- Edge snap shifts min bound — [Drag.ts:674](di/src/lib/ts/editors/Drag.ts#L674)
- Edge snap shifts max bound — [Drag.ts:675](di/src/lib/ts/editors/Drag.ts#L675)
- Fit-to-children rewrites root x_min — [Engine.ts:836](di/src/lib/ts/render/Engine.ts#L836)
- Fit-to-children rewrites root x_max — [Engine.ts:837](di/src/lib/ts/render/Engine.ts#L837)
- Fit-to-children rewrites root y_min — [Engine.ts:838](di/src/lib/ts/render/Engine.ts#L838)
- Fit-to-children rewrites root y_max — [Engine.ts:839](di/src/lib/ts/render/Engine.ts#L839)
- Fit-to-children rewrites root z_min — [Engine.ts:840](di/src/lib/ts/render/Engine.ts#L840)
- Fit-to-children rewrites root z_max — [Engine.ts:841](di/src/lib/ts/render/Engine.ts#L841)
- Fit-to-children restores direct children x_min — [Engine.ts:845](di/src/lib/ts/render/Engine.ts#L845)
- Fit-to-children restores direct children x_max — [Engine.ts:846](di/src/lib/ts/render/Engine.ts#L846)
- Fit-to-children restores direct children y_min — [Engine.ts:847](di/src/lib/ts/render/Engine.ts#L847)
- Fit-to-children restores direct children y_max — [Engine.ts:848](di/src/lib/ts/render/Engine.ts#L848)
- Fit-to-children restores direct children z_min — [Engine.ts:849](di/src/lib/ts/render/Engine.ts#L849)
- Fit-to-children restores direct children z_max — [Engine.ts:850](di/src/lib/ts/render/Engine.ts#L850)
- Default root start bounds on new scene — [Engine.ts:216-218](di/src/lib/ts/render/Engine.ts#L216-L218)
- Strip clones writes template axis start — [Engine.ts:1047](di/src/lib/ts/render/Engine.ts#L1047)
- Strip clones writes template axis end — [Engine.ts:1048](di/src/lib/ts/render/Engine.ts#L1048)
- Strip clones restores run-axis length — [Engine.ts:1055](di/src/lib/ts/render/Engine.ts#L1055)
- Strip clones restores run-axis end — [Engine.ts:1056](di/src/lib/ts/render/Engine.ts#L1056)
- Swap axes exchanges axis objects — [Engine.ts:892](di/src/lib/ts/render/Engine.ts#L892)
- Swap axes fixes offsets on the first axis start — [Engine.ts:911](di/src/lib/ts/render/Engine.ts#L911)
- Swap axes fixes offsets on the first axis end — [Engine.ts:912](di/src/lib/ts/render/Engine.ts#L912)
- Swap axes fixes offsets on the second axis start — [Engine.ts:913](di/src/lib/ts/render/Engine.ts#L913)
- Swap axes fixes offsets on the second axis end — [Engine.ts:914](di/src/lib/ts/render/Engine.ts#L914)

#### 9. History — undo, redo, snapshot, load scene

- Snapshot before dimension edit — [Dimension.ts:58](di/src/lib/ts/editors/Dimension.ts#L58)
- Snapshot before angular edit — [Angular.ts:56](di/src/lib/ts/editors/Angular.ts#L56)
- Snapshot before face label edit — [Face_Label.ts:65](di/src/lib/ts/editors/Face_Label.ts#L65)
- Snapshot before delete — [Engine.ts:476](di/src/lib/ts/render/Engine.ts#L476)
- Snapshot before import — [Engine.ts:540](di/src/lib/ts/render/Engine.ts#L540)
- Snapshot before add child — [Engine.ts:680](di/src/lib/ts/render/Engine.ts#L680)
- Snapshot before duplicate — [Engine.ts:711](di/src/lib/ts/render/Engine.ts#L711)
- Snapshot before a pointer drag mutates state — [Events_3D.ts:113](di/src/lib/ts/events/Events_3D.ts#L113)
- Undo restores scene state — [Engine.ts:258](di/src/lib/ts/render/Engine.ts#L258)
- Redo restores scene state — [Engine.ts:264](di/src/lib/ts/render/Engine.ts#L264)
- Initial scene load on setup — [Engine.ts:73](di/src/lib/ts/render/Engine.ts#L73)
- Undo keyboard shortcut — [Events.ts:193](di/src/lib/ts/events/Events.ts#L193)
- Redo keyboard shortcut — [Events.ts:192](di/src/lib/ts/events/Events.ts#L192)

#### 10. Constraints / formula propagation

- Register the post-propagate hook that keeps repeater clones fresh — [Engine.ts:47](di/src/lib/ts/render/Engine.ts#L47)
- Propagate after the drag handler writes bounds — [Engine.ts:81](di/src/lib/ts/render/Engine.ts#L81)
- Propagate after dimension edit — [Dimension.ts:88](di/src/lib/ts/editors/Dimension.ts#L88)
- Propagate after angular edit — [Angular.ts:70](di/src/lib/ts/editors/Angular.ts#L70)
- Propagate after pin formulas set — [Drag.ts:220](di/src/lib/ts/editors/Drag.ts#L220)
- Propagate-all after stretch — [Drag.ts:710](di/src/lib/ts/editors/Drag.ts#L710)
- Set formula for the dragged bound during pin — [Drag.ts:206](di/src/lib/ts/editors/Drag.ts#L206)
- Set formula for the sibling bound during pin — [Drag.ts:212](di/src/lib/ts/editors/Drag.ts#L212)
- Set formula on newly added child — [Engine.ts:690](di/src/lib/ts/render/Engine.ts#L690)
- Set formula on newly duplicated clone — [Engine.ts:739](di/src/lib/ts/render/Engine.ts#L739)
- Propagate after duplicate — [Engine.ts:755](di/src/lib/ts/render/Engine.ts#L755)
- Propagate-all after precision change — [Engine.ts:469](di/src/lib/ts/render/Engine.ts#L469)
- Clear formulas in the delete-cascade subtree — [Engine.ts:498](di/src/lib/ts/render/Engine.ts#L498)
- Clear formulas that referenced a deleted SO — [Engine.ts:509](di/src/lib/ts/render/Engine.ts#L509)
- Rebind formulas during scene load — [Engine.ts:184](di/src/lib/ts/render/Engine.ts#L184)
- Propagate-all during scene load — [Engine.ts:189](di/src/lib/ts/render/Engine.ts#L189)
- Rebind formulas during import — [Engine.ts:616](di/src/lib/ts/render/Engine.ts#L616)
- Propagate-all after import — [Engine.ts:624](di/src/lib/ts/render/Engine.ts#L624)
- Rebind during fit-to-children — [Engine.ts:853](di/src/lib/ts/render/Engine.ts#L853)
- Rebind and cascade after swap-axes — [Engine.ts:932](di/src/lib/ts/render/Engine.ts#L932)
- Propagate-all after swap-axes — [Engine.ts:937](di/src/lib/ts/render/Engine.ts#L937)
- Propagate-all after root rotate — [Engine.ts:1004](di/src/lib/ts/render/Engine.ts#L1004)
- Propagate-all after repeater sync — [Engine.ts:1252](di/src/lib/ts/render/Engine.ts#L1252)

#### 11. Window resize and device-pixel-ratio change

- Canvas init with initial size — [Render.ts:141](di/src/lib/ts/render/Render.ts#L141)
- Canvas resize in response to window resize — [Render.ts:147](di/src/lib/ts/render/Render.ts#L147)
- Device-pixel-ratio resampled during resize — [Render.ts:148](di/src/lib/ts/render/Render.ts#L148)
- Camera resized to match new canvas — [Render.ts:151](di/src/lib/ts/render/Render.ts#L151)
- Graph component calls render-resize on window change — [Graph.svelte:81](di/src/lib/svelte/main/Graph.svelte#L81)

#### 12. Preference changes that affect rendering

Every entry in this category writes a persistent reactive store.

- \* Toggle show-dimensionals — [Stores.ts:37](di/src/lib/ts/managers/Stores.ts#L37)
- \* Toggle show-angulars — [Stores.ts:38](di/src/lib/ts/managers/Stores.ts#L38)
- \* Toggle show-names — [Stores.ts:39](di/src/lib/ts/managers/Stores.ts#L39)
- \* Set orientation (persisted tumble) — [Stores.ts:40](di/src/lib/ts/managers/Stores.ts#L40)
- \* Toggle details panel visibility — [Stores.ts:41](di/src/lib/ts/managers/Stores.ts#L41)
- \* Toggle solid mode — [Stores.ts:42](di/src/lib/ts/managers/Stores.ts#L42)
- \* Toggle rotation snap — [Stores.ts:43](di/src/lib/ts/managers/Stores.ts#L43)
- \* Toggle allow-editing — [Stores.ts:44](di/src/lib/ts/managers/Stores.ts#L44)
- \* Toggle show-grid — [Stores.ts:45](di/src/lib/ts/managers/Stores.ts#L45)
- \* Toggle view mode between 2D and 3D — [Engine.ts:427](di/src/lib/ts/render/Engine.ts#L427)
- \* Set precision level — [Engine.ts:459](di/src/lib/ts/render/Engine.ts#L459)
- \* User adjusts line thickness slider — [D_Preferences.svelte:64](di/src/lib/svelte/details/D_Preferences.svelte#L64)
- \* User adjusts grid opacity slider — [Graph.svelte:43](di/src/lib/svelte/main/Graph.svelte#L43)
- \* User changes unit system — [D_Preferences.svelte:26](di/src/lib/svelte/details/D_Preferences.svelte#L26)
- \* User changes accent color — [D_Preferences.svelte:73](di/src/lib/svelte/details/D_Preferences.svelte#L73)
- \* User changes edge color — [D_Preferences.svelte:81](di/src/lib/svelte/details/D_Preferences.svelte#L81)
- \* Toolbar toggles solid mode — [Controls.svelte:51](di/src/lib/svelte/main/Controls.svelte#L51)
- \* Toolbar toggles view mode — [Controls.svelte:50](di/src/lib/svelte/main/Controls.svelte#L50)
- \* Toolbar toggles rotation snap — [Controls.svelte:64](di/src/lib/svelte/main/Controls.svelte#L64)
- \* Toolbar toggles details panel — [Controls.svelte:29](di/src/lib/svelte/main/Controls.svelte#L29)
- \* Decorations menu toggles show-names — [Controls.svelte:42](di/src/lib/svelte/main/Controls.svelte#L42)
- \* Decorations menu toggles show-dimensionals — [Controls.svelte:43](di/src/lib/svelte/main/Controls.svelte#L43)
- \* Decorations menu toggles show-angulars — [Controls.svelte:44](di/src/lib/svelte/main/Controls.svelte#L44)

#### 13. Debug flag flips

- Facet-log flag flipped during render — [Render.ts:545](di/src/lib/ts/render/Render.ts#L545)
- Facet-logged flag set on completion — [Render.ts:548](di/src/lib/ts/render/Render.ts#L548)
- Trace-logged flag cleared when showing facets — [Render.ts:451](di/src/lib/ts/render/Render.ts#L451)
- Trace-logged flag set during facet paint — [Facets.ts:862](di/src/lib/ts/render/Facets.ts#L862)
- Merge-logged flag set during topology merge — [Topology.ts:1448](di/src/lib/ts/render/Topology.ts#L1448)

Note: these flags do not themselves need to mark the canvas stale — they are one-shot log guards. But any developer-mode toggle added later that flips an actual rendering switch (for example, forcing wireframe, forcing facets visible) must mark stale.

#### 14. Other mutation sites worth noting

- Edge-color subscription rewrites every scene object's color — [Engine.ts:38](di/src/lib/ts/render/Engine.ts#L38). Canvas-affecting: every visible SO's color changes. This is a reaction to a reactive store, not a write; no star.
- \* Library-update counter incremented to refresh the library panel — [Scenes.ts:257](di/src/lib/ts/managers/Scenes.ts#L257). Affects the UI panel, not the canvas directly; listed in case the gate audits UI too.
- \* Scale preference updated during wheel zoom — [Drag.ts:229](di/src/lib/ts/editors/Drag.ts#L229). Duplicates item 1 above; noted so future audits do not double-wire it.
- Face label name written during editor sync — [Face_Label.ts:86](di/src/lib/ts/editors/Face_Label.ts#L86). Changes the on-canvas label text.
- \* SO list republished during face label sync — [Face_Label.ts:88](di/src/lib/ts/editors/Face_Label.ts#L88). Ensures reactive label re-render even when list identity is unchanged.
- \* Front-face tracker updated each tick — [Engine.ts:417](di/src/lib/ts/render/Engine.ts#L417). Feeds guidance rendering and rotation-snap target picking.
- \* Scale set on new scene load — [Engine.ts:205](di/src/lib/ts/render/Engine.ts#L205). Initial zoom on first run.
- Repeater configuration mutated during swap-axes — [Engine.ts:924](di/src/lib/ts/render/Engine.ts#L924). Changes which axes drive repeater layout.

### Audit summary

- Total categorized sites: roughly one hundred and forty distinct lines, spread across eleven source files.
- Hottest files by site count: Engine.ts, Drag.ts, Events_3D.ts, Hits_3D.ts.
- The single riskiest category is hover change — eight sites, all inside fast pointer-event paths. Missing any one of them means a stale hover dot.
- The safest-to-wire category is history — every history write already flows through a small number of well-named entry points.
- Starred (reactive-store-writing) sites are the large majority. Unstarred sites are concentrated in three places: the bound-write category (direct writes on smart-object axis fields), the constraint propagation category (writes to smart-object fields inside propagate), and the resize category (writes to canvas and camera fields).
- Recommendation — **get most of this for free by subscribing to reactive stores.** If every reactive-store subscription marks stale on every change, every starred bullet is covered automatically by one hook. Only the unstarred bullets then need individual wiring. The three unstarred clusters are: bound writes (wire inside the bound-setter on the smart-object class), constraints propagation (wire inside propagate and propagate_all), and window resize (wire inside the resize method on the renderer). Everything else comes for free.

### Third risk — racing against mutations that happen during render

If the flag is cleared at the start of render, and any code during render causes a store write, that write sets the flag again — which is good, it means the next frame runs. But if instead the flag is cleared at the end of render, a write during render is lost, because render clears the just-set flag.

Mitigation is simple — clear at the start of render, not the end — but it must be done the right way around. Getting this wrong is another silent staleness bug.

I AM GUESSING that a full audit of what gets written during render would turn up at least one such in-render write, because the renderer pushes rects to a few arrays that UI code reads. I have not traced whether those reads ever cause a store write back.

Evidence:

- Render clears per-frame rect lists at the top of render: [Render.ts:190-193](di/src/lib/ts/render/Render.ts#L190-L193)

### Fourth risk — debug toggles and developer-tools flips

Some debug flags and constants are constant at build time, but others can be flipped in a running session. If a flag flip does not go through a path that marks dirty, flipping it will not redraw — the person flipping will think it didn't work.

The fix is to route flag flips through a "mark dirty" call, but that means the dirty path has to be discoverable from the console, not only from wiring inside the managers.

Evidence:

- The debug flags object is a plain constant object with no setter guarding writes: [Constants.ts](di/src/lib/ts/common/Constants.ts)

### Fifth risk — the first frame and hot-module-reload cases

If the flag starts clean, the first render never runs and the canvas stays blank. The flag must start dirty. Similarly, after a hot-module-reload that swaps the renderer singleton, the new renderer must start dirty.

This one is easy to get right — start the flag at true — but it is worth spelling out because missing it means a blank screen at startup that looks like a bigger bug than it is.

Evidence:

- The animation manager has a reset path used by hot-module-reload: [Animation.ts:20-23](di/src/lib/ts/render/Animation.ts#L20-L23)

### Sixth risk — hover feedback lag

Pointer-move updates the hit state, and the current unconditional render makes the hover dot appear immediately. If the hit-state update does not mark dirty, the hover dot will lag until the next unrelated redraw, which feels broken.

The mitigation is the same pattern as the rest: wire the hit-state update to the dirty mark. The risk is "forgetting," not "impossible."

I AM GUESSING this is the risk most likely to slip through a first pass, because pointer-move is a high-frequency code path that currently benefits from the free redraw every tick — it will be easy to skip when auditing the "big" mutation sites.