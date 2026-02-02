# Resume

**February 1, 2026**

## Current

Hub improvements:
- [x] Title buttons (hosts, docs, relay, tests) now turn green while working and disable all four
- [x] Status dot repositioned to top-left corner of "Mono" title, behind text
- [x] Deploy status now skips canceled builds, shows last successful/failed deploy instead
- [x] Badge styling updated (grey background, black text)

Vitepress:
- [x] Fixed dead link `./handoff` in ws/notes/work/index.md — build passes

---

**January 28, 2026 (early afternoon)**

## Previous

- [x] shift-click one of the multiply selected, deselects all
- [x] deselect all -> NOT select root (confusing)
- [x] click on a breadcrumb to the left of the focus -> **change** the focus AND the level
- [x] radial mode -> changing the focus -> **selects** the focus
- [x] click on background -> deselect all
- [x] rubber band not working

---
## Done

- [x] Fixed Netlify deployment (base path ws not projects/ws)
- [x] Added `define: { global: 'globalThis' }` to vite.config.js for Firebase
- [x] Removed unused packages: neo4j, pg, sveltekit, skeleton, tailwind, typedoc-plugin-markdown, vite-plugin-singlefile, rollup
- [x] Removed SvelteKit block from svelte.config.js
- [x] Deleted tailwind.config.ts
- [x] Zero yarn warnings achieved
- [x] Moved notes/architecture → notes/guides/architecture
- [x] Moved notes/collaborate → notes/guides/collaborate
- [x] Updated .vitepress/config.mts sidebar links
- [x] Removed notes/tools/ (config just restated defaults)
- [x] Fixed dead links in project.md (preferences.md, search.md)

---
## Future

- [ ] add dot to breadcrumb -> focus
- [ ] API -> change in root
- [ ] API -> edits made in Catalist
- [ ] show recents count and index -> primary controls
- [ ] instead of reveal dot's big inner dot, enlarge stroke to indicate "hidden children here"
- [ ] implement keep graph centered on selection
- [ ] test whether two-finger no longer moves graph
- [ ] while editing A, select a range, click B, click A, RETURN should reselect the range 
