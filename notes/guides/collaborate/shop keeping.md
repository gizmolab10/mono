# Shop keeping

The project's notes are infrastructure. They guide every session that comes after the one that wrote them. When a session ends with notes in the wrong shape — content in the wrong file, old gaps marked as gaps that have already been closed, completed work cluttering the active-work area — the next session starts at a disadvantage. Shop keeping is the work of fixing that shape so the notes keep guiding well.

For what each file is — handoff, work journal, code debt, and the rest — see the handoff pieces in [workflow.md](workflow.md).

## What shop keeping does

- **Moves completed work to where it belongs.** Done work belongs in the work journal as a session entry, not in the handoff under the word "open" or in the open-items file.
- **Removes what is addressed.** Once a gap is filled in a design, the "what's missing" entry that named the gap becomes clutter and gets deleted, not annotated. Once a planned step is done, the step's open-items entry gets dropped.
- **Collapses the active surface.** The handoff and the open-items file are read at the start of every session. They are kept short on purpose. Everything substantial that survives those two files lives elsewhere — in a guide, in a lesson, in a journal entry, in a design proposal — where the next session can find it on demand instead of paying its cost on every read.
- **Captures what would otherwise be lost.** A bug fix that surfaced a general pattern goes into the lessons file. A workflow prerequisite that bit one session and would bite the next goes into a setup note. A reasoning chain that justified a deferred decision goes into the design document where the decision lives, not into the chat that produced it.
- **Holds the lexicon.** When the project's vocabulary drifts, shop keeping renames the file and the references across hooks, indexes, the map, and the memory files so the lexicon stays the source of truth.

## Recent case — consolidating the uniface rules and the uniface proposal

The uniface design moved through several rounds of consolidation across the last few sessions.

**The rules file.** Started with eight numbered rules plus a separate "abandoned rules" enumeration and a long carry-over list that named other-spec rules by number only. The other-spec rules got pulled in verbatim, renumbered as rules 9 through 28 in the same file, with banned words swapped to the project's lexicon (template to master, paint to render, search to placement algorithm, slidable position to label position, combined silhouette outline to silhouette box), concept names rephrased where the spec model had moved (the witness-length degree of freedom became the witness-index degree of freedom; the four-degrees tuple changed shape), and cross-references repointed to the new rule numbers. The abandoned-rules enumeration got dropped once its content was either folded into the carry-over rules or rendered obsolete by the new design.

**The proposal file.** Built up from a one-paragraph intent into a structured document: preparation, phase 1 with two test groups (Group A keeps, Group B disables), phase 2 with eight numbered steps. Each step gained an exit criterion. The visible-output steps were tied to per-step visual inspection by the user, with an explicit rejection branch (fix code, switch alternative, or surface as spec question). Hard parts were named so the reader can pace themselves. Missing steps that the original sketch had assumed away — renderer wiring for label text, visual baseline capture, interactive-layer audit, user-override placeholder — were each added as numbered phase 2 steps and the issue list that called them out got dissolved into the steps themselves.

**The active-work surface.** The handoff file was carrying twenty-plus completed proposals plus many unnumbered bug-fix sections. Today those moved out: three consolidated session-window entries in the work journal cover the algorithm rewrite, the painter and parity gaps, and the uniface design capture. Four open items in the open-items file cover the four threads of work still ongoing. Two standalone notes captured a generally useful pitfall and a workflow prerequisite. The handoff itself shrank to its header plus the reference-material list — the active-work surface is now small enough to read in one glance.

**The design-creation guide.** Three new rules came out of the session's mistakes: quote the architect's compound terms intact, treat emotional reactions as problem reports not redesign authority, and require a rejection branch on every plan whose acceptance criterion is human visual inspection. All three got added to the guide so future sessions inherit the discipline without re-paying the cost.
