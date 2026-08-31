---
description: core — the library every mono app shares; state lives in the host, behavior in core.
---
# core

A library with no entry point, carved out of ov: what every mono app can share. Four ts folders — common, events, types, utilities — each behind an index.ts barrel, and eight support components. Core keeps no state of its own; a host hands its state in as props and remembers what needs remembering.

**Current state:** the ov-only code is out (tests, main.ts, the managers reads in Colors, Big_Pill and Status_Line); every cross-folder import goes through a barrel; the package is named core, declares only what its code uses, and sits in mono's workspaces — one pile at the root, the svelte nohoist gone. `zone/design.md` is a draft awaiting Jonathan's edit. Not yet in the hub, by decision. The carve leftovers are leaving: handoff and the copy of ov's map are gone.

## Truths

- [structure.md](truth/structure.md) — what core is and the rules that keep it core.
- [decisions.md](truth/decisions.md) — live rationales, and the pac responses weighing coming choices.
