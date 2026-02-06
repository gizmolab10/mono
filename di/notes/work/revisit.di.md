# Revisit

Where we are in Design Intuition.

---
## Quick Links

- [docs](http://docs.designintuition.app)
- [app](http://designintuition.app)
- [Milestones](./milestones/)
- [Architecture](../architecture/)
- [Guides](../guides/)

---
## Milestones (current work)

- [ ] [8 dimensionals](./milestones/8.dimensionals) (terminator arrows, text, dimension and witness lines)
	- [ ] edit dimensions -> renders the change
	- [ ] tweaks to assure that dimensionals extend outward from SO
- [ ] [9 persistence](./milestones/9.persistence) — save/load scene state
- [ ] **10 hierarchy** of SO
- [ ] **11 controls UI** — actual buttons in the toolbar
	- [ ] scaling (logarithmic, coarse and fine)
- [ ] **12 details** — attributes
- [ ] **13 algebra** — recursive descent compiler
	- [ ] compile tree
	- [ ] traverse and reverse traverse
- [ ] **14 what? **

## Code Debt

- [ ] fat triangle
- [ ] steppers
- [ ] close button

## What's Working

| Layer       | Status                                     |
| ----------- | ------------------------------------------ |
| Rendering   | Quaternions, wireframe, depth-based alpha  |
| Main        | Three regions: controls, details, graph    |
| Interaction | Hits managers — 2D (ported from ws) and 3D |
| Docs        | VitePress configured, new guides content   |
| Testing     | 232 tests for core types                   |
| Editing     | Select face, drag edge or vertex           |
| Build Notes | List of important steps in our progress    |
| Dimensions  | Dynamic (value, layout, not yet editable)  |
| Persistence | SO, camera orientation                     |

