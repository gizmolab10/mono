# kb

The library extracted from ov, which ai and mu import. Made 12 September 2026 at step 4 of the plan in [music and ai](zone/music%20and%20ai.md), holding all of ov's code: its page under the name Main.svelte, which a host's App.svelte draws, its one bridge, `common/Core.ts`, and ov's tests, core_alias.test rewritten for one bridge. No entry file, no port, no db entry and no servers entry, since a library has none. ov is frozen, the reference kb is proved against. Each step of the plan from 5 to 19 moves a piece that is the ai specialty's out to the ai host, and ov is retired the day the last is ticked.

**Current state:** ov's code whole, on panel since step 5, 13 September 2026: Main.svelte draws panel and hands it kb's own four, and a host hands kb its facts, `common/Customizations.ts`, and its drawing, four snippets each rendered in one place. Two bridges, Core.ts and Panel.ts. Since step 7 the kinds, the tags and the tag areas are the host's, three lists in the configuration, and kb's kind is a word. Checked and tested alone: check clean at 540 files, 324 tests passing. Not yet looked at in a browser.

## Zone

- [adopt kb.md](zone/adopt%20kb.md) — what a host hands kb, built at step 5: the configuration, one field per fact with ai's and mu's values, the four snippets and where kb renders each, what is not handed, the type and its proof.
- [music and ai.md](zone/music%20and%20ai.md) — the plan, kb's since 14 September 2026: what kb holds, what a specialty is, the ai and music specialties each defined with a key values table, the db tables, one db per host, and the 32 steps, ai on kb first, then the strip of ov, then music, kb's new work, the drop box and mu adopting kb.
- [ov as knowledge bases.md](zone/ov%20as%20knowledge%20bases.md) — how companies organize and browse their knowledge, and which of those approaches fit ov, mu and ji; its roadmap's phases 1 to 6 are built, rules among them.

## Truths

- [lexicon.md](truth/lexicon.md) — kb's terms: ov's, and the words for its hosts and its db.
- [map of kb files.md](truth/map%20of%20kb%20files.md) — every source file in kb; read it instead of discovering files using regex and wildcards, and update it when files move.
