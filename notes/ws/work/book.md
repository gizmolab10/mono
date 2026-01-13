# Book

## Problem

This is getting to be a lot of material. Perhaps overwhelming to a newbie. I want to understand what's missing and how to inject it.

## Goal

Document what makes great technical writing feel great, how to achieve it, and what raw material is needed to get started.

## Approach

### What Makes Great Technical Books Feel Good

**Narrative thread.** Not just facts dumped in order. There's a story — here's where we started, here's the problem we hit, here's how we solved it. Even dry topics have a journey.

**Voice.** A human wrote this. You can hear them thinking. They have opinions, frustrations, moments of delight. Not corporate-speak, not textbook-neutral.

**Pacing.** Dense sections followed by breathers. Code blocks broken up by explanation. Short sentences after complex ones. Rhythm.

**Earned complexity.** Simple first, then build. Never dump the hard stuff without setup. Each concept earns its place by solving a problem you now understand.

**Concrete before abstract.** Show the specific case, then generalize. "Here's what happened" before "here's the principle."

**Respect for the reader.** Assumes intelligence, doesn't assume knowledge. Explains without condescending. Doesn't hide difficulty but doesn't exaggerate it either.

**Moments of humor or humanity.** A wry aside. An admission of a dumb mistake. Keeps you reading because the author feels real.

### How To Do It



1. **Start with the pain.** What sucked? What was confusing? What broke? That's your hook.
2. **Tell the story of figuring it out.** Not "here's the answer" but "here's how I got there." Include dead ends if they're instructive.
3. **Use your actual voice.** Read it aloud. Does it sound like you talking? If not, rewrite.
4. **Vary sentence length.** Long explanation. Short punch. Like this.
5. **One idea per paragraph.** If you're covering two things, split it.
6. **Code in context.** Don't just show code — show why this code, why now, what it replaces.
7. **Name the tradeoffs.** Nothing is perfect. Say what you gave up.
8. **End sections with what you now know.** Summarize the takeaway. Cement it.

### Starting Material Needed

* **A problem you actually solved.** Not hypothetical. Real friction, real fix.
* **Notes from the journey.** What you tried, what failed, what clicked. Raw is fine.
* **Code snippets.** Before/after. The ugly version and the clean version.
* **Your opinions.** What do you think about this? Don't hedge everything.
* **Questions you had.** What confused you? Others will be confused too.

### What's Likely Missing



1. **"Start here" entry point.** Where does a newbie begin? The digest lists everything equally. No hierarchy of "read this first."
2. **Progressive path.** A suggested reading order. "Understand state before managers. Understand managers before UX."
3. **Context-setting intro.** "What is webseriously? What problem does it solve? Why is it built this way?" Before diving into components and databases.
4. **Glossary or quick reference.** All those prefixes (S_, w_, G_, T_) — a newbie sees them everywhere with no decoder ring upfront.
5. **"Big picture" diagram.** How the pieces connect. Visual map before detailed terrain.

## Audit

### Entry Points

| Doc | Has "start here" feel? | Notes |
|----|----|----|
| digest.md | ❌ | Lists everything flat, no guidance |
| designs/index.md | ❌ | Just links, no context |
| architecture/index.md | ❌ | Lists managers, no intro |
| guides/index.md | ⚠️ | Has a sentence of context, but not newbie-oriented |

### Progressive Path

*Does any doc explain dependencies between concepts?*

| Concept | Depends on | Documented? |
|----|----|----|
| managers | state | ❌ |
| UX | managers, state | ❌ |
| hits | state, geometry | ❌ |
| components | state, managers | ❌ |

### Context-Setting

*Does anything explain what webseriously IS?*

- [ ] What problem does it solve?
- [ ] Who is it for?
- [ ] Why these architectural choices?
- [ ] High-level "here's how it works"

### Glossary

*Are prefixes explained anywhere?*

| Prefix | Explained in | Findable? |
|----|----|----|
| S_ | state.md | ⚠️ buried |
| w_ | state.md | ⚠️ buried |
| G_ | geometry.md | ⚠️ buried |
| T_ | style.md | ⚠️ in naming section |
| k, h, s, x, g, p, u, e, c | style.md | ⚠️ in prefixes table |

### Big Picture

*Visual overview exists?*

- [x] Architecture diagram — `architecture/overview.md`
- [ ] Data flow diagram
- [ ] Component relationship map

### Full Review of all `md` files in `notes/designs`

