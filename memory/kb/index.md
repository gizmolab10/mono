# kb

The library extracted from ov, which ai and mu import. Made 12 September 2026 at step 4 of the plan in [how ai hosts kb](../ai/truth/design/how%20ai%20hosts%20kb.md), holding all of ov's code: its page under the name Main.svelte, which a host's App.svelte draws, its one bridge, `common/Core.ts`, and ov's tests, core_alias.test rewritten for one bridge. No entry file, no port, no db entry and no servers entry, since a library has none. ov is frozen, the reference kb is proved against. Each step of the plan from 5 to 19 moves a piece that is the ai specialty's out to the ai host, and ov is retired the day the last is ticked.

The adoption of core, measured 12 September 2026 in ov's code, which kb holds whole, in ov's index's words: The adoption is finished and measured: no file in ov is a copy of anything in core, proved by comparing both source folders — zero identical, zero near, zero paired by name. Thirty-two of core's files arrive through `Core.ts`, plus `Extensions` as a bare import there and `main.css` at `main.ts`. Those are the only two bridges through the alias, and `core_alias.test.ts` fails if a third is built: code goes through `Core.ts`, the stylesheet through `main.ts`, since where a stylesheet loads decides which rule wins between two that match equally. core now checks and tests itself — its own first check found that `Big_Pill` had never compiled. Three files say where the alias points, not two: `tsconfig.json`, `vite.config.ts` and `vitest.config.ts`, the last read in place of the second. ov is clean at 529 files with 336 tests; core at 466 with 91. How a host does all this is core's now — [adopting core.md](../core/truth/adopting%20core.md).

## Zone

- [drive.md](zone/drive.md) — the current undertaking, and the project's current state, moved here from this index 16 September 2026.
- hosting kb.md — what both hosts need of kb, cut from the plan 23 September 2026 and moved to [memory/mu/zone](../mu/zone/hosting%20kb.md) the same day. Each host's own part is its own: ai's [how ai hosts kb.md](../ai/truth/design/how%20ai%20hosts%20kb.md), the ai specialty, its schema and rules and the strip of ov, and mu's [kb hosted by music.md](../mu/zone/kb%20hosted%20by%20music.md), the music specialty, its schema and rules and steps 20 to 24 and 29 to 31.

## Truths

- [adopt kb.md](truth/adopt%20kb.md) — what a host hands kb: the configuration, one field per fact and who reads it, the six snippets and where kb renders each, what ai hands, and what is not handed.
- [lexicon.md](truth/lexicon.md) — kb's terms: ov's, and the words for its hosts and its db.
- [map of kb files.md](truth/map%20of%20kb%20files.md) — every source file in kb; read it instead of discovering files using regex and wildcards, and update it when files move.
- [ov as knowledge bases.md](truth/ov%20as%20knowledge%20bases.md) — how companies organize and browse their knowledge, and which of those approaches fit ov, mu and ji; its roadmap's phases 1 to 6 are built, rules among them. Moved here from ai's zone/work 23 September 2026.
