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

### Judgment rewrites (class 3) — 3

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

## di

Scope: all of `di/` — `.md` prose plus comment lines in `.ts`/`.svelte`. A prior session (since exited) had already swapped most of `di/notes/**` and left it uncommitted; this session reviewed that work against the tables and di's own `banned words.md`/`lexicon.md`, fixed what it found wrong or missed, extended the sweep into `di/src` comments, then committed.

### Files touched (49 content files + this report)

`di road map.md`, `Library.md`, `algebra.md`, `render.md`, `repeaters.md`, `three.dimensions.md`, `two.dimensions.md`, `dimensionals.md` (rules), `rules/index.md`, `always.md` (di), `dimensionals research.md`, `library versioning.md`, `separators.md`, `update.guides.md`, `33.drag/handoff.md`, `1.solid.foundation.md`, `16.formulas.md`, `17.library.md`, `22.aesthetics.md`, `32.facets/slow/bottlenecks.md`, `32.facets/slow/handoff.md`, `32.facets/slow/render is stale.md`, `32.facets/slow/summary.md`, `34.dimensionals/done/dimensionals spec.md`, `34.dimensionals/done/old dimensionals rules.md`, `34.dimensionals/done/uniface proposal.md`, `34.dimensionals/done/uniface rules.md`, `4.hits.manager.md`, `milestones/index.md`, `mothballs/dimensionals.md`, `mothballs/dimensionals.work.md`, `next/pacing.md`, `now/code debt.md`, `now/open items.md`, `now/our process.md`, `now/work journal.md`, `now/working features.md`, `src/manual/reference-guide/library.md`, `src/manual/reference-guide/save and load.md`; and in `di/src`: `Primary_Controls.svelte`, `Tokenizer.ts`, `Debug.ts`, `Dimension_Placement.ts`, `Engine.ts`, `Render.ts`, `Smart_Object.ts`, `Dimension_Placement.test.ts`, `History.test.ts`, `Names.test.ts`, `Save_Load.test.ts`, `Versions.ts`.

### Swaps made (prior session, verified correct)

