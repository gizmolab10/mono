# Migration: w_ancestry_focus to si_recents.index

*Extracted from architecture/ux/breadcrumbs.md*

## Goal

`x.si_recents` tracks history. Its index is the single source of truth about `s.w_ancestry_focus`. The two must always be in sync. The latter is observed ubiquitously.

## Migration Plan (six phases)

These phases can be implemented incrementally, but in order, with each phase leaving the app in a safe, running state.

### Notes

- Phase 1 (subscription) and phase 5 (initialization) have to be implemented and deployed before fully removing direct `w_ancestry_focus.set` calls.
- Phases 2–4 depend on phase 1 being in place, but can still be shipped one by one (for example: update `becomeFocus()` first, `ancestry_next_focusOn()` next, then the remaining setters).

### 1. Create derived store subscription

- In `UX.ts.setup_subscriptions()`, add subscription to `si_recents.w_index` and `si_recents.w_items`
- When either changes, extract ancestry from `si_recents.item[0]` and update `w_ancestry_focus`
- Handle edge case: if `si_recents.item` is null, use `h.rootAncestry` or current focus
- Expose a `ux.focus_forIndex` helper that maps an index to an ancestry without mutating history.
- **Files impacted**: `UX.ts` (code) plus this analysis note.
- **Status**: implemented.
- **Risk**: Low, provided the subscription is strictly one‑way: it only reads from `si_recents` and writes to `w_ancestry_focus`. Main concern is handling the empty `si_recents` case without setting focus to `undefined`.
- **Mitigation**: Keep the subscription read‑only with respect to history (never call `becomeFocus()` or mutate `si_recents` inside it). Always guard the empty case (`if (!si_recents.item) { use root/current focus; return; }`). A reentrancy flag is optional insurance but not required if the subscription never touches `si_recents`.

### 2. Update `becomeFocus()` method

- Remove direct `s.w_ancestry_focus.set(ancestry)` call (line 128)
- Keep `si_recents.push(pair)` - this automatically updates index via `S_Items.push()`
- The subscription from step 1 will update `w_ancestry_focus` automatically
- **Files impacted**: `UX.ts` (1 file)
- **Risk**: **Low to Medium**. Svelte subscriptions fire synchronously when stores update, so `si_recents.push()` → `w_index` update → subscription → `w_ancestry_focus.set()` should complete before `update_ancestry_forDetails()` reads the store. However, `update_ancestry_forDetails()` (line 90) reads `w_ancestry_focus` as a fallback, creating a small timing risk. Also risk if `si_recents.push()` fails or doesn't update index as expected.
- **Mitigation**: 
  - Svelte subscriptions are synchronous, so timing should be safe
  - Add dev-only invariant: `console.assert(si_recents.item?.[0] === ancestry, 'recents index out of sync')` at end of `becomeFocus()`
  - If needed, pass `ancestry` parameter directly to `update_ancestry_forDetails()` instead of relying on store read
  - Use the `ancestry` parameter directly anywhere in `becomeFocus()` that needs immediate access
- **Verification tests**:
  - [x] Call `ancestry.becomeFocus()` and immediately check `get(s.w_ancestry_focus)` equals the ancestry
  - [x] Verify `si_recents.item[0]` equals the ancestry after `becomeFocus()` returns
  - [x] Verify `update_ancestry_forDetails()` gets correct ancestry (not stale) when called from `becomeFocus()`
  - [x] Test rapid successive `becomeFocus()` calls to ensure no race conditions
  - [x] Verify breadcrumb button click updates focus correctly
- **Status**: ✅ Implemented. Removed direct `s.w_ancestry_focus.set()` call, added dev-only invariant assertion. Tests created in `src/lib/ts/tests/UX_becomeFocus.test.ts`.

### 3. Update `ancestry_next_focusOn()` method

