# Phaser Editor integration

## Install

1. Download Phaser Editor v4 from [phaser.io/editor](https://phaser.io/editor) (ARM Mac version)
2. Drag to Applications
3. Free tier: all features, 200-file cap. Fine for this prototype.

## Open the project

1. Launch Phaser Editor
2. Open folder: `~/GitHub/mono/ga`
3. The editor reads `phasereditor2d.config.json` for config
4. Run `yarn dev` in a terminal — the editor's Play button opens `http://localhost:5173`

## How scene files work

Phaser Editor uses paired files per scene:

- `MapScene.scene` — JSON layout (positions, colors, sizes, text). The editor reads and writes this.
- `MapScene.ts` — TypeScript code. The editor compiles the `.scene` into an `editorCreate()` method inside the `.ts` file, wrapped in `/* START OF COMPILED CODE */` / `/* END OF COMPILED CODE */` markers.

Your hand-written game logic goes in sections marked `/* START-USER-CODE */` / `/* END-USER-CODE */`. The editor preserves these on recompile.

## Current scenes

Our scenes are currently pure code — no `.scene` files. Two paths forward:

### Path A: Convert scenes to editor format
Rebuild the scene layouts in the visual editor. Game logic (event handlers, tweens, state) stays in the user code sections. This gives Jonathan full visual control over layout.

### Path B: Keep code scenes, use editor for new scenes
Leave the 4 existing scenes as code. Use the editor only for new scenes going forward. Less work now, less visual control over existing scenes.

**Recommendation:** Path A for MapScene (the one Jonathan will tweak most). Path B for booth scenes (gameplay logic dominates layout).

## Workflow

### Jonathan
- Opens project in Phaser Editor
- Drags objects around, changes colors, tweaks text
- Saves → editor writes `.scene` JSON and recompiles the `.ts` file
- Browser hot-reloads via Vite

### Claude
- Reads the `.ts` file, writes game logic in the user code sections
- Never touches the compiled code block or the `.scene` JSON
- Can read the `.scene` JSON to understand layout if needed

## What's next

- [ ] Jonathan: download and install Phaser Editor
- [ ] Together: convert MapScene to editor format (Path A)
- [ ] Verify: Jonathan moves a tent in the editor, sees it move in the browser
