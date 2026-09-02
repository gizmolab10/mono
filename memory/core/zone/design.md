---
kind: analyze
title: "Core design"
description: "How core is used by ov (and any later host): what core offers, what a host owes it."
tags: [now, waiting, weighed]
date: 2026-08-30
---
# how ov uses core

30 August 2026, DRAFT — for Jonathan to edit.

## the split

core is a library with no entry point: four ts folders (common, events, types, utilities) each behind an index.ts barrel, and eight support components. It holds no state of its own — no preferences, no managers, no app. ov is a host: it keeps the state, wires it in, and draws the app around it.

## what core offers

- the constants ladder (k), the debug log, Dirty's stale stores, Extensions
- the hits manager and hit_target — every press, hover, and tip
- the structures: Action, Angle, Coordinates, Stacked, the ladder of types
- the utilities: Colors, SVG_Paths, Sectioning, Separator_Spacing, Fitting, Stepping, Numbers, Sections, Smooth_Height, Thumb, Tooltip
- the support components: Separator, Stack, Section, Steppers, Big_Pill, ToolTip, Status_Line, BuildNotes

Inside core, a cross-folder import goes through a barrel, never a file inside one. A host gathers its adoptions instead: in ov, every file imports from ov's own `common/Core.ts`, and that file alone reaches through the alias.

## what a host must provide

Core components take their state as props and hand every act back out:

- **Colors** starts at defaults; the host remembers the chosen colors (ov: preferences) and writes them back into the stores at startup.
- **Big_Pill** takes `opened` (which areas stand open) and `ontoggle_area`; ov passes what its Filters manager holds.
- **Status_Line** takes `status`, `offer`, and three presses — `ontake`, `onhide`, `onreport`; ov wires its Status manager to them.
- **Configuration** pushes the constants onto the page; the host calls it at startup, before anything draws.

The rule behind all four: state lives in the host, behavior in core. Anything in core reaching for a manager is a bug.

## how ov reaches core

Decided — way 2: a path alias in ov's tsconfig and vite pointing at `../core/src/lib`, spelled `core/...` in imports. The roads not taken: a workspace dependency (heavier than the wish), and copies retired one at a time (drift while they lasted — see Extensions below).

## not settled

- do the tests stay in core, or does each host run them?
- does core's Tooltip absorb ov's, or the other way?
- what else in ov's utilities/ belongs in core?

## use case: Constants

ov's Constants.ts is today identical to core's — diff shows zero lines — so ov owns nothing of its own yet. It shrinks to two lines:

```ts
// ov's constants ARE core's, until ov disagrees with one. Every ov file keeps
// importing k from here; this file just says where k really lives — through the
// "core" alias both tsconfig and vite know.
export { default, k } from 'core/ts/common/Constants';
```

Every ov import keeps its path, and there is one `k` instance in the world, not a copy — ov and core cannot drift.

The day ov first disagrees with a number, this file grows into a spread: import core's `k`, spread it, override the one number, export the result — imports still untouched. For example, ov wanting a slower hover and a width change of its own:

```ts
import { k as core_k } from 'core/ts/common/Constants';

export const k = {
	...core_k,                                     // everything core says …
	timeout : { ...core_k.timeout, hover: 500 },   // … except ov's slower hover
	width   : { ...core_k.width,   tiny: 50 },     // … plus a change core lacks
};
```

A group being touched is spread too (`...core_k.timeout`), or its other members would vanish — the spread replaces whole values, and a group is one value. If ov ever disagrees with a *seed* (common_size and friends), core wraps its arithmetic in a `constants_from(seeds)` function and ov calls it with its own; not worth building until a host actually asks.

The "core" alias is part of ov's tsconfig and vite. The two-line file itself is gone: every adoption lives in ov's `common/Core.ts`, one line each — the merge criterion is *adopted from core*, not *small*.

## use case: Configuration

ov's Configuration differs from core's by one import line — but the merge is not the one-liner Constants was, because Configuration pushes what `colors` holds onto the page, and the two projects hold different Colors: core's keeps no state, ov's still reads and writes preferences.

Re-exporting Configuration alone would push core's colors — defaults, never Jonathan's chosen ones. So the honest unit is three changes, together:

1. ov's Colors.ts becomes a re-export of core's, like Constants.
2. ov's startup (main.ts) provides the three remembered colors from preferences, and manages them into core's stores.
3. ov's Configuration.ts becomes a re-export of core's.

ov's Colors and Configuration are re-exports of core's, through `common/Core.ts` — one SOT for colors — and main.ts reads the three remembered colors in and writes changes back.

## use case: Extensions

A adoption must never be a copy. ov's Extensions.ts was core's verbatim, and both ran — the second define() on String.prototype hit configurable: false and crashed the app. A side-effect module rides Core.ts as a bare import (`import 'core/ts/common/Extensions'`), and ov's copy is gone.

### dunno

The four claimants for an unresolved pac:

1. decisions.md — today's practice
2. questions.md — the previous pac's offer
3. zone/decisions.md — handbook line 83's stray claim
4. unresolved.md — this pac's newcomer