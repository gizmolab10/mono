---
kind: wire
title: "Editing a Guide"
description: "How this app lets you change a guide from inside the app, one piece at a time, without rewriting the file."
tags: [write, notes]
date: 2026-08-02
---

# Editing

Editing a guide from inside overview: you change what's on the page, and the file on disk changes with it.

This has all been built. This is the plan we followed, the risks, and what it costs.

## The trap to avoid

Despite the obvious appeal  whole page typeable and, on save, turn the page back into markdown. Don't. That rewrites the entire file — every blank line, every link style, every indent becomes whatever the converter prefers — so a one-word fix lands as a rewritten file. It also has to invent an answer for things markdown has and a page does not: reference-style links, raw HTML, the label block.

So: don't convert the page. Convert one block.

## Glossary

**block:** one whole piece of the page standing on its own lines — a paragraph, heading, list, table, quote, fenced code. Not bold or a link, which live inside one. It starts and ends on a line boundary. Some hold others — a list holds its items — and those are the ones whose line range is easiest to get wrong, so they come last.

**stamp:** inside the in-memory data structure for a block, store two numbers (first and last line) so it knows where in the file it came from.

## The plan

1. **Stamp each block with the lines it came from.** The markdown reader hands back, for every block it builds, the first and last line of the file that block came from. Stamp those two numbers onto the element as it's drawn.
2. **Click a block to edit it.** The block is replaced in place by a plain text box holding *that block's own markdown, straight from the file* — not a conversion of what's on screen. A heading shows its hashes, a list its dashes. Escape drops it; it saves on leaving the box.
3. **Save replaces only those lines.** Take the file's text, swap the stamped range for what was typed, write it back. Nothing outside the edited block is touched, so the rest of the file stays bit-for-bit what it was.
4. **Re-draw from the new text.** The changed block is read again and redrawn, so what's on screen is always what the file says — never a guess about what the file now says.
5. **Writing needs a route that accepts writes.** The app already talks to a dispatcher — the diagnostic lines it posts get written to a file on this machine. A second route beside it, taking a path and a body, is the smallest addition. It refuses any path that isn't a markdown file inside a guides folder.
6. **The OKF label block is edited as one thing**, through its own small form (kind, title, description, tags, date), since those five labels are what the app itself reads. Changing a title or tags means the app's own list of guides needs those two facts updated in place.
7. **Mark pieces sitting inside other pieces.** ...

You type markdown, not rich text. That's the trade: a fast editor rather than a word processor, with no conversion library, no round-trip fidelity problem, and no way to mangle a file you didn't mean to touch.

## How each step is built

Same three beats every time, in this order:

1. **Stub and test first** — write the empty function with its name and what goes in and out, then write the tests that say what it must do, including the ugly cases. They fail; that's the point.
2. **Then the code** — the least that turns those tests green.
3. **Then run them** — and the type check. A step isn't done until both are clean.

The test runner is in place — `yarn test:run` for one pass, `yarn test` to watch. Anything ending in `.test.ts` under the source folder is picked up.

## Risk

1. **Writing over a good file is the only serious one.** It happens if the stamped line range is stale — the file changed on disk since it was drawn — or off by one. Guard: before writing, check the file still reads exactly as it did when opened; if not, refuse and re-draw. That turns the whole risk into a refusal rather than a loss.
2. **Many of these guides are the rules I read every session.** An accidental edit changes how I work, quietly. Guard: no save without leaving the box, and every save says which file and which lines in the log.
3. **The label block is the one place a typo breaks the app's list.** A tag off the closed list is dropped, and says so in the log. A small form rather than free text removes the problem.

## Cost

Roughly two hours of Jonathan's time end to end — steps 1 and 2 about half of that, the save route a small piece, the label form the rest. Even odds on two hours; two to four is the honest band. What can't be predicted is the rounds spent on how it feels on screen, which is where small changes usually run long.

## Confidence

1. **Won't destroy a file: high.** The refuse-if-changed check means the worst outcome is a save that declines and re-draws.
2. **Free of bugs: medium.** Nested lists, tables and fenced code blocks are where the line ranges will likely come out wrong, since those are the blocks that hold other blocks. Plain paragraphs and headings should be solid quickly.
3. **The safe order:** paragraphs and headings first, and only reach for a block that contains other blocks once that much is proven on real guides.
