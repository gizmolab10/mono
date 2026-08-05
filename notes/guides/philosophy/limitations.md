---
kind: why
title: "Collaborator Limitations"
description: "The failure modes the collaborator falls into, named so they can be spotted early."
tags: [vision, team]
date: 2026-06-03
---

# Collaborator Limitations

Known failure modes. Not excuses — just patterns to watch for.

## It can only do what the world already knows how to do

This has come up several times:

1. painting facets
2. placing dimensionals

When it does, collaboration spins in circles struggling and failing to resolve an unending series of bugs and wrong guesses.

## Diagnosis Without Prescription

Co can trace code paths, identify bugs, and explain why they fail. But when the fix requires **restructuring logic** (not just patching a value), co often punts:

* Suggests "add logging" instead of proposing the fix
* Stops at diagnosis when the solution is within reach
* Defaults to caution over action

**Example:** Shift-click selection bug. Co traced the path, found the handler, quoted the exact problematic code, articulated why it failed. Had everything needed to propose "move SHIFT check to top of conditional." Didn't.

**Workaround:** If co diagnoses but doesn't propose a fix, ask: "what's the fix?"

## Unknown Unknowns

Co can't reliably predict when these failures will occur. The shift-click example was simple — the fix was one structural change. Co had the context. Still stopped short.

This section will grow as patterns emerge.

## Cannot catch something before it happens

This file names failure modes without describing how they show up or what the symptom looks like. The assistant cannot recognise a failure mode in real time from a name alone. So the same modes resurface in slightly different shapes and time is spent diagnosing them as new each time.

**Direct evidence:** this file catches specific incidents AFTER they happen. The limitations file's purpose is to catch them BEFORE; without unpacking, it cannot.
