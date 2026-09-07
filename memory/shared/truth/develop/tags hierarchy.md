---
kind: explain
title: "Tags hierarchy"
description: "In the filters, the linear list is currently quite lengthy (22), challenging to scan by eye"
tags: [keep, proposal]
date: 2026-08-08
---
# Tags hierarchy

In the filters, the linear list is currently quite lengthy (22), challenging to scan by eye. would be easier if some can be encapsulated, and thus hidden. These are the six areas and their tags.

**code:** port, migrate, refactor, wire, data **ai:** session, team, style, prose **other:** notes, vision, research, stale, think **harness:** platform, setup, deploy, tools, build **ux:** visual-design, UX, geometry **fix:** test, debug

## thoughts

need a new kind of pill that can hide and show its tags. i want to call it big. while hidden, big shows just the area. click it and just the tags appear. an inconspicuous and obvious close button.

### proposal — big pill

- a pill button with a double border
    - place the second border inside, thickness 0.5
    - between them --gap-tight
    - thickness 0.7 for the outer one
- all the tags are this kind
- two states by click
    1. single clickable string
        - area name when no tag is chosen
        - names of chosen tags
    2. area's set of tags (click on a segment or close)
        - click on a segment does not close
        - opening a second tag set does NOT shut the first
- state 2 — inside the outer border
    - same gap and thicknesses
    - --gap between:
        - close me button at left
        - segmented controller at the right
            - shows chosen tags with --accent bg
- all transitions -> auto pill layout
    - state 2 pills do not divide
- unreferenced tags disappear
    - when only one is left, show the tag name as a single border pill
    - when they all disappear from an area, hide it
- multiple tags across multiple tag sets can be chosen 
- 'any tag' remains a separate, single bordered pill
- these choices are NOT persisted, too complicated for now