- Remove direct `s.w_ancestry_focus.set(focus)` call (line 107)
- Keep `si_recents.find_next_item(next)` - this updates index
- The subscription from step 1 will update `w_ancestry_focus` automatically
- **Files impacted**: `UX.ts` (1 file). Call sites (`Primary_Controls.svelte`, `Events.ts`) don't need changes.
- **Risk**: **Low**. Svelte subscriptions fire synchronously, so timing is safe. Main risks are: (1) `si_recents` is empty (`find_next_item` returns false, `si_recents.item` is null), (2) `find_next_item` fails to find valid item (returns false but doesn't throw), (3) `si_recents.item` is null after navigation. The method already handles null checks, but should early-return if recents is empty.
- **Mitigation**: 
  - Early-return when `si_recents.length === 0` before calling `find_next_item`
  - After `find_next_item(next)`, verify `si_recents.item` is not null before accessing it
  - The subscription will handle updating `w_ancestry_focus` synchronously
  - If callers need immediate access to new focus, they can read `x.si_recents.item?.[0]` directly
- **Verification tests**:
  - [x] Test navigation forward (`next=true`) through recents history
  - [x] Test navigation backward (`next=false`) through recents history
  - [x] Test empty recents case (should early-return gracefully)
  - [x] Test that `w_ancestry_focus` updates correctly after navigation
  - [x] Test that grabs are restored from history entry
  - [x] Test that all grabbed ancestries are made visible
- **Status**: ✅ Implemented. Removed direct `s.w_ancestry_focus.set()` call, added early-return for empty recents, added null checks. Tests created in `src/lib/ts/tests/UX_ancestry_next_focusOn.test.ts`.

### 4. Find and update all direct setters

- Search for all `s.w_ancestry_focus.set()` calls
- Replace with either:
  - `ancestry.becomeFocus()` if setting a new focus (adds to history)
  - `x.si_recents.index = targetIndex` if navigating to existing history entry
- **Files impacted**: `Preferences.ts` (line 116). Note: `UX.ts` line 68 in `update_focus_from_recents()` is CORRECT - it's the subscription handler from phase 1 and should remain.
- **Risk**: **Low to Medium**. Only one direct setter found outside the subscription handler. The `Preferences.ts` setter (line 116) is redundant since `becomeFocus()` is called immediately after (line 134). Risk of missing setters in dynamic/generated code is low since TypeScript will catch most. Main risk is understanding initialization context - the direct set happens during startup before `becomeFocus()` is called, but `becomeFocus()` will handle it correctly.
- **Mitigation**: 
  - Remove redundant direct set on line 116 in `Preferences.ts` - `becomeFocus()` on line 134 will handle focus setting and add to history
  - The direct set only occurs when `c.eraseDB > 0`, but `becomeFocus()` is called anyway, making it redundant
  - Verify initialization sequence: `restore_focus()` is called during startup, and `becomeFocus()` will properly initialize history
  - Add comment explaining why direct set was removed
- **Verification tests**:
  - [x] Test that `restore_focus()` correctly sets focus via `becomeFocus()` (not direct set)
  - [x] Test initialization with `eraseDB > 0` flag
  - [x] Test initialization with saved focus path from preferences
  - [x] Verify focus is added to recents history during initialization
  - [x] Verify no duplicate history entries are created
  - [x] Test that preferences subscription still works (line 136-138)
  - [x] Verify all direct setters have been found and updated (grep verification)
- **Status**: ✅ Implemented. Removed redundant direct `s.w_ancestry_focus.set()` call from `Preferences.ts` line 116. The `becomeFocus()` call on line 134 now handles focus setting and history management. Tests created in `src/lib/ts/tests/UX_direct_setters.test.ts`.

### 5. Handle initialization

- Ensure `si_recents` has at least one entry (root ancestry) before subscriptions are set up
- Or initialize `w_ancestry_focus` directly during startup, then sync to `si_recents`
- **Files impacted**: `UX.ts` (setup_subscriptions), `Preferences.ts` (restore_focus), `Hierarchy.ts` (wrapUp_data_forUX, restore_fromPreferences), `DB_Common.ts` (hierarchy_setup_fetch_andBuild)
- **Risk**: **Low**. Initialization sequence is: `restore_focus()` → `becomeFocus()` → adds to `si_recents` → then `setup_subscriptions()` is called. The subscription handler (`update_focus_from_recents()`) already handles empty `si_recents` with fallback to existing focus or root. Main risk is if `restore_focus()` doesn't call `becomeFocus()` (when `ancestryToFocus` is null), leaving `si_recents` empty when subscription is set up.
- **Mitigation**: 
  - Add assertion in `setup_subscriptions()` that `si_recents.length > 0` after `restore_focus()` completes
  - Ensure `restore_focus()` always seeds `si_recents` even if `ancestryToFocus` is null (use `h.rootAncestry`)
  - The existing fallback in `update_focus_from_recents()` (line 64) already handles empty case gracefully
  - Verify initialization order: `restore_focus()` must complete before `setup_subscriptions()` is called
- **Verification tests**:
  - [x] Test that `si_recents` has at least one entry after `restore_focus()` completes
  - [x] Test that `setup_subscriptions()` doesn't crash when `si_recents` is empty (should use fallback)
  - [x] Test initialization sequence: `restore_focus()` → `becomeFocus()` → `si_recents` populated → `setup_subscriptions()`
  - [x] Test case where `ancestryToFocus` is null in `restore_focus()` - should still seed recents
  - [x] Verify subscription handler handles empty `si_recents` gracefully
  - [x] Test that `w_ancestry_focus` is set correctly after initialization
  - [x] Test initialization in both code paths: `Hierarchy.wrapUp_data_forUX()` and `DB_Common.hierarchy_setup_fetch_andBuild()`
- **Status**: ✅ Implemented. Added assertion in `setup_subscriptions()` to verify `si_recents.length > 0`. Updated `restore_focus()` to always seed `si_recents` with `rootAncestry` even if `ancestryToFocus` is null. Tests created in `src/lib/ts/tests/UX_initialization.test.ts`.

### 6. Testing

- Verify breadcrumb navigation updates focus correctly
- Verify `becomeFocus()` adds to history and updates focus
- Verify next/previous buttons sync focus with history index
- Verify all reactive subscriptions to `w_ancestry_focus` still work
- **Risk**: **Low to Medium**. May miss edge cases like rapid successive focus changes, empty history scenarios, or concurrent updates. Reactive subscriptions in Svelte components may behave differently if store updates are asynchronous. Must test all code paths that read `w_ancestry_focus`. However, Svelte subscriptions are synchronous, so timing issues are minimal. Main risk is missing edge cases in integration scenarios.
- **Mitigation**: 
  - Add comprehensive integration tests covering all user interaction patterns
  - Test rapid successive focus changes to ensure no race conditions
  - Test empty history scenarios to verify fallback behavior
  - Test mode switching (ancestry/history) while navigating
  - Test history truncation and navigation edge cases
  - Verify all reactive subscriptions fire correctly (Widget.svelte, D_Selection.svelte, Widget_Title.svelte, Radial_Rings.svelte, Widget_Drag.svelte, Tree_Graph.svelte, Radial_Graph.svelte, Graph.svelte)
  - Use temporary debug logging around `si_recents.index`, `si_recents.item`, and `w_ancestry_focus` to verify they stay in lockstep
- **Files impacted**: 
  - `src/lib/ts/tests/UX_integration.test.ts` (new test file)
  - All Svelte components that reactively use `w_ancestry_focus`:
    - `src/lib/svelte/widget/Widget.svelte`
    - `src/lib/svelte/details/D_Selection.svelte`
    - `src/lib/svelte/widget/Widget_Title.svelte`
    - `src/lib/svelte/radial/Radial_Rings.svelte`
    - `src/lib/svelte/widget/Widget_Drag.svelte`
    - `src/lib/svelte/tree/Tree_Graph.svelte`
    - `src/lib/svelte/radial/Radial_Graph.svelte`
    - `src/lib/svelte/main/Graph.svelte`
  - `src/lib/svelte/controls/Breadcrumbs.svelte` (breadcrumb rendering)
  - `src/lib/svelte/mouse/Breadcrumb_Button.svelte` (breadcrumb clicks)
  - `src/lib/svelte/mouse/Next_Previous.svelte` (next/previous navigation)
- **Verification tests**:
  - [x] Test breadcrumb button click updates focus correctly
  - [x] Test next/previous navigation syncs focus with recents index
  - [x] Test rapid successive focus changes
  - [x] Test empty history scenarios
  - [x] Test sync between si_recents.index and w_ancestry_focus
  - [x] Test ancestry_forDetails updates when focus changes
  - [x] Test history truncation handling
  - [x] Test subscription handler updates focus from recents
  - [x] Test mode switching between ancestry and history
  - [x] Test reactive subscriptions to w_ancestry_focus fire correctly
  - [x] Test navigation followed by breadcrumb click
  - [x] Test concurrent updates
- **Manual testing**:
  - [ ] Verify all call sites of `becomeFocus()` still work (Events.ts, Hierarchy.ts, Breadcrumb_Button.svelte, etc.)
  - [ ] Test keyboard shortcuts `[` and `]` still work (Events.ts)
  - [ ] Test recents button clicks still work (Primary_Controls.svelte)
  - [ ] Verify all Svelte components update correctly when focus changes
  - [ ] Verify breadcrumb UI updates in both ancestry and history modes
  - [ ] Verify next/previous buttons work correctly in history mode
- **Status**: ✅ Implemented. Created comprehensive integration test suite in `src/lib/ts/tests/UX_integration.test.ts` with 12 test cases covering all major interaction patterns and edge cases.

## Step 2: Move w_ancestry_focus

Move `w_ancestry_focus` from `Stores` into `UX` as a writable focus store owned by `S_UX`, with a thin forwarding getter on `Stores` for compatibility.

### Risk

**Breaking Svelte reactivity**: If the forwarding getter on `Stores` doesn't properly expose the writable store, Svelte components using `$s.w_ancestry_focus` may lose reactivity. The forwarding pattern must maintain the writable store interface.  
**Mitigation**: Keep `w_ancestry_focus` as a real `Writable<Ancestry>` on `UX` and have `Stores` return `x.w_ancestry_focus` directly (no wrappers). In Svelte, continue to destructure `const { w_ancestry_focus } = s;` so `$w_ancestry_focus` still works.

**Circular dependency risk**: `UX` imports from `Stores` (via `s`), and `Stores` would need to forward to `UX`. This creates a circular dependency that must be carefully managed, possibly requiring a lazy getter or initialization pattern.  
**Mitigation**: Move the focus store wiring into a small, dedicated module (e.g., `Focus.ts`) that both `Stores` and `UX` import from, or have `Stores` depend on `UX` but not vice‑versa (replace direct `s.w_ancestry_focus` reads inside `UX` with `x.w_ancestry_focus`). Use TypeScript's module graph to verify dependencies are acyclic.

**Subscription breakage**: 16 TypeScript files subscribe to or read `s.w_ancestry_focus`. All subscriptions must be updated to use `x.w_ancestry_focus` or the forwarding getter must be implemented before the store is moved.  
**Mitigation**: Perform the move in two phases: (1) introduce `x.w_ancestry_focus` and have `Stores` forward to it while keeping the old field, (2) update all call sites to import from `x` (or the new focus module), then finally remove the old `Stores` field. Run the TypeScript compiler after each phase to catch any missed locations.

**Missing migration locations**: With 36 total files impacted (16 TS, 8 Svelte, 12 docs), there's risk of missing some usages. TypeScript compiler errors will catch most, but edge cases in reactive statements or dynamic access might be missed.  
**Mitigation**: Use `grep`/TS‑server search on both `w_ancestry_focus` and `$w_ancestry_focus`, and temporarily mark the old symbol as deprecated or renamed so any remaining references show up as errors. For docs, search in `notes/` and update manually as part of the same PR.

**Type compatibility**: The forwarding getter must return the exact same `Writable<Ancestry>` type to maintain type safety and prevent downstream type errors.  
**Mitigation**: Define the store's type once (e.g., `type FocusStore = Writable<Ancestry>;`) and use it for both `UX` and `Stores` declarations. Add a small compile‑time check function that only accepts a `Writable<Ancestry>` to ensure the forwarded value matches the expected type.

### Impacted Files

**Runtime/TS files**:
- [ ] `UX.ts`
- [ ] `Stores.ts`
- [ ] `Ancestry.ts`
- [ ] `G_Cluster.ts`
- [ ] `Radial.ts`
- [ ] `S_Rotation.ts`
- [ ] `Styles.ts`
- [ ] `Events.ts`
- [ ] `Preferences.ts`
- [ ] `Utilities.ts`
- [ ] `Signals.ts`
- [ ] `Thing.ts`
- [ ] `Hierarchy.ts`
- [ ] `G_TreeGraph.ts`
- [ ] `G_RadialGraph.ts`
- [ ] `DB_Bubble.ts`

**Svelte components**:
- [ ] `Widget.svelte`
- [ ] `D_Selection.svelte`
- [ ] `Widget_Title.svelte`
- [ ] `Radial_Rings.svelte`
- [ ] `Widget_Drag.svelte`
- [ ] `Tree_Graph.svelte`
- [ ] `Radial_Graph.svelte`
- [ ] `Graph.svelte`

**Notes/docs**:
- [ ] `breadcrumbs.md`
- [ ] `styles-manager.md`
- [x] `slim/SlimStores.ts`
- [ ] `stores.md`
- [ ] `hover.widget.md`
- [ ] `Resize_Optimization_AI.md`
- [ ] `project guide.md`
- [x] `Widget_Title.svelte` (2025 archive)
- [ ] `Radial_Focus.svelte`
- [x] `DB_Bubble.abandoned.ts`
- [x] `DB_Bubble.ts` (2025 archive)
- [ ] `Canvas_Graph.svelte`
