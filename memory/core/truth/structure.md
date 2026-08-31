---
type: design
title: core structure
description: What core is and the rules that keep it core.
tags: [structure, library, incorporated]
use_when: [working in core, moving code between ov and core]
updated: 30 August 2026
---
# core structure

A library with no entry point. Four ts folders — common, events, types, utilities — each behind an index.ts barrel that re-exports everything the folder offers, defaults by name. Eight support components under svelte/support.

The rules:

- **State lives in the host, behavior in core.** A component takes its state as props and hands every act back out. Anything in core reaching for a manager is a bug — that is how Colors, Big_Pill and Status_Line were cut loose.
- **Imports go through the barrels.** A caller names the folder, never a file inside it. Same-folder imports stay direct, so no barrel imports itself.
- **Core declares only what its code uses** — color2k, rbush (the hits manager), the svelte toolchain. Host-only dependencies stay in hosts.
- **Tests live beside the code they prove** — the eleven whose subjects are core's.