*Is the documentation content* (1) [well organized](#_1-organization) (2) [complete](#_2-completeness) (3) [articulated with my voice.md](#_3-voice-consistency-vs-voice-md) (4) [contain redundancies](#_4-redundancies) (5) [needs more explanation](#_5-areas-needing-more-explanation) (6) [spelling or grammatical errors](#_6-spelling-grammatical-errors)?

*39 markdown files were reviewed, across `notes/designs` (excluding `work`), totaling 50,000+ words.*

#### 1. Organization

**Strengths:**

* Logical hierarchy: architecture/ (what/why) vs guides/ (how)
* digest.md provides quick-reference synopses
* overview.md offers reading order + architecture diagram
* Each directory has index.md for navigation

**Issues:**

* "further" and "more" directory names are vague — unclear distinction. Suggest: "further" → "integrations/platforms", "more" → "patterns/internals"
* breadcrumbs.md overloaded with extensive migration plan (w_ancestry_focus refactor) — should move to work/ or migrations/
* controls.md contains grow/shrink → Next_Previous migration plan — same issue
* Naming overlap: architecture/core/ux.md (UX Manager) vs architecture/ux/ (UX components) could confuse

**Recommendation:** Create top-level migrations/ directory for in-progress refactor plans.

#### 2. Completeness

**Well-Covered:**

* State management (state.md excellent)
* Manager architecture (comprehensive)
* Hit testing (thorough)
* Database abstraction (complete)
* Component architecture (detailed)
* Style/color management (well-documented)
* Svelte patterns and gotchas

**Gaps:**

* Testing guide (how to write/run tests, patterns)
* Error handling patterns (no flow documentation)
* Adding new components (no step-by-step)
* Tree vs Radial mode (referenced everywhere, never consolidated)
* Ancestry/Thing relationship (core concept assumed but not explained)
* Import/Export features (mentioned in project.md, no dedicated doc)
* Accessibility (not mentioned)
* search.md (thin compared to other UX docs)
* draw/ components (SVG primitives barely touched)

**digest.md Accuracy Issue:** Lists svelte.5.md under Guides, actually in architecture/further/

#### 3. Voice Consistency (vs voice.md)

**Voice Guidelines:** First-person, lowercase "i", problem-first, casual language, short punchy sentences, show emotion.

**Files Nailing Voice:**

* paging.md: "Lots of ghastly geometry goes into making it feel comfortable"
* preferences.md: "It's a computer, for crying sake"
* styles.md: "i admit it, my early code was a nightmare"
* buttons.md: "These just cropped up, ad-hoc"
* debugging.md: "going around in circles, unable to consider venturing outside the box"
* refactoring.md: "Man crawling across the desert"
* gotchas.md: "Ack, i get this cryptic error"

**Voice Lost in Body Content:**
Pattern: Synopses are great, body content reverts to formal technical writing.

Examples:

* components.md: Good synopsis, body reads like generated documentation
* managers.md: Short synopsis, mostly formal tables
* databases.md: Great synopsis, body purely technical
* persistable.md: Completely formal, no personality
* state.md: Starts casual, becomes dense
* controls.md, details.md, breadcrumbs.md: Good synopses, formal bodies

**Observation:** Guides (debugging.md, gotchas.md, chat.md) maintain voice better than architecture docs.

#### 4. Redundancies

**Significant Overlaps:**



1. **project.md vs overview.md:** Manager list in both, database types in both, state management overview in both, naming conventions in both
2. **State management explained in:** state.md (primary), components.md (S_Component vs S_Element section), managers.md (store patterns), project.md (architecture section)
3. **Hit testing documented in:** hits.md (primary), components.md (Pattern 3), timers.md (references and builds on)
4. **digest.md** — By design duplicates all synopses (maintenance burden: any synopsis change needs two edits)
5. **breadcrumbs.md** — Contains meta-commentary section "Comparison: Architecture vs Design Documents" explaining why two breadcrumbs docs exist (unnecessary)
6. **S_Snapshot** — Detailed in styles.md, referenced from state.md (unclear authoritative location)
7. **Migration plans** — In architecture docs (breadcrumbs.md, controls.md) duplicate what should be tracked elsewhere

#### 5. Areas Needing More Explanation



1. **search.md** — Thinnest UX doc. Missing: search index internals, performance characteristics, edge cases
2. **Ancestry concept** — Referenced constantly, never gets own explanation. How does Ancestry relate to Thing? Why both?
3. **Tree vs Radial differences** — Every component doc mentions differently. Needs consolidated explanation.
4. **draw/ components** — One paragraph in components.md. SVG primitives worth more.
5. **Testing patterns** — gotchas.md mentions tests, no guide for writing them
6. **How to add new component** — No walkthrough for common developer task
7. **"trigger" pattern** — Used extensively (Breadcrumbs, others), mentioned in reactivity.md, deserves own explanation given centrality
8. **S_Items** — Used everywhere (si_grabs, si_recents, si_found), never fully explained
9. **performance.md** — Would consolidate scattered performance notes

#### 6. Spelling/Grammatical Errors

**Formatting Issues:**

* vitepress.md: Uses `==The trick==` and `==Note==` (Obsidian-specific syntax, won't render in VitePress)
* breadcrumbs.md: Same Obsidian `==highlight==` syntax
* access.md: `**Note**:` should be `**Note:**` (colon inside bold)

**Inconsistencies:**

* Lowercase "i" usage inconsistent (voice.md says use in casual contexts, but many files use capital "I" throughout when should be casual)
* Quote styles mixed (single/double in prose, not code)

**Typos:**

* project.md: "beyond the scope off this file" → "of"
* overview.md: Reference link format inconsistent (some use ./ prefix, some don't)
* components.md: Run-on sentence in state management description

**Markdown Issues:**

* Some bullet lists lack blank lines before them (inconsistent rendering)
* Some headers have inconsistent spacing
* A few code blocks missing language identifiers

#### Summary Recommendations

**Quick Wins:**

1. Fix Obsidian `==highlight==` syntax in vitepress.md and breadcrumbs.md
2. Fix "off" → "of" in project.md
3. Move migration plans from breadcrumbs.md and controls.md to work/ directory
4. Correct digest.md to show svelte.5.md in architecture/further, not guides

**Medium Effort:**

1. Rename "further" and "more" directories to be more descriptive
2. Write brief "Ancestry & Things" explainer
3. Expand search.md
4. Add testing guide

**Larger Effort:**

1. Sustain voice through body content, not just synopses
2. Consolidate state management documentation to reduce redundancy
3. Create single authoritative location for S_Snapshot documentation
4. Write "Tree vs Radial Mode" comparison doc

#### Overall Assessment

Documentation is thorough and well-structured. Main issues: voice fading in detailed sections, some redundancy between reference docs, a few missing topics. Synopses are excellent and consistent with voice.md guidelines.

## Resolution

*Pending — decide what to create first.*