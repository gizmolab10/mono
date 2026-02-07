# Civilization 2.0 Game — Work Log

**Date:** February 5, 2026
**Participants:** Jonathan Sand, Claude (Anthropic)

**Challenge:** Can Claude build the game under Jonathan's supervision?

## Next Steps

- [x] Jonathan to review this summary
- [x] Claude to begin building minimal carnival prototype
- [x] research [[game.engines]]
- [x] create work plan in [[phaser.start]]
- [x] Phases 1–6 complete (scaffold → map → booths → polish → colors → pentagons)
- [ ] Phase 7: Phaser Editor integration (Jonathan installs editor)
- [ ] Phase 8: deduplicate scene boilerplate — see [[phaser.start]]
- [ ] Iterate based on Jonathan's reactions

---
### Proposed Minimal First Version

1. A map (clickable regions)
2. 2-3 booths with simple regard-earning mini-games
3. A regard counter that persists
4. A needs list (simple, shared)

Goal: something to _feel_ and react to, then iterate toward guilds, opinions, homes.

---
### Reflections on working with Phaser

**What worked well:**
- Graphics API is the right tool for custom shapes. Polygon game objects fight you on origin and centering. Graphics + manual hit areas = full control.
- Camera fades are dead simple and feel good at 150ms. Longer feels sluggish.
- The EventBridge pattern (typed emitter between Svelte and Phaser) kept the two worlds clean. No global state leaking across the boundary.
- Phaser's tween system is intuitive — hover feedback, title float, star twinkle all came together fast.

**What bit us:**
- Phaser's input system and display list ordering are entangled. Invisible Zones sound right for hit areas but get blocked by text objects sitting on top. Making the Graphics object itself interactive was the fix.
- Resize handling is tricky. Phaser doesn't re-layout — you restart the scene. That triggers fades, which triggers flicker, which needs a `skipFade` flag. Debounce at 50ms was the sweet spot.
- Polygon game objects position from the bounding box top-left, not the geometric center. `setOrigin(0.5)` doesn't fix it visually. We burned time on this before switching to Graphics.
- Color tuning is iterative and physical — can't shortcut it. Needed many rounds of "brighter... brighter... too much... back" with real eyes on the screen.

**What we'd do differently next time:**
- Start with Graphics API for any non-rectangular shapes. Skip Polygon entirely.
- Build the responsive layout from day one instead of bolting it on in P5.
- Keep the Phaser Editor in the loop earlier — visual tweaking in code is slow.
