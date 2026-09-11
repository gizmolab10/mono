# Markdown Guide

How to structure markdown files for this project.

## Headings as Anchors

Each heading (`#`, `##`, `###`, etc.) becomes a linkable anchor. Use headings for any concept you might want to reference from elsewhere.

```markdown
#### Coordinate system proliferation
```
→ Links as `#coordinate-system-proliferation`

## Problems and Goals

State problems and goals inline, near the content they describe:

```markdown
#### Widget Layout

**Problem:** Widgets overlap when the container resizes.

**Goal:** Widgets reflow gracefully at any width.
```

Keep the source of truth close to the code or concept it describes.

## Summary Sections

For longer documents, add a `## Summary` section that collects problems and goals:

```markdown
## Summary

### Problems
- From [Widget Layout](#widget-layout): Widgets overlap when the container resizes
- From [Color States](#color-states): Hover colors don't update consistently

### Goals
- From [Widget Layout](#widget-layout): Widgets reflow gracefully at any width
- From [Color States](#color-states): Single source of truth for color state
```

Group by originating section with links back. Copy the text faithfully—don't rephrase.

## Editing Workflow

**Adding a problem or goal:**
1. Add it under the appropriate heading with `**Problem:**` or `**Goal:**` prefix
2. Mirror it in the Summary section under the `From [#heading]` group

**Renaming a heading:**
1. Update the heading text
2. Update all `From [#heading]` references in the Summary

## File Structure

```markdown
# Title

Brief intro.

## Section One

Content with inline **Problem:** and **Goal:** statements.

## Section Two

More content.

## Summary

### Problems
- From [Section One](#section-one): ...
- From [Section Two](#section-two): ...

### Goals
- From [Section One](#section-one): ...
- From [Section Two](#section-two): ...
```

## Why This Works

- **Local + global view**: Each section has detailed context; the summary provides a scannable overview
- **Anchor stability**: Real headings as anchors keep links predictable
- **Explicit origin**: `From [#heading]` makes it clear where each item came from

## Small, Composable Pieces

Files stay focused. It might be a class, it might be a concern.

When something grows too big, split it. And, jeez, the fewer the better. Shrink, evaporate, snip.

Lessons learned that are universal get promoted to shared guides.
