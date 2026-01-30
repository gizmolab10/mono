# Resume

**January 28, 2026 (early afternoon)**

## Current

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
