## Guide for creating md files

This anchor-strategy might be a hack. This is the first attempt to formalize the material in the analysis section.

## Table of Contents
- [Guide for creating md files](#guide-for-creating-md-files)
  - [Debugging](#debugging)
    - [1. Create stable anchor targets](#1-create-stable-anchor-targets)
    - [2. Write problems and goals inline](#2-write-problems-and-goals-inline)
    - [3. Collect a summary section](#3-collect-a-summary-section)
    - [4. Editing workflow](#4-editing-workflow)
    - [5. Why this pattern works](#5-why-this-pattern-works)

### Debugging

#### 1. Create stable anchor targets
- **Use headings as anchors**: Each `#`, `##`, `###`, etc. line becomes a linkable anchor.
	- Example: `#### Coordinate system proliferation` → anchor `#Coordinate system proliferation`
- **Promote important bullets to subheaders**:
	- When a bullet contains a distinct concept (e.g., a problem family), turn it into a heading (`####` or `#####`) so it has a stable, human-readable anchor.
	- Keep its inner bullets (details, examples, problems/goals) nested under that heading.

#### 2. Write problems and goals inline
- **Keep source-of-truth near the heading**:
	- Under each heading, write `**Problem**` / `**Goal**` bullets close to the code or concept they describe.
	- Example:
		- `**Problem**: Chained calls make it unclear which coordinate system a value is in`
		- `**Goal**: Establish clear coordinate system hierarchy with explicit transformation points`

#### 3. Collect a summary section
- **Create a `## Summary` at the end**:
	- Split into `### Problems` and `### Goals`.
- **Group by originating section**:
	- For each heading that defines problems/goals, add a group marker that links back to it:
		- `- From [[#Coordinate system proliferation]]`
	- Under that line, copy the problem/goal sentences as plain bullets, stripping the `**Problem**:` / `**Goal**:` prefixes.
	- Do **not** rephrase in the summary; it should be a faithful copy so it stays in sync with edits.

#### 4. Editing workflow
- **When you add a new problem/goal**:
	- Add it under the appropriate heading with the `**Problem**` / `**Goal**` prefix.
	- Then mirror it into the `## Summary`:
		- If the heading already has a `- From [[#...]]` group, append the new bullet there.
		- If not, create a new `- From [[#Heading text]]` group and add its bullets.
- **When you rename a heading**:
	- Update the text after `[[#...]]` in the summary to match the new heading text, so links keep working.

#### 5. Why this pattern works
- **Local + global view**:
	- Each heading carries its own detailed problems and goals (local context near the code).
	- The summary gives a scan-friendly, grouped list of everything (global context) with links back to detail.
- **Anchor stability**:
	- Using real headings as anchors keeps links predictable and readable.
	- Grouping via `From [[#Heading]]` makes the origin of each problem/goal explicit.



