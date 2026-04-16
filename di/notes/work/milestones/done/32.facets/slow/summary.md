# Handoff

## Where things stand

Two sessions of work captured in the handoff. Yesterday I audited the renderer and shipped the biggest single win. Today I cleaned up references after you reorganized the work folder.

## What is shipped right now

The duplicate geometry pipeline that was running every frame for a turned-off feature is gated off. Tests pass, type-check is clean. Two pre-existing type errors that surfaced during the verification are also fixed.

## What is planned but not built

A way to skip rendering when nothing has changed. The full design is in the bottlenecks file: a flag, twenty-six store subscriptions to set the flag automatically, three hand-placed marks for the parts that do not go through stores, and a one-character rollback lever. About fifty lines of new code in total. A complete audit of every place in the codebase that changes what the canvas shows is also in the file — about one hundred and forty places, grouped, with most of them already covered by the subscription approach.

## What you need to decide before I can build it

- Which decay-prevention strategy to commit to (strong, middle, or weak).
- One commit or three commits for the rollout.
- Whether to include the temporary "force redraw" key in the first commit.
- Whether the three hand-placed marks ship at the same time as the subscriptions or later.
- Whether to shorten the helper function name.

## Three small loose ends from the reorg cleanup

Three files in the work folder link to the slow handoff but the surrounding text reads like they should be linking to the facets handoff. They are not broken — the path resolves — but they look semantically wrong. They are listed in session two of the handoff with file paths and line numbers. Tell me to repoint them and I will.

## One open question on the shorthand

There are now two active handoff files (slow and facets). I made the shorthand point at slow because that is where today's work lives. If you want it to switch between them or to support both as separate commands, say so.

## The first concrete next step

Clean up the proposal section of the bottlenecks file: remove the obsolete "audit first" bullet (the audit is done), drop the boolean parameter from the helper signature, add a bullet that names the subscribe-to-stores shortcut as the primary path, and move the audit results out of the middle of the risks section. After that, the four open decisions, then the build.

# Bottlenecks

The bottlenecks file is a ranked list of fifteen things slowing down the canvas, each with evidence and a fix proposal. Here is the shape.

## What it covers

Fifteen distinct slowdowns, ordered worst-first. Every one points to a specific file and line. Every one has a plain-English description of what it does, why it costs frame time, and how to fix it.

## What is done

One: the duplicate geometry pipeline that was running every frame for a turned-off feature. That bottleneck is marked complete in the file with a check mark in its heading.

## What is partially captured but lives elsewhere

Bottleneck two — the one about not painting when nothing changed — has its short original bullets in the bottlenecks file, but its deep content (full audit of every place that could trigger a repaint, the risks list, the formal wiring proposal, the verification plan) lives in a sister file called `render is stale.md` next to it. The bottlenecks file is the index; the sister file is the working document.

## The shape of the remaining fourteen

They sort into four loose groups by what kind of problem they are.

- *One-time waste.* Items one and two — dead pipeline, no idle skip. The biggest single wins.
- *Same work done many times per frame.* Items three and four — the per-object world transform is rebuilt several times per frame, and the whole scene is walked once just to derive a single number that the dead pipeline used.
- *Bad algorithms or data structures.* Items five through eight — face-pair intersection has no per-face pruning, the silhouette-edge tagger does a quadratic neighbor scan, the spatial index rebuilds twice per frame, and the camera-extent computation does a recursive filter through the whole object list at every level.
- *Allocation pressure in hot loops.* Items nine, twelve, thirteen, fifteen — vector and matrix objects allocated by the thousands per frame, the occlusion clipper rebuilds its working array on every occluder, the hidden-wireframe pass calls a heavy clipper that throws away half its output, and edge keys are rebuilt as fresh strings every frame.
- *Linear searches that want maps.* Items ten, eleven, fourteen — endpoint filtering, crossing-split application, and a "is this face in the occluder list" check, all linear scans that should be hash lookups.

## The suggested ship order at the end of the file

Bottleneck one is done. Two is the next big one. Three after that — once the world transform is built once per frame, it unlocks several others. Then five, seven, and eight in any order. Then the cluster of map-lookup swaps (six, ten, eleven, fourteen). Then four falls out for free as a side effect of one. Then the allocation cluster (nine, twelve, thirteen) together. Fifteen last, only if profiling still shows allocation as the dominant cost after everything above.

## What the file does not cover

The author noted three deliberate omissions: the side overlay renderers (grid, axes, dimensions, angulars), the events and pointer-hit pipeline, and the contents of the facets file itself. None of these were inspected because they sit outside the main per-frame paint path or are dead code.

## Confidence statement

The file says items above number nine are structural and confident from reading alone. Items nine, twelve, and fifteen are flagged as guesses about absolute impact because they depend on garbage-collector behavior that was not measured. Item six is flagged as a guess because the quadratic does not bite at today's six-faces-per-cuboid scale but will bite the moment any object gets a richer mesh.

## Bottom line

The file is a punch list. One item shipped, fourteen left. The next concrete step is whichever direction you choose for bottleneck two — either the deep proposal in the sister file, or any of the smaller items below it.
