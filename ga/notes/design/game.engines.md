- [x] i want to understand the development options for my game
- [x] i do not need realism or 3D
- [x] i want it to be
	- [x] easy for you to configure and build onto
	- [x] extremely performant
	- [x] web based
	- [x] excellent for desktop, adaptable for mobile

i need a game engine Claude can build on quickly — fast iteration, clean code, performant result. Clickable map, a few mini-game booths, a regard counter that sticks around, a shared needs list. Browser-native.

---

## The Contenders

### [Phaser 3](https://phaser.io) (official Svelte template)

The pro pick. Everything the carnival needs is baked in — scenes for booth transitions, input handling for the map, tweens for juice. Official Svelte template with a communication bridge for the surrounding UI (regard counter, needs list live in Svelte, game lives in Phaser).

v3 is rock-solid (v3.87). v4 is in RC but just a TypeScript rewrite of v3, same concepts. Unmatched docs, massive community, every question already answered somewhere.

**[Phaser Editor](https://phasereditor2d.com):** visual drag-and-drop scene layout, asset placement, real-time property editing. Desktop app or browser-based. Outputs real Phaser code (JS/TypeScript), not a proprietary format. Free tier (200-file cap), $4/mo subscription, or $75 lifetime (currently closed). Supports Phaser v3.80+.

**The catch:** ~1.2MB. The learning curve is real, but the editor softens it — you can visually place and tweak things without writing positioning code. The payoff is a game that works and grows.

**Svelte fit:** official template exists (`phaserjs/template-svelte`), Vite, hot-reload, bridge between Svelte and Phaser canvas.

---

### p5.js (possibly + p5play)

Low-ceremony creative coding library. Born from Processing. `setup()` and `draw()` — minimal concepts before first result. Built-in `storeItem()`/`getItem()` for persistence. Massive educational community.

p5play adds physics (planck.js), sprites, collision detection on top.

**The catch:** not a game engine. No scene management, no asset loading pipeline, no spritesheets. Claude would be building infrastructure from scratch as the project grows. Less structure means more guesswork for the co-builder.

**Svelte fit:** instance mode embeds fine in Svelte components. No official template.

---

### Kaplay (successor to Kaboom.js)

Middle ground. Community fork after Replit abandoned Kaboom. API reads like pseudocode: `add([sprite("bean"), pos(100, 200)])`. Scenes, collision, sprites — more game-aware than p5, lighter than Phaser.

**The catch:** younger ecosystem. Kaboom's abandonment is a cautionary tale. Less documentation depth. No official Svelte template.

---

## Honorable Mentions

| Engine | Why it's interesting | Why not |
|---|---|---|
| **PixiJS** | Fastest 2D renderer (v8.16, WebGPU). Beautiful scene graph | No game features — you build everything yourself |
| **Konva** | Perfect for interactive maps (clickable polygons, hover states) | Wrong tool for mini-games. No game loop |
| **Godot** | Visual scene editor is great for visual thinkers | Not web-native. WASM export is clunky. Svelte integration is painful |
| **GDevelop** | No-code, visual events, lowest floor | Can't integrate with a Svelte app. Claude can't co-build easily |
| **Excalibur** | TypeScript-first, clean API | Pre-1.0, smaller community |
| **Paper.js** | Vector art on canvas | Uncertain maintenance, no game features |

---

## Persistence (all of them)

Every option uses the same strategy:

- **localStorage** for the regard counter. Trivial. Survives browser restarts. Perfect for a prototype.
- **Shared needs list** is the question mark — if "shared" means across users, that pushes toward a simple backend (Supabase table, JSON endpoint). Design question, not framework question.

---

## Summary Grid

| | Claude can build on it | Map | Mini-Games | Svelte Fit | Performance |
|---|---|---|---|---|---|
| **Phaser** | Best — structured, documented | Great | Excellent | Official template | WebGL, good |
| **p5.js + p5play** | Weak — builds infrastructure from scratch | Hand-rolled | Very good | Instance mode | Canvas 2D, lower ceiling |
| **Kaplay** | Decent — less community knowledge | Good | Good | Manual setup | WebGL, good |
| **PixiJS** | Hard — no game features included | Excellent | DIY | Exists | Fastest |
| **Konva** | Map only | Excellent | Wrong tool | Good | Canvas 2D |

---

## My read

Given the requirements — easy for Claude to configure and build onto, extremely performant, web-based, desktop-first with mobile adaptability:

1. **Phaser** — strongest fit. Claude knows it well, infrastructure is there, WebGL performance, official Svelte template, responsive scaling built in. Most structured, most documented, fastest to iterate on.

2. **Kaplay** — lighter API, good performance. Riskier long-term (young ecosystem). Less community knowledge for Claude to draw from.

3. **p5.js + p5play** — low ceremony, but weaker on performance and mobile. Claude builds more infrastructure from scratch, which slows iteration.

Phaser wins on the requirements as stated.

---

## Proposal: use Phaser

- **Engine:** Phaser 3 with the official Svelte template
- **Editor:** Phaser Editor (free tier, 200-file cap is fine for a prototype)
- **Division of labor:** Jonathan uses the editor to visually place and tweak scenes. Claude writes game logic, wires up interactions, builds the Svelte UI around it (regard counter, needs list). Both work on the same codebase — the editor outputs code Claude can read and extend.
- **Stack:** Phaser 3 + SvelteKit + Vite. Game canvas lives inside Svelte. Persistence via localStorage. Shared needs list TBD (localStorage for now, backend later if needed).
