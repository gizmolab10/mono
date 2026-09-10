---
kind: explain
title: "Incorporating a project"
description: "The steps a host follows to take panel in, as mu and mj did on 7 September 2026: what it takes, what it changes, how it proves the result."
tags: [now, howto]
date: 2026-09-07
---
# Incorporating a project

panel is the three regions together — the controls row, the details column, the operation view — drawn on core with nothing in them. A host incorporates panel by taking panel's files as its own and growing its own contents inside them. panel imports core; nothing of panel moves into core, and a host does not import panel. These are the steps, in order, each proved on mu and mj.

## Before

1. The host adopts core, per [adopting core](../../../core/truth/adopting%20core.md): the `core` alias in its tsconfig and vite config, `common/Core.ts` as the bridge, `main.ts` calling `configure_layers`, `configure_metrics` and `configure_inks` before mounting. Check it with `yarn run check` in the host before touching anything.
2. Read the host's `App.svelte` and note what it draws. That content goes into the operation view at step 6.

## Taking panel in

3. **The four components.** Take `App.svelte`, `Controls.svelte`, `Details.svelte` and `Operation.svelte` from `panel/src/lib/svelte/main/` as the host's own files, in the host's own svelte folder. Where the host's folder sits at a different depth — mj's is `svelte/`, not `svelte/main/` — the relative imports change: `../../ts/common/Core` becomes `../ts/common/Core`, and the three sibling imports stay `./Controls.svelte` and so on. Nothing else in the four changes.
4. **Core.ts.** Grow the host's `common/Core.ts` to panel's lines. Beyond the three every host already holds — Extensions, `c`, `k` — panel takes `Colors` and `colors`, `S_Mouse`, `Point`, `hit_target`, `hits`, `start_tips` and `w_tip`, `Hamburger` and `ToolTip`. Keep ov's order for the first four lines: Constants before Colors.
5. **Customizations.ts.** Set `name` to the host's own name. Controls reads it and centers it in the row.
6. **The stylesheet.** The host's `main.ts` imports `core/main.css` last, after the mount. mj lacked it; mu had it.
7. **The host's contents.** What the old `App.svelte` drew goes inside the operation view — into `Operation.svelte`'s region, below the `region content` div's opening tag — so the host still shows what it showed.

## Proving it

8. `yarn run check` in the host: clean.
9. `yarn run build` in the host: every module resolves. Then remove `dist/`.
10. The controls row shows the hamburger at the left and the host's name in the middle. The hamburger hides and shows the details column. The operation view shows the host's contents.

## Recording it

11. A `D:` line in the host's log naming the files taken, the Core.ts lines added, the path change if any, and the check and build counts.
12. The host's `index.md` current state says the host draws panel and where its contents sit.
13. A `D:` line in panel's log naming the host.

## Not covered

ov. ov's own four hold 980 lines that panel does not, and the way ov incorporates panel is an open proposal in [proposals](proposals.md). These steps are for a host whose `App.svelte` draws a line or nothing.

## Importing

Proposal, 8 September 2026 — core, panel and gallery each become a library a host imports, the way every host imports core today: an alias, a bridge, one line per thing taken. panel and gallery import core themselves. The steps above, which take panel by file, are then replaced by importing it.

gallery's half was built 9 September 2026: lv and mj import it, recorded under "lv and mj import gallery" in [proposals](../proposals.md). panel's half was built 10 September 2026: `Panel.svelte` is the page as a component, taking the name, whether the details column is shown with the toggle handed back, what goes in each region as snippets, and words for a status line. panel's own App.svelte is its smallest host, and gallery, mj and mu import it, each through its own `Panel.ts`. mu's and mj's own versions of the three region files are deleted, so the steps above are history: a host imports panel now, and takes nothing by file.

**Where each is today.** core is imported through the `core` alias by ov, lv, gallery, mj, mu and panel. panel is imported by nobody: mu and mj hold their own version of its four files. gallery is lv's whole code duplicated and renamed, with no alias in lv and nothing lv imports from it. panel and gallery both already import core.

**What changes in the library.** panel's `App.svelte` is an app, and an app cannot be imported. It becomes a component that draws the outer box, the controls row with its hamburger and name, the details column and the operation view, and takes from the host what to draw inside each region as snippets, the host's name as a prop, and whether details shows as a prop with the toggle handed back — state in the host, as core's rule says. panel's own `App.svelte` shrinks to the smallest host of that component, with nothing in the snippets. gallery is taken apart into the drag-and-drop pieces lv will import; which files those are is unread.

**What changes in a host.** Three lines per library — the alias in tsconfig's paths, in vite's resolve, and in a standalone vitest config where the host has one, exactly as for core. One bridge per library beside `common/Core.ts`, each line saying where the thing really lives; the one-bridge rule becomes one bridge per library, and ov's `core_alias.test.ts` becomes one test over every alias. mu and mj then delete their Controls, Details and Operation, and their `App.svelte` hands snippets to panel's component. lv deletes each piece as it imports gallery's.

**Success criteria.** mu and mj draw exactly what they draw today with no version of panel's four files of their own. panel draws its own component with empty snippets. lv imports at least one piece through a `gallery` alias and deletes its own. Every host's check, build and tests pass, and one test proves that for each alias only its bridge names it.

**Cost.** panel: its App.svelte cut in two. mu and mj: two config lines, one bridge, one App.svelte rewritten, three files deleted, each. lv: two config lines, one bridge, then one deletion per piece taken. gallery: the taking-apart, whose size is lv's whole code. ov is not in this proposal.

**Open.** The name of each library's bridge — Core.ts is the pattern, and the other two are named in the write that makes them, not before. Whether the alias for gallery is `gallery` or the drag-and-drop pieces earn a name of their own. And whether the steps above stay as the way to take a library by file, or go once importing works.
