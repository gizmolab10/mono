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

- [ ] **10 controls UI** — actual buttons in the toolbar
	- [x] scaling (logarithmic, coarse and fine)
	- [x] horizontal Stepper layout
	- [x] slider (linear, with logarithmic option)
- [ ] **11 details** — attributes
- [ ] **12 hierarchy** of SO
- [ ] **13 algebra** — recursive descent compiler
	- [ ] compile tree
	- [ ] traverse and reverse traverse
- [ ] **14 what? **

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
| Controls    | Steppers (h/v), slider, scale +/−/wheel   |
| Persistence | SO, camera orientation, scale              |

