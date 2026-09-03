---
kind: analyze
title: Big rewrite log
description: running report for the mechanical sweep (branch sweep/unmurk) — banned words and lexicon swaps across every project
tags: [now]
date: 2026-09-03
---
# Big rewrite log

Running report for the unsupervised mechanical sweep on branch `sweep/unmurk`. See [[rewrite the guides]] for the plan this executes.

Sections below are appended one per top-level folder as the sweep proceeds. Each section lists: files touched, every swap (word → replacement, count), every class-3 judgment rewrite (file, line, old → new), and every hit left in place with its reason.

## Murk translations (murk.jsonl, class 4)

Extracted every row in `.claude/hooks/murk.jsonl` (main checkout, read-only) with both a non-empty `murky` and `plain` field: 42 such rows. Each is a fragment of a past chat reply, not file prose. Grepped distinctive 5–10 word phrases from every one of the 42 rows across every scoped `.md`, `.ts`, and `.svelte` file (notes, core, di, ga, ji, lv, me, ov, ws, root). No verbatim occurrence of any murky wording was found in any swept file — these were spoken translations, not written ones. Nothing to fix for class 4.

## notes + root

Scope: `notes/` (whole tree, ~140 `.md` files + 9 `.ts` files) and root `*.md` (`README.md`, `2026-06-11.md` — the latter is empty, nothing to do). `banned words.md` and `lexicon.md` themselves untouched, as required.

One method note: an early `xargs grep` pass silently mis-handled the ~30 filenames in this tree that contain spaces (`create a design.md`, `kinds of tasks.md`, etc.) — xargs split each into multiple bogus arguments. Caught it and re-swept every one of those files individually with `find -exec`; several real hits (mostly more `collaborator`/`assistant`/`shipped` instances) turned up only on the second pass and are included below.

### Files touched (30 content files + this report)

`notes/work/journal.md`, `notes/work/done/class-lists.md`, `notes/guides/develop/css.md`, `notes/work/worktrees.md`, `notes/work/co.md`, `notes/guides/collaborate/workflow.md`, `notes/guides/develop/sections.md`, `notes/guides/pre-flight/agency.md`, `notes/work/learn.md`, `notes/guides/collaborate/breakdown.md`, `notes/guides/collaborate/voice.md`, `notes/guides/collaborate/hooks.md`, `notes/guides/collaborate/jonathan.md`, `notes/guides/collaborate/expectations.md`, `notes/guides/collaborate/chat.md`, `notes/guides/develop/refactor.md`, `notes/guides/collaborate/index.md`, `notes/guides/pre-flight/gotchas.md`, `notes/guides/pre-flight/shorthand.md`, `notes/guides/philosophy/limitations.md`, `notes/guides/setup/onboarding.md`, `README.md`, `notes/work/next/curiosity.md`, `notes/work/next/retention-test.md`, `notes/guides/develop/build notes.md`, `notes/guides/philosophy/logic driven design.md`, `notes/guides/pre-flight/kinds of tasks.md`, `notes/guides/develop/create a design.md`, `notes/work/done/single project.md`, `notes/guides/develop/create a proposal.md`.

### Swaps made (61 total)

