# Components
**Started:** 2025-01-06 | **Status:** Phase 2 in progress

## Problem
webseriously has 40+ Svelte components built organically over time. Many have tangled concerns, prop soup, and inconsistent patterns. Need to identify which are worth salvaging vs. rebuilding from scratch. 
## Goal

- [ ] Catalog existing components
- [ ] Panel design and implementation, all four components, one component at a time

Later, we can select candidates for di, then architect and implement versions according to industry best practices for svelte components using typescript.

## Tasks

- [ ] implement the panel using industry best practices for svelte components using typescript
- [ ] work with me to mold it as needed
- [ ] I will then choose the next component

---
## Webseriously Architecture

The code should be treated as rotten. The concepts, capabilities, purpose should be treated as well-tested and worth recreating from scratch.

### Layout/Structure
| Component | Purpose |
|-----------|---------|
| `Panel.svelte` | Main container — orchestrates everything. Routes between normal view, BuildNotes, Import, Preview. Houses Primary_Controls, Details, Secondary_Controls, and the graph area. |
| `Box.svelte` | Bordered container with Separators on all four sides. Uses slots for content. |
| `Separator.svelte` | Visual dividers with optional gull wings, titles, and thin divider lines. Horizontal or vertical. |
| `Gull_Wings.svelte` | Decorative curved corners for separators. |

### Graph Views
| Component | Purpose |
|-----------|---------|
| `Graph.svelte` | Switches between radial and tree views. Handles layout triggers, rubberband selection, and bottom controls. |
| `Radial_Graph.svelte` | Radial layout implementation. |
| `Tree_Graph.svelte` | Tree layout implementation. |

### Controls
| Component | Purpose |
|-----------|---------|
| `Primary_Controls.svelte` | Top toolbar area. |
| `Secondary_Controls.svelte` | Additional toolbar (tree controls when in tree mode). |
| `Breadcrumbs.svelte` | Navigation path display. |
| `Button.svelte` | Core button — hover, autorepeat, long-click, double-click via S_Element state. Complex. |
| `Segmented.svelte` | Segmented control (iOS-style toggle buttons). |
| `Slider.svelte` | Slider control. |
| `Steppers.svelte` | Increment/decrement controls. |

### Details Panel
| Component | Purpose |
|-----------|---------|
| `Details.svelte` | Side panel showing properties/actions for selected item. |
| `Banner_Hideable.svelte` | Collapsible section with show/hide toggle. |
| `D_Actions.svelte` | Action buttons for selected item. |
| `D_Data.svelte` | Data display section. |
| `D_Header.svelte` | Header info for selection. |
| `D_Preferences.svelte` | User preferences UI. |
| `D_Selection.svelte` | Selection info. |
| `D_Tags.svelte` | Tag management. |
| `D_Traits.svelte` | Trait display. |

### Widgets (Graph Nodes)
| Component | Purpose |
|-----------|---------|
| `Widget.svelte` | Main node component for graph items. |
| `Widget_Drag.svelte` | Drag handling for widgets. |
| `Widget_Reveal.svelte` | Expand/collapse animation. |
| `Widget_Title.svelte` | Title display/editing. |

### Mouse/Interaction
| Component | Purpose |
|-----------|---------|
| `Rubberband.svelte` | Selection rectangle. |
| `Clickable_Label.svelte` | Text that responds to clicks. |
| `Buttons_Row.svelte` | Horizontal button arrangement. |
| `Buttons_Table.svelte` | Grid button arrangement. |
| `Close_Button.svelte` | X button for closing. |
| `Cluster_Pager.svelte` | Paging through clustered items. |
| `Color.svelte` | Color picker/display. |
| `Glow_Button.svelte` | Button with glow effect. |
| `Glows_Banner.svelte` | Banner with glow buttons. |
| `Next_Previous.svelte` | Navigation arrows. |
| `Triangle_Button.svelte` | Directional triangle button. |

### Utility/Drawing
| Component | Purpose |
|-----------|---------|
| `Spinner.svelte` | Loading indicator with dashes. |
| `Circle.svelte` | Circle rendering. |
| `Transparent_Circle.svelte` | Semi-transparent circle. |
| `Portal.svelte` | Renders children outside normal DOM hierarchy. |
| `SVG_D3.svelte` | D3-based SVG rendering. |
| `SVG_Gradient.svelte` | Gradient definitions. |
| `Printable.svelte` | Print-friendly output. |

### Search
| Component | Purpose |
|-----------|---------|
| `Search.svelte` | Search input. |
| `Search_Results.svelte` | Results display. |

---

## Phase 2: Selection
- [ ] Choose which components to focus on

(waiting for your selection)

---

## Phase 3: Architecture
- [ ] Describe in abstract terms: what it does, why, and conceptually how
- [ ] Compose formal architecture and implementation plan documents

---

## Phase 4: Implementation
- [ ] Implement one component

---

## Phase 5: Assessment
- [ ] Assess strategy, update docs

---

## Artifacts
(add links when complete)
