# Handoff

My resume point for overview: the one thing to do next.

Everything still owed is in [code debt](code%20debt.md). The [work journal](work%20journal.md)  file has what's finished iand the [[current context]] you can't read off the code. 

## Sections and separators become one piece
### Success

1. The editor is built from one Section piece used five times, not from hand-set spacing at every level.
2. A section says what it is with props — its separator's thickness, its title, whether the title can be pressed, whether it folds — and nothing else.
3. Every gap above and below content comes from the Section, so no rule in the editor sets a margin to line something up.
4. Nothing on screen moves.
5. The type check and the tests are clean.

### The shape of it

The editor is 1,897 lines with 55 separate spacing rules, and I have spent this session fixing three faults that were all the same fault: one place pushing, another pulling, and the two drifting apart. The guide names the cause — separators deployed several ways, each with its own arithmetic.

**What a Section is.** A rectangle bounded above and below by a separator or an edge, with equal room around its content. That is the whole idea; the props are thickness, title, pressable, foldable, and the extra strip that also takes hover and click.

**The order.** Build the Section against the tags row first, since it is the one whose height changes. Then kinds, then title-and-brief, then search, then title-and-navigator. Content last — it holds the scrolling and the pinned title, and is the only one that is not a plain stack.

**How it stays honest.** Each phase ends with the screen unchanged. That is the test: a phase that moves something by a pixel is a phase that got the room wrong.

**What I would drop first.** The `word` on a separator and the strip that answers a press are already one component. It is the _placing_ that is scattered — so Section owns placing, and Separator keeps drawing.

**The risk.** The editor's spacing is now the product of many small corrections, several of them mine and undocumented. Some exist for reasons nobody wrote down. Any that vanish under the Section will show as a pixel shift, which is why every phase ends with a look.