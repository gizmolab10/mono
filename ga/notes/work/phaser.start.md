
# Project Description

- **Engine:** Phaser 3 with the official Svelte template
- **Editor:** Phaser Editor (free tier, 200-file cap is fine for a prototype)
- **Division of labor:** Jonathan uses the editor to visually place and tweak scenes. Claude writes game logic, wires up interactions, builds the Svelte UI around it (regard counter, needs list). Both work on the same codebase — the editor outputs code Claude can read and extend.
- **Stack:** Phaser 3 + Svelte 5 + Vite. Game canvas lives inside Svelte. Persistence via localStorage. Shared needs list TBD (localStorage for now, backend later if needed).

---

# Work Plan

## What we're keeping

Two stores from the existing app:

- `src/lib/stores/regard.ts` — localStorage-backed regard counter with `earn()` and `reset()`
- `src/lib/stores/needs.ts` — localStorage-backed needs list with `vote()` and `add()`

Everything else gets replaced.

---

## Phase 1: Fresh scaffold

**Goal:** clean Phaser + Svelte app running in the browser. Phaser canvas fills the screen. Svelte provides a minimal UI overlay (regard counter). Stores are wired up.

- [ ] remove old components (`App.svelte`, `CarnivalMap.svelte`, `RewardBar.svelte`, `booths/`)
- [ ] `yarn add phaser`
- [ ] create `src/lib/game/config.ts` — Phaser game config (type: AUTO, scale mode RESIZE, transparent or dark background)
- [ ] create `src/lib/game/scenes/BootScene.ts` — minimal scene that draws a colored shape to prove Phaser is running
- [ ] create `src/lib/game/PhaserGame.svelte` — mounts Phaser canvas, handles lifecycle (create on mount, destroy on unmount)
- [ ] create `src/lib/game/EventBridge.ts` — typed event emitter for Svelte↔Phaser communication
- [ ] new `App.svelte` — Phaser canvas + simple regard counter overlay (reads from `regard` store)
- [ ] verify: `yarn dev` shows Phaser canvas with the shape and the regard counter displayed over it

**Done when:** browser shows a Phaser canvas with a colored shape. Regard counter visible as a Svelte overlay. No old components remain (except the two stores).

---

## Phase 2: Carnival map

**Goal:** a Phaser scene with clickable booth regions. Clicking one emits an event through the bridge.

- [ ] create `src/lib/game/scenes/MapScene.ts` — renders 3 clickable zones (kindness, trust, needs) as colored shapes with labels
- [ ] hover feedback on zones (color shift, scale tween, cursor change)
- [ ] click emits booth ID through EventBridge → Svelte receives it
- [ ] Svelte transitions to booth view (for now, just a placeholder text showing which booth was selected + a back button)
- [ ] back button tells Phaser to return to MapScene
- [ ] verify: click a zone → see booth name → click back → see map

**Done when:** three clickable zones on the map, hover feedback, bidirectional navigation via the event bridge.

---

## Phase 3: First booth (Kindness Exchange)

**Goal:** one playable mini-game as a Phaser scene. Earning regard flows back to the Svelte store.

- [ ] create `src/lib/game/scenes/KindnessScene.ts` — Phaser scene for Kindness Exchange
- [ ] implement a simple mechanic (drag-and-drop, matching, or timed response — whatever feels right for "kindness")
- [ ] completing the mechanic calls `regard.earn()` via the event bridge
- [ ] scene transition: MapScene → KindnessScene (with fade or slide) → back to MapScene
- [ ] verify: play the game, earn regard, see the counter update. Navigate back to map.

**Done when:** one booth is playable end-to-end. Regard earned persists across browser reload.

---

## Phase 4: Remaining booths

**Goal:** all three booths are playable Phaser scenes.

- [ ] create `src/lib/game/scenes/TrustScene.ts` — Trust Circle mini-game
- [ ] create `src/lib/game/scenes/NeedsScene.ts` — Needs Spotter mini-game (integrates with `needs` store — surfaces needs, lets player vote or add)
- [ ] scene transitions for all three booths
- [ ] verify: all three booths playable, regard and needs persist, navigation clean

**Done when:** three distinct mini-games, all earning regard or interacting with needs. Full map → booth → map loop for each.

---

## Phase 5: Polish + responsive

**Goal:** the carnival feels like a place. Works at different window sizes.

- [ ] visual polish on MapScene — booth entrances look inviting, hover animations, maybe particles or ambient motion
- [ ] transition animations between scenes (fade, slide, etc.)
- [ ] regard counter UI polished (animated on earn, positioned well)
- [ ] test responsive scaling: resize window, game adapts. Test on narrow (mobile-ish) viewport
- [ ] test persistence: reload browser, regard and needs survive
- [ ] verify: looks and feels good at 1440px, 1024px, and 375px widths

**Done when:** the carnival has visual character. Responsive. Persistent. Feels like something worth reacting to.

---

## Phase 6: Color and contrast tuning ✅

**Goal:** all text readable against the dark background. Colors feel warm, not washed out.

- [x] bump instruction/hint text contrast across all scenes
- [x] bump secondary text (drop zones, progress) contrast
- [x] bump label/back button contrast
- [x] brighten booth titles on map
- [x] brighten purple text in NeedsScene
- [x] convert triangles -> pentagons
- [x] put the name inside the shape
- [x] responsive title clamping (Math.max so title stays visible at small sizes)
- [x] fix hover/click on labels (Graphics interactive instead of invisible Zone)
- [x] simplify MapScene — extract `pentagonPoints()`, `drawPent()`, hoist `SCENE_KEYS`

**Done when:** every piece of text is comfortably readable. Jonathan confirms.

---

## Phase 7: Phaser Editor integration

**Goal:** Jonathan can use Phaser Editor to visually place and tweak scene layouts.

- [x] add `phasereditor2d.config.json` (playUrl → localhost:5183)
- [x] document workflow in `notes/work/phaser.editor.md`
- [ ] Jonathan: download and install Phaser Editor (free tier)
- [ ] together: convert MapScene to editor format
- [ ] verify: Jonathan makes a visual change in the editor, it shows up in the running game

**Done when:** Jonathan can open the project in Phaser Editor, move things around, save, and see the change in the browser.

---

## Phase 8: Deduplicate scene boilerplate ✅

**Goal:** extract shared fade/resize/navigation code into utility functions.

- [x] create `Scene_Utilities.ts` — `setupFade()`, `setupResize()`, `fadeToScene()`
- [x] apply to all four scenes
- [x] rename files to underscore convention (`Map_Scene`, `Event_Bridge`, `Phaser_Game`, etc.)
- [x] manual tests pass

**Done when:** no duplicated fade/resize/cursor code across scenes. Game works identical to before.

---

## After this plan

The carnival prototype is running. Next steps from `revisit.ga.md`: iterate based on Jonathan's reactions. The guilds (Needs, Opinions, Regards, Dreams, Wisdom, Builders, Game Tools) come after the carnival feels right.
