# Handoff

My resume point for overview: the one thing to do next.

Everything still owed is in [code debt](code%20debt.md). The [work journal](work%20journal.md)  file has what's finished iand the [[context]] you can't read off the code. 

## Next — the close cross goes, and the rows themselves take you back

The way out of a file is a small circle at the far left. Aiming at it is the only way back, which is a lot of precision to demand for the commonest move in the app. The two rows above the words are mostly empty space; that empty space can be the way out.

### The shape of it

The close cross is removed. A press anywhere in either of the top two rows goes back to the list — except on the things that already answer: the step marks, the search field, its count and its two marks, and the file's name. The hover words on the empty parts say where a press leads, so the new behavior is never a surprise.

Two things to settle while doing it: the file's name is pinned to the middle of the whole row and overlaps the empty space on both sides, so whatever decides "not on a control" has to account for a control that is drawn out of the flow; and the Escape key stays the other way out either way.

### Success

1. There is no close cross, and a press on the empty part of either top row goes back to the list.
2. A press on any control in those rows does what that control does, and nothing more.
3. Pointing at the empty part says where a press leads.
4. The tests and the type check run clean.

