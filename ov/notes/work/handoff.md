# Handoff

My resume point for overview: the one thing to do next.

Everything still owed is in [code debt](code%20debt.md). The [work journal](work%20journal.md)  file has what's finished iand the [[current context]] you can't read off the code. 

## Break the editor into four

### Success

1. The editor holds only what makes the editor: its four sections, its way back to the list, its top row.
2. Three pieces of its own: how a guide's words read, the box that changes one piece, and the searching.
3. Nothing on screen moves, and nothing changes what it does.
4. The type check and the tests are clean.
5. The editor is under 700 lines.

### The shape of it

The editor is 1,919 lines, 758 of them styling, and 48 of those rules dress a guide's own words rather than the editor's frame. Three things in there are whole in themselves and mention the editor nowhere.

**How a guide reads** — the biggest and the cleanest. Paragraphs, the six heading levels, lists, tables, quotes, chunks of code, the marks that fold a section, the fixed slot the title stands in. It takes the words and draws them; the editor hands them over. Roughly 400 lines of styling and the folding code.

**The box that changes one piece** — making it, sizing it to what it holds, sliding it onto the place the piece stood, holding what follows still, the marking-up keys, the paired brackets and quotes. It knows about a piece of a page and the file's own lines; it does not know about a top row or a search. Roughly 250 lines.

**The searching** — lighting a place, stepping from one to the next, showing a place that a fold had put away. Roughly 120 lines.

**The order.** Searching first: it is the smallest and touches the least. Then the box. The words last, because it is the one whose styling the others sit inside, and moving it will show up any rule that was quietly relying on being in the same file.

**The risk.** A rule that dresses a guide's own words has to keep reaching in from outside its file. That works — the guides' own styling already does it — but a rule that reaches in and one that does not are written differently, and every one of those 48 has to be checked rather than moved.