| Word → replacement | Count | Files |
| --- | --- | --- |
| absorb → inserted / include | 2 | journal.md ("absorbed `simplicity.md` into" → "inserted … into"); single project.md ("Keep or absorb?" → "Keep or include?") |
| heavy lifting → a lot of work | 2 | class-lists.md, css.md (identical duplicate sentence in both) |
| ship/shipped → completes/completed | 4 | co.md ("Co ships the architecture" → "Co completes the architecture"); build notes.md ×3 ("shipped capability", "shipped milestone", "parked rather than shipped", "shipped fix chains" — one edit covered the first two) |
| room → gap | 1 | voice.md quoted synopsis example ("not enough room" → "not enough gap") |
| shape → structure | 3 | learn.md ("watch for the shape" — a recurring mistake-pattern), workflow.md ("the whole shape plain"), breakdown.md ("common shape is a guess reported as a fact") — all three meant "structure/pattern", none were geometric |
| stand/standing → remain/unchanged | 2 | sections.md ("all stand until those are converted" → "all remain…"); agency.md ("leave every prop, field and export standing" → "…unchanged") |
| Claude → co (generic collaborator reference, not the product name) | 17 | workflow.md ×4, voice.md ×2, hooks.md ×8, onboarding.md ×1, README.md ×2 |
| collaborator/assistant → co | 28 | jonathan.md ×4, expectations.md ×1, chat.md ×5, refactor.md ×1, index.md ×1, gotchas.md ×1, shorthand.md ×1, limitations.md ×4 (title, description, H1, "the assistant"), learn.md ×2, curiosity.md ×1, retention-test.md ×1, build notes.md ×1, logic driven design.md ×2, kinds of tasks.md ×1, create a design.md ×1, voice.md ×1 |
| i (co's own first-person self-reference) → co | 1 | create a proposal.md ("a list of options I laid out" → "…co laid out" — the "we" framing elsewhere in that paragraph is fine, only the singular "I" was co speaking of itself) |

### Judgment rewrites (class 4) — 3

1. `notes/work/worktrees.md`, the "What NOT to Do" bullet: "they're session scaffolding, not feature branches." → "they're session infrastructure, not feature branches." (table word "stub out" is a verb phrase and doesn't fit this noun position; "infrastructure" preserves the meaning — temporary technical setup, not a feature branch.)
2. `notes/guides/collaborate/workflow.md`, "Safe updating" list: "Gutting the middle to make room costs everything." → "Gutting the middle to create a gap costs everything." ("make room" is a fixed idiom; "make gap" isn't English, so reworded around the sanctioned noun.)
3. `notes/work/done/single project.md`, Phase 2 checklist: "Create `work/core` scaffold" → "Stub out `work/core`" (rephrased to use the sanctioned verb phrase naturally, matching the checklist's other imperative-verb items.)

### Hits left in place, with reason

Most of the corpus's apparent hits turned out to be a different, legitimate sense of the word once read in context. Grouped by word:

- **copy/copies/copied/copying** (~20 instances, e.g. jonathan-old.md, netlify.md, hooks.md, access.md, pitfalls.md, agency.md, git.md, chat.md, port.md) — all are clipboard/UI copy actions, "a copy" as a plain duplicate-instance noun, or (hooks.md's snapshot-before-edit hook) a factually-necessary copy where "move" would be wrong (the original must stay). None are the specific "said copy, meant move a file" confusion the row targets.
- **mark/marked/marking** (~15 instances, e.g. always.old.md, sites-hub.md, january.2026.md, PHASE*.md, sync-sidebar.ts, markdown-parser.ts, logic driven design.md, unit testing.md) — all generic non-UI "designate/flag/label" usage (marking a task complete, marking a line for deletion, marking a test fixture). Lexicon explicitly carves this out: "generic non-UI mark… is NOT banned." None referred to a UI highlight, a pressable button, a decoration, or a soft-pointer.
- **panel** (8 instances: journal.md ×3, aesthetics.md ×2, best practices.md ×2, build notes.md ×2, unit testing.md ×2) — best practices.md:120 ("Removed snippet-based Panel in favor of direct children in Main") shows "Panel" is a literal named component in di's/ws's own code, and build notes.md's "build-notes panel" matches the actual `BuildNotes.svelte` component visible in this session's git status. journal.md's "Library panel in details" further shows "panel" and "details" are two distinct, nested UI concepts in this vocabulary, not synonyms — swapping panel→details there would have produced "Library details in details." Left all instances rather than guess at an out-of-scope codebase's naming.
- **band/bar/gutter/padding** (~7 instances: aesthetics.md ×3, sections.md, sections spec.md, journal.md, conceptual composition.md) — aesthetics.md uses real, distinct CSS box-model properties (`margin-left` in actual code alongside prose "padding") — collapsing "padding" into "margin" would misstate which CSS property is meant. Others ("a colored bar", "the accent band") describe a solid visual stripe/line element, the opposite of "margin" (empty space).
- **edge** (~20 instances) — nearly all are either literal spatial edges (of a shape, a screen, a list) or the standard "edge case(s)" software idiom, which is its own term of art distinct from "edge = a boundary/threshold value." One genuine code-identifier hit (sections.md/sections spec.md: `edge` as a named, eliminated prop) left untouched per the naming rule.
- **circle/circles** (~10 instances) — "going in circles" is a fixed idiom for an unproductive, repetitive conversation (jonathan.md, cadence.md, breakdown.md, limitations.md, debugging.md, and the `circles`/`going in circles` shorthand and keyword trigger strings, which are functional identifiers, not prose). None describe modules importing each other. Others are literal geometry (quarter-circle arcs, R-tree).
- **split/splits/splitting** (~10 instances) — all describe dividing a phase, a file, or a component into parts (migrate.md, workflow.md, composition.md, personas.md, combined-docs.md, logic driven design.md, use ai.md, markdown structure.md), not "who does what" among people. `.split(...)` in the `.ts` tool files is code, untouched.
- **words** (~25 instances, e.g. co.md, voice.md, workflow.md, breakdown.md, skills.md, hooks.md, pitfalls.md, always.md, shorthand.md, response.md, sections.md, sections spec.md, constants and subtypes.md, create a proposal.md) — all literal readable/typed/spoken text ("in Jonathan's words," "words riding a separator," "spell out full words"), the term-of-art sense the rule explicitly exempts.
- **tree/trees** (~8 instances) — journal.md's "works in both tree and radial" is a ws graph view-mode name; refactor.md's "R-tree (RBush)" and unit testing.md's "evaluable tree"/"source tree" are generic CS data-structure terms; `T_Graph.tree` instances are code. None are ji's hierarchy.
- **hand over/hand to/handed** (6 instances: sections.md ×3, sections spec.md ×3) — describes a parent component passing a prop/value to a child ("hand over how thick it is"), not the "register a target with the hits manager" sense — that file already uses "registers" correctly elsewhere for the actual hits-manager case.
- **room** (pacing.md: "gives me more room, not less. … They have space to grow.") — metaphorical mental/creative space in Jonathan's own first-person reflection, not literal empty space; "more gap" would read as nonsense.
- **cross-project** (journal.md:38, "Cross-project links") — names a link feature that spans any two projects; "main links" (main = belonging to every project) would misdescribe it.
- **nod/eyeball** (accidental.programmer.md: "The AI would nod along (metaphorically)") — the idiom for pretend-listening, not a screen-check confirmation.
- **slid/sliding** (code.md: "Sliding the levels slider") — literal UI slider, the explicit exception in the rule.
- **glob/globbing** (validate-paths.ts, generate-sidebar.ts comments, build.md, hub-app.md, agency.md, gotchas.md, pitfalls.md — several as literal `Glob` tool-name references) — the standard CS term for wildcard file patterns (an actual npm/VitePress concept) or the Claude Code tool name, not "co searching the disk" prose.
- **borrowed** (pacing.md: "patterns are borrowed from ws") — conceptual practice-borrowing between projects, not the specific "host adopts a core file" architecture sense.
- **owed/owes** (skills.md ×2, response.md) — "what is owed" / "nothing is owed" describes pending to-do items or nothing-further-due, not "verification pending."
- **shape** (literal geometric, ~8 instances: lessons.md ×3, aesthetics.md, hits system.md, co.md/chat.md/commoditize.md as the verb "shapes" = influences) — di's 3D shape objects, wing-arc SVG geometry, or the verb sense, none the "decision/structure" noun sense.
- **stand/standing/stands** (remaining ~30 instances after the 2 swaps above, mostly in sections.md and sections spec.md) — all describe where something is positioned on screen, or "stands alone" = exists independently — the rule's own carve-out ("sits, is drawn at" is a different, allowed sense per this task's narrower scope than the raw lexicon text).
- **Claude** (product-name usages, left as-is: setup/access.md, setup/onboarding.md's app-menu instructions, pre-flight/gotchas.md "Claude Code tools," pre-flight/shorthand.md's `claude` trigger keyword, co.md's "Claude Code" example, work/claude agent skills.md, philosophy/use ai.md's "Claude Projects," and every `CLAUDE.md`/`CLAUDE.MD` filename reference across the tree) — literal product/file names, required for the instructions or references to remain accurate.
- **Claude** (historical/archived/public-facing content, left as-is: notes/work/done/gating.md, notes/work/journal.md, notes/work/done/migrations.md, notes/work/next/personas.md, notes/work/next/commoditize.md, notes/work/articles/*.md, notes/work/done/docs/**) — journal entries, closed-out "done" docs, and public-facing article drafts describing a specific past state or written for an external reader who doesn't know "co"; changing these risks misrepresenting what was literally said/named at the time, unlike the living guides where "co" is the house style.
- **collaborator** (4 instances left: how.to.build.it.md, write.article.md, accidental.programmer.md article titles/subtitles; gating.md "A good collaborator would have said…") — the three are public-article titles using the term generically for an outside audience; the fourth is a hypothetical common-noun phrase ("a good collaborator") that doesn't read naturally as the proper name "co."

Total for this section: 30 files touched, 61 swaps, 3 judgment rewrites, ~19 categories of hits deliberately left in place (roughly 150+ individual occurrences) with reasons above.

### Out-of-scope note

`memory/` is read-only for this task and was not swept — no `notes/`-scope search touched it, so nothing to report there.
