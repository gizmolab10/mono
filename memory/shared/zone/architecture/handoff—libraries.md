# Handoff: Svelte/TS library build approach for mono

Written 2026-09-10 by a Claude (Cowork) session, for a Claude Code session to resume from. Jonathan owns this. His monorepo is at `~/GitHub/mono`, containing (among others) `di` (quaternion-based 3D CAD tool, Svelte) and `webseriously` (graph visualization, Svelte/TypeScript).

## The question he asked

He has a dependency chain of Svelte/TypeScript packages: a `core` package, a `panel` package that imports `core`, a `gallery` package that imports `panel`, and so on. He asked how Svelte and TypeScript recommend building libraries in that shape, and what the right approach is for his setup.

## The answer given so far

There are two different situations, and the right approach depends on which one applies.

**If these packages are only ever used inside his own monorepo** (not published to npm separately), the recommendation is: skip a build step per package entirely.

- Set up the packages as workspace packages (pnpm workspaces is the common current choice — fast, disk-efficient, strict about what each package can see; npm/yarn workspaces work too).
- Each package's `package.json` `exports` field points directly at its Svelte/TS source files, not at a compiled `dist` folder.
- The final consuming app is the only thing that actually gets built — Vite compiles the whole chain (core through gallery) in one pass.
- This sidesteps the build-order problem completely, since nothing needs building in order.
- It also gives real hot-reload: editing `core` is picked up immediately by `panel` and `gallery`, because Vite is compiling source directly, not reading a stale compiled copy.
- For type checking across the chain without full rebuilds: use TypeScript project references (`composite: true` plus a `references` array in each package's `tsconfig.json`), so `tsc` checks incrementally instead of re-checking everything each time.

**If standalone builds are actually needed** (e.g., publishing one package to npm independently, or wanting an isolated compiled artifact for `core`):

- Build each package with `@sveltejs/package` (the `svelte-package` CLI), which compiles the Svelte components and emits `.d.ts` files into a `dist` folder.
- Downstream packages import from that `dist` folder via normal package exports.
- Build order now matters (`core` → `panel` → `gallery`). Don't manage that by hand — use a task runner that reads the workspace dependency graph and builds in the correct order automatically, with caching for unchanged packages. Turborepo or Nx are the usual choices.

**Recommendation given to Jonathan:** since `di`, `webseriously`, and the rest are personal tools inside one monorepo rather than published npm packages, the no-per-package-build approach (source-level workspace linking) is almost certainly the better fit. Reach for `svelte-package` + Turborepo/Nx only if he actually plans to publish one of these packages independently, or specifically needs `core` compiled in isolation for some other reason.

## Answered, 10 September 2026

The files were read. Nothing is published outside mono, so the first situation applies. The concrete recommendation is the proposal "libraries resolve through the workspace, not through aliases" in [proposals](memory/ov/logs/proposals.md).

## Open thread / where to pick up

Jonathan was offered a concrete check: looking at his actual `package.json` and `tsconfig.json` files across `core`/`panel`/`gallery` (or `di`/`webseriously`) to confirm which situation actually applies and give a specific setup, rather than the general answer above. That check was not yet done — the cloud session had no access to his local files at the time this was written (no device folder was connected).

If resuming: read the relevant `package.json` and `tsconfig.json` files in the affected packages under `~/GitHub/mono`, confirm whether any of these packages are (or are meant to be) published outside the monorepo, and give a concrete recommendation — workspace tool choice, `exports` field shape, and tsconfig project-reference setup — rather than repeating the general guidance above.

## Style notes for continuing this conversation

Jonathan has stated preferences that apply to how any Claude should talk with him:
- No metaphors. Say the plain thing.
- Short, plain sentences. No ornament. Wordiness is the problem, not just length.
- Define every new term introduced.
- Never say something "lands" — say it "works fine" or "satisfies our criteria."
- Minimal formatting in chat replies — prose over bullet lists unless a list is genuinely essential.
- Deliver work by writing files directly rather than pasting content inline, when working in his repo.
- When he rewrites something Claude drafted, treat the rewrite as the new version verbatim, not as instructions to reinterpret.
- "Where is X" means: file name and line number.
