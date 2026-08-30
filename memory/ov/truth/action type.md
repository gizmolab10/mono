---
kind: explain
title: "new Action type"
description: "pass Separator more than one title"
tags: [keep]
date: 2026-08-12
---
# Action type

i want to pass **Separator** more than one title. each title needs its own handler and a position enum {left, center, right}. combine those three things into one prop -> a type containing an **HTML element** (eg a segmented control) and an enum value.

## convert these

### analysis

**Separators** are used in two ways:

1. All of the titled **separators** are called through **Section**
2. All of the **separators** called directly have no title
3. None of the **separators** have a plain, non-clickable title

### conversion steps

- [x] for ALL ***clickable*** titles
    - [x] ***copy*** button creation from **separator** to caller
        - [x] Search — the first one, the pattern for the rest
        - [x] Editor_Filters (three) — filters, kinds, tags
        - [x] Browse_Filters (four) — filters, projects, kinds, tags
    - [x] place button in an **action** -> `position.left`
    - [x] add logic to use it — **Separator** lends each given **element** a place at its own end or middle
- [ ] leave all plain titles as is
- [x] remove from **separator** and **section**
    - [x] all hover logic
    - [x] onclick
    - [x] title, and the whole-line press strip that went with it

### calls to Section

Each of these reaches a Separator through [Section.svelte:46](../../../src/lib/svelte/support/Section.svelte#L46), and each decides for itself what goes on the bar. Eight give it a clickable title; the last gives it nothing.

| file | line |
| --- | --- |
| [Editor_Filters.svelte](../../../src/lib/svelte/filter/Editor_Filters.svelte#L148) | 148 |
| [Editor_Filters.svelte](../../../src/lib/svelte/filter/Editor_Filters.svelte#L183) | 183 |
| [Editor_Filters.svelte](../../../src/lib/svelte/filter/Editor_Filters.svelte#L202) | 202 |
| [Browse_Filters.svelte](../../../src/lib/svelte/filter/Browse_Filters.svelte#L182) | 182 |
| [Browse_Filters.svelte](../../../src/lib/svelte/filter/Browse_Filters.svelte#L195) | 195 |
| [Browse_Filters.svelte](../../../src/lib/svelte/filter/Browse_Filters.svelte#L210) | 210 |
| [Browse_Filters.svelte](../../../src/lib/svelte/filter/Browse_Filters.svelte#L242) | 242 |
| [Search.svelte](../../../src/lib/svelte/filter/Search.svelte#L158) | 158 |
| [Browse.svelte](../../../src/lib/svelte/main/Browse.svelte#L47) | 47 |

### separators with no title

these do not need conversison

| file | line |
| --- | --- |
| [Markdown_Editor.svelte](../../../src/lib/svelte/content/Markdown_Editor.svelte#L784) | 784 |
| [Markdown_Editor.svelte](../../../src/lib/svelte/content/Markdown_Editor.svelte#L804) | 804 |
| [Files_List.svelte](../../../src/lib/svelte/content/Files_List.svelte#L411) | 411 |

## done

- [x] define the position enum
- [x] define the action type -> types
    - [x] element -> button
    - [x] position
- [x] add an action prop
    - [x] Separator
    - [x] Section

## challenge — met

hovering on the separator needs to coordinate with the element. answer: drop this feature. it wasn't that great and it interfered with the click-here-to-go-back in the filters area.
