---
description: core — the library every mono app shares; state lives in the host, behavior in core.
---
# core

A library with no entry point, carved out of ov: what every mono app can share. Four ts folders — common, events, types, utilities — each behind an index.ts barrel, and nine support components. Core keeps no state of its own; a host hands its state in as props and remembers what needs remembering.

**Current state:** core checks and tests itself — 468 files clean, 11 test files, 91 tests — and its first check found `Big_Pill` had never compiled, which is why it now keeps none of a host's vocabulary. Two hosts draw its Hamburger, ov and lv, each with its own block of styling. `Colors.ts` names a file rather than the common barrel, which is the cut that breaks the ring with Configuration. How a host takes all this is `truth/adopting core.md`, moved here from ov's zone so the next host can find it. `zone/design.md` is a draft awaiting Jonathan's edit. Not yet in the hub, by decision. Its one proposal sits in `zone/proposals.md`.

## Truths

- [structure.md](truth/structure.md) — what core is and the rules that keep it core.
- [adopting core.md](truth/adopting%20core.md) — how a host takes core: the three files that say where the alias points, the one file holding every adoption, what the host owes at startup, and the lessons each paid for. Read it before adopting anything.
- [decisions.md](truth/decisions.md) — live rationales, and the pac responses weighing coming choices.
- [lexicon.md](truth/lexicon.md) — core's terms.
- [scope.md](truth/scope.md) — what belongs in core and what deliberately does not.
- [claude-files.md](truth/claude-files.md) — how CLAUDE files are listed, placed, read, and written.
- [action type.md](truth/action%20type.md) — the type that hands Separator more than one title, each with its handler and its position.
