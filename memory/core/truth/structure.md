---
type: design
title: core structure
description: What core is and the rules that keep it core.
tags: [structure, library, incorporated]
use_when: [working in core, moving code between a host and core]
updated: 1 September 2026
---
# core structure

A library with no entry point. Four ts folders — common, events, types, utilities — each behind an index.ts barrel that re-exports everything the folder offers, defaults by name. Nine support components under svelte/support.

The rules:

- **State lives in the host, behavior in core.** A component takes its state as props and hands every act back out. Anything in core reaching for a manager is a bug — that is how Colors, Big_Pill, Status_Line and Hamburger were cut loose.
- **Core keeps none of a host's vocabulary either.** Big_Pill takes `name`, `items`, `shown` and `reads` as plain values; ov's `Tag_Areas.ts`, with its ten areas and thirty-five tags, stays ov's. BuildNotes takes its table as text rather than naming a file inside a project it has never heard of.
- **How a thing looks belongs to the host too.** Hamburger carries no styling at all; each host reaches it by the two class names it wears — `hamburger-button` and `hamburger-icon`. Where a host's block sits inside a component's own `<style>`, svelte scopes it to that file, so it must be wrapped in `:global` to reach a button core draws.
- **Imports go through the barrels.** A caller names the folder, never a file inside it. Same-folder imports stay direct, so no barrel imports itself.
- **One import names a file, on purpose.** `Colors.ts` reaches for `../common/Dirty` rather than the common barrel: the barrel's first line pulls in Configuration, which reaches back here through the utilities barrel. That ring's behavior depends on which file is entered first, and naming the file is the cut that breaks it.
- **Core declares only what its code uses** — color2k, rbush (the hits manager), the svelte toolchain. Host-only dependencies stay in hosts.
- **Tests live beside the code they prove** — the eleven whose subjects are core's.

## Core checks and tests itself

`tsconfig.json` and `vitest.config.ts`, plus `src/vite-env.d.ts` for vite's own import suffixes. No `vite.config.ts`: core has no port in the hub's ports file and no app to serve, so nothing would read one. 11 test files, 91 tests.

Its own check had never run before 1 September 2026, and the first run found that `Big_Pill.svelte` had never compiled — it reached for three things that live only in ov. **A library with no way to check itself is a library whose faults wait for its host.** Give a library both before adopting anything from it.
