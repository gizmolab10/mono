# Handoff

My resume point for overview: the one thing to do next.

Everything still owed is in [code debt](code%20debt.md). The [work journal](work%20journal.md)  file has what's finished iand the [[current context]] you can't read off the code. 

## Next — a seventh tag area: progress

### Success

1. Three new tags exist: `propose`, `construct`, `done`. They sit on the closed list with the twenty-four already there, alphabetized among them.
2. A seventh area, `progress`, holds exactly those three and nothing else. Every other area is untouched.
3. Move 'stale' and 'think' from 'other' to 'progress'.
4. The area shows in the filters and in the label form the same as the other six — folding behind its own name, reading what is picked inside it, graying out what nothing wears.
5. The check that every tag belongs to exactly one area still finds nothing homeless.
6. Every new design gets kind 'design' and every new work file gets kind 'work' BUT do this on beginning to edit a file that has no labels. files with no labels will show kind as '---' in Files table.
7. The type check and the tests are clean, and nothing on screen moves except the new area appearing.

### The shape of it

The other six areas gather tags by *what a guide is about* — code, fixing, the harness, the look of things. This one gathers by *where a guide stands in its own life*: proposed, being coded, done. That is a different sort of grouping, which is why it wants an area of its own rather than being scattered into `other`.

Evidence there is room for it: the areas are one flat list, and adding to it is one line — [Tag_Areas.ts:16](../../src/lib/ts/types/Tag_Areas.ts#L16). Nothing counts on there being six; the filters and the label form both walk whatever is there.

**Who decides a label, and when.** The collaborator does, reading the file's own words — and only the first time that file is opened for editing, never in a sweep over files nobody asked about. Until then the file shows `---` for its kind and carries no label block at all. Jonathan corrects whatever came out wrong; that is the whole of the checking, and it happens on the file he is already looking at.

**Why not before.** Judging a hundred files at once means a hundred guesses nobody reads, and no way to tell a good one from a bad one. Judging one file at the moment someone opens it means the guess is looked at while it is fresh.

**The one thing to watch.** Shut areas read as one word each across the top: six become seven. If that crowds the row, the answer is to look at how the areas are laid out rather than to give this one up.

## Then — mark the guides that are talking about finished work

### Success

1. Every guide whose words are a list of completed tasks, phases or steps wears the `stale` tag.
2. Nothing else is changed in those files — only the tag line.
3. The count is said plainly: how many were looked at, how many were marked.
4. A guide already marked is left alone rather than marked twice.

### The shape of it

A guide that reads as a checklist of things already done is a record, not guidance — it wants a rewrite, and `stale` is the tag that says so. The judging cannot be automated: a file full of ticked boxes might be a finished plan or a live one. So the pass is: find the candidates by what is in them, list them for a person, and mark only what that person confirms.

One word covers both on purpose. `stale` already means "this has fallen behind what it describes", and a file that is a list of finished work has fallen behind in exactly that way — it describes doing rather than done. A second tag would split one idea in two and leave a reader deciding which applies, which is how a closed list stops being readable.
