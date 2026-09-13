# kb

The library extracted from ov, which ai and mu import. Made 12 September 2026 at step 4 of the plan in [music and ai](../ov/zone/music%20and%20ai.md), holding all of ov's code: its page under the name Main.svelte, which a host's App.svelte draws, its one bridge, `common/Core.ts`, and ov's tests, core_alias.test rewritten for one bridge. No entry file, no port, no db entry and no servers entry, since a library has none. ov is frozen, the reference kb is proved against. Each step of the plan from 5 to 19 moves a piece that is the ai specialty's out to the ai host, and ov is retired the day the last is ticked.

**Current state:** ov's code whole, checked and tested alone: check clean at 532 files, 338 tests passing.

## Zone

- [adopt kb.md](zone/adopt%20kb.md) — what a host hands kb, proposed: the configuration, one field per fact with ai's and mu's values, the four snippets and where kb renders each, what is not handed, the type, its proof and what is open. Step 5 of the plan builds it.

## Truths

- [lexicon.md](truth/lexicon.md) — kb's terms: ov's, and the words for its hosts and its db.
- [map of kb files.md](truth/map%20of%20kb%20files.md) — every source file in kb; read it instead of discovering files using regex and wildcards, and update it when files move.
