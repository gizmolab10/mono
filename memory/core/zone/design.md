---
kind: analyze
title: "Core design"
description: "How core is used by ov (and any later host): what core offers, what a host owes it."
tags: [now]
date: 2026-08-30
---
# how ov uses core

30 August 2026, DRAFT — for Jonathan to edit.

## the split

core is a library with no entry point: four ts folders (common, events, types, utilities) each behind an index.ts barrel, and eight support components. It holds no state of its own — no preferences, no managers, no app. ov is a host: it keeps the state, wires it in, and draws the app around it.

## what core offers

- the constants ladder (k), the debug log, Dirty's stale stores, Extensions
- the hits manager and hit_target — every press, hover, and tip
- the shapes: Action, Angle, Coordinates, Stacked, the ladder of types
- the utilities: Colors, SVG_Paths, Sectioning, Separator_Spacing, Fitting, Stepping, Numbers, Sections, Smooth_Height, Thumb, Tooltip
- the support components: Separator, Stack, Section, Steppers, Big_Pill, ToolTip, Status_Line, BuildNotes

A host imports from a folder, never a file inside one: `import { k, debug } from 'core/common'`.

## what a host must provide

Core components take their state as props and hand every act back out:

- **Colors** starts at defaults; the host remembers the chosen colors (ov: preferences) and writes them back into the stores at startup.
- **Big_Pill** takes `opened` (which areas stand open) and `ontoggle_area`; ov passes what its Filters manager holds.
- **Status_Line** takes `status`, `offer`, and three presses — `ontake`, `onhide`, `onreport`; ov wires its Status manager to them.
- **Configuration** pushes the constants onto the page; the host calls it at startup, before anything draws.

The rule behind all four: state lives in the host, behavior in core. Anything in core reaching for a manager is a bug.

## how ov reaches core

Open — one of:
1. a project: core joins mono's project, ov depends on it, imports read `core/...`
2. a path alias in ov's tsconfig/vite pointing at `../core/src/lib`
3. ov's copies stay until each is retired one at a time, the inception pattern

## not settled

- do the tests stay in core, or does each host run them?
- does core's Tooltip absorb ov's, or the other way?
- what else in ov's utilities/ belongs in core?
