---
kind: design
title: "new Action type"
description: "pass Separator more than one title"
tags: [active]
date: 2026-08-12
---
# Action

i want to pass Separator more than one title. each title needs its own handler and a position enum {left, center, right}. combine those three things into one prop -> a type containing an HTML element (eg a segmented control) and an enum value.

## convert these

### analysis

Separators are used in two ways:

1. All of the titled separators are called through Section
2. All of the separators called directly have no title
3. None of the separators have a plain, non-clickable title

### conversion steps:

- [ ] for ALL ***clickable*** titles
    - [ ] ***copy*** button creation from separator to caller
        - [ ] place button in an action -> position.left
        - [ ] add logic to use it
- [ ] leave all plain titles as is
- [ ] remove from separator and section
    - [ ] all hover logic
    - [ ] onclick

### calls to Section

Each of these reaches a Separator through [Section.svelte:46](../../src/lib/svelte/support/Section.svelte#L46), and each decides for itself what goes on the bar. Eight give it a clickable title; the last gives it nothing.

| file | line |
| --- | --- |
| [File_OKF.svelte](../../src/lib/svelte/content/File_OKF.svelte#L148) | 148 |
| [File_OKF.svelte](../../src/lib/svelte/content/File_OKF.svelte#L183) | 183 |
| [File_OKF.svelte](../../src/lib/svelte/content/File_OKF.svelte#L202) | 202 |
| [List_OKF.svelte](../../src/lib/svelte/content/List_OKF.svelte#L182) | 182 |
| [List_OKF.svelte](../../src/lib/svelte/content/List_OKF.svelte#L195) | 195 |
| [List_OKF.svelte](../../src/lib/svelte/content/List_OKF.svelte#L210) | 210 |
| [List_OKF.svelte](../../src/lib/svelte/content/List_OKF.svelte#L242) | 242 |
| [Search.svelte](../../src/lib/svelte/content/Search.svelte#L158) | 158 |
| [Browse.svelte](../../src/lib/svelte/main/Browse.svelte#L47) | 47 |


### separators with no title

these do not need conversison

| file | line |
| --- | --- |
| [File_Content.svelte](../../src/lib/svelte/content/File_Content.svelte#L784) | 784 |
| [File_Content.svelte](../../src/lib/svelte/content/File_Content.svelte#L804) | 804 |
| [Files.svelte](../../src/lib/svelte/content/Files.svelte#L411) | 411 |

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