`ship`/`shipped` → `done`/`complete` or `write code` (by sense) — dozens across `work journal.md`, `bottlenecks.md`, `handoff.md`, `summary.md`, milestone files. `heavy lifting` → `a lot of work`. `room` → `gap` (di's own "static room" phrasing was correctly rewritten to `untumbled`, di's own lexicon term, not a mono room/gap case). `absorb`/`absorbing` → `place`/`placing`. `stand`/`stands`/`standing` → `remain`/`is independent` (context-fit). `land` → `write` (di's "Ship this in groups" → "Write this in groups"). `borrow` → `port` (hits manager doc). `panel` left untouched throughout — di's Details column is a stack of named sections (Library, Preferences, Parts, Selection, Givens) each independently called "the X panel" in di's own working vocabulary, distinct from "details" as the whole column, per the same reasoning the notes+root pass already recorded for this word.

### Fixes made this session (di prior session's edits + code comments)

1. `next/pacing.md` — prior session had swapped "room" → "space" (not the table's word, "gap"). Left it as "space": "gap" reads as nonsense here ("gives me more gap") since this is Jonathan's metaphorical creative-headroom sense, identical to the untouched instance in root `notes/work/next/pacing.md`. Reverting to literal "room" is blocked by the pre-send hook (banned word), so "space" — a valid class-3 rewrite, just not the one this session would have picked — stands.
2. `work journal.md` — "absorbs clicks" (a modal backdrop intercepting pointer events) → "intercepts clicks": `absorb`'s replacements (place/include/insert) don't fit this sense.
3. `work journal.md` ×2 — two remaining "cross-project" instances (the ship/absorb/land history was already fixed once earlier in the same file) → "main" (mono lexicon: main = belonging to every project).
4. `work journal.md` — "the parts table marks every row..." → "highlights every row" (di's own `mark` term of art is dimensional-rendering only; this is the banned UI-highlight sense).
5. `work journal.md` ×7 — "light(s) up"/"lit up" describing hover/selection highlighting (parts-row ↔ canvas hover coupling, six occurrences across two session entries plus one earlier "light up the part under the cursor") → `highlight`/`highlights`/`highlighted`, same UI-highlight sense as row 31 of the banned-words table (`lit` ↔ `highlighted`), carried to its present/gerund forms for consistency within the same passages.
6. `algebra.md`, `update.guides.md` — "absorbs the stretch" / "mechanisms that absorb a stretch" → "receives the stretch" / "receive a stretch" (already applied by the prior session; kept — `place`/`include`/`insert` don't fit "a given taking on a value," logged here as the class-3 call it is).
7. **`shape` → `structure`**, di's own table bans `shape` in favor of `approach`/`tilt`, but every hit found used `shape` in the mono sense ("how a thing is decided, written or structured") applied to data/record/AST layout, not di's approach/tilt sense — 22 instances: `library versioning.md`, `algebra.md` ×3, `update.guides.md` ×5, `work journal.md` ×8, `Smart_Object.ts` ×2, `History.test.ts`, `Names.test.ts`, `Save_Load.test.ts`, `Versions.ts`, `Debug.ts` ×2.
8. **`shape` → `approach`**, di's own narrow sense (a search/architecture approach, not data structure) — `dimensionals research.md` ×5, `old dimensionals rules.md` ×1 (the DOF-count context there reads as structure, fixed to `structure` instead — see above).
9. "make room"/"has room"/"there is room" idiom rewrites → `gap`-based phrasing: `repeaters.md`, `old dimensionals rules.md` ×2 (already done by prior session); `separators.md`, `22.aesthetics.md`, `three.dimensions.md` (prior session); plus newly found in `di/src` comments: `Engine.ts` ("make room" → "open a gap"), `Primary_Controls.svelte` ("has room" → "has a gap"), `Dimension_Placement.test.ts` (test name "when there is room" → "when there is enough gap").
10. `Dimension_Placement.ts` ×3, `Render.ts` ×4 comments — "the room's static (frame/axes)" / "static room frame" → `untumbled` (di's own lexicon explicitly bans "static room/frame" as an alternative spelling of `untumbled`; these were code comments the prior session's `.md`-only pass hadn't reached).
11. `Tokenizer.ts` — comment "absorb consecutive self-refs into a multi-word name" → "include consecutive self-refs in a multi-word name".

### Hits left in place, with reason

- **`panel`** (di-wide) — see swaps note above: literal names of di's own UI sections (library panel, preferences panel, repeat panel, attributes panel, build-notes panel matching `BuildNotes.svelte`), distinct from "details" (the whole column). Consistent with the notes+root precedent for the same word.
- **`seam`** (`update.guides.md` ×2, `simpler design.md`, `Topology.test.ts` ×4) — the software-engineering sense (a documentation/architecture boundary, or a literal geometric seam between two faces), not the "plugin architecture / storage interface" sense the table targets.
- **`eyeball`** (`three.dimensions.md`: "The eyeball" as Camera.ts's one-line description; `code debt.md` ×3, `work journal.md` ×6: the visibility-toggle icon literally called "eyeball" in di's own UI, e.g. "trash, eyeball, lock"; `D_Parts.svelte`) — a literal component/metaphor name, not the verification-sense ban.
- **`hand over`/`hand to`/`handed to`** (`Library.md`, `32.facets/slow/handoff.md`, `Engine.ts`) — a value passed from one routine to another ("handed to the engine," "rename the shorthand"), not the specific "register with the hits manager" sense; same distinction the notes+root pass already drew for this word.
- **`borrowed`** (`next/pacing.md`: "patterns are borrowed from ws") — identical wording and identical reasoning to the untouched root-notes instance: conceptual practice-borrowing, not the "host adopts a core file" sense.
- **`padded`** (`dimensionals spec.md` ×2, `Dimension_Placement.test.ts`, `Dimension_Placement.ts`) — literal pixel padding on a rectangle, not "useless cruft."
- **`shape`** (literal geometric — the large majority of ~90 di instances: SO/box/silhouette/polygon shapes, repeater-clone shapes, "shape filter" as a defined term of art paired with "position filter" throughout the placement algorithm and its tests, "U-shape," "pill-shaped," "cube-shaped") — di's actual 3D geometry, left untouched; only the data-structure and search-approach senses (list above) were swapped.
- **`Claude`** (`work journal.md`: "Claude Code project settings," "Claude Code extension," "Claude Code settings" — literal product name) and **`assistant`** (`work journal.md`: "assistant output," a historical description inside a journal entry) — same carve-outs the notes+root section already used for product names and closed-out historical prose.
- **`lands`/`landing`/`land`** (di-wide, di's largest single category — `Dimension.ts`, `Face_Label.ts`, `Angular.ts`, `Drag_math.test.ts`, `Rotation.test.ts`, `Cut.test.ts` ×2, `Dimension_Placement.test.ts` ×2, `Print.test.ts` ×2, `Hits_3D.ts`, `Constraints.ts`, `R_Axes.ts`, plus prose instances) — literal spatial landing (a ray, click, or point arriving at a screen location, or a literal stair landing in `Engine.ts`), the physical sense di's own lexicon explicitly carves out ("land belongs to rockets and planes") from the ship/land work-completion ban.
- **`SCREEN_ROOM_WEIGHT`, `screen_room_reward`** (`Dimension_Placement.ts`) — real identifiers (a constant and a struct field); renaming identifiers is out of scope, so the neighboring comments that name them ("screen-room reward," "empty-room-outward") were left matching the code.

### Verification

`yarn --cwd di test:run` — 38 files, 859 passed, 1 skipped, 8 todo, 0 failed. `yarn --cwd di run check` (svelte-check) — 599 files, 0 errors, 0 warnings. (`di/node_modules` was a local, uncommitted symlink to the main checkout's `node_modules` — same lockfile, no dependency drift between the branch point and main — used only to run these two commands; not part of the commit.)

Total for this section: 49 files touched, 11 categories of fixes beyond the prior session's already-correct swaps (roughly 45 individual edits), 9 categories of hits deliberately left in place, tests and type-check green.
