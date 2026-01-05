# Migration Guide

How to create effective migration documents for component refactors.

## Purpose

Migration documents guide incremental, safe refactoring of components. They break big changes into small phases, document decisions, and track progress.

## When to Create One

Create a `<migrate-component>.md` when:
- Refactoring affects multiple files
- Changes break existing functionality temporarily
- Work spans multiple sessions
- You need to track what's done vs. what's planned

## Document Structure

### 1. Overview Section

**What it needs:**
- Brief description of the refactor goal
- List of main objectives (3-5 bullet points)
- Why we're doing this

**Example:**
```markdown
## Overview

Breadcrumbs.svelte currently mixes three concerns: data selection, layout calculation, and rendering. This refactor separates these concerns using composition patterns.

**Goals:**
- Move mode logic to parent component
- Extract separator into reusable component
- Improve reactivity and testability
```

### 2. Current Implementation

**What it needs:**
- Location of files
- Current props/API
- Key code snippets showing the problem
- How it's currently used

**Keep it factual** - just describe what exists, don't editorialize yet.

### 3. What It Does Well

List the good parts that should be preserved:
- Clean interfaces
- Good composition patterns already in use
- Proper separation that exists

This helps you not throw out good code during refactoring.

### 4. Improvement Opportunities

**This is where you identify problems:**
- Tight coupling
- Mixed concerns
- Hard-to-test code
- Missing flexibility

Be specific about what's wrong and why it matters.

### 5. Refactor Suggestion

**Show the vision:**
- Code examples of the proposed new API
- Component structure diagram (if helpful)
- List concrete benefits

Keep it brief - details go in the phases.

## STOP WRITING DOCUMENT

This is a good stopping point. Gives me a chance to consider the suggestions and erase or add. Wait until asked to resume.

### 6. Migration Plan

**This is the heart of the document.**

Break the work into phases. Each phase should:
- Be completable in one session
- Leave the app in a working state (when possible)
- Have clear checkboxes for tasks

#### Phase Checklist Format

```markdown
### Phase N: Descriptive Name

- [ ] **Task name** ✅
  - Specific detail about what to do
  - Another detail
  - Result or file location
```

Use the ✅ emoji ONLY in completed checkboxes `[x]`, not uncompleted ones `[ ]`.

#### Common Phase Pattern

Most refactors follow this pattern:

**Phase 1: Preparation**
- Review usage (where is it used?)
- Document behavior (what does it do?)
- Run existing app and verify it works
- Take screenshots for comparison

**Phase 2: Extract Components**
- Create new sub-components
- Test them in isolation
- Don't integrate yet

**Phase 3: Refactor Main Component**
- Integrate extracted components
- Keep same external API (no breaking changes)
- Verify everything still works

**Phase 4: Update Consumers**
- Move logic to parent/consumers
- Change component API if needed
- Update all usage sites

**Phase 5: Testing & Cleanup**
- Comprehensive testing
- Remove dead code
- Update documentation
- Commit changes

#### Breaking Changes Warning

If a phase breaks the app temporarily, add a clear warning:

```markdown
**WARNING**: These changes break breadcrumbs until Phase 4 is completed.
```

### 7. Work Performed Sections

**Location:** At the END of each phase (not in a separate section)

**Heading:** Use `#### Work Performed` (not "Phase X Work Performed")

**What to include:**
- Tasks completed (with ✅)
- Key findings or decisions
- Code changes (before/after snippets)
- What was NOT changed (important!)
- Results (does it work? is layout correct?)

**Example:**
```markdown
### Phase 3: Refactor Parent

- [x] **Import Breadcrumb_Separator** ✅
  - Added: `import Breadcrumb_Separator from './Breadcrumb_Separator.svelte';`

- [x] **Replace inline separator with component** ✅
  - Replaced `<div class='between-breadcrumbs'>` with `<Breadcrumb_Separator {color} {left} />`
  - Kept all other code unchanged
  - No breaking changes

#### Work Performed

**Tasks completed:**
1. ✅ Imported Breadcrumb_Separator component
2. ✅ Replaced inline separator with Breadcrumb_Separator

**Import added:**
[code snippet]

**Template change:**
[before/after code]

**What was NOT changed:**
- No new props added
- No mode logic moved
- Layout positioning unchanged

**Result:**
- ✅ App works exactly as before
- ✅ Layout is correct
```

