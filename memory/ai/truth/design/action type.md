# Action type

i want to pass **Separator** more than one title. each title needs its own handler and a position enum {left, center, right}. combine those three things into one prop -> a type containing an **HTML element** (eg a segmented control) and an enum value.

## convert these

### analysis

**Separators** are used in two ways:

1. All of the titled **separators** are called through **Section**
2. All of the **separators** called directly have no title
3. None of the **separators** have a plain, non-clickable title

### conversion steps

- [ ] leave all plain titles as is

### calls to Section

Each of these reaches a Separator through [Section.svelte:46](core/src/lib/svelte/support/Section.svelte#L46), and each decides for itself what goes on the bar. Eight give it a clickable title; the last gives it nothing.

| file | line |
| --- | --- |
| [Editor_Filters.svelte](../../../src/lib/svelte/filter/Editor_Filters.svelte#L148) | 148 |
| [Editor_Filters.svelte](../../../src/lib/svelte/filter/Editor_Filters.svelte#L183) | 183 |
| [Editor_Filters.svelte](../../../src/lib/svelte/filter/Editor_Filters.svelte#L202) | 202 |
| [Browse_Filters.svelte](Browse_Filters.svelte#L182) | 182 |
| [Browse_Filters.svelte](Browse_Filters.svelte#L195) | 195 |
| [Browse_Filters.svelte](Browse_Filters.svelte#L210) | 210 |
| [Browse_Filters.svelte](Browse_Filters.svelte#L242) | 242 |
| [Search.svelte](ov/src/lib/svelte/filter/Search.svelte#L158) | 158 |
| [Browse.svelte](Browse.svelte#L47) | 47 |

### separators with no title

these do not need conversison

| file | line |
| --- | --- |
| [Edit_Markdown.svelte](Edit_Markdown.svelte#L784) | 784 |
| [Edit_Markdown.svelte](Edit_Markdown.svelte#L804) | 804 |
| [List_Files.svelte](List_Files.svelte#L411) | 411 |

## done

## challenge — met

hovering on the separator needs to coordinate with the element. answer: drop this feature. it wasn't that great and it interfered with the click-here-to-go-back in the filters area.
