# Handoff

My resume point for overview: the one thing to do next.

Everything still owed is in [code debt](code%20debt.md). The [work journal](work%20journal.md)  file has what's finished iand the [[current context]] you can't read off the code. 

## Next — one question instead of two: fold purpose into kind

### Success

1. The purpose row is gone from the filters. Nothing on screen asks which of guides, designs or work to show.
2. `design` and `work` join the five kinds, so a file says which it is the same way it says everything else — in its own labels.
3. Every guide that sat under a designs folder wears `kind: design`; every one under a work folder wears `kind: work`. Nothing else in those files changes.
4. Picking a kind narrows the list exactly as it does today, with the two new words among the choices.
5. The remembered purpose setting is dropped rather than left behind to confuse a later reader.
6. The type check and the tests are clean, and nothing on screen moves except the row that went.

### The shape of it

Purpose and kind ask the same question twice. Purpose asks it by where the file sits — a path beginning with `designs` makes a file a design, and that is read off the folder rather than off the file. Kind asks it by what the file says about itself. Two answers to one question means two places to look, two ways to be wrong, and a filter row that carries no information the kinds could not carry.

Evidence for the doubling: a file's design-ness is worked out from its path, at [Guide.ts:77](../../src/lib/ts/types/Guide.ts#L77), and the filter then tests that worked-out flag against the picked purposes, at [Hierarchy.ts:330](../../src/lib/ts/managers/Hierarchy.ts#L330).

**Why it is worth doing rather than tidying around.** Purpose reaches into nine files. It has its own remembered setting, its own filter row, its own toggling rule (the last one on cannot be turned off — a rule that exists only because purpose is not a kind). Kind has none of that: it is one word on the file, one segment in a row, one test. Folding one into the other removes a whole mechanism rather than moving it.

**What it costs.** Around a hundred guide files gain or change a `kind:` line. That is a sweep, and a sweep can be got wrong quietly — so it wants to be done by reading the folder each file is in, counted out loud, and checked by listing every file whose kind does not match its folder afterwards.

**Decision.** `design` and `work` may not be the same sort of word as `specify`, `step`, `wire`, `explain` and `refer`. This is fine.

## Then — mark the guides that are talking about finished work

### Success

1. Every guide whose words are a list of completed tasks, phases or steps wears the `stale` tag.
2. Nothing else is changed in those files — only the tag line.
3. The count is said plainly: how many were looked at, how many were marked.
4. A guide already marked is left alone rather than marked twice.

### The shape of it

A guide that reads as a checklist of things already done is a record, not guidance — it wants a rewrite, and `stale` is the tag that says so. The judging cannot be automated: a file full of ticked boxes might be a finished plan or a live one. So the pass is: find the candidates by what is in them, list them for a person, and mark only what that person confirms.

One word covers both on purpose. `stale` already means "this has fallen behind what it describes", and a file that is a list of finished work has fallen behind in exactly that way — it describes doing rather than done. A second tag would split one idea in two and leave a reader deciding which applies, which is how a closed list stops being readable.