### 8. Issues Identified

Optional section listing known problems discovered during work:
- Bugs found
- Technical debt
- Future improvement opportunities

### 9. Files to Modify

Simple list of files that will change:

```markdown
**Create:**
- `/path/to/NewComponent.svelte` ✅ DONE

**Modify:**
- `/path/to/ExistingComponent.svelte` (Phase 3)
- `/path/to/Parent.svelte` (Phase 4)
```

## Writing Style

Follow `voice.md` guidelines:
- Casual, first-person perspective
- Problem-first (describe the pain before the solution)
- Concise (no fluff)
- Specific (concrete examples over abstract theory)

## Common Pitfalls to Avoid

**Don't make phases too big**
- If a phase has >5 tasks, split it
- Each phase should be doable in one sitting

**Don't skip the "what it does well" section**
- This prevents you from breaking good code
- Preserves valuable patterns

**Don't leave "Work Performed" empty**
- Always document what actually happened
- Include what DIDN'T change (prevents confusion)

**Don't forget layout verification**
- Visual bugs are the worst
- Always verify layout after changes

**Don't use "Phase X Work Performed" as heading**
- Just use "Work Performed"
- It's clear from context which phase it refers to

## Keeping It Updated

As you work:
1. Check off completed tasks with `[x]`
2. Add ✅ emoji after checked tasks
3. Fill in "Work Performed" at end of each phase
4. Update TOC if adding sections
5. Note any deviations from the plan

## Example Structure

```markdown
# Component Migration Guide

## Table of Contents
- [Overview](#overview)
- [Current Implementation](#current-implementation)
- [What It Does Well](#what-it-does-well)
- [Improvement Opportunities](#improvement-opportunities)
- [Refactor Suggestion](#refactor-suggestion)
- [Migration Plan](#migration-plan)
  - [Phase 1: Preparation](#phase-1-preparation)
  - [Phase 2: Extract Components](#phase-2-extract-components)
  - [Phase 3: Refactor](#phase-3-refactor)
  - [Phase 4: Update Consumers](#phase-4-update-consumers)
  - [Phase 5: Testing & Cleanup](#phase-5-testing--cleanup)
- [Issues Identified](#issues-identified)
- [Files to Modify](#files-to-modify)

## Overview
[Vision and goals]

## Current Implementation
[What exists today]

## What It Does Well
[Good parts to preserve]

## Improvement Opportunities
[Problems to solve]

## Refactor Suggestion
[Proposed solution]

## Migration Plan

### Phase 1: Preparation
[Tasks and checkboxes]

#### Work Performed
[What actually happened]

### Phase 2: Extract Components
[Tasks and checkboxes]

#### Work Performed
[What actually happened]

[... more phases ...]

## Issues Identified
[Known problems]

## Files to Modify
[File list]
```

## Tips for Success

**Start with phase 1 tasks**
- Don't skip preparation
- Understanding current state prevents mistakes

**Keep the app working**
- Each phase should leave things functional
- Exception: Phase 3/4 breaking changes are OK if Phase 4 fixes them

**Document layout concerns**
- Layout bugs are subtle and annoying
- Always verify visual correctness
- Add "make painfully certain layout is not broken" to tasks

**Be honest in "Work Performed"**
- Document failed attempts
- Note what didn't work
- Explain why you changed the plan

**Update as you go**
- Don't wait until the end
- Fresh details are more accurate

## Real-World Example

See `/notes/designs/refactor/breadcrumbs.md` for a complete example showing:
- How phases evolved
- What worked and what didn't
- How documentation accumulated
- Layout verification process
