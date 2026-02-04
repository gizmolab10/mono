# Resume

Where we are in Design Intuition.

---
## Milestones

- [ ] 7 mouse editing of SO (selection corners, drag)
- [ ] 8 dimensions (terminators, text, dimension and extension lines)
	- [ ] edit dimensions -> renders the change
- [ ] 9 hierarchy of SO
- [ ] 10 **persistence** — save/load scene state
- [ ] 11 **controls UI** — actual buttons in the toolbar
- [ ] 12. **details**: attributes

### Ideas

- [ ] ask it the right qs -> lean i nto learning
	- [ ] are you leading me d own the garden path?


## What's Working

| Layer | Status |
|-------|--------|
| Rendering | Quaternions, wireframe, depth-based alpha |
| Layout | Three regions, separators, fillets |
| Interaction | Hits manager ported from ws |
| Docs | VitePress, dual Netlify deploy |
| Testing | 232 tests for core types |

## Quick Links

- [Milestones](./milestones/)
- [Architecture](../architecture/)
- [Guides](../guides/)

---
## Current State

**Milestone 6 next.** Smart objects foundation complete:

- `Smart_Object.ts` — extends Identifiable, optional O_Scene ref
- `Attribute.ts` — name/value boilerplate
- Decision: SO is primary, O_Scene is rendering detail

The app has:

- Panel layout with controls, details, graph regions
- Separators with fillets for rounded corners
- Quaternion-based 3D rendering (two nested cubes, drag to rotate)
- RBush hit detection with hover/click/long-click/double-click
- VitePress docs at docs.designintuition.app
- Main app at designintuition.app
