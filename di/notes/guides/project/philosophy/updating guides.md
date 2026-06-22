# Updating the guides

Instructions for keeping the guide tree in sync with the code as the project changes. Distilled from several long sessions; the principles here have been tested by use.

## The four working rules

These hold regardless of what is being added, fixed, or removed.

1. **Cite every claim.** Every statement on a guide page about what the code does must be backed by evidence in the code that can be pointed to. A claim without a code pointer is a guess; either back it with a pointer or do not write it.
2. **Lint by hand.** Every guide that gets touched also gets its lint warnings fixed by hand, in the same pass. Never relax the linter and never skip a warning to deal with it later.
3. **Number list items in working notes.** Working notes use `1.`, `2.`, `3.` rather than bullets. The exception is short content lists inside finished guide pages, where bullets are fine.
4. **Component-tree diagrams show all four children.** When a guide page draws the layout tree, it shows the four child components (toolbar, side panel, drawing area, build notes) and notes that the status strip lives inside the drawing area.

## The shape of a typical update pass

A update pass starts narrow (one slice) and ends with a clean docs build.

1. **Pick a slice.** One concept, one page, or one folder. Big sweeps start as a sequence of slices, not as one block.
2. **Read the source code first.** Before touching the guide page, open the modules the page is about. Hold the line numbers; they will go on the page as citations. Do not write from memory of milestone files.
3. **Re-read the existing guide page in full.** Do not assume the page is wrong from a partial read. The page may already cover most of what is needed; the gap may be smaller than it looks. State the gap precisely after the full read.
4. **Verify each candidate claim against the code.** If a claim cannot be backed, drop it. If a milestone file describes a feature that does not exist in the current code, it does not go on the guide page — milestones are historical, not authoritative.
5. **Write the change in plain English first.** Say what things do; the citations sit on separate lines below. Do not pad the prose with module names or acronyms; the reader does not yet know the codebase.
6. **Add citations on separate lines.** Each citation names the file path and the line range. Cluster citations by section, not after every sentence.
7. **Wire into the indexes.** Adding, moving, or removing a page means three index files (sometimes four). See the next section.
8. **Run the docs build.** Dead links and lint errors block the build; the build is the final gate. If the build fails, fix it before declaring the slice done.

## Indexes to keep in sync

When adding, moving, renaming, or removing a guide page, all the following stay in sync:

1. **The folder's own `index.md`.** Add or remove the link in the contents list. Pages are listed alphabetically.
2. **The architecture top-level `index.md`** (for any page under `architecture/`). The descriptive bullet list is grouped by sub-folder; the contents list at the bottom names the folders.
3. **The `guides.layout.md` file.** A bird's-eye tree of every page; each entry has a one-line description of eight words or less.
4. **The map page** (`project/overview/map.md`) — only when source-code paths or notes-tree paths change. The map is a flat list, not an index.

For a moved page, also fix every inbound link surfaced by the docs build.

## Known traps from past sessions

These have cost real time. Avoid them.

1. **Milestone files are historical, not authoritative.** A milestone may describe a flag, a use case, or a method that did not survive to the current code. Always grep for the names before documenting them. The fixed-versus-variable design from milestone thirteen is the canonical example: the design was rich, the code never carried the boolean.
2. **Do not pad the gap list with guesses.** A gap claim that has not been verified gets the prefix "I AM GUESSING" or it does not go on the list. Padding the list to look thorough is dishonest and corrodes trust.
3. **"Move" means relocate.** When a directive says move, that is copy plus delete. Do not split the operation into copy plus question; if there is doubt about deletion, ask before the copy happens.
4. **A partial read produces a wrong gap.** Reading the first eighty lines of a page and concluding it covers only the alias table will produce a wrong gap. Always read the full page before claiming what is missing.
5. **If a directive is ambiguous, ask.** Three readings of "move key paths into arch/ui" all looked plausible; the right reading was none of them. Asking once is cheap; writing the wrong page is expensive.

## The build check

The command `yarn docs:build` catches dead links, lint warnings, and broken page references. Run it at the end of every slice. If new dead links surfaced, repair them in the same slice; never declare the slice done with red links.

## Where pages live

The current folder shape is documented in [the guides layout map](guides.layout.md). The layout map is the canonical answer to "where does a new page belong" — read it before placing.

## Citation hygiene

A citation that names a line range can rot when the file changes. Two practices help.

1. **Cite by line range, not by line number.** Single-line citations rot fastest; ranges (e.g. lines 11-38) survive small reorderings.
2. **Re-verify on every touch.** When editing a citation's surrounding section, open the cited file and confirm the range still spans the right code. Update if it has drifted.

## What this file replaces

This file is the distilled instruction set. The working file at `work/now/update.guides.md` is a session-by-session log of what was done and what is left to do. The two are different in purpose: this file is durable instructions; the working file is a ledger.
