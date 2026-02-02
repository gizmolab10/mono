# User Manual

**Started:** 2026-02-01
**Status:** Proposal

## Problem

ws has dev docs (project.md, architecture guides) but no user manual. End users — whether using the standalone app or Bubble plugin — have no guide to actually using the thing.

## Goal

A manual that helps users understand and enjoy ws. Not code, not architecture — just how to use it.

## Decisions

1. **Audience:** Both standalone app and Bubble plugin users
2. **Scope:** Full manual
3. **Where:** mono/ws/notes/manuals/user/*.md
4. **Tone:** voice.md style (casual, first person, punchy)

## Proposed Structure

```
1. What is Webseriously?
   - The concept (hierarchical data visualization)
   - Who it's for

2. Getting Started
   - First launch
   - The interface (controls, details, graph)
   - Creating your first item

3. The Graph
   - Tree mode vs Radial mode
   - Navigating (pan, zoom, rotate)
   - Selecting items

4. Working with Items
   - Creating, editing, deleting
   - Parent-child relationships
   - Drag and drop
   - Rubberband selection

5. Details Panel
   - Tabs (actions, data, preferences, tags, traits)
   - Per-item settings

6. Search
   - Finding items
   - Filtering

7. Import/Export
   - JSON, CSV
   - PDF export

8. Preferences
   - Themes
   - Layout options
   - Database switching (?db= parameter)

9. Bubble Plugin (if applicable)
   - Embedding
   - Communication with parent app
```

## Next Action

Answer the questions above, then draft section 1.
