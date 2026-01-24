# Timers

Mouse timing logic centralized in Hits manager. Components declare intent ("I need autorepeat"), manager handles lifecycle. State survives re-renders because it lives on the target, not the component.

## Table of Contents
- [Overview](#overview)
  - [Before: Distributed Timing](#before-distributed-timing)
  - [After: Centralized Timing](#after-centralized-timing)
  - [Core Principles](#core-principles)
- [T_Mouse_Detection Enum](#t_mouse_detection-enum)
- [State Management](#state-management)
- [Event Flow](#event-flow)
  - [handle_click_at Flow](#handle_click_at-flow)
  - [Cleanup on Hover-Leave](#cleanup-on-hover-leave)
- [Timing Types](#timing-types)
  - [Autorepeat](#autorepeat)
  - [Long-Click](#long-click)
  - [Double-Click](#double-click)
  - [Click Counting](#click-counting)
- [Component Migration Notes](#component-migration-notes)
  - [Glow_Button.svelte](#glow_buttonsvelte--low-risk-)
  - [Button.svelte](#buttonsvelte--medium-risk-)
  - [Next_Previous.svelte](#next_previoussvelte--medium-high-risk-)
  - [D_Actions.svelte](#d_actionssvelte--high-risk-)
- [Testing](#testing)
  - [Autorepeat](#autorepeat-1)
  - [Double-Click](#double-click-1)
  - [Long-Click](#long-click-1)
- [Risks & Mitigation](#risks--mitigation)
- [Session Notes](#session-notes)
  - [Button Styling Fixes](#button-styling-fixes)
  - [Close Button Hit Testing](#close-button-hit-testing-unresolved)
  - [Documentation Patterns](#documentation-patterns)

---

## Overview

### Before: Distributed Timing
```
Component → Own Timer → Manual Start/Stop → Component State
```
- Each component manages its own timer lifecycle
- State lives in component (lost on re-render)
- Duplicated logic across components
- Manual hover-leave handling per component

### After: Centralized Timing
```
Component → Declares Intent → Central Manager → Automatic Lifecycle
```
- Single manager owns all timers
- State persists on shared target (survives re-render)
- Logic centralized in one place
- Automatic hover-leave cleanup

### Core Principles

1. **Declaration Over Management** — Components set properties (`mouse_detection`, `*_callback`), manager handles timing automatically
2. **State Persistence** — Timing state lives on target (`autorepeat_event`, `autorepeat_isFirstCall`, `clicks`), not component
3. **Enum-Based Configuration** — Single enum replaces multiple boolean flags, enforces mutual exclusivity
4. **Automatic Lifecycle** — Mouse down starts timers, mouse up/hover-leave cancels them
5. **Single Source of Truth** — One manager, one timer per timing type

---

## T_Mouse_Detection Enum

The `T_Mouse_Detection` enum (in `Enumerations.ts`) uses bit flags:

```ts
export enum T_Mouse_Detection {
    autorepeat = 4,  // Mutually exclusive with others
    doubleLong = 3,  // double | long (can combine these two)
    double     = 1,
    long       = 2,
    none       = 0,
}
```

`S_Hit_Target` uses a single `mouse_detection` property:

```ts
// S_Hit_Target.ts
mouse_detection: T_Mouse_Detection = T_Mouse_Detection.none;
longClick_callback?: (s_mouse: S_Mouse) => void;
doubleClick_callback?: (s_mouse: S_Mouse) => void;
clicks: number = 0;

// Getters for Hits logic
get detects_autorepeat(): boolean { return this.mouse_detection === T_Mouse_Detection.autorepeat; }
get detects_longClick(): boolean { return (this.mouse_detection & T_Mouse_Detection.long) !== 0; }
get detects_doubleClick(): boolean { return (this.mouse_detection & T_Mouse_Detection.double) !== 0; }
```

Components pass `mouse_detection={T_Mouse_Detection.autorepeat}` instead of `detect_autorepeat={true}`.

---

## State Management

`Hits` manages centralized timing with:

| Store/Property | Purpose |
|----------------|---------|
| `w_autorepeat` | Target currently autorepeating |
| `w_longClick` | Target waiting for long-click |
| `autorepeat_timer` | Single `Mouse_Timer` for autorepeat |
| `click_timer` | Single `Mouse_Timer` for long-click and double-click |
| `pending_singleClick_target` | Target with deferred single-click (double-click detection) |
| `pending_singleClick_event` | MouseEvent for deferred single-click |
| `longClick_fired` | Flag to suppress mouse-up after long-click |
| `doubleClick_fired` | Flag to suppress mouse-up after double-click timer expires |

---

## Event Flow

### handle_click_at Flow

**On mouse down:**
- Increment `target.clicks`
- If `target.detects_longClick` → start long-click timer, store pending target/event
- If `target.detects_doubleClick`:
  - If second click within threshold → fire `doubleClick_callback`, cancel timer
  - If first click → start double-click timer, defer single-click
- If `target.detects_autorepeat` → start autorepeat
- If no special detection → fire `handle_s_mouse` immediately

**On mouse up:**
- Cancel long-click timer
- Stop autorepeat
- Reset `target.clicks`
- If long-click already fired or double-click timer already fired → suppress regular click
- Otherwise → fire `handle_s_mouse`

**When long-click timer fires:**
- Fire `longClick_callback` with `S_Mouse.long(...)`
- Set `longClick_fired` flag to suppress subsequent mouse-up

**When double-click timer expires:**
- User didn't click again → fire deferred single-click callback
- Reset `target.clicks`
- Set `doubleClick_fired` flag to suppress subsequent mouse-up click

### Cleanup on Hover-Leave

In `detect_hovering_at`, cancel pending timers if mouse leaves the target:
- If hover leaves the autorepeating target → stop autorepeat
- If hover leaves the long-click target → cancel long-click timer
- If hover leaves the pending double-click target → cancel double-click timer

---

## Timing Types

### Autorepeat

Buttons repeatedly fire their action while held down.

**Originally per-component:**
1. Each component got its own `Mouse_Timer` via `e.mouse_timer_forName(name)`
2. On `s_mouse.isDown`, called `mouse_timer.autorepeat_start(id, callback)`
3. On `s_mouse.isUp` or hover leave, called `mouse_timer.autorepeat_stop()`
4. Visual feedback via `mouse_timer.isAutorepeating_forID(id)`

**Now centralized in Hits:**
1. `Hits` owns `autorepeat_timer` plus `w_autorepeat` store
2. Components set properties on `S_Hit_Target`:
   - `mouse_detection = T_Mouse_Detection.autorepeat`
   - `autorepeat_callback?: () => void`
   - `autorepeat_id?: number`
   - `autorepeat_event?: MouseEvent` (persists across component recreation)
   - `autorepeat_isFirstCall: boolean`
3. Hits starts/stops autorepeat on mouse down/up
4. Visual feedback from `w_autorepeat` store

**Components using autorepeat:**

| Component | Pattern | Notes |
|-----------|---------|-------|
| `Glow_Button.svelte` | `mouse_detection={T_Mouse_Detection.autorepeat}` | ✅ Migrated |
| `Button.svelte` | `mouse_detection` prop | ✅ Migrated |
| `Next_Previous.svelte` | Always enabled | ✅ Migrated; each button has its own `S_Element` |
| `D_Actions.svelte` | `mouse_detection={T_Mouse_Detection.autorepeat}` | ✅ Migrated |
| `Steppers.svelte` | `mouse_detection={T_Mouse_Detection.autorepeat}` | ✅ Migrated |

### Long-Click

Fires after ~500ms threshold, suppresses subsequent mouse-up click. Centralized in `Hits` with `w_longClick` store, using `click_timer`.

### Double-Click

Defers single-click ~200ms, fires double-click on second click within threshold. Centralized in `Hits` using `click_timer`.

### Click Counting

Moved from `S_Mouse.clicks` (deprecated) to `S_Hit_Target.clicks`. Centralized in `Hits` — increments on down, resets on up or double-click.

---

## Component Migration Notes

### Glow_Button.svelte — Low Risk ✅

**Migration:**
- Removed `Mouse_Timer` instance
- Removed autorepeat start/stop calls
- Removed hover leave reactive statement
- Set `s_element.detect_autorepeat`, `autorepeat_callback`, `autorepeat_id` in `onMount`
- Updated CSS class to use `w_autorepeat` store

**Result:** ~20 lines of autorepeat logic → 4 lines of property setup

### Button.svelte — Medium Risk ✅

**Complexity:**
- Supports `autorepeat`, `long`, `double`, `doubleLong`
- Uses `S_Mouse.repeat()` vs `S_Mouse.down()` distinction
- Exposes `handle_s_mouse` prop, wraps in `intercept_handle_s_mouse`

**Migration:**
- Removed autorepeat start/stop calls
- Autorepeat callback uses `autorepeat_isFirstCall` flag to distinguish initial vs repeat
- Captures mouse event on down for autorepeat callbacks
- LongClick handling remains component-managed

### Next_Previous.svelte — Medium-High Risk ✅

**Challenge:** Multiple buttons (array) previously shared one `Mouse_Timer`

**Migration:**
- Each button gets its own `S_Element` hit target
- `s_element.handle_s_mouse` set per index
- Each button can autorepeat independently

### D_Actions.svelte — High Risk ✅

**Challenge:** Conditional autorepeat — only `T_Action.browse` and `T_Action.move` support it

**Migration:**
- All actions now autorepeat
- Callback logic handles action-specific behavior

---

## Testing

### Autorepeat

1. **Basic autorepeat across re-render**
   - [x] Open actions panel, press and **hold** a browse action
   - [x] Verify: fires immediately, repeats after delay, stops on release
   - [x] **Re-render test**: Selection changes cause UI re-render, autorepeat continues

2. **Hover-leave cancels autorepeat**
   - [x] Press and hold, drag mouse off button
   - [x] Verify: autorepeat stops immediately

3. **Steppers autorepeat**
   - [x] Click build button, hold stepper triangle
   - [x] Verify: value increments/decrements repeatedly

### Double-Click

4. **Double-click fires on second click**
   - [ ] Find button with `T_Mouse_Detection.double`
   - [ ] Click twice quickly (~300ms)
   - [ ] Verify: double-click callback fires, single-click does not

5. **Single-click deferred then fires**
   - [ ] Click once, wait for threshold
   - [ ] Verify: single-click fires after delay

6. **Hover-leave cancels pending double-click**
   - [ ] Click once, move mouse off button
   - [ ] Verify: pending single-click cancelled

### Long-Click

7. **Long-click fires after threshold**
   - [ ] Find button with `T_Mouse_Detection.long`
   - [ ] Press and hold past ~500ms
   - [ ] Verify: long-click callback fires

8. **Long-click suppresses regular click**
   - [ ] After long-click fires, release mouse
   - [ ] Verify: no additional click action

9. **Early release prevents long-click**
   - [ ] Press, release before threshold
   - [ ] Verify: normal click fires, not long-click

10. **Hover-leave cancels long-click timer**
    - [ ] Press and hold, drag off before threshold
    - [ ] Verify: long-click does not fire

---

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Long-click cancels single-click | Set `longClick_fired` flag, check in mouse-up handler |
| Double-click delays single-click | Opt-in per target; document tradeoff |
| Click counting conflicts | Migrate all to `S_Hit_Target.clicks`; deprecate `S_Mouse.clicks` |
| Timer conflicts | Each timer tracks its target; cancel on target change |
| Hover-leave edge cases | Cancel pending timers in `detect_hovering_at` |
| Autorepeat incompatible with long/double | Enforced via `T_Mouse_Detection` enum |

---

## Session Notes

Historical notes from the timing centralization work.

### Button Styling Fixes

**Problem:** Control buttons had incorrect fill colors (transparent instead of white).

**Solution:**
1. Set `color_background` on `S_Element` instances in `Elements.s_control_forType()`
2. Modified `S_Element.ts`: `fill` getter uses `color_background` as fallback

**Files:** `Elements.ts`, `S_Element.ts`

### Close Button Hit Testing (Unresolved)

**Problem:** Close search button only responded in tiny area at top-left corner.

**Attempted:** `display: block`, `tick()`, bypassing `set_html_element()`, duplicate entry prevention.

**Status:** Reverted. Root cause unclear — may be stale RBush entries or timing of rect updates.

### Documentation Patterns

#### Refactoring Guide Pattern
Create `notes/design/refactoring-guide.md` with principles and process, then add example section.

#### Geometry Documentation Pattern  
Before refactoring, document existing system's responsibilities, invocation patterns, and actors.

#### Layout Guide Pattern
Create guide with Analysis Questions, Design Questions, Simplification Opportunities, Performance Opportunities, Summary.

#### Markdown Anchor Pattern
1. Promote important bullets to subheaders for stable anchors
2. Write `**Problem**` / `**Goal**` bullets inline near context
3. Create `## Summary` with `### Problems` and `### Goals`
4. Group by originating section with links back
