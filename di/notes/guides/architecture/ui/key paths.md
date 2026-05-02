# Key Paths

Two columns: which key (with any modifier), and what it does. Grouped by the context the key is interpreted in. Within a context, simpler keys come first.

## Canvas / parts panel — when nothing is being edited

| Key | What it does |
|---|---|
| Delete | Delete the selected part. |
| Backspace | Delete the selected part. |
| Comma | Toggle the details panel open or shut. |
| Arrow Up | In the parts table, move the selection one row up. |
| Arrow Down | In the parts table, move the selection one row down. |
| Arrow Left | In the parts table, collapse one generation under the selected row. |
| Arrow Right | In the parts table, reveal one generation under the selected row. |
| Tab | In the parts table, move the selection one row down. |
| Shift + Tab | In the parts table, move the selection one row up. |
| Cmd / Ctrl + Z | Step backward one history snapshot. |
| Cmd / Ctrl + Shift + Z | Step forward one history snapshot. |

Citation: `src/lib/ts/events/Events.ts` lines 189-231 (the document-level keyboard handler that owns this whole context).

## Inside an attribute-table value or formula cell

| Key | What it does |
|---|---|
| Enter | Commit the cell, then move to the next cell in the table. |
| Tab | Move to the next cell. |
| Shift + Tab | Move to the previous cell. |
| Escape | Cancel the edit and dismiss any error overlay. |

Citation: `Events.ts` lines 191-194 (the route into the table-navigator helper); `Events.ts` lines 233-260 (the helper itself, which does same-column-next-row on Enter and linear walk on Tab); `src/lib/svelte/details/P_Attributes.svelte` lines 254 and 287 (the per-input commit-on-Enter and cancel-on-Escape behaviour).

## Inside a part-name input (in the parts table)

| Key | What it does |
|---|---|
| Enter | Commit the new name. |
| Escape | Cancel and restore the prior name. |
| Delete (with error showing) | Dismiss the naming error and behave as a normal delete inside the input. |
| Backspace (with error showing) | Dismiss the naming error and behave as a normal backspace inside the input. |

Citation: `src/lib/svelte/details/D_Parts.svelte` lines 112-124 (the keyboard handler with the with-error escape hatch and the normal Enter and Escape branches).

## Inside a given-name or given-value cell

| Key | What it does |
|---|---|
| Enter | Commit the value, then move down the column. |
| Tab | Move to the next column. |
| Escape | Cancel the edit. |
| Delete (with error showing) | Dismiss the naming error and continue editing. |
| Backspace (with error showing) | Dismiss the naming error and continue editing. |

Citation: `src/lib/svelte/details/P_Givens.svelte` lines 89-105 (the keyboard handler with the with-error escape hatch, the cancel branch, and the commit-and-move-down branch).

## Inside a dimension or angle input on the canvas

| Key | What it does |
|---|---|
| Enter | Commit the typed value and dismiss the input. |
| Escape | Cancel and dismiss the input. |

Citation: `src/lib/svelte/main/Graph.svelte` lines 71-87 (the per-input handlers for the dimension overlay and the angle overlay, both with the same Enter-commits-Escape-cancels shape).

## Inside the face-label input on the canvas

| Key | What it does |
|---|---|
| Enter | Commit the typed name and dismiss the input. |
| Escape | Cancel and dismiss the input. |

Citation: `src/lib/svelte/main/Graph.svelte` lines 99-101 (the per-input handler for the face-label overlay, with the same Enter-commits-Escape-cancels shape).

## Inside the build-notes modal

| Key | What it does |
|---|---|
| Escape | Close the modal. |

Citation: `src/lib/svelte/main/BuildNotes.svelte` line 35.
