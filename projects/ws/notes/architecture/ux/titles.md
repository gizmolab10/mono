# Widget_Title Design Responsibilities

Documented the editable title component before replacing it. Captures what it does (display, selection, inline editing, width measurement, hit detection) and how it coordinates with other systems. Completed replacement work.

## Purpose

Widget_Title is the editable text component within a widget that displays and allows editing of a Thing's title. This document captured the existing component and guided implementing its replacement. Completed ✅ 

---

## Core Responsibilities

### 1. Title Display
- Render the Thing's title text with appropriate styling
- Adapt styling based on widget state (grabbed, editing, focus)
- Support both tree mode and radial mode positioning adjustments
- Reflect the Thing's color and font family

### 2. Selection State
- Respond to grab/select interactions on the title
- Coordinate with the grab system (`si_grabs`)
- Support shift-click for multi-selection

### 3. Inline Editing
- Transition between display and edit modes
- Manage text cursor position and selection ranges
- Preserve selection state across mode transitions
- Handle keyboard input during editing (typing, arrow keys, enter, tab)
- Support cut/paste operations

### 4. Edit Lifecycle
- Start editing when appropriate (grabbed + click on editable ancestry)
- Stop editing on blur, enter, or external signals
- Persist changes to the database when editing completes
- Coordinate with `w_s_title_edit` store for cross-component edit state

### 5. Width Measurement
- Use a hidden "ghost" span to measure rendered text width
- Dynamically size the input to fit content
- Trigger layout updates when title length changes significantly

### 6. Hit Detection
- Register with the Hits system for hover detection
- Provide the HTML element for rectangle-based hit testing

---

## Coordination Points

| System | Interaction |
|--------|-------------|
| `w_s_title_edit` | Global edit state store — who is editing, selection range |
| `si_grabs` | Grab/selection system — determines if ancestry is grabbed |
| `Hits` | Hit testing — registers element for hover detection |
| `databases.db_now` | Persistence — saves title changes |
| `g.layout()` | Layout system — triggers re-layout after title changes |

---

## State Dependencies

- **Ancestry state**: grabbed, editing, focus, editable
- **Thing state**: title, color, width_ofTitle
- **Global state**: control mode (tree vs radial), font family, thing color
- **Edit state**: active editor, selection range, edit phase (editing/stopping/percolating)

---

## Behavioral Notes

- Only one title may be edited at a time (global `w_s_title_edit`)
- Clicking a title while another is editing stops the prior edit first
- Tab key creates a new sibling and moves edit focus
- Layout is debounced during typing to prevent jitter

