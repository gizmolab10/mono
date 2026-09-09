---
description: lv — Tommy's Vineyard Space: sharing the work and fun of owning a vineyard, in descriptions and photos.
---
# lv

Tommy's Vineyard Space — a place to share the work and fun of owning a vineyard, representing it with descriptions and photos. Svelte site, deployed on Netlify. Structure emerges as needed; don't over-organize early.

**Current state:** since 9 September 2026 lv imports gallery — the page shell, the sidebar, the renderer, the galleries, the editing, the router, the parser, what the browser remembers, and both stylesheets — through the `gallery` alias and `common/Gallery.ts`, the way it imports core through `common/Core.ts`. lv's own code is App.svelte, Main.ts, the two bridges and `Customizations.ts`, which holds the three switches gallery reads: the home page is Little Cloud Vineyard, remembered values are saved under `lv.`, the sidebar is off. Main.ts hands them to gallery before anything mounts. The plugins run from gallery's folder, named in vite.config.ts. The four netlify functions are lv's own and import stamp and Order from gallery. Its pages, pictures and icon are its own. Check clean at 398 files, 4 tests, build 386 modules. Open: which remote hosted storage, if the pictures outgrow the repo.

Its whole code was copied on 1 September 2026 into [gallery](../gallery/index.md), which is now the library lv imports.

## Truths

- [structure.md](truth/structure.md) — what lv takes from core and from gallery, what is lv's alone, and how its files are named.
- [decisions.md](truth/decisions.md) — live rationales, and the pac responses weighing coming choices.
- [gallery.md](truth/gallery.md) — how pictures and captions currently work.
- [lexicon.md](truth/lexicon.md) — lv's terms, defined once.
- [working features.md](truth/working%20features.md) — what the site does today, and what each thing cannot do.
- [map of lv files.md](truth/map%20of%20lv%20files.md) — every source file in lv; read it instead of discovering files using regex and wildcards.